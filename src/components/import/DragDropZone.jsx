import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Music } from 'lucide-react';

const DragDropZone = ({ onImportComplete, children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFolderImport = async () => {
    const folderPath = await window.api.selectFolder();
    if (!folderPath) {
      return;
    }
    await startImportProcess(folderPath);
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const folderPath = files[0].path.substring(0, files[0].path.lastIndexOf('\\'));
    if (!folderPath) {
      alert("Could not determine the folder from the dropped files.");
      return;
    }
    await startImportProcess(folderPath);
  }, []);

  const startImportProcess = async (path) => {
    setIsImporting(true);
    setMessage(`Scanning for music in: ${path}...`);

    try {
      const result = await window.api.importFolder(path);
      if (result.success) {
        setMessage(`Import complete! Added ${result.importedCount} new tracks.`);
        onImportComplete?.();
      } else {
        setMessage(`Import failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`An unexpected error occurred: ${error.message}`);
      console.error('Import process failed:', error);
    }

    setIsImporting(false);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}
      
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border dark:border-slate-700">
        <p className="text-center mb-2 text-sm text-slate-600 dark:text-slate-400">Import music from a folder</p>
        <Button onClick={handleFolderImport} disabled={isImporting}>
          {isImporting ? 'Scanning...' : 'Select Folder'}
        </Button>
      </div>
      
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl border-2 border-dashed border-blue-500 text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Drop Your Music Folder</h3>
            <p className="text-slate-500">Release to start importing</p>
          </div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl text-center">
            <Music className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold">Importing Music...</h3>
            <p className="text-slate-500 max-w-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;