// --- START OF FILE src/local-backend/db.js ---
// This file represents our local database and the logic to interact with it,
// effectively replacing the entire Base44 backend for local development.

// 1. In-memory database
let db = {
  tracks: [],
  playlists: [],
  syncDevices: [],
  syncJobs: [],
  playHistory: [],
};

// 2. Helper to generate unique IDs
const newId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 3. Seed Data (to populate the app with initial content)
const seedDatabase = () => {
  if (db.tracks.length > 0) return; // Only seed once
  console.log("Seeding Local Database...");

  const artists = ["Stellar Fusion", "Crimson Tide", "Echo Valley", "Neon Pulse", "Solar Flare"];
  const albums = ["Cosmic Drift", "Oceanic Echoes", "Mountain Hymns", "Digital Dreams", "Sunspot"];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 15; j++) {
      db.tracks.push({
        id: newId(),
        title: `Song ${j + 1}`,
        artist: artists[i],
        album: albums[i],
        genre: i % 2 === 0 ? "Rock" : "Electronic",
        year: 2020 + i,
        track_number: j + 1,
        duration: 180 + Math.floor(Math.random() * 120),
        file_format: j % 3 === 0 ? "FLAC" : "MP3",
        file_size: 5000000 + Math.floor(Math.random() * 10000000),
        file_path: `/Users/mock/Music/${artists[i]}/${albums[i]}/Song_${j + 1}.mp3`,
        album_art_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg',
        is_favorite: Math.random() > 0.85,
        play_count: Math.floor(Math.random() * 150),
        last_played: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 30).toISOString(),
        created_date: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 60).toISOString(),
      });
    }
  }

  db.playlists.push({ id: newId(), name: "Chill Vibes", description: "For relaxing.", track_ids: db.tracks.slice(0, 8).map(t => t.id), is_smart: false });
  db.playlists.push({ id: newId(), name: "Rock Anthems (Smart)", track_ids: db.tracks.filter(t => t.genre === 'Rock').map(t => t.id), is_smart: true, smart_criteria: { match_all: true, rules: [{ field: 'genre', operator: 'is', value: 'Rock' }] } });
  db.playlists.push({ id: newId(), name: "Favorites (Smart)", track_ids: db.tracks.filter(t => t.is_favorite).map(t => t.id), is_smart: true, smart_criteria: { match_all: true, rules: [{ field: 'is_favorite', operator: 'is_true', value: true }] } });

  db.syncDevices.push({ id: newId(), device_name: "Pixel 8 Pro (Local)", device_model: "GP4BC", is_connected: true, storage_total: 256e9, storage_used: 89e9, last_sync: new Date().toISOString(), sync_enabled: true, auto_convert: true, selected_playlists: [db.playlists[0].id], synced_track_ids: db.playlists[0].track_ids.slice(0,4) });
};

// 4. Generic CRUD Logic for any data type (entity)
const createApiFor = (store) => ({
  list: async (sortKey, limit) => {
    let results = [...store];
    if (sortKey) {
        const isDesc = sortKey.startsWith('-');
        const key = isDesc ? sortKey.substring(1) : sortKey;
        results.sort((a, b) => {
            if (a[key] < b[key]) return isDesc ? 1 : -1;
            if (a[key] > b[key]) return isDesc ? 1 : -1;
            return 0;
        });
    }
    return limit ? results.slice(0, limit) : results;
  },
  get: async (id) => store.find(item => item.id === id) || null,
  create: async (data) => {
    const newItem = { ...data, id: newId(), created_date: new Date().toISOString() };
    store.push(newItem);
    return newItem;
  },
  update: async (id, data) => {
    const index = store.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${id} not found`);
    store[index] = { ...store[index], ...data };
    return store[index];
  },
  delete: async (id) => {
    const index = store.findIndex(item => item.id === id);
    if (index > -1) store.splice(index, 1);
    return { success: true };
  },
  filter: async (filters) => store.filter(item => Object.entries(filters).every(([key, value]) => item[key] === value)),
});

// 5. Build the Local SDK object that mimics the Base44 SDK structure
export const LocalSDK = {
  entities: {
    Track: createApiFor(db.tracks),
    Playlist: createApiFor(db.playlists),
    SyncDevice: createApiFor(db.syncDevices),
    SyncJob: createApiFor(db.syncJobs),
    PlayHistory: createApiFor(db.playHistory),
  },
  functions: {
    // Implement mock versions of all backend functions listed in the document
    getRecommendations: async () => ({ data: { heavyRotation: { title: "Heavy Rotation", tracks: db.tracks.slice(0, 8) }, recentlyAdded: { title: "Recently Added", tracks: db.tracks.slice(8, 16) } } }),
    findDuplicateTracks: async () => ({ data: [] }),
    runLibraryMaintenance: async () => ({ data: { details: "Local maintenance complete." } }),
    logPlay: async ({ trackId }) => {
        const track = await LocalSDK.entities.Track.get(trackId);
        if (track) await LocalSDK.entities.Track.update(trackId, { play_count: (track.play_count || 0) + 1, last_played: new Date().toISOString() });
        return { success: true };
    },
    searchLibrary: async ({ query }) => {
        const q = query.toLowerCase();
        const tracks = db.tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)).slice(0, 5);
        const artists = [...new Set(db.tracks.filter(t => t.artist.toLowerCase().includes(q)).map(t => t.artist))].map(name => ({name})).slice(0, 3);
        const albums = [...new Map(db.tracks.filter(t => t.album.toLowerCase().includes(q)).map(t => [`${t.album}-${t.artist}`, {name: t.album, artist: t.artist, coverArt: t.album_art_url}])).values()].slice(0, 3);
        return { data: { tracks, artists, albums } };
    },
    updateSmartPlaylists: async () => ({ data: { updatedCount: db.playlists.filter(p => p.is_smart).length, message: "Smart playlists updated." } }),
    exportLibraryData: async () => ({ data: db, headers: {'content-disposition': 'attachment; filename="beatbox_local_export.json"'} }),
    processAudioFiles: async ({ trackIds }) => ({ data: { processed: trackIds.length, failed: 0 } }),
    extractTrackMetadata: async () => ({ data: { title: 'New Track', artist: 'Unknown Artist' } }),
    getStats: async () => ({ data: { totalPlays: 1234, totalListeningTime: 567890, totalTracks: db.tracks.length, topTracksAllTime: db.tracks.slice(0,5), topTracksWeekly: db.tracks.slice(5,10) } }),
    simulateDeviceSync: async ({ deviceId }) => {
        const job = await LocalSDK.entities.SyncJob.create({ device_id: deviceId, status: 'in_progress', total_files: 5, total_size: 25000000 });
        setTimeout(() => LocalSDK.entities.SyncJob.update(job.id, { status: 'completed', completed_files: 5, transferred_size: 25000000 }), 3000);
        return { data: { jobId: job.id } };
    },
  },
  integrations: {
    UploadFile: async ({ file }) => ({ file_url: `/${file.name}` }),
  },
};

// 6. Initialize the database with data
seedDatabase();
// --- END OF FILE src/local-backend/db.js ---