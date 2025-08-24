
import React, { useState, useEffect } from "react";
import { Playlist } from "@/api/entities";
import { Track } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input as it might be used elsewhere, though not for search here
import { createPageUrl } from "@/utils";
import {
  Plus,
  ListMusic,
  RefreshCw,
  Loader2, // Added for loading state
  Sparkles, // Added for smart playlist icon
  Zap // Added Zap icon for Smart Playlist
} from "lucide-react";

import PlaylistCard from "../components/playlists/PlaylistCard";
import CreatePlaylistDialog from "../components/playlists/CreatePlaylistDialog";
import SmartPlaylistDialog from "../components/playlists/SmartPlaylistDialog"; // New import
import EditPlaylistDialog from "../components/playlists/EditPlaylistDialog"; // New import for editing existing playlists
import PlaylistView from "../components/playlists/PlaylistView";
import { usePlayer } from "@/components/player/PlayerContext";
import { useSearch } from "@/components/search/SearchContext";
import { useData } from "@/components/providers/DataProvider";
import { updateSmartPlaylists } from '@/api/functions'; // New import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // New imports for dropdown

export default function PlaylistsPage() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSmartDialog, setShowSmartDialog] = useState(false); // New state for smart dialog
  const [showEditDialog, setShowEditDialog] = useState(false); // New state for edit dialog
  const [playlistToEdit, setPlaylistToEdit] = useState(null); // New state to hold playlist being edited
  const [updatingSmartPlaylists, setUpdatingSmartPlaylists] = useState(false); // State for smart playlist update loading
  const { play } = usePlayer();
  const { globalSearchQuery } = useSearch(); // Using global search from context
  const { playlists, loading, refreshData } = useData();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const playlistId = urlParams.get('id');

    if (playlistId) {
      loadSinglePlaylist(playlistId);
    } else {
      setSelectedPlaylist(null); // Ensure we are in list view
    }
  }, [window.location.search]);

  // Listen for library updates from drag & drop imports
  useEffect(() => {
    const handleLibraryUpdate = () => {
      refreshData('playlists');
    };

    window.addEventListener('musicLibraryUpdated', handleLibraryUpdate);
    return () => window.removeEventListener('musicLibraryUpdated', handleLibraryUpdate);
  }, [refreshData]);

  const loadSinglePlaylist = async (id) => {
    try {
      const playlist = await Playlist.get(id);
      setSelectedPlaylist(playlist);
    } catch (error) {
      console.error("Error loading single playlist:", error);
      setSelectedPlaylist(null);
    }
  };
  
  const loadPlaylists = async () => {
    await refreshData('playlists');
  };

  const handleCreatePlaylist = async (playlistData) => {
    try {
      console.log("Creating playlist:", playlistData);
      await Playlist.create(playlistData);
      await refreshData('playlists'); // Reload the list
      setShowCreateDialog(false);
      setShowSmartDialog(false); // Close smart dialog as well
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await Playlist.delete(playlistId);
      await refreshData('playlists');
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        window.history.pushState({}, '', createPageUrl('Playlists'));
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  const handleEditPlaylist = (playlist) => {
    setPlaylistToEdit(playlist);
    setShowEditDialog(true);
  };

  const handleUpdateSmartPlaylists = async () => {
    setUpdatingSmartPlaylists(true);
    try {
      const { data } = await updateSmartPlaylists({});
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
      toast.textContent = data.message || `Updated ${data.updatedCount || data.updated} smart playlists`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      
      await refreshData('playlists');
    } catch (error) {
      console.error("Error updating smart playlists:", error);
      alert("Failed to update smart playlists.");
    }
    setUpdatingSmartPlaylists(false);
  };

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const handleBackToOverview = () => {
    setSelectedPlaylist(null);
    window.history.pushState({}, '', createPageUrl('Playlists'));
    refreshData('playlists');
  };

  // If a playlist is selected, show the detailed view
  if (selectedPlaylist) {
    return (
      <PlaylistView 
        playlist={selectedPlaylist} 
        onBack={handleBackToOverview}
        onUpdate={loadPlaylists}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Playlists</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} created
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Removed local search input as global search is now used */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleUpdateSmartPlaylists}
                disabled={updatingSmartPlaylists}
                className="ripple-effect dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {updatingSmartPlaylists ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2 text-blue-500" /> Update Smart
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => refreshData('playlists')}
                className="ripple-effect dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ripple-effect">
                    <Plus className="w-4 h-4 mr-2" />
                    New Playlist
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                    <ListMusic className="mr-2 h-4 w-4" />
                    Regular Playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSmartDialog(true)}>
                    <Zap className="mr-2 h-4 w-4" />
                    Smart Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 material-elevation-1 animate-pulse">
                <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => {
                  window.history.pushState({}, '', createPageUrl(`Playlists?id=${playlist.id}`));
                  setSelectedPlaylist(playlist)
                }}
                onPlay={async () => {
                  if (playlist.track_ids && playlist.track_ids.length > 0) {
                    const firstTrack = await Track.get(playlist.track_ids[0]);
                    play(firstTrack);
                  }
                }}
                onDelete={() => handleDeletePlaylist(playlist.id)}
                onEdit={() => handleEditPlaylist(playlist)} // Pass the edit handler
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ListMusic className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {globalSearchQuery ? "No playlists found" : "No playlists yet"}
            </h3>
            <p className="text-sm text-center mb-4">
              {globalSearchQuery 
                ? "No playlists match your search." 
                : "Create your first playlist to organize your music."
              }
            </p>
            {!globalSearchQuery && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ripple-effect"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Playlist
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                    <ListMusic className="mr-2 h-4 w-4" />
                    Regular Playlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSmartDialog(true)}>
                    <Zap className="mr-2 h-4 w-4" />
                    Smart Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Create Regular Playlist Dialog */}
      <CreatePlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Create Smart Playlist Dialog */}
      <SmartPlaylistDialog
        open={showSmartDialog}
        onOpenChange={setShowSmartDialog}
        onCreated={() => { // Changed from onCreatePlaylist to onCreated as per outline
            loadPlaylists(); // Refresh the list
            handleUpdateSmartPlaylists(); // Update smart playlists immediately after creation
        }}
      />

      {/* Edit Playlist Dialog */}
      {playlistToEdit && (
        <EditPlaylistDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setPlaylistToEdit(null); // Clear playlist when dialog closes
            }
          }}
          playlist={playlistToEdit}
          onUpdate={(updatedPlaylist) => {
            // Logic to handle update after editing
            console.log("Playlist updated:", updatedPlaylist);
            setShowEditDialog(false);
            setPlaylistToEdit(null);
            refreshData('playlists'); // Refresh playlists to show changes
            if (selectedPlaylist?.id === updatedPlaylist.id) {
              setSelectedPlaylist(updatedPlaylist); // Update the selected playlist if it's the one being viewed
            }
          }}
        />
      )}
    </div>
  );
}
