import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3 } from "lucide-react";

export default function RenamePlaylistDialog({ open, onOpenChange, playlist, onRename }) {
  const [playlistName, setPlaylistName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (playlist) {
      setPlaylistName(playlist.name);
    }
  }, [playlist]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    setIsRenaming(true);
    try {
      await onRename(playlist.id, playlistName.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Error renaming playlist:", error);
    }
    setIsRenaming(false);
  };

  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-slate-100">
            <Edit3 className="w-5 h-5" />
            Rename Playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name" className="dark:text-slate-200">
              Playlist Name
            </Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="h-10 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              required
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRenaming}
              className="ripple-effect dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!playlistName.trim() || isRenaming || playlistName.trim() === playlist.name}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect min-w-[100px] text-white"
            >
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Renaming...
                </div>
              ) : (
                "Rename"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}