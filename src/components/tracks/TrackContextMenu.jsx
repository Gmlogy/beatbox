// --- START OF FILE src/components/tracks/TrackContextMenu.jsx ---
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/components/player/PlayerContext";
import { Track } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { createPageUrl } from "@/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  Play,
  StepForward,
  ListPlus,
  ListMusic,
  Plus,
  Info,
  Trash2,
  Disc,
  AlertTriangle, // New icon for destructive action
} from "lucide-react";
import EditTrackDialog from "./EditTrackDialog";
import { useData } from "@/components/providers/DataProvider";

export default function TrackContextMenu({ children, track, onUpdate }) {
  const navigate = useNavigate();
  const { play } = usePlayer();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { playlists, refreshData } = useData();

  useEffect(() => {
    if (playlists.length === 0) {
      refreshData('playlists');
    }
  }, [playlists.length, refreshData]);

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const playlist = await Playlist.get(playlistId);
      const updatedTrackIds = [...new Set([...(playlist.track_ids || []), track.id])];
      await Playlist.update(playlistId, { track_ids: updatedTrackIds });

      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Added "${track.title}" to "${playlist.name}"`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2500);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  const handleDeleteFromLibrary = async () => {
    if (window.confirm(`Are you sure you want to remove "${track.title}" from your library? The file on disk will NOT be deleted.`)) {
      try {
        await Track.delete(track.id);
        onUpdate(); // Refreshes the UI
      } catch (error) {
        console.error("Error deleting track from library:", error);
      }
    }
  };

  // --- NEW: Logic for deleting the file from disk ---
  const handleDeleteFromDisk = async () => {
    if (window.confirm(`PERMANENTLY DELETE "${track.title}" from your hard drive? This cannot be undone.`)) {
      try {
        // In a real Electron app, you would call the native file system API here.
        // For this browser-based simulation, we'll show an alert and then delete the DB entry.
        alert(`In a real desktop app, this would now delete the file at:\n\n${track.file_path}\n\nFor now, we will just remove it from the library.`);
        
        await Track.delete(track.id);
        onUpdate(); // Refresh the UI
      } catch (error) {
        console.error("Error deleting track:", error);
        alert(`Could not delete track: ${error.message}`);
      }
    }
  };
  
  const handleShowAlbum = () => {
    if (track.album && track.artist) {
      navigate(createPageUrl(`Albums?name=${encodeURIComponent(track.album)}&artist=${encodeURIComponent(track.artist)}`));
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56 dark:bg-slate-800 dark:border-slate-700">
          <ContextMenuItem onClick={() => play(track)} className="dark:focus:bg-slate-700"><Play className="mr-2 h-4 w-4" /><span>Play</span></ContextMenuItem>
          <ContextMenuItem disabled className="dark:focus:bg-slate-700"><StepForward className="mr-2 h-4 w-4" /><span>Play Next</span></ContextMenuItem>
          <ContextMenuItem disabled className="dark:focus:bg-slate-700"><ListPlus className="mr-2 h-4 w-4" /><span>Add to Up Next</span></ContextMenuItem>
          <ContextMenuSeparator className="dark:bg-slate-700" />
          <ContextMenuSub>
            <ContextMenuSubTrigger className="dark:focus:bg-slate-700"><ListMusic className="mr-2 h-4 w-4" /><span>Add to Playlist</span></ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 dark:bg-slate-800 dark:border-slate-700">
              <ContextMenuItem disabled className="dark:focus:bg-slate-700"><Plus className="mr-2 h-4 w-4" /><span>New Playlist...</span></ContextMenuItem>
              <ContextMenuSeparator className="dark:bg-slate-700" />
              {playlists.map((p) => (
                <ContextMenuItem key={p.id} onClick={() => handleAddToPlaylist(p.id)} className="dark:focus:bg-slate-700"><span>{p.name}</span></ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator className="dark:bg-slate-700" />
          <ContextMenuItem onClick={() => setShowEditDialog(true)} className="dark:focus:bg-slate-700"><Info className="mr-2 h-4 w-4" /><span>Get Info</span></ContextMenuItem>
          <ContextMenuItem onClick={handleShowAlbum} className="dark:focus:bg-slate-700"><Disc className="mr-2 h-4 w-4" /><span>Show Album</span></ContextMenuItem>
          <ContextMenuSeparator className="dark:bg-slate-700" />
          <ContextMenuItem className="dark:focus:bg-slate-700" onClick={handleDeleteFromLibrary}><Trash2 className="mr-2 h-4 w-4" /><span>Remove from Library</span></ContextMenuItem>
          <ContextMenuItem className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300" onClick={handleDeleteFromDisk}><AlertTriangle className="mr-2 h-4 w-4" /><span>Delete from Disk</span></ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <EditTrackDialog open={showEditDialog} onOpenChange={setShowEditDialog} track={track} onUpdate={onUpdate} />
    </>
  );
}
// --- END OF FILE src/components/tracks/TrackContextMenu.jsx ---