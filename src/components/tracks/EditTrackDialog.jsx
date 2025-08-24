import React, { useState, useEffect } from 'react';
import { Track } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditTrackDialog({ open, onOpenChange, track, onUpdate }) {
  const [formData, setFormData] = useState({ title: '', artist: '', album: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        artist: track.artist || '',
        album: track.album || '',
      });
    }
  }, [track]);

  const handleSave = async () => {
    if (!track) return;
    setIsSaving(true);
    try {
      await Track.update(track.id, formData);
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating track:", error);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-100">Get Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right dark:text-slate-300">Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="col-span-3 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right dark:text-slate-300">Artist</Label>
            <Input id="artist" value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} className="col-span-3 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="album" className="text-right dark:text-slate-300">Album</Label>
            <Input id="album" value={formData.album} onChange={(e) => setFormData({...formData, album: e.target.value})} className="col-span-3 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}