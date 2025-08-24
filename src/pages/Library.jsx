
import React, { useState, useEffect, useCallback } from "react";
import { Track } from "@/api/entities";
import { Playlist } from "@/api/entities"; // Added Playlist entity import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Grid3X3, 
  List, 
  Plus, 
  Upload,
  Filter,
  Play,
  Pause,
  MoreHorizontal,
  Trash2, // Added Trash2 icon
  ListMusic, // Added ListMusic icon
  Settings // Added Settings icon for processing audio
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import LibraryHeader from "../components/library/LibraryHeader";
import TrackCard from "../components/library/TrackCard";
import TrackRow from "../components/library/TrackRow";
import ImportDialog from "../components/library/ImportDialog";
import AudioProcessingDialog from "../components/library/AudioProcessingDialog"; // New import
import { usePlayer } from "@/components/player/PlayerContext";
import { useSearch } from "@/components/search/SearchContext";
import { useData } from "@/components/providers/DataProvider";

export default function Library() {
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false); // New state for audio processing dialog
  const { play, pause, isPlaying, currentTrack } = usePlayer();
  const { globalSearchQuery } = useSearch();
  const { tracks, loading, refreshData } = useData();

  const loadTracks = useCallback(async () => {
    // Use refreshData from DataProvider instead of direct API calls
    await refreshData('tracks');
  }, [refreshData]);

  useEffect(() => {
    // Data is already being loaded by DataProvider, just refresh if needed
    // Only trigger a load if tracks haven't been loaded yet and no load is in progress
    if (tracks.length === 0 && !loading.tracks) {
      loadTracks();
    }
  }, [loadTracks, tracks.length, loading.tracks]);

  // Listen for library updates from drag & drop imports
  useEffect(() => {
    const handleLibraryUpdate = () => {
      loadTracks();
    };

    window.addEventListener('musicLibraryUpdated', handleLibraryUpdate);
    return () => window.removeEventListener('musicLibraryUpdated', handleLibraryUpdate);
  }, [loadTracks]);

  // Load playlists when bulk actions are shown
  useEffect(() => {
    if (showBulkActions) {
      loadPlaylists();
    }
  }, [showBulkActions]);

  const loadPlaylists = async () => {
    try {
      const data = await Playlist.list('-created_date', 50);
      setPlaylists(data);
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  // Sort tracks based on current sort settings
  const sortedTracks = React.useMemo(() => {
    const sorted = [...tracks].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle null/undefined values for consistent sorting
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    return sorted;
  }, [tracks, sortBy, sortOrder]);

  const filteredTracks = sortedTracks.filter(track => 
    track.title?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const handleTrackSelect = (track, isSelected) => {
    if (isSelected) {
      setSelectedTracks(prev => [...prev, track]);
    } else {
      setSelectedTracks(prev => prev.filter(t => t.id !== track.id));
    }
  };

  // Update showBulkActions when selectedTracks changes
  useEffect(() => {
    setShowBulkActions(selectedTracks.length > 0);
  }, [selectedTracks]);

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const playlist = await Playlist.get(playlistId);
      const currentTrackIds = playlist.track_ids || [];
      const newTrackIds = selectedTracks
        .map(t => t.id)
        .filter(id => !currentTrackIds.includes(id));
      
      if (newTrackIds.length > 0) {
        const updatedTrackIds = [...currentTrackIds, ...newTrackIds];
        await Playlist.update(playlistId, { track_ids: updatedTrackIds });
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `Added ${newTrackIds.length} tracks to playlist`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      }
      
      setSelectedTracks([]);
      setShowPlaylistSelector(false);
    } catch (error) {
      console.error("Error adding to playlist:", error);
    }
  };

  const handleCreateNewPlaylist = async () => {
    const name = prompt("Enter playlist name:");
    if (!name) return;
    
    try {
      const newPlaylist = await Playlist.create({
        name,
        track_ids: selectedTracks.map(t => t.id)
      });
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Created playlist "${name}" with ${selectedTracks.length} tracks`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
      setSelectedTracks([]);
      setShowPlaylistSelector(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
  };

  const handleDeleteTracks = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTracks.length} track(s)? This cannot be undone.`)) {
      return;
    }
    
    try {
      for (const track of selectedTracks) {
        await Track.delete(track.id);
      }
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Deleted ${selectedTracks.length} tracks`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
      setSelectedTracks([]);
      loadTracks();
    } catch (error) {
      console.error("Error deleting tracks:", error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <LibraryHeader 
        trackCount={tracks.length}
        selectedCount={selectedTracks.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onImport={() => setShowImportDialog(true)}
        onRefresh={() => setShowImportDialog(true)}
        onPlayAll={() => {
          if (filteredTracks.length > 0) {
            play(filteredTracks[0], filteredTracks);
          }
        }}
        onShuffle={() => {
          if (filteredTracks.length > 0) {
            const shuffledTracks = [...filteredTracks].sort(() => Math.random() - 0.5);
            play(shuffledTracks[0], shuffledTracks);
          }
        }}
      />

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
          <span className="font-medium">{selectedTracks.length} tracks selected</span>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowProcessingDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              <Settings className="w-4 h-4 mr-2" />
              Process Audio
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Playlist
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTracks}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTracks([])}
              className="text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Playlist Selector */}
      {showPlaylistSelector && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Add to Playlist</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            <Button
              variant="outline"
              onClick={handleCreateNewPlaylist}
              className="p-3 h-auto flex-col items-start text-left dark:bg-slate-700 dark:border-slate-600"
            >
              <Plus className="w-4 h-4 mb-1" />
              <span className="font-medium">New Playlist</span>
            </Button>
            {playlists.map((playlist) => (
              <Button
                key={playlist.id}
                variant="outline"
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="p-3 h-auto flex-col items-start text-left dark:bg-slate-700 dark:border-slate-600"
              >
                <ListMusic className="w-4 h-4 mb-1" />
                <span className="font-medium truncate w-full">{playlist.name}</span>
                <span className="text-xs text-slate-500">
                  {playlist.track_ids?.length || 0} tracks
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {loading.tracks ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 material-elevation-1 animate-pulse">
                <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isSelected={selectedTracks.some(t => t.id === track.id)}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={() => play(track, filteredTracks)}
                onPause={pause}
                onSelect={(isSelected) => handleTrackSelect(track, isSelected)}
                onUpdate={loadTracks}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="border-b border-slate-200 dark:border-slate-700">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Title</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Artist</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Album</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Duration</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Plays</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Format</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="dark:divide-slate-700">
                {filteredTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={index}
                    isSelected={selectedTracks.some(t => t.id === track.id)}
                    isPlaying={isPlaying && currentTrack?.id === track.id}
                    onPlay={() => play(track, filteredTracks)}
                    onPause={pause}
                    onSelect={(isSelected) => handleTrackSelect(track, isSelected)}
                    onUpdate={loadTracks}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredTracks.length === 0 && !loading.tracks && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No music found</h3>
            <p className="text-sm text-center mb-4">
              {globalSearchQuery ? "No tracks match your search." : "Import your music to get started."}
            </p>
            <Button 
              onClick={() => setShowImportDialog(true)}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Import Music
            </Button>
          </div>
        )}
      </div>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={loadTracks}
      />

      <AudioProcessingDialog
        open={showProcessingDialog}
        onOpenChange={setShowProcessingDialog}
        selectedTracks={selectedTracks}
		onUpdate={loadTracks} 
      />
    </div>
  );
}
