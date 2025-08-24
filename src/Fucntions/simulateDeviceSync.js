import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Calculate total size of tracks to sync
const calculateSyncSize = (tracks, autoConvert = false) => {
    return tracks.reduce((total, track) => {
        let size = track.file_size || 0;
        // Estimate conversion size reduction for FLAC->MP3
        if (autoConvert && track.file_format === 'FLAC') {
            size = Math.floor(size * 0.3); // Rough 70% reduction
        }
        return total + size;
    }, 0);
};

// Simulate file transfer with realistic timing
const simulateFileTransfer = async (track, progressCallback, autoConvert = false) => {
    let fileSize = track.file_size || (1024 * 1024 * 4); // Default 4MB
    
    // Simulate conversion time for FLAC files
    if (autoConvert && track.file_format === 'FLAC') {
        fileSize = Math.floor(fileSize * 0.3);
        // Add conversion overhead
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const chunkSize = Math.max(64 * 1024, Math.floor(fileSize / 20)); // Transfer in chunks
    let transferred = 0;
    
    while (transferred < fileSize) {
        const chunk = Math.min(chunkSize, fileSize - transferred);
        transferred += chunk;
        
        // Simulate variable transfer speeds (USB can be inconsistent)
        const transferTime = Math.random() * 100 + 50; // 50-150ms per chunk
        await new Promise(resolve => setTimeout(resolve, transferTime));
        
        if (progressCallback) {
            progressCallback(transferred, fileSize);
        }
    }
    
    return { size: fileSize, converted: autoConvert && track.file_format === 'FLAC' };
};

// Resolve sync conflicts between desktop and device
const resolveSyncConflicts = (desktopTracks, deviceTracks, strategy = 'desktop_wins') => {
    const conflicts = [];
    const resolution = [];
    
    desktopTracks.forEach(desktopTrack => {
        const deviceTrack = deviceTracks.find(dt => 
            dt.title === desktopTrack.title && dt.artist === desktopTrack.artist
        );
        
        if (deviceTrack) {
            const hasConflict = 
                desktopTrack.play_count !== deviceTrack.play_count ||
                desktopTrack.is_favorite !== deviceTrack.is_favorite ||
                new Date(desktopTrack.last_played || 0) !== new Date(deviceTrack.last_played || 0);
            
            if (hasConflict) {
                conflicts.push({ desktop: desktopTrack, device: deviceTrack });
                
                // Apply resolution strategy
                switch (strategy) {
                    case 'desktop_wins':
                        resolution.push(desktopTrack);
                        break;
                    case 'device_wins':
                        resolution.push(deviceTrack);
                        break;
                    case 'merge_stats':
                        resolution.push({
                            ...desktopTrack,
                            play_count: Math.max(desktopTrack.play_count || 0, deviceTrack.play_count || 0),
                            is_favorite: desktopTrack.is_favorite || deviceTrack.is_favorite,
                            last_played: new Date(Math.max(
                                new Date(desktopTrack.last_played || 0),
                                new Date(deviceTrack.last_played || 0)
                            )).toISOString()
                        });
                        break;
                }
            }
        }
    });
    
    return { conflicts, resolution };
};

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);

        const body = await req.json();
        const { deviceId, operation = 'sync_to_device', conflictStrategy = 'merge_stats' } = body;

        // Get device info
        const device = await base44.entities.SyncDevice.get(deviceId);
        if (!device) {
            return new Response(JSON.stringify({ error: 'Device not found' }), { status: 404 });
        }

        // Get tracks to sync based on device selection
        const allTracks = await base44.entities.Track.list(null, 10000);
        const tracksToSync = [];

        // Add playlist tracks
        if (device.selected_playlists?.length) {
            for (const playlistId of device.selected_playlists) {
                const playlist = await base44.entities.Playlist.get(playlistId);
                if (playlist?.track_ids) {
                    const playlistTracks = allTracks.filter(track => 
                        playlist.track_ids.includes(track.id)
                    );
                    tracksToSync.push(...playlistTracks);
                }
            }
        }

        // Add individual tracks
        if (device.selected_tracks?.length) {
            const selectedTracks = allTracks.filter(track =>
                device.selected_tracks.includes(track.id)
            );
            tracksToSync.push(...selectedTracks);
        }

        // Remove duplicates
        const uniqueTracks = tracksToSync.filter((track, index, self) =>
            index === self.findIndex(t => t.id === track.id)
        );

        // Filter out already synced tracks for incremental sync
        const newTracks = uniqueTracks.filter(track =>
            !device.synced_track_ids?.includes(track.id)
        );

        // Calculate sync requirements
        const totalSize = calculateSyncSize(newTracks, device.auto_convert);
        const availableSpace = device.storage_total - device.storage_used;

        if (totalSize > availableSpace) {
            return new Response(JSON.stringify({ 
                error: 'Insufficient space on device',
                required: totalSize,
                available: availableSpace
            }), { status: 400 });
        }

        // Create sync job
        const syncJob = await base44.entities.SyncJob.create({
            device_id: deviceId,
            total_files: newTracks.length,
            total_size: totalSize,
            started_at: new Date().toISOString()
        });

        // Simulate the sync process
        let completedFiles = 0;
        let transferredSize = 0;
        const syncedTrackIds = [...(device.synced_track_ids || [])];

        for (const track of newTracks) {
            // Update current file
            await base44.entities.SyncJob.update(syncJob.id, {
                current_file: track.title,
                completed_files: completedFiles,
                transferred_size: transferredSize
            });

            // Simulate file transfer
            const result = await simulateFileTransfer(track, null, device.auto_convert);
            
            transferredSize += result.size;
            completedFiles++;
            syncedTrackIds.push(track.id);

            // Update progress periodically
            if (completedFiles % 5 === 0 || completedFiles === newTracks.length) {
                const timeRemaining = newTracks.length > completedFiles 
                    ? Math.floor((Date.now() - new Date(syncJob.started_at)) / completedFiles * (newTracks.length - completedFiles) / 1000)
                    : 0;

                await base44.entities.SyncJob.update(syncJob.id, {
                    completed_files: completedFiles,
                    transferred_size: transferredSize,
                    time_remaining_seconds: timeRemaining
                });
            }
        }

        // Complete the sync job
        await base44.entities.SyncJob.update(syncJob.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            completed_files: completedFiles,
            transferred_size: transferredSize
        });

        // Update device with synced tracks
        await base44.entities.SyncDevice.update(deviceId, {
            synced_track_ids: syncedTrackIds,
            last_sync: new Date().toISOString(),
            storage_used: device.storage_used + transferredSize
        });

        return new Response(JSON.stringify({
            success: true,
            jobId: syncJob.id,
            filesTransferred: completedFiles,
            bytesTransferred: transferredSize,
            duration: Date.now() - new Date(syncJob.started_at)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Sync error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});