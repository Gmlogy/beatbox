import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);

        // Fetch all necessary data
        const playlists = await base44.entities.Playlist.list(null, 1000);
        const playHistory = await base44.entities.PlayHistory.list(null, 10000);
        
        // Fetch only tracks with user-specific data to keep export smaller
        const favoriteTracks = await base44.entities.Track.filter({ is_favorite: true });
        const tracksWithPlayCount = await base44.entities.Track.filter({ play_count: { '$gt': 0 } });
        
        const userTrackData = {};
        favoriteTracks.forEach(t => {
            if (!userTrackData[t.id]) userTrackData[t.id] = {};
            userTrackData[t.id].is_favorite = true;
        });
        tracksWithPlayCount.forEach(t => {
            if (!userTrackData[t.id]) userTrackData[t.id] = {};
            userTrackData[t.id].play_count = t.play_count;
            userTrackData[t.id].last_played = t.last_played;
        });

        const exportData = {
            version: '1.0.0',
            exported_at: new Date().toISOString(),
            data: {
                playlists,
                playHistory,
                userTrackData: Object.entries(userTrackData).map(([id, data]) => ({ id, ...data })),
            }
        };

        return new Response(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="beatbox_library_export_${new Date().toISOString().split('T')[0]}.json"`
            },
        });

    } catch (error) {
   