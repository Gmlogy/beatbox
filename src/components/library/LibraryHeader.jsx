// --- START OF FILE src/components/library/LibraryHeader.jsx ---
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Grid3X3, 
  List, 
  Plus, 
  RefreshCw,
  SortAsc,
  SortDesc,
  Play,
  Shuffle,
  Scan // New icon
} from "lucide-react";

export default function LibraryHeader({
  trackCount,
  selectedCount,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  onImport,
  onRefresh,
  onPlayAll,
  onShuffle
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Music Library</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {trackCount} tracks {selectedCount > 0 && `• ${selectedCount} selected`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32 dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:text-slate-200">
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="album">Album</SelectItem>
                <SelectItem value="created_date">Date Added</SelectItem>
                <SelectItem value="play_count">Play Count</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ripple-effect dark:bg-slate-700 dark:border-slate-600">
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>

            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" onClick={() => onViewModeChange("list")} className={`w-8 h-8 ripple-effect ${viewMode === "list" ? 'bg-white shadow-sm dark:bg-slate-500' : 'dark:hover:bg-slate-600'}`}><List className="w-4 h-4" /></Button>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" onClick={() => onViewModeChange("grid")} className={`w-8 h-8 ripple-effect ${viewMode === "grid" ? 'bg-white shadow-sm dark:bg-slate-500' : 'dark:hover:bg-slate-600'}`}><Grid3X3 className="w-4 h-4" /></Button>
            </div>

            <Button variant="outline" onClick={onRefresh} className="ripple-effect dark:bg-slate-700 dark:border-slate-600">
              <Scan className="w-4 h-4 mr-2" />
              Rescan
            </Button>

            <Button onClick={onPlayAll} className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"><Play className="w-4 h-4 mr-2" />Play All</Button>
            <Button onClick={onShuffle} variant="outline" className="ripple-effect dark:bg-slate-700 dark:border-slate-600"><Shuffle className="w-4 h-4 mr-2" />Shuffle</Button>
            <Button onClick={onImport} variant="outline" className="ripple-effect dark:bg-slate-700 dark:border-slate-600"><Plus className="w-4 h-4 mr-2" />Import</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END OF FILE src/components/library/LibraryHeader.jsx ---