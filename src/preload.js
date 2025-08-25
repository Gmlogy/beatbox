// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose all of our backend functions under a single, safe 'api' object
contextBridge.exposeInMainWorld('api', {
  // Database Functions
  getTracks: () => ipcRenderer.invoke('get-tracks'),

  // File System Functions
  deleteTrack: (trackId, filePath) => ipcRenderer.invoke('delete-track', trackId, filePath),
  moveTrack: (trackId, oldPath) => ipcRenderer.invoke('move-track', trackId, oldPath),

  // Importer Functions
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  importFolder: (folderPath) => ipcRenderer.invoke('import-folder', folderPath),

  // Native Tools Functions
  processAudio: (filePath, options) => ipcRenderer.invoke('process-audio', filePath, options),

  // Listener for the File Watcher
  onLibraryUpdate: (callback) => ipcRenderer.on('library-updated', callback),
  cleanupLibraryUpdate: () => ipcRenderer.removeAllListeners('library-updated'),
});