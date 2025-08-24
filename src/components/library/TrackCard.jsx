
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Pause
} from "lucide-react";
import TrackContextMenu from "../tracks/TrackContextMenu";

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function TrackCard({
  track,
  isSelected,
  isPlaying,
  onPlay,
  onPause,
  onSelect,
  onUpdate
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    console.log('Drag started for track:', track.title);
    const dragData = {
      type: 'track',
      track: track,
      title: track.title,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    const dragImage = document.createElement('div');
    dragImage.className = 'px-3 py-1 bg-white dark:bg-slate-700 rounded-md shadow-lg text-sm flex items-center gap-2';
    dragImage.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> <span>${track.title}</span>`;

    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    e.currentTarget.classList.add('dragging'); // Add dragging class
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging'); // Remove dragging class
    e.currentTarget.style.opacity = '1';
  };

  return (
    <TrackContextMenu track={track} onUpdate={onUpdate}>
      <div
        className="group bg-white dark:bg-slate-800 rounded-xl p-4 material-elevation-1 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 draggable-track"
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="relative mb-3">
          <div
            className="w-full aspect-square bg-slate-700 rounded-lg overflow-hidden"
            style={{
              backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
          </div>

          <div className="absolute top-2 left-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="bg-white/80 backdrop-blur-sm border-slate-300 dark:bg-slate-900/50 dark:border-slate-600"
            />
          </div>

          <div className="absolute bottom-2 right-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white ripple-effect shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              ) : (
                <Play className="w-5 h-5 text-slate-700 dark:text-slate-200 ml-0.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={track.title}>
            {track.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate" title={track.artist}>
            {track.artist}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={track.album}>
            {track.album}
          </p>

          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-slate-300">
              {track.file_format}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDuration(track.duration || 0)}
            </span>
          </div>
        </div>
      </div>
    </TrackContextMenu>
  );
}
