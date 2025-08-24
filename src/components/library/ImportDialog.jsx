// --- START OF FILE src/components/library/ImportDialog.jsx ---
import React, { useState, useRef } from "react";
import * as mm from 'music-metadata-browser';
import { Track } from "@/api/entities"; // This correctly imports our mocked Track entity
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FolderUp, Music, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// This is a simple in-memory cache to hold the temporary audio URLs for playback.
const audioBlobCache = new Map();

export default function ImportDialog({ open, onOpenChange, onImportComplete }) {
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [errorDetails, setErrorDetails] = useState("");
  const fileInputRef = useRef(null);

  const handleFolderSelect = () => {
    fileInputRef.current.click();
  };

  const processFiles = async (files) => {
    setStatus('processing');
    const audioFiles = Array.from(files).filter(file => /\.(mp3|flac|m4a|aac|ogg|wav)$/i.test(file.name));
    setTotalFiles(audioFiles.length);
    setProcessedCount(0);
    setProgress(0);
    setCurrentFile("");

    if (audioFiles.length === 0) {
      setErrorDetails("No compatible audio files found in the selected folder.");
      setStatus('error');
      return;
    }

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      setCurrentFile(file.name);
      setProgress(((i + 1) / audioFiles.length) * 100);

      try {
        const metadata = await mm.parseBlob(file);
        const { common } = metadata;

        let albumArtUrl = null;
        if (common.picture?.length > 0) {
          const picture = common.picture[0];
          const blob = new Blob([picture.data], { type: picture.format });
          albumArtUrl = URL.createObjectURL(blob);
        }
        
        const trackData = {
          title: common.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: common.artist || "Unknown Artist",
          album: common.album || "Unknown Album",
          genre: common.genre?.[0] || "Unknown",
          year: common.year,
          track_number: common.track.no,
          duration: metadata.format.duration,
          file_format: metadata.format.codec?.toUpperCase().replace('MPEG 1 LAYER 3', 'MP3'),
          file_size: file.size,
          file_path: file.webkitRelativePath || file.name, // In Electron, this would be the absolute path
          album_art_url: albumArtUrl,
        };

        const newTrack = await Track.create(trackData);
        
        // After creating the track in our mock DB, we cache its playable blob URL
        const audioBlobUrl = URL.createObjectURL(file);
        audioBlobCache.set(newTrack.id, audioBlobUrl);

        setProcessedCount(i + 1);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // We'll just skip files that have parsing errors
      }
    }

    setStatus('success');
    setTimeout(() => {
      onImportComplete(); // Refresh the main library view
      onOpenChange(false);
      resetState();
    }, 2000);
  };

  const resetState = () => {
    setStatus('idle');
    setProgress(0); setProcessedCount(0); setTotalFiles(0);
    setErrorDetails(""); setCurrentFile("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Import Music</DialogTitle></DialogHeader>
        <div className="space-y-6 min-h-[300px] flex flex-col justify-center">
          {status === 'idle' && (
            <div className="text-center py-8">
              <input type="file" webkitdirectory="true" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => processFiles(e.target.files)} />
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><FolderUp className="w-8 h-8 text-slate-600 dark:text-slate-400" /></div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Import Music from a Folder</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Scan a folder to add all its music to your library.</p>
              <Button onClick={handleFolderSelect} className="btn-primary"><FolderUp className="w-4 h-4 mr-2" />Select Folder</Button>
            </div>
          )}
          {status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Scanning Library...</h3>
              <div className="space-y-2 text-left mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{processedCount} of {totalFiles} | {currentFile}</p>
              </div>
            </div>
          )}
          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Import Complete!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Added {processedCount} new tracks.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Import Error</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 break-words">{errorDetails}</p>
              <Button variant="outline" onClick={resetState}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// This helper function allows other parts of the app (like the player) to get the correct audio source.
export const getAudioSource = (trackId) => audioBlobCache.get(trackId);
// --- END OF FILE src/components/library/ImportDialog.jsx ---