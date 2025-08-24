import React, { useState, useEffect } from 'react';
import { Track } from '@/api/entities';
import { findDuplicateTracks } from '@/api/functions';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Trash2, 
  Music, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import { usePlayer } from '@/components/player/PlayerContext';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const DuplicateGroup = ({ group, onSelectionChange, selectedTracks }) => {
  const { play, pause, isPlaying, currentTrack } = usePlayer();
  
  const handleTrackSelect = (track, isSelected) => {
    onSelectionChange(track.id, isSelected);
  };

  const totalWastedSpace = group.slice(1).reduce((sum, track) => sum + (track.file_size || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 material-elevation-1 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {group[0].title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            by {group[0].artist} • {group.length} duplicates found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatBytes(totalWastedSpace)} wasted
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {group.map((track, index) => (
          <div 
            key={track.id} 
            className={`flex items-center gap-4 p-3 rounded-lg border ${
              index === 0 
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
            }`}
          >
            <Checkbox 
              checked={selectedTracks.has(track.id)}
              onCheckedChange={(isSelected) => handleTrackSelect(track, isSelected)}
              disabled={index === 0} // Don't allow selecting the best quality version
            />
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <CheckCircle className="w-4 h-4 text-green-600" title="Best quality" />
                  )}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {track.title}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {track.album}
                </p>
              </div>
              
              <div className="text-center">
                <Badge variant={track.file_format === 'FLAC' ? 'default' : 'secondary'}>
                  {track.file_format}
                </Badge>
              </div>
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                {track.bitrate || 'Unknown'}
              </div>
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                {formatBytes(track.file_size || 0)}
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isPlaying && currentTrack?.id === track.id) {
                      pause();
                    } else {
                      play(track, group);
                    }
                  }}
                  className="w-8 h-8"
                >
                  {isPlaying && currentTrack?.id === track.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DuplicatesPage() {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const { data } = await findDuplicateTracks();
      setDuplicateGroups(data || []);
    } catch (error) {
      console.error('Error loading duplicates:', error);
    }
    setLoading(false);
  };

  const handleSelectionChange = (trackId, isSelected) => {
    const newSelection = new Set(selectedTracks);
    if (isSelected) {
      newSelection.add(trackId);
    } else {
      newSelection.delete(trackId);
    }
    setSelectedTracks(newSelection);
  };

  const selectAllDuplicates = () => {
    const newSelection = new Set();
    duplicateGroups.forEach(group => {
      // Skip the first (best quality) track in each group
      group.slice(1).forEach(track => {
        newSelection.add(track.id);
      });
    });
    setSelectedTracks(newSelection);
  };

  const clearSelection = () => {
    setSelectedTracks(new Set());
  };

  const deleteDuplicates = async () => {
    if (selectedTracks.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTracks.size} duplicate tracks? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      for (const trackId of selectedTracks) {
        await Track.delete(trackId);
      }
      
      // Reload duplicates after deletion
      await loadDuplicates();
      setSelectedTracks(new Set());
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Deleted ${selectedTracks.size} duplicate tracks`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      alert('Failed to delete some tracks. Please try again.');
    }
    setDeleting(false);
  };

  const totalWastedSpace = duplicateGroups.reduce((total, group) => {
    return total + group.slice(1).reduce((sum, track) => sum + (track.file_size || 0), 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Scanning for duplicate tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Duplicate Tracks</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {duplicateGroups.length === 0 
                ? "No duplicates found in your library" 
                : `Found ${duplicateGroups.length} sets of duplicates • ${formatBytes(totalWastedSpace)} can be saved`
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadDuplicates} disabled={loading}>
              Rescan Library
            </Button>
          </div>
        </div>
        
        {duplicateGroups.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={selectAllDuplicates} variant="outline" size="sm">
              Select All Duplicates
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
            {selectedTracks.size > 0 && (
              <Button 
                onClick={deleteDuplicates}
                variant="destructive" 
                size="sm"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {selectedTracks.size} Selected
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {duplicateGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Duplicates Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your music library is clean! No duplicate tracks were detected.
            </p>
            <Button onClick={loadDuplicates} variant="outline">
              Scan Again
            </Button>
          </div>
        ) : (
          <div>
            {duplicateGroups.map((group, index) => (
              <DuplicateGroup
                key={`${group[0].title}-${group[0].artist}-${index}`}
                group={group}
                onSelectionChange={handleSelectionChange}
                selectedTracks={selectedTracks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}