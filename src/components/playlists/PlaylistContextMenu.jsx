import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Play,
  Shuffle,
  Edit3,
  Trash2,
  Copy,
  Download,
  Smartphone
} from "lucide-react";

export default function PlaylistContextMenu({ 
  children, 
  playlist, 
  onPlay, 
  onShuffle, 
  onRename, 
  onDelete, 
  onDuplicate, 
  onExport, 
  onAddToDevice 
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 dark:bg-slate-800 dark:border-slate-700">
        <ContextMenuItem onClick={() => onPlay(playlist)} className="dark:focus:bg-slate-700">
          <Play className="w-4 h-4 mr-2" />
          Play
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onShuffle(playlist)} className="dark:focus:bg-slate-700">
          <Shuffle className="w-4 h-4 mr-2" />
          Shuffle
        </ContextMenuItem>
        <ContextMenuSeparator className="dark:bg-slate-700" />
        <ContextMenuItem onClick={() => onRename(playlist)} className="dark:focus:bg-slate-700">
          <Edit3 className="w-4 h-4 mr-2" />
          Rename Playlist
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(playlist)} className="dark:focus:bg-slate-700">
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator className="dark:bg-slate-700" />
        <ContextMenuItem onClick={() => onExport(playlist)} className="dark:focus:bg-slate-700">
          <Download className="w-4 h-4 mr-2" />
          Export Playlist...
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onAddToDevice(playlist)} className="dark:focus:bg-slate-700">
          <Smartphone className="w-4 h-4 mr-2" />
          Add to Device
        </ContextMenuItem>
        <ContextMenuSeparator className="dark:bg-slate-700" />
        <ContextMenuItem 
          onClick={() => onDelete(playlist)} 
          className="text-red-600 dark:text-red-400 dark:focus:bg-slate-700 focus:text-red-700 dark:focus:text-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete from Library
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}