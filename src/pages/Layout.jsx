

import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Playlist } from "@/api/entities";
import { Track } from "@/api/entities";
import {
  Music,
  Library,
  Heart,
  ListMusic,
  Users,
  Disc,
  Clock,
  Play,
  Smartphone,
  Settings,
  Search,
  Minimize2,
  Maximize2,
  X,
  Plus,
  Compass, // Added Compass icon
  BarChart2 // Added Stats icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { PlayerProvider, usePlayer } from "@/components/player/PlayerContext";
import NowPlayingBar from "@/components/player/NowPlayingBar";
import { SearchProvider, useSearch } from "@/components/search/SearchContext";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import PlaylistContextMenu from "@/components/playlists/PlaylistContextMenu";
import RenamePlaylistDialog from "@/components/playlists/RenamePlaylistDialog";
import GlobalSearchResults from "@/components/search/GlobalSearchResults";
import DragDropZone from '@/components/import/DragDropZone.jsx';
import { DataProvider, useData } from "@/components/providers/DataProvider";
import { exportPlaylist } from "@/api/functions"; // Added import
import KeyboardShortcuts from "@/components/shared/KeyboardShortcuts";

const navigationItems = [
  { title: "Discover", url: createPageUrl("Discover"), icon: Compass, category: "library" },
  { title: "Songs", url: createPageUrl("Library"), icon: Music, category: "library" },
  { title: "Albums", url: createPageUrl("Albums"), icon: Disc, category: "library" },
  { title: "Artists", url: createPageUrl("Artists"), icon: Users, category: "library" },
  { title: "Statistics", url: createPageUrl("Stats"), icon: BarChart2, category: "library" },
  { title: "Recently Played", url: createPageUrl("RecentlyPlayed"), icon: Play, category: "library" },
  { title: "Recently Added", url: createPageUrl("Recent"), icon: Clock, category: "library" },
  { title: "Favorites", url: createPageUrl("Favorites"), icon: Heart, category: "library" },
];

const deviceItems = [
  { title: "Android Sync", url: createPageUrl("Sync"), icon: Smartphone, category: "sync" },
  { title: "Settings", url: createPageUrl("Settings"), icon: Settings, category: "settings" },
];


const LayoutComponent = ({ children, currentPageName }) => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [dragOverPlaylist, setDragOverPlaylist] = useState(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [playlistToRename, setPlaylistToRename] = useState(null);
  const { currentTrack, play, isPlayerMinimized } = usePlayer();
  const { globalSearchQuery, setGlobalSearchQuery } = useSearch();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = React.useRef(null);
  const { playlists: dataPlaylists, refreshData, getAllTracks } = useData(); // Destructured playlists, refreshData, and getAllTracks

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  useEffect(() => {
    // Update local playlists state when dataPlaylists from DataProvider changes
    setPlaylists(dataPlaylists);
  }, [dataPlaylists]);

  const loadPlaylists = async () => {
    // Trigger refresh of playlists data from DataProvider
    await refreshData('playlists');
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlaylist(targetId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove highlight if we're actually leaving the playlist area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverPlaylist(null);
    }
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlaylist(null);

    try {
      const dataString = e.dataTransfer.getData('application/json');
      if (!dataString) return;
      const data = JSON.parse(dataString);

      let tracksToProcess = [];

      if (data.type === 'track' && data.track) {
        tracksToProcess = [data.track];
      } else if (data.type === 'album' && data.tracks) {
        tracksToProcess = data.tracks;
      } else if (data.type === 'artist' && data.tracks) {
        tracksToProcess = data.tracks;
      }

      if (tracksToProcess.length === 0) return;

      let toastMessage = '';

      // Handle drop on Favorites
      if (targetId === 'favorites') {
        let favoriteCount = 0;
        for (const track of tracksToProcess) {
          if (!track.is_favorite) {
            await Track.update(track.id, { is_favorite: true });
            favoriteCount++;
          }
        }
        toastMessage = favoriteCount > 0
          ? `Added ${favoriteCount} track(s) to Favorites.`
          : (tracksToProcess.length > 0 ? `Selected track(s) already in Favorites.` : `No tracks to add to Favorites.`);

      // Handle drop on a playlist
      } else {
        const playlist = playlists.find(p => p.id === targetId);
        if (!playlist) return;

        const currentTrackIds = playlist.track_ids || [];
        const newTrackIds = tracksToProcess
          .map(t => t.id)
          .filter(id => !currentTrackIds.includes(id));

        if (newTrackIds.length === 0) {
          toastMessage = `Track(s) already in "${playlist.name}".`;
        } else {
          const updatedTrackIds = [...currentTrackIds, ...newTrackIds];
          await Playlist.update(playlist.id, { track_ids: updatedTrackIds });
          loadPlaylists(); // Refresh playlist counts
          toastMessage = `Added ${newTrackIds.length} track(s) to "${playlist.name}"`;
        }
      }

      // Show toast notification
      if (toastMessage) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-16 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
        toast.textContent = toastMessage;
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2500);
      }

    } catch (error) {
      console.error("Error handling drop event:", error);
    }
  };

  const handlePlaylistPlay = async (playlist) => {
    if (playlist.track_ids && playlist.track_ids.length > 0) {
      try {
        const allTracks = await getAllTracks(); // Use getAllTracks from DataProvider
        const playlistTracks = allTracks.filter(track =>
          playlist.track_ids.includes(track.id)
        );
        if (playlistTracks.length > 0) {
          play(playlistTracks[0], playlistTracks);
        }
      } catch (error) {
        console.error("Error playing playlist:", error);
      }
    }
  };

  const handlePlaylistShuffle = async (playlist) => {
    if (playlist.track_ids && playlist.track_ids.length > 0) {
      try {
        const allTracks = await getAllTracks(); // Use getAllTracks from DataProvider
        const playlistTracks = allTracks.filter(track =>
          playlist.track_ids.includes(track.id)
        );
        if (playlistTracks.length > 0) {
          const shuffledTracks = [...playlistTracks].sort(() => Math.random() - 0.5);
          play(shuffledTracks[0], shuffledTracks);
        }
      } catch (error) {
        console.error("Error shuffling playlist:", error);
      }
    }
  };

  const handlePlaylistRename = (playlist) => {
    setPlaylistToRename(playlist);
    setShowRenameDialog(true);
  };

  const handleRenameSubmit = async (playlistId, newName) => {
    try {
      await Playlist.update(playlistId, { name: newName });
      loadPlaylists(); // Reload playlists after rename
      setShowRenameDialog(false); // Close dialog on success
    } catch (error) {
      console.error("Error renaming playlist:", error);
    }
  };

  const handlePlaylistDelete = async (playlist) => {
    if (confirm(`Are you sure you want to delete "${playlist.name}"? This cannot be undone.`)) {
      try {
        await Playlist.delete(playlist.id);
        loadPlaylists(); // Reload playlists after delete
      } catch (error) {
        console.error("Error deleting playlist:", error);
      }
    }
  };

  const handlePlaylistDuplicate = async (playlist) => {
    try {
      await Playlist.create({
        name: `${playlist.name} Copy`,
        description: playlist.description,
        track_ids: [...(playlist.track_ids || [])],
        is_smart: playlist.is_smart,
        smart_criteria: playlist.smart_criteria
      });
      loadPlaylists(); // Reload playlists after duplicate
    } catch (error) {
      console.error("Error duplicating playlist:", error);
    }
  };

  const handlePlaylistExport = async (playlist) => {
    try {
        const { data, error } = await exportPlaylist({ playlistId: playlist.id });
        if (error) throw new Error(error.error);

        const blob = new Blob([data], { type: 'audio/x-mpegurl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}.m3u`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch(err) {
        console.error("Error exporting playlist:", err);
        alert(`Failed to export playlist: ${err.message}`);
    }
  };

  const handleAddToDevice = (playlist) => {
    // Navigate to sync page with playlist pre-selected
    // This example just navigates. A real implementation might pass playlist ID via state or query params.
    window.location.href = createPageUrl('Sync');
  };

  const handleFileImport = () => {
    // Refresh all data that might have changed
    refreshData('all');
  };

  return (
    <DragDropZone onImportComplete={handleFileImport}>
      <KeyboardShortcuts />
      <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <style>
            {`
              :root {
                --primary: #111b43;
                --primary-light: #1a2951;
                --secondary: #da7152;
                --secondary-light: #e28567;
                --tertiary: #2fb99b;
                --tertiary-light: #4cc5aa;
                --accent-blue: #5d9ed6;
                --accent-purple: #885da7;
                --surface: #ffffff;
                --surface-variant: #f8fafc;
                --on-surface: #1e293b;
                --on-surface-variant: #64748b;
                --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
              }

              .dark {
                --surface: #1e293b;
                --surface-variant: #0f172a;
                --on-surface: #f8fafc;
                --on-surface-variant: #94a3b8;
              }

              .material-elevation-1 {
                box-shadow: var(--shadow);
              }

              .material-elevation-2 {
                box-shadow: var(--shadow-md);
              }

              .material-elevation-3 {
                box-shadow: var(--shadow-lg);
              }

              .ripple-effect {
                position: relative;
                overflow: hidden;
                transform: translate3d(0, 0, 0);
              }

              .ripple-effect:after {
                content: "";
                display: block;
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
                background-image: radial-gradient(circle, #ffffff 10%, transparent 10.01%);
                background-repeat: no-repeat;
                background-position: 50%;
                transform: scale(10, 10);
                opacity: 0;
                transition: transform .5s, opacity 1s;
              }

              .ripple-effect:active:after {
                transform: scale(0, 0);
                opacity: .2;
                transition: 0s;
              }

              .draggable-track {
                cursor: default;
              }

              .draggable-track:active {
                cursor: grabbing;
              }

              .dragging {
                cursor: grabbing !important;
              }

              .drop-target {
                background: linear-gradient(90deg, #3b82f6, #1e40af) !important;
                color: white !important;
                border: 2px solid #1d4ed8 !important;
                transform: scale(1.02);
              }

              .drop-target * {
                color: white !important;
              }

              .playlist-drop-zone {
                transition: all 0.2s ease-in-out;
              }

              .playlist-drop-zone:hover {
                background-color: rgba(0, 0, 0, 0.05);
              }

              /* Volume slider override */
              .volume-slider .bg-primary {
                background: linear-gradient(90deg, #0f172a, #1e40af, #0f172a);
              }
              
              /* Progress slider override */
              .progress-slider .bg-primary {
                background: linear-gradient(to right, var(--accent-blue), #1e3a8a);
              }

              /* Global button theme override */
              .btn-primary {
                background: linear-gradient(90deg, #0f172a, #1e40af, #0f172a) !important;
                color: white !important;
                border: none !important;
              }

              .btn-primary:hover {
                background: linear-gradient(90deg, #1e293b, #1e3a8a, #1e293b) !important;
              }

              /* Sync Page Checkbox Override */
              .sync-checkbox[data-state='checked'] {
                background: linear-gradient(90deg, #0f172a, #1e40af, #0f172a) !important;
                border-color: #1e40af !important;
                color: white !important;
              }
            `}
        </style>

        {/* Title Bar */}
        <div className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 border-b border-slate-700 z-50 flex items-center justify-between px-4 material-elevation-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/207962c77_whitelogo.png"
                  alt="BeatBox"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-lg font-semibold text-white">BeatBox</h1>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-white/10 text-white">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 hover:bg-white/10 text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-red-500/20 hover:text-red-300 text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

        <Sidebar className="mt-12 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <SidebarHeader className="border-b border-slate-100 dark:border-slate-700/50 p-4">
              <div className="relative" ref={searchContainerRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search music..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="pl-10 h-9 bg-slate-50 border-slate-200 focus:border-blue-500 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                />
                {isSearchFocused && globalSearchQuery && (
                  <GlobalSearchResults 
                    query={globalSearchQuery}
                    onResultClick={() => {
                      setIsSearchFocused(false);
                      setGlobalSearchQuery('');
                    }}
                  />
                )}
              </div>
            </SidebarHeader>

            <SidebarContent className="p-2">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                  Library
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem
                        key={item.title}
                        onDragOver={(e) => item.category === 'library' && item.title === 'Favorites' && handleDragOver(e, 'favorites')}
                        onDragLeave={(e) => item.category === 'library' && item.title === 'Favorites' && handleDragLeave(e)}
                        onDrop={(e) => item.category === 'library' && item.title === 'Favorites' && handleDrop(e, 'favorites')}
                        className={`playlist-drop-zone rounded-lg mx-1 mb-1 transition-all duration-200 ${
                            dragOverPlaylist === 'favorites' && item.title === 'Favorites' ? 'drop-target' : ''
                          }`}
                      >
                        <SidebarMenuButton
                          asChild
                          className={`w-full ripple-effect rounded-lg transition-all duration-200 ${
                            location.pathname === item.url
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                              : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2 flex items-center justify-between">
                  Playlists
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-4 h-4 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => window.location.href = createPageUrl('Playlists')}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {playlists.slice(0, 10).map((playlist) => {
                      const urlParams = new URLSearchParams(location.search);
                      const currentPlaylistId = urlParams.get('id');
                      const isActive = location.pathname === createPageUrl('Playlists') && currentPlaylistId === playlist.id;

                      return (
                        <SidebarMenuItem key={playlist.id}>
                          <PlaylistContextMenu
                            playlist={playlist}
                            onPlay={handlePlaylistPlay}
                            onShuffle={handlePlaylistShuffle}
                            onRename={handlePlaylistRename}
                            onDelete={handlePlaylistDelete}
                            onDuplicate={handlePlaylistDuplicate}
                            onExport={handlePlaylistExport}
                            onAddToDevice={handleAddToDevice}
                          >
                            <div
                              className={`playlist-drop-zone rounded-lg mx-1 mb-1 transition-all duration-200 ${
                                dragOverPlaylist === playlist.id ? 'drop-target' :
                                isActive
                                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
                              }`}
                              onDragOver={(e) => handleDragOver(e, playlist.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, playlist.id)}
                            >
                              <Link
                                to={createPageUrl(`Playlists?id=${playlist.id}`)}
                                className="flex items-center gap-3 px-3 py-2.5 min-w-0 block"
                              >
                                <ListMusic className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium truncate">{playlist.name}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0">
                                  {playlist.track_ids?.length || 0}
                                </span>
                              </Link>
                            </div>
                          </PlaylistContextMenu>
                        </SidebarMenuItem>
                      )
                    })}

                    {playlists.length > 10 && (
                      <SidebarMenuItem>
                        <div className="rounded-lg mx-1 mb-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <Link to={createPageUrl('Playlists')} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="text-xs">Show {playlists.length - 10} more...</span>
                          </Link>
                        </div>
                      </SidebarMenuItem>
                    )}

                    {playlists.length === 0 && (
                      <SidebarMenuItem>
                        <div className="rounded-lg mx-1 mb-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <Link to={createPageUrl('Playlists')} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="text-xs italic">No playlists yet</span>
                          </Link>
                        </div>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                  Device & Settings
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {deviceItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`ripple-effect rounded-lg mx-1 mb-1 transition-all duration-200 ${
                            location.pathname === item.url
                              ? item.category === 'sync'
                                ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800'
                                : 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800'
                              : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.title}</span>
                            {item.title === 'Android Sync' && (
                              <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 dark:border-slate-700/50 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Library</span>
                  <span className="font-medium">2,847 tracks</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage</span>
                  <span className="font-medium">18.4 GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Playlists</span>
                  <span className="font-medium">{playlists.length}</span>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

        <main className="relative flex-1 flex flex-col mt-12 bg-slate-50 dark:bg-slate-900">
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${currentTrack && !isPlayerMinimized ? 'pb-24' : 'pb-0'}`}>
            <Outlet />
          </div>
        </main>

        {/* Fixed Player Bar - only full player is fixed to bottom, minimized is floating */}
        {currentTrack && !isPlayerMinimized && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <NowPlayingBar />
          </div>
        )}

        {/* Minimized player renders itself as floating */}
        {currentTrack && isPlayerMinimized && <NowPlayingBar />}

        <RenamePlaylistDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          playlist={playlistToRename}
          onRename={handleRenameSubmit}
        />
      </div>
    </DragDropZone>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <SearchProvider>
        <DataProvider>
          <SidebarProvider>
            <PlayerProvider>
              <LayoutComponent currentPageName={currentPageName}>
                {children}
              </LayoutComponent>
            </PlayerProvider>
          </SidebarProvider>
        </DataProvider>
      </SearchProvider>
    </ThemeProvider>
  )
}

