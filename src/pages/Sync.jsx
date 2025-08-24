
import React, { useState, useEffect, useMemo } from "react";
import { SyncDevice } from "@/api/entities";
import { SyncJob } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { Track } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch"; // New import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // New import
import { Badge } from "@/components/ui/badge"; // New import
import { Separator } from "@/components/ui/separator"; // New import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // New import
import {
  Smartphone,
  CheckCircle,
  AlertCircle, // Changed from XCircle
  RefreshCw,
  Loader2,
  Wifi, // New import, replaced CloudOff
  HardDrive, // New import
  Music, // New import, replaced ListMusic, Disc, Users
  Play, // New import
  Settings, // New import
  Download // Changed from DownloadCloud
  , Zap // New import
} from "lucide-react";


// Helper functions (updated per outline)
const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB']; // Outline's version, removed TB
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '...';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                     : `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export default function SyncPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [playlists, setPlaylists] = useState([]); // Replaced allPlaylists from useData
  const [tracks, setTracks] = useState([]); // Replaced allTracks from useData
  const [currentJob, setCurrentJob] = useState(null); // Renamed from syncJob
  const [syncing, setSyncing] = useState(false); // New state
  const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0, currentFile: '', timeRemaining: 0, transferredSize: 0, totalSize: 0 }); // New state

  // Load initial data on component mount
  useEffect(() => {
    loadDevices();
    loadPlaylists();
    loadTracks();
  }, []);

  // Poll for sync progress
  useEffect(() => {
    let interval;
    if (currentJob && syncing) {
      interval = setInterval(async () => {
        try {
          const job = await SyncJob.get(currentJob.id);
          setSyncProgress({
            completed: job.completed_files || 0,
            total: job.total_files || 0,
            currentFile: job.current_file || '',
            timeRemaining: job.time_remaining_seconds || 0,
            transferredSize: job.transferred_size || 0,
            totalSize: job.total_size || 0
          });

          if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') { // Added cancelled status
            setSyncing(false);
            setCurrentJob(null);
            loadDevices(); // Refresh device info to update synced tracks
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error polling sync progress:', error);
          setSyncing(false); // Stop syncing on error
          setCurrentJob(null);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentJob, syncing]);

  // Function to load devices (adapted from detectDevice)
  const loadDevices = async () => {
    try {
      let deviceList = await SyncDevice.list();

      // Simulate some tracks already being on devices for demo
      // Only create demo devices if none exist to avoid duplicates on every load
      if (deviceList.length === 0) {
        const demoSyncedTracks = tracks.slice(0, Math.floor(tracks.length * 0.3)).map(t => t.id);
        
        const demoDevicesData = [
          { device_name: "Samsung Galaxy S21", device_model: "SM-G991B", build_fingerprint: "F45_U02_240401", is_connected: true, storage_total: 128000000000, storage_used: 45000000000, synced_track_ids: demoSyncedTracks, sync_enabled: true, auto_convert: true, selected_playlists: [] },
          { device_name: "Pixel 7 Pro",  device_model: "GP4BC", build_fingerprint: "F52_U01_240315", is_connected: false, storage_total: 256000000000, storage_used: 89000000000, synced_track_ids: [], sync_enabled: true, auto_convert: true, selected_playlists: [] },
          { device_name: "OnePlus 11", device_model: "CPH2449",  build_fingerprint: "F72-V1.1_240520", is_connected: false, storage_total: 512000000000, storage_used: 156000000000, synced_track_ids: [], sync_enabled: true, auto_convert: true, selected_playlists: [] }
        ];

        for (const demo of demoDevicesData) {
          await SyncDevice.create(demo);
        }
        deviceList = await SyncDevice.list(); // Re-fetch after creating
      } else {
        // Update existing device with demo synced tracks if needed (e.g., on app refresh)
        // This part might be simplified or removed in a real app that persists changes
        const connectedDevice = deviceList.find(d => d.is_connected);
        if (connectedDevice && tracks.length > 0 && connectedDevice.synced_track_ids.length === 0) {
            const demoSyncedTracks = tracks.slice(0, Math.floor(tracks.length * 0.3)).map(t => t.id);
            await SyncDevice.update(connectedDevice.id, { synced_track_ids: demoSyncedTracks });
            deviceList = await SyncDevice.list(); // Re-fetch after update
        }
      }
      
      setDevices(deviceList);
      if (!selectedDevice && deviceList.length > 0) {
        // Auto-select first connected device, or just the first device
        const connected = deviceList.find(d => d.is_connected);
        setSelectedDevice(connected || deviceList[0]);
      } else if (selectedDevice) {
        // If a device was already selected, make sure it's the latest version from the list
        const updatedSelected = deviceList.find(d => d.id === selectedDevice.id);
        if (updatedSelected) {
          setSelectedDevice(updatedSelected);
        } else if (deviceList.length > 0) {
          setSelectedDevice(deviceList[0]); // Fallback if previously selected device is gone
        } else {
          setSelectedDevice(null);
        }
      }

    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  // Function to load playlists
  const loadPlaylists = async () => {
    try {
      const playlistList = await Playlist.list('-created_date', 100);
      setPlaylists(playlistList);
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  // Function to load tracks
  const loadTracks = async () => {
    try {
      const trackList = await Track.list('-created_date', 1000);
      setTracks(trackList);
    } catch (error) {
      console.error("Error loading tracks:", error);
    }
  };

  // Handle device settings toggle
  const handleDeviceToggle = async (deviceId, field, value) => {
    try {
      await SyncDevice.update(deviceId, { [field]: value });
      loadDevices(); // Refresh devices to reflect changes
    } catch (error) {
      console.error("Error updating device setting:", error);
    }
  };

  // Handle playlist selection for a device
  const handlePlaylistSelection = async (playlistId, selected) => {
    if (!selectedDevice) return;
    
    const currentPlaylists = selectedDevice.selected_playlists || [];
    const updatedPlaylists = selected 
      ? [...new Set([...currentPlaylists, playlistId])] // Use Set to avoid duplicates
      : currentPlaylists.filter(id => id !== playlistId);
    
    try {
      await SyncDevice.update(selectedDevice.id, { selected_playlists: updatedPlaylists });
      loadDevices(); // Refresh selected device to reflect changes
    } catch (error) {
      console.error("Error updating playlist selection:", error);
    }
  };

  // Start the sync process
  const startSync = async () => {
    if (!selectedDevice || syncing) return;

    setSyncing(true);
    setCurrentJob(null); // Clear previous job status
    setSyncProgress({ completed: 0, total: 0, currentFile: '', timeRemaining: 0, transferredSize: 0, totalSize: 0 });

    try {
      // The simulateDeviceSync function will calculate tracks to sync based on device's selected_playlists
      // and update the SyncJob and SyncDevice entities accordingly.
      const { data } = await simulateDeviceSync({
        deviceId: selectedDevice.id,
        operation: 'sync_to_device'
      });
      
      setCurrentJob({ id: data.jobId });
    } catch (error) {
      console.error("Error starting sync:", error);
      setSyncing(false);
      // Optionally show an error message in UI
    }
  };

  // Calculate stats for the selected device
  const calculateSyncStats = () => {
    if (!selectedDevice) return { tracks: 0, size: 0, newTracksCount: 0 };
    
    let selectedTrackIds = new Set();
    
    // Add tracks from selected playlists
    if (selectedDevice.selected_playlists) {
      selectedDevice.selected_playlists.forEach(playlistId => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist?.track_ids) {
          playlist.track_ids.forEach(tid => selectedTrackIds.add(tid));
        }
      });
    }
    
    // Convert Set to Array and filter for actual Track objects
    const tracksToConsider = tracks.filter(t => selectedTrackIds.has(t.id));
    
    // Filter out already synced tracks
    const newTracksToSync = tracksToConsider.filter(t => 
      !selectedDevice.synced_track_ids?.includes(t.id)
    );
    
    const totalSize = newTracksToSync.reduce((sum, track) => {
      let size = track.file_size || 5000000; // Default size if not available
      if (selectedDevice.auto_convert && track.file_format === 'FLAC') {
        size *= 0.3; // Estimate MP3 conversion size
      }
      return sum + size;
    }, 0);
    
    return { tracks: tracksToConsider.length, size: totalSize, newTracksCount: newTracksToSync.length };
  };

  const syncStats = calculateSyncStats();
  const storageUsedPercent = selectedDevice ? (selectedDevice.storage_used / selectedDevice.storage_total) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Android Sync</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sync your music library with Android devices
            </p>
          </div>
          {/* Conditional rendering for connected status (basic indication) */}
          <div className="flex items-center gap-2">
            {selectedDevice && selectedDevice.is_connected ? (
                <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Connected</span>
                </>
            ) : (
                <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Disconnected</span>
                </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Selection & Status */}
        <div className="lg:col-span-1">
          <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <Smartphone className="w-5 h-5" />
                Connected Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No devices found.</p>
                  <p className="text-xs mt-1">Please ensure your Android device is connected and recognized.</p>
                  <Button onClick={loadDevices} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Scan Again
                  </Button>
                </div>
              ) : (
                <Select value={selectedDevice?.id || ''} onValueChange={(deviceId) => setSelectedDevice(devices.find(d => d.id === deviceId))}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a device">
                            {selectedDevice ? `${selectedDevice.device_name} (${selectedDevice.device_model})` : "Select a device"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {devices.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                                <div className="flex items-center gap-2">
                                    <Smartphone className={`w-4 h-4 ${device.is_connected ? 'text-green-500' : 'text-slate-400'}`} />
                                    {device.device_name} ({device.device_model})
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              )}
              {selectedDevice && (
                <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedDevice.device_name}</h3>
                        <Badge variant={selectedDevice.is_connected ? "default" : "secondary"} className="text-xs">
                            {selectedDevice.is_connected ? 'Connected' : 'Offline'}
                        </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedDevice.device_model}</p>
                    
                    {/* Storage Info */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3"/>Storage</span>
                            <span>{formatBytes(selectedDevice.storage_used || 0)} / {formatBytes(selectedDevice.storage_total || 0)}</span>
                        </div>
                        <Progress value={storageUsedPercent} className="h-1" />
                    </div>
                    
                    {selectedDevice.last_sync && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3"/> Last sync: {new Date(selectedDevice.last_sync).toLocaleDateString()}
                        </p>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Settings */}
          {selectedDevice && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Settings className="w-5 h-5" />
                  Sync Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Sync Enabled</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable syncing for this device</p>
                  </div>
                  <Switch
                    checked={selectedDevice.sync_enabled}
                    onCheckedChange={(checked) => handleDeviceToggle(selectedDevice.id, 'sync_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Auto Convert FLAC</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Convert FLAC to MP3 to save space</p>
                  </div>
                  <Switch
                    checked={selectedDevice.auto_convert}
                    onCheckedChange={(checked) => handleDeviceToggle(selectedDevice.id, 'auto_convert', checked)}
                  />
                </div>

                <Separator className="dark:bg-slate-700" />
                
                <div className="space-y-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100">Sync Statistics</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">Total songs selected</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{syncStats.tracks}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">New songs to sync</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{syncStats.newTracksCount}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg col-span-2">
                      <p className="text-slate-500 dark:text-slate-400">Estimated size to sync</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{formatBytes(syncStats.size)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sync Progress & Playlist Selection */}
        <div className="lg:col-span-2">
          {selectedDevice ? (
            <>
              {/* Sync Progress */}
              {syncing && (
                <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Download className="w-5 h-5 animate-pulse" />
                      Syncing to {selectedDevice.device_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
                      <span>Progress: {syncProgress.completed} / {syncProgress.total} files</span>
                      <span>{formatBytes(syncProgress.transferredSize || 0)} / {formatBytes(syncProgress.totalSize || 0)}</span>
                    </div>
                    <Progress 
                      value={syncProgress.total > 0 ? (syncProgress.completed / syncProgress.total) * 100 : 0} 
                      className="h-2"
                    />
                    {syncProgress.currentFile && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Currently syncing: {syncProgress.currentFile}
                      </p>
                    )}
                    {syncProgress.timeRemaining > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Time remaining: {formatTime(syncProgress.timeRemaining)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              {!syncing && currentJob?.status === 'completed' && (
                <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                            <CheckCircle className="w-5 h-5" /> Sync Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-green-600 dark:text-green-400">Your device is up to date.</p>
                    </CardContent>
                </Card>
              )}
              {!syncing && currentJob?.status === 'failed' && (
                <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                            <AlertCircle className="w-5 h-5" /> Sync Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-600 dark:text-red-400">{currentJob.error_message || "An unexpected error occurred during sync."}</p>
                    </CardContent>
                </Card>
              )}

              {/* Playlist Selection */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Select Playlists to Sync
                    </div>
                    <Button
                      onClick={startSync}
                      disabled={syncing || !selectedDevice.sync_enabled || syncStats.newTracksCount === 0 || !selectedDevice.is_connected}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ripple-effect"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Start Sync ({syncStats.newTracksCount} new)
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {playlists.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No playlists found.</p>
                      <p className="text-xs mt-1">Add some playlists to your library to sync them.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                      {playlists.map(playlist => {
                        const isSelected = selectedDevice.selected_playlists?.includes(playlist.id);
                        const trackCount = playlist.track_ids?.length || 0;
                        const syncedCount = playlist.track_ids?.filter(id => 
                          selectedDevice.synced_track_ids?.includes(id)
                        ).length || 0;

                        return (
                          <div
                            key={playlist.id}
                            className={`p-4 border rounded-lg transition-all cursor-pointer dark:border-slate-600 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                            onClick={() => handlePlaylistSelection(playlist.id, !isSelected)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handlePlaylistSelection(playlist.id, checked)}
                                  className="sync-checkbox"
                                />
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{playlist.name}</h3>
                                  {playlist.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{playlist.description}</p>
                                  )}
                                </div>
                              </div>
                              {playlist.is_smart && (
                                <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-slate-300">
                                  Smart
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                              <span><Music className="w-3 h-3 inline mr-1"/>{trackCount} tracks</span>
                              {trackCount > 0 && (
                                <div className="flex items-center gap-1">
                                    {syncedCount === trackCount ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            <span>All synced</span>
                                        </>
                                    ) : syncedCount > 0 ? (
                                        <>
                                            <Download className="w-3 h-3 text-yellow-500" />
                                            <span>{syncedCount} synced</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3 h-3 text-slate-400"/>
                                            <span>Not synced</span>
                                        </>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="py-12">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
                  <p className="text-sm">Select a connected device to configure sync settings and manage music.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
