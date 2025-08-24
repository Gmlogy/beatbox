
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ListMusic, 
  Sparkles
} from "lucide-react";

export default function CreatePlaylistDialog({ open, onOpenChange, onCreatePlaylist }) {
  const [playlistData, setPlaylistData] = useState({
    name: "",
    description: "",
    is_smart: false,
    track_ids: []
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playlistData.name.trim()) return;

    setIsCreating(true);
    try {
      await onCreatePlaylist(playlistData);
      // Reset form
      setPlaylistData({
        name: "",
        description: "",
        is_smart: false,
        track_ids: []
      });
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
    setIsCreating(false);
  };

  const handleInputChange = (field, value) => {
    setPlaylistData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setPlaylistData({
      name: "",
      description: "",
      is_smart: false,
      track_ids: []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Create New Playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name *</Label>
            <Input
              id="playlist-name"
              placeholder="Enter playlist name..."
              value={playlistData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="h-10"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description (Optional)</Label>
            <Textarea
              id="playlist-description"
              placeholder="Describe your playlist..."
              value={playlistData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Smart Playlist</p>
                <p className="text-xs text-slate-600">Auto-update based on criteria</p>
              </div>
            </div>
            <Switch
              checked={playlistData.is_smart}
              onCheckedChange={(checked) => handleInputChange('is_smart', checked)}
            />
          </div>

          {playlistData.is_smart && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Smart Playlist</span>
              </div>
              <p className="text-xs text-amber-700">
                Smart playlists will automatically add tracks based on your criteria. 
                This feature is coming in a future update!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
              className="ripple-effect"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!playlistData.name.trim() || isCreating}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect min-w-[100px] text-white"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create Playlist"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
