const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// Core external dependencies
const Database = require('better-sqlite3');
const chokidar = require('chokidar');
const { glob } = require('glob');

// FFmpeg dependencies
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


// --- DATABASE SETUP ---
const dbPath = path.join(app.getPath('userData'), 'beatbox_library.db');
const db = new Database(dbPath);
console.log(`Database connected at: ${dbPath}`);
const createTracksTable = `
CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, file_path TEXT NOT NULL UNIQUE, title TEXT, artist TEXT, album TEXT, duration REAL
);`;
db.exec(createTracksTable);


// --- IPC HANDLERS (The Backend Logic) ---

// Handle request to get all tracks
ipcMain.handle('get-tracks', async () => {
  const stmt = db.prepare('SELECT * FROM tracks ORDER BY artist, album, title');
  return stmt.all();
});

// Handle request to delete a track
ipcMain.handle('delete-track', async (event, trackId, filePath) => {
  try {
    await fs.unlink(filePath);
    const stmt = db.prepare('DELETE FROM tracks WHERE id = ?');
    stmt.run(trackId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete track:', error);
    return { success: false, error: error.message };
  }
});

// Handle request to move a track
ipcMain.handle('move-track', async (event, trackId, oldPath) => {
  try {
    const { canceled, filePath: newPath } = await dialog.showSaveDialog({ title: 'Move Track To...', defaultPath: oldPath });
    if (canceled || !newPath) return { success: false, error: 'User cancelled operation.' };
    await fs.rename(oldPath, newPath);
    const stmt = db.prepare('UPDATE tracks SET file_path = ? WHERE id = ?');
    stmt.run(newPath, trackId);
    return { success: true, newPath: newPath };
  } catch (error) {
    console.error('Failed to move track:', error);
    return { success: false, error: error.message };
  }
});

// Handle request to open the folder selection dialog
ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return (!canceled && filePaths.length > 0) ? filePaths[0] : null;
});

// Handle request to import all music from a folder (CORRECTED VERSION)
ipcMain.handle('import-folder', async (event, folderPath) => {
  if (!folderPath) return { success: false, error: 'No folder path provided.' };
  console.log(`Starting import for folder: ${folderPath}`);

  const { parseFile } = await import('music-metadata');
  
  const files = await glob('**/*.{mp3,m4a,flac,wav,ogg,aac}', { cwd: folderPath, nocase: true, absolute: true });
  console.log(`Found ${files.length} audio files to process.`);

  let importedCount = 0;
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO tracks (file_path, title, artist, album, duration) VALUES (?, ?, ?, ?, ?)`);

  for (const filePath of files) {
    try {
      const metadata = await parseFile(filePath);
      const { common, format } = metadata;
      const info = insertStmt.run(filePath, common.title || 'Unknown Title', common.artist || 'Unknown Artist', common.album || 'Unknown Album', format.duration || 0);
      if (info.changes > 0) importedCount++;
    } catch (error) {
      console.warn(`Skipping file due to error: ${filePath}`, error.message);
    }
  }

  console.log(`Import complete. Added ${importedCount} new tracks.`);
  return { success: true, importedCount };
});

// Handle request to transcode/process an audio file with FFmpeg
ipcMain.handle('process-audio', async (event, filePath, options) => {
  return new Promise((resolve, reject) => {
    const { operation, targetFormat = 'mp3' } = options;
    const outputFilePath = filePath.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;
    const command = ffmpeg(filePath);
    if (operation === 'transcode') {
      command.toFormat(targetFormat)
        .on('end', () => resolve({ success: true, newPath: outputFilePath }))
        .on('error', (err) => reject({ success: false, error: err.message }))
        .save(outputFilePath);
    } else {
      reject({ success: false, error: 'Unknown operation specified.' });
    }
  });
});


// --- FILE SYSTEM WATCHER ---
let watcher = null;
function initializeWatcher(win, libraryPath) {
  if (!win || !libraryPath) return;
  console.log(`Initializing watcher for path: ${libraryPath}`);
  watcher = chokidar.watch(libraryPath, { ignored: /(^|[\/\\])\../, persistent: true, ignoreInitial: true, depth: 99 });

  const notifyRenderer = () => win && !win.isDestroyed() && win.webContents.send('library-updated');
  
  watcher.on('add', (filePath) => {
    console.log(`[Watcher] File added: ${filePath}. Notifying UI to refresh.`);
    notifyRenderer();
  });
  watcher.on('unlink', (filePath) => {
    console.log(`[Watcher] File removed: ${filePath}`);
    try {
      const stmt = db.prepare('DELETE FROM tracks WHERE file_path = ?');
      if (stmt.run(filePath).changes > 0) notifyRenderer();
    } catch (e) { console.error("Failed to delete track for unlinked file:", e); }
  });
}


// --- ELECTRON APP LIFECYCLE ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: { preload: path.join(__dirname, 'src/preload.js'), contextIsolation: true, nodeIntegration: false },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // !! IMPORTANT !! You must change this to a real music folder on your PC for testing.
  const libraryPathToWatch = 'C:\\Users\\af200\\Music';
  initializeWatcher(win, libraryPathToWatch);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});