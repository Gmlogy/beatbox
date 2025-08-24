
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Play, 
  MoreHorizontal, 
  Edit3,
  Trash2,
  Music,
  Clock,
  Users
} from "lucide-react";

export default function PlaylistCard({ playlist, onClick, onPlay, onDelete }) {
  const trackCount = playlist.track_ids?.length || 0;
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      onDelete();
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl p-4 material-elevation-1 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative mb-3">
        <div className="w-full aspect-square bg-gradient-to-br from-purple-200 via-blue-200 to-teal-200 rounded-lg overflow-hidden flex items-center justify-center">
          {playlist.cover_art_url ? (
            <img 
              src={playlist.cover_art_url} 
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl font-bold text-white/80">
              {playlist.is_smart ? "🎯" : "♪"}
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Playlist
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-2 right-2">
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white ripple-effect shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
          >
            <Play className="w-5 h-5 text-slate-700 ml-0.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900 truncate" title={playlist.name}>
          {playlist.name}
          {playlist.is_smart && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Smart
            </span>
          )}
        </h3>
        {playlist.description && (
          <p className="text-sm text-slate-600 truncate" title={playlist.description}>
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Music className="w-3 h-3" />
            <span>{trackCount} tracks</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>0m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
