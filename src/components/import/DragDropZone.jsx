import React, { useState, useCallback } from 'react';
import { Track } from '@/api/entities';
import { Upload, Music, FileX, CheckCircle } from 'lucide-react';

const SUPPORTED_FORMATS = ['mp3', 'aac', 'flac', 'alac', 'aiff', 'wav', 'm4a', 'ogg'];

const DragDropZone = ({ onImportComplete, children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we have files being dragged
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasAudioFiles = Array.from(e.dataTransfer.items).some(item => {
        if (item.kind === 'file') {
          const extension = item.type.split('/')[1] || '';
          return SUPPORTED_FORMATS.includes(extension.toLowerCase());
        }
        return false;
      });
      
      if (hasAudioFiles) {
        setIsDragOver(true);
      }
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove drag state if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const extractMetadataFromFile = (file) => {
    // Extract basic metadata from filename and file properties
    const filename = file.name;
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
    
    // Try to parse artist - title format
    let title = nameWithoutExtension;
    let artist = "Unknown Artist";
    
    if (nameWithoutExtension.includes(' - ')) {
      const parts = nameWithoutExtension.split(' - ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    return {
      title,
      artist,
      album: "Unknown Album",
      genre: "Unknown",
      year: new Date().getFullYear(),
      duration: 0, // Would need audio analysis to get real duration
      bitrate: "Unknown",
      file_format: file.name.split('.').pop().toUpperCase(),
      file_size: file.size,
      file_path: `/imported/${file.name}`,
      rating: 0,
      play_count: 0
    };
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return SUPPORTED_FORMATS.includes(extension);
    });

    if (audioFiles.length === 0) {
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'No supported audio files found. Supported formats: MP3, AAC, FLAC, ALAC, AIFF, WAV';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 4000);
      return;
    }

    setIsImporting(true);
    setImportedCount(0);
    setImportProgress(0);

    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        const metadata = extractMetadataFromFile(file);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await Track.create(metadata);
        
        setImportedCount(i + 1);
        setImportProgress(((i + 1) / audioFiles.length) * 100);
      }

      // Success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Successfully imported ${audioFiles.length} track${audioFiles.length !== 1 ? 's' : ''}!`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);

      onImportComplete?.();
      
    } catch (error) {
      console.error('Error importing files:', error);
      
      // Error toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Error importing files. Please try again.';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }

    setIsImporting(false);
    setImportProgress(0);
    setImportedCount(0);
  }, [onImportComplete]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}
      
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl border-2 border-dashed border-blue-500 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Drop Audio Files Here
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Release to import your music files
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {SUPPORTED_FORMATS.slice(0, 4).map(format => (
                  <span key={format} className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    {format.toUpperCase()}
                  </span>
                ))}
                <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  +{SUPPORTED_FORMATS.length - 4} more
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Music className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Importing Music...
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Processing and adding files to your library
              </p>
              
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {importedCount} files imported
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;