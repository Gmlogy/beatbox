
import React, { useState, useEffect } from "react";
import { Track } from "@/api/entities";
import { Playlist } from "@/api/entities"; // Added import for Playlist entity
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Disc,
  Play,
  Pause,
  Search,
  RefreshCw,
  Music,
  Clock,
  Plus, // Added import for Plus icon
  Trash2, // Added import for Trash2 icon
  ListMusic // Added import for ListMusic icon
} from "lucide-react";
import { usePlayer } from "@/components/player/PlayerContext";
import { useSearch } from "@/components/search/SearchContext";
import TrackContextMenu from "../components/tracks/TrackContextMenu";
import { useData } from "@/components/providers/DataProvider";
import { Checkbox } from "@/components/ui/checkbox"; // Added import for Checkbox component

// Helper function to create page URLs. This is a placeholder for a more
// robust routing solution that would typically be provided by a framework's
// router (e.g., Next.js useRouter, React Router history API).
const createPageUrl = (pageName) => {
  switch (pageName) {
    case 'Albums':
      // Assuming the base URL for the Albums page is '/albums'
      // Adjust this path if your routing system uses a different one.
      return '/albums';
    default:
      return '/'; // Fallback for unknown page names
  }
};

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([]); // New state for selected tracks
  const [showBulkActions, setShowBulkActions] = useState(false); // New state for bulk actions visibility
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false); // New state for playlist selector visibility
  const [playlists, setPlaylists] = useState([]); // New state for playlists
  const { play, pause, isPlaying, currentTrack } = usePlayer();
  const { globalSearchQuery } = useSearch();
  const { tracks, loading, refreshData } = useData(); // Integrated useData hook

  // Process tracks from useData into albums
  useEffect(() => {
    if (tracks.length > 0) {
      processAlbums();
    }
  }, [tracks]); // Dependency on tracks from useData

  // Listen for library updates from drag & drop imports
  useEffect(() => {
    const handleLibraryUpdate = () => {
      refreshData('tracks'); // Trigger refresh of track data
    };

    window.addEventListener('musicLibraryUpdated', handleLibraryUpdate);
    return () => window.removeEventListener('musicLibraryUpdated', handleLibraryUpdate);
  }, [refreshData]); // Dependency on refreshData

  // Handle URL parameters for direct album access
  useEffect(() => {
    // Only proceed if albums data is available
    if (albums.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const albumName = urlParams.get('name');
      const artistName = urlParams.get('artist');

      // Only attempt to find if both params exist
      if (albumName && artistName) {
        const foundAlbum = albums.find(a => a.name === albumName && a.artist === artistName);
        if (foundAlbum) {
          setSelectedAlbum(foundAlbum);
          // Clear URL params after selection to prevent re-triggering on subsequent renders
          // and to keep the URL clean.
          window.history.replaceState({}, document.title, createPageUrl('Albums'));
        }
      }
    }
  }, [albums, window.location.search]); // Depend on albums and window.location.search

  // Clear selected tracks when album changes
  useEffect(() => {
    setSelectedTracks([]);
  }, [selectedAlbum]);

  // Update showBulkActions when selectedTracks changes
  useEffect(() => {
    setShowBulkActions(selectedTracks.length > 0);
  }, [selectedTracks]);

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

  // Function to group and process tracks into albums
  const processAlbums = () => {
    // Group tracks by album using cached data
    const albumMap = {};
    tracks.forEach(track => { // Use 'tracks' from useData
      const albumKey = `${track.album}-${track.artist}`;
      if (!albumMap[albumKey]) {
        albumMap[albumKey] = {
          name: track.album,
          artist: track.artist,
          year: track.year,
          tracks: [],
          totalDuration: 0,
          playCount: 0,
          coverArt: track.album_art_url
        };
      }

      albumMap[albumKey].tracks.push(track);
      albumMap[albumKey].totalDuration += track.duration || 0;
      albumMap[albumKey].playCount += track.play_count || 0;
    });

    const albumsArray = Object.values(albumMap).map(album => ({
      ...album,
      trackCount: album.tracks.length,
      // Sort tracks by track number
      tracks: album.tracks.sort((a, b) => (a.track_number || 0) - (b.track_number || 0))
    })).sort((a, b) => a.name.localeCompare(b.name));

    setAlbums(albumsArray); // Update albums state
  };

  // Function to trigger a refresh of track data
  const loadAlbums = async () => {
    await refreshData('tracks'); // Trigger data refresh, 'tracks' is the key for track data
  };

  const handleTrackSelect = (track, isSelected) => {
    if (isSelected) {
      setSelectedTracks(prev => [...prev, track]);
    } else {
      setSelectedTracks(prev => prev.filter(t => t.id !== track.id));
    }
  };

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
      await Playlist.create({
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
      loadAlbums(); // Refresh albums to reflect deleted tracks
    } catch (error) {
      console.error("Error deleting tracks:", error);
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    album.artist?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleDragStart = (e, type, data) => {
    e.stopPropagation();
    let dragData;
    if (type === 'album') {
      dragData = { type: 'album', tracks: data.tracks, title: data.name };
    } else { // track
      dragData = { type: 'track', track: data, title: data.title };
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'px-3 py-1 bg-white dark:bg-slate-700 rounded-md shadow-lg text-sm flex items-center gap-2';
    const icon = type === 'album' ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    dragImage.innerHTML = `${icon} <span>${dragData.title}</span>`;

    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }

  if (selectedAlbum) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        {/* Album Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 w-full">
            <Button
              variant="outline"
              onClick={() => setSelectedAlbum(null)}
              className="ripple-effect self-start md:self-center dark:bg-slate-700 dark:border-slate-600"
            >
              ← Back to Albums
            </Button>
            <div
              className="w-24 h-24 bg-slate-700 rounded-xl overflow-hidden flex-shrink-0"
              style={{
                backgroundImage: `url(${selectedAlbum.coverArt || PLACEHOLDER_IMAGE_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedAlbum.name}</h1>
              <p className="text-xl text-slate-700 dark:text-slate-300 mb-1">{selectedAlbum.artist}</p>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedAlbum.year} • {selectedAlbum.trackCount} tracks • {formatDuration(selectedAlbum.totalDuration)}
              </p>
            </div>
            <div className="flex gap-3 self-center">
              <Button
                onClick={() => {
                  if (selectedAlbum.tracks.length > 0) {
                    play(selectedAlbum.tracks[0], selectedAlbum.tracks);
                  }
                }}
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Album
              </Button>
              <Button
                variant="outline"
                className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
                onClick={() => {
                  if (selectedAlbum.tracks.length > 0) {
                    const shuffledTracks = [...selectedAlbum.tracks].sort(() => Math.random() - 0.5);
                    play(shuffledTracks[0], shuffledTracks);
                  }
                }}
              >
                Shuffle
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
            <span className="font-medium">{selectedTracks.length} tracks selected</span>
            <div className="flex items-center gap-3">
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

        {/* Album Tracks */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {selectedAlbum.tracks.map((track, index) => (
                <TrackContextMenu track={track} onUpdate={loadAlbums} key={track.id}>
                  <div
                    onClick={() => play(track, selectedAlbum.tracks)}
                    className={`group flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors draggable-track cursor-pointer ${
                      selectedTracks.some(t => t.id === track.id) ? 'bg-blue-50 dark:bg-blue-900/50' : ''
                    }`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, 'track', track)}
                  >
                    <div className="flex items-center gap-3 w-12">
                      <Checkbox
                        checked={selectedTracks.some(t => t.id === track.id)}
                        onCheckedChange={(checked) => handleTrackSelect(track, checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="sync-checkbox"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from triggering twice
                          isPlaying && currentTrack?.id === track.id ? pause() : play(track, selectedAlbum.tracks)
                        }}
                        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity ripple-effect dark:hover:bg-slate-700"
                      >
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-mono group-hover:opacity-0 transition-opacity">
                        {(track.track_number || index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{track.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{track.artist}</p>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {Math.floor((track.duration || 0) / 60)}:{((track.duration || 0) % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </TrackContextMenu>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Albums</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {albums.length} albums in your library
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* The search input field is removed as global search handles it */}
            <Button
              variant="outline"
              size="icon"
              onClick={loadAlbums}
              className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading.tracks ? ( // Use 'loading.tracks' from useData
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 p-4">
            <div className="space-y-3">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredAlbums.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredAlbums.map((album) => (
                <div
                  key={`${album.name}-${album.artist}`}
                  onClick={() => setSelectedAlbum(album)}
                  className="group flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer draggable-track"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'album', album)}
                >
                  <div
                    className="w-12 h-12 bg-slate-700 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${album.coverArt || PLACEHOLDER_IMAGE_URL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-base">{album.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{album.artist}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      {album.year} • {album.trackCount} tracks
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-9 h-9 bg-white/90 backdrop-blur-sm hover:bg-white ripple-effect shadow dark:bg-slate-700 dark:hover:bg-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (album.tracks.length > 0) {
                          play(album.tracks[0], album.tracks);
                        }
                      }}
                    >
                      <Play className="w-4 h-4 text-slate-700 dark:text-slate-200 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Disc className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No albums found</h3>
            <p className="text-sm text-center">
              {globalSearchQuery ? "No albums match your search." : "Import music to see your albums here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
