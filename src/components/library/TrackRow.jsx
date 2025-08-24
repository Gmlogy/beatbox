
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  MoreHorizontal,
  Heart,
  Plus,
  Download
} from "lucide-react";
import TrackContextMenu from "../tracks/TrackContextMenu";

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function TrackRow({
  track,
  index,
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

    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.opacity = '1';
  };

  return (
    <TrackContextMenu track={track} onUpdate={onUpdate}>
      <TableRow
        className={`group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors draggable-track cursor-pointer ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/50 border-l-4 border-l-blue-500' : ''
        } ${isPlaying ? 'bg-green-50 dark:bg-green-900/50' : ''}`}
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onPlay()}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="sync-checkbox"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? onPause() : onPlay();
              }}
              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity ripple-effect"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-slate-700 rounded overflow-hidden flex-shrink-0"
              style={{
                backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{track.title}</p>
              {track.year && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{track.year}</p>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-slate-700 dark:text-slate-300">{track.artist}</span>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-slate-600 dark:text-slate-400">{track.album}</span>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-slate-600 dark:text-slate-400 font-mono text-sm">
            {formatDuration(track.duration || 0)}
          </span>
        </TableCell>

        <TableCell className="py-3">
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            {track.play_count || 0}
          </span>
        </TableCell>

        <TableCell className="py-3">
          <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
            {track.file_format}
          </Badge>
        </TableCell>

        <TableCell className="py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuItem className="dark:focus:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                Add to Playlist
              </DropdownMenuItem>
              <DropdownMenuItem className="dark:focus:bg-slate-700">
                <Heart className="w-4 h-4 mr-2" />
                Add to Favorites
              </DropdownMenuItem>
              <DropdownMenuItem className="dark:focus:bg-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Show in Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TrackContextMenu>
  );
}
