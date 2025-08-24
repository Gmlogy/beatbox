
import React, { useState, useEffect } from "react";
import { Track } from "@/api/entities";
import { Playlist } from "@/api/entities"; // Added Playlist import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Play,
  Pause,
  Search,
  RefreshCw,
  Music,
  Disc,
  Plus,       // Added Plus icon
  Trash2,     // Added Trash2 icon
  ListMusic   // Added ListMusic icon
} from "lucide-react";
import { usePlayer } from "@/components/player/PlayerContext";
import { useSearch } from "@/components/search/SearchContext";
import TrackContextMenu from "../components/tracks/TrackContextMenu";
import { useData } from "@/components/providers/DataProvider";

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false); // New state for bulk actions bar visibility
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false); // New state for playlist selector visibility
  const [playlists, setPlaylists] = useState([]); // New state for playlists
  const { play, pause, isPlaying, currentTrack } = usePlayer();
  const { globalSearchQuery } = useSearch();
  const { tracks, loading, refreshData } = useData(); // Destructure tracks, loading, and refreshData from useData

  // Process artists when the tracks data changes
  useEffect(() => {
    if (tracks.length > 0) {
      processArtists();
    } else if (tracks.length === 0 && !loading.tracks) {
      // If tracks are empty and not loading, clear artists too
      setArtists([]);
      setSelectedArtist(null); // Deselect artist if no tracks
    }
  }, [tracks, loading.tracks]); // Depend on tracks and loading state

  // Listen for library updates from drag & drop imports
  useEffect(() => {
    const handleLibraryUpdate = () => {
      refreshData('tracks'); // Use refreshData to update tracks
    };

    window.addEventListener('musicLibraryUpdated', handleLibraryUpdate);
    return () => window.removeEventListener('musicLibraryUpdated', handleLibraryUpdate);
  }, [refreshData]); // Depend on refreshData

  // Handle URL parameter for direct artist navigation
  useEffect(() => {
    if (artists.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const artistName = urlParams.get('name');
      if (artistName) {
        const foundArtist = artists.find(a => a.name === artistName);
        if (foundArtist) {
          setSelectedArtist(foundArtist);
          // Clear URL params after selection to allow back button to work as expected
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [artists, window.location.search]);

  // Clear selected tracks when selected artist changes
  useEffect(() => {
    setSelectedTracks([]);
  }, [selectedArtist]);

  // Update showBulkActions when selectedTracks changes
  useEffect(() => {
    setShowBulkActions(selectedTracks.length > 0);
    // Hide playlist selector if no tracks are selected
    if (selectedTracks.length === 0) {
      setShowPlaylistSelector(false);
    }
  }, [selectedTracks]);

  // Load playlists when bulk actions are shown
  useEffect(() => {
    if (showBulkActions) {
      loadPlaylists();
    }
  }, [showBulkActions]);

  const loadPlaylists = async () => {
    try {
      const data = await Playlist.list('-created_date', 50); // Fetch up to 50 playlists
      setPlaylists(data);
    } catch (error) {
      console.error("Error loading playlists:", error);
    }
  };

  // Function to process tracks into artist data structure
  const processArtists = () => {
    const artistMap = {};
    tracks.forEach(track => {
      const artistName = track.artist;
      if (!artistMap[artistName]) {
        artistMap[artistName] = {
          name: artistName,
          tracks: [],
          albums: new Set(),
          totalDuration: 0,
          playCount: 0
        };
      }
      
      artistMap[artistName].tracks.push(track);
      artistMap[artistName].albums.add(track.album);
      artistMap[artistName].totalDuration += track.duration || 0;
      artistMap[artistName].playCount += track.play_count || 0;
    });
    
    const artistsArray = Object.values(artistMap).map(artist => ({
      ...artist,
      albumCount: artist.albums.size,
      trackCount: artist.tracks.length,
      coverArt: artist.tracks.find(t => t.album_art_url)?.album_art_url
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    setArtists(artistsArray);
  };

  // Function to trigger data refresh
  const loadArtists = async () => {
    await refreshData('tracks');
  };

  const filteredArtists = artists.filter(artist => 
    artist.name?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSelectTrack = (track, isChecked) => {
    setSelectedTracks((prevSelected) => {
      if (isChecked) {
        if (!prevSelected.some(t => t.id === track.id)) {
          return [...prevSelected, track];
        }
        return prevSelected;
      } else {
        return prevSelected.filter((t) => t.id !== track.id);
      }
    });
  };

  const handleSelectAllTracks = (isChecked) => {
    if (isChecked) {
      if (selectedArtist) {
        setSelectedTracks([...selectedArtist.tracks]);
      }
    } else {
      setSelectedTracks([]);
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
      loadArtists(); // Refresh the list of tracks after deletion
    } catch (error) {
      console.error("Error deleting tracks:", error);
    }
  };

  const handleDragStart = (e, type, data) => {
    e.stopPropagation();
    let dragData;
    if (type === 'artist') {
      dragData = { type: 'artist', tracks: data.tracks, title: data.name };
    } else { // track
      dragData = { type: 'track', track: data, title: data.title };
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'px-3 py-1 bg-white dark:bg-slate-700 rounded-md shadow-lg text-sm flex items-center gap-2';
    const icon = type === 'artist' ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    dragImage.innerHTML = `${icon} <span>${dragData.title}</span>`;

    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }

  if (selectedArtist) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 w-full">
            <Button
              variant="outline"
              onClick={() => setSelectedArtist(null)}
              className="ripple-effect self-start md:self-center dark:bg-slate-700 dark:border-slate-600"
            >
              ← Back to Artists
            </Button>
            <div 
              className="w-24 h-24 bg-slate-700 rounded-xl overflow-hidden flex-shrink-0"
              style={{
                backgroundImage: `url(${selectedArtist.coverArt || PLACEHOLDER_IMAGE_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedArtist.name}</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedArtist.albumCount} albums • {selectedArtist.trackCount} tracks • {formatDuration(selectedArtist.totalDuration)}
              </p>
            </div>
            <div className="flex gap-3 self-center">
              <Button 
                onClick={() => {
                  if (selectedArtist.tracks.length > 0) {
                    play(selectedArtist.tracks[0], selectedArtist.tracks);
                  }
                }}
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Play All
              </Button>
              <Button 
                variant="outline" 
                className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
                onClick={() => {
                  if (selectedArtist.tracks.length > 0) {
                    const shuffledTracks = [...selectedArtist.tracks].sort(() => Math.random() - 0.5);
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
          <div className="bg-blue-600 text-white p-3 flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium text-sm md:text-base">{selectedTracks.length} tracks selected</span>
            <div className="flex flex-wrap items-center gap-3">
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
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">All Tracks</h2>
              {/* This section for Play Selected/Add to Queue etc. will likely be replaced by the bulk actions bar, but keeping for now as per outline */}
              {selectedTracks.length > 0 && (
                <div className="hidden items-center gap-3"> {/* Hidden as new bulk actions bar takes precedence */}
                  <span className="text-sm text-slate-600 dark:text-slate-400">{selectedTracks.length} selected</span>
                  <Button
                    onClick={() => {
                      if (selectedTracks.length > 0) {
                        play(selectedTracks[0], selectedTracks);
                        setSelectedTracks([]);
                      }
                    }}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Selected
                  </Button>
                  <Button
                    variant="outline"
                    className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
                    onClick={() => {
                      console.warn("Add to Queue functionality not yet implemented in PlayerContext.");
                      setSelectedTracks([]);
                    }}
                  >
                    Add to Queue
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTracks([])}
                    className="ripple-effect text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>

            {selectedArtist.tracks.length > 0 && (
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <Checkbox
                  checked={selectedTracks.length === selectedArtist.tracks.length && selectedArtist.tracks.length > 0}
                  onCheckedChange={(checked) => handleSelectAllTracks(checked)}
                  id="select-all-tracks"
                  className="sync-checkbox"
                />
                <label
                  htmlFor="select-all-tracks"
                  className="text-sm font-medium leading-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  Select All
                </label>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {selectedArtist.tracks.map((track, index) => (
                <TrackContextMenu track={track} onUpdate={loadArtists} key={track.id}>
                  <div 
                    // Add background color if track is selected
                    onClick={() => play(track, selectedArtist.tracks)}
                    className={`group flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors draggable-track cursor-pointer ${
                      selectedTracks.some(t => t.id === track.id) ? 'bg-blue-50 dark:bg-blue-900/50' : ''
                    }`}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, 'track', track)}
                  >
                    <div className="flex items-center gap-3 w-12">
                      <Checkbox
                        checked={selectedTracks.some(t => t.id === track.id)}
                        onCheckedChange={(checked) => handleSelectTrack(track, checked)}
                        onClick={(e) => e.stopPropagation()}
                        id={`track-${track.id}`}
                        className="flex-shrink-0 sync-checkbox"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          isPlaying && currentTrack?.id === track.id ? pause() : play(track, selectedArtist.tracks);
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
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div 
                      className="w-12 h-12 bg-slate-700 rounded overflow-hidden flex-shrink-0"
                      style={{
                        backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{track.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{track.album} • {track.year}</p>
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
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Artists</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {artists.length} artists in your library
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Removed the local search input as global search is used */}
            <Button
              variant="outline"
              size="icon"
              onClick={loadArtists}
              className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading.tracks ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 p-4">
            <div className="space-y-3">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.name}
                  onClick={() => setSelectedArtist(artist)}
                  className="group flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer draggable-track"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, 'artist', artist)}
                >
                  <div 
                    className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${artist.coverArt || PLACEHOLDER_IMAGE_URL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-base">{artist.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {artist.albumCount} albums • {artist.trackCount} tracks
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-9 h-9 bg-white/90 backdrop-blur-sm hover:bg-white ripple-effect shadow dark:bg-slate-700 dark:hover:bg-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (artist.tracks.length > 0) {
                          play(artist.tracks[0], artist.tracks);
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
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No artists found</h3>
            <p className="text-sm text-center">
              {globalSearchQuery ? "No artists match your search." : "Import music to see your artists here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
