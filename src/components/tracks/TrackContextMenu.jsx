// --- START OF CORRECTED FILE src/components/tracks/TrackContextMenu.jsx ---
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/components/player/PlayerContext";
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
  Disc,
  FolderSync,
  AlertTriangle,
  Music4, // New Icon for Transcode
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
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  const handleMoveFile = async () => {
    if (!track) return;
    const result = await window.api.moveTrack(track.id, track.file_path);
    if (result.success) {
      alert(`Track successfully moved to:\n${result.newPath}`);
      onUpdate();
    } else if (result.error && result.error !== 'User cancelled operation.') {
      alert(`Error moving file: ${result.error}`);
    }
  };

  const handleDeleteFromDisk = async () => {
    if (!track) return;
    const confirmationMessage = `Are you sure you want to PERMANENTLY DELETE the file for "${track.title}" from your hard drive?\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmationMessage)) {
      const result = await window.api.deleteTrack(track.id, track.file_path);
      if (result.success) {
        alert('File deleted successfully.');
        onUpdate();
      } else {
        alert(`Error deleting file: ${result.error}`);
      }
    }
  };
  
  const handleShowAlbum = () => {
    if (track.album && track.artist) {
      navigate(createPageUrl(`Albums?name=${encodeURIComponent(track.album)}&artist=${encodeURIComponent(track.artist)}`));
    }
  };

  // --- THIS IS THE NEW FUNCTION THAT WAS MISSING ---
  const handleTranscode = async () => {
    if (!track) return;
    alert(`This will convert "${track.title}" to MP3. This may take a moment and the app might be unresponsive.`);
    try {
      const result = await window.api.processAudio(track.file_path, { operation: 'transcode', targetFormat: 'mp3' });
      if (result.success) {
        alert(`Successfully created new file at:\n${result.newPath}`);
        // The file watcher should automatically pick up the new file and refresh the library
      }
    } catch(err) {
      alert(`Error during transcoding: ${err.error || 'An unknown error occurred.'}`);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56 dark:bg-slate-800 dark:border-slate-700">
          <ContextMenuItem onClick={() => play(track)} className="dark:focus:bg-slate-700"><Play className="mr-2 h-4 w-4" /><span>Play</span></ContextMenuItem>
          {/* ... other menu items ... */}
          <ContextMenuSeparator className="dark:bg-slate-700" />
          <ContextMenuItem onClick={() => setShowEditDialog(true)} className="dark:focus:bg-slate-700"><Info className="mr-2 h-4 w-4" /><span>Get Info</span></ContextMenuItem>
          <ContextMenuItem onClick={handleShowAlbum} className="dark:focus:bg-slate-700"><Disc className="mr-2 h-4 w-4" /><span>Show Album</span></ContextMenuItem>
          
          {/* --- THIS IS THE NEW MENU ITEM --- */}
          <ContextMenuItem onClick={handleTranscode} className="dark:focus:bg-slate-700">
            <Music4 className="mr-2 h-4 w-4" />
            <span>Convert to MP3</span>
          </ContextMenuItem>

          <ContextMenuSeparator className="dark:bg-slate-700" />
          <ContextMenuItem className="dark:focus:bg-slate-700" onClick={handleMoveFile}>
            <FolderSync className="mr-2 h-4 w-4" />
            <span>Move File...</span>
          </ContextMenuItem>
          <ContextMenuItem className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300" onClick={handleDeleteFromDisk}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Delete from Disk</span>
          </ContextMenuItem>

        </ContextMenuContent>
      </ContextMenu>
      <EditTrackDialog open={showEditDialog} onOpenChange={setShowEditDialog} track={track} onUpdate={onUpdate} />
    </>
  );
}
// --- END OF CORRECTED FILE src/components/tracks/TrackContextMenu.jsx ---