// --- START OF FILE src/lib/local-sdk.js ---
// This file is the complete local replacement for the Base44 backend SDK.
// It contains the in-memory database, seed data, and all API logic.

// 1. In-memory database
let db = {
  tracks: [], playlists: [], syncDevices: [], syncJobs: [], playHistory: [],
};

// 2. Helper to generate unique IDs
const newId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 3. Seed Data
const seedDatabase = () => {
  if (db.tracks.length > 0) return;
  console.log("Seeding Local Database from local-sdk.js...");

  const artists = ["Stellar Fusion", "Crimson Tide", "Echo Valley", "Neon Pulse", "Solar Flare"];
  const albums = ["Cosmic Drift", "Oceanic Echoes", "Mountain Hymns", "Digital Dreams", "Sunspot"];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 15; j++) {
      db.tracks.push({
        id: newId(), title: `Song ${j + 1}`, artist: artists[i], album: albums[i],
        genre: i % 2 === 0 ? "Rock" : "Electronic", year: 2020 + i, track_number: j + 1,
        duration: 180 + Math.floor(Math.random() * 120), file_format: j % 3 === 0 ? "FLAC" : "MP3",
        file_size: 5e6 + Math.random() * 1e7, file_path: `/Users/mock/Music/${artists[i]}/${albums[i]}/Song_${j + 1}.mp3`,
        album_art_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg',
        is_favorite: Math.random() > 0.85, play_count: Math.floor(Math.random() * 150),
        last_played: new Date(Date.now() - Math.random() * 1e3 * 3600 * 24 * 30).toISOString(),
        created_date: new Date(Date.now() - Math.random() * 1e3 * 3600 * 24 * 60).toISOString(),
      });
    }
  }
  db.playlists.push({ id: newId(), name: "Chill Vibes", description: "For relaxing.", track_ids: db.tracks.slice(0, 8).map(t => t.id), is_smart: false });
  db.playlists.push({ id: newId(), name: "Rock Anthems (Smart)", track_ids: db.tracks.filter(t => t.genre === 'Rock').map(t => t.id), is_smart: true, smart_criteria: { match_all: true, rules: [{ field: 'genre', operator: 'is', value: 'Rock' }] } });
  db.syncDevices.push({ id: newId(), device_name: "Pixel 8 Pro (Local)", device_model: "GP4BC", is_connected: true, storage_total: 256e9, storage_used: 89e9, last_sync: new Date().toISOString(), sync_enabled: true, auto_convert: true, selected_playlists: [db.playlists[0].id], synced_track_ids: db.playlists[0].track_ids.slice(0,4) });
};

// 4. Generic CRUD Logic for entities
const createApiFor = (store) => ({
  list: async (sortKey, limit) => {
    let results = [...store];
    if (sortKey) {
        const isDesc = sortKey.startsWith('-');
        const key = isDesc ? sortKey.substring(1) : sortKey;
        results.sort((a, b) => (a[key] > b[key] ? 1 : -1) * (isDesc ? -1 : 1));
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

// 5. Build and export the complete Local SDK
export const LocalSDK = {
  entities: {
    Track: createApiFor(db.tracks),
    Playlist: createApiFor(db.playlists),
    SyncDevice: createApiFor(db.syncDevices),
    SyncJob: createApiFor(db.syncJobs),
    PlayHistory: createApiFor(db.playHistory),
  },
  functions: {
    extractTrackMetadata: async () => ({ data: { title: 'New Track', artist: 'Unknown Artist' } }),
    exportPlaylist: async () => ({ data: "#EXTM3U\n" }),
    simulateDeviceSync: async ({ deviceId }) => {
      const job = await LocalSDK.entities.SyncJob.create({ device_id: deviceId, status: 'in_progress', total_files: 5, total_size: 25000000 });
      setTimeout(() => LocalSDK.entities.SyncJob.update(job.id, { status: 'completed', completed_files: 5, transferred_size: 25000000 }), 3000);
      return { data: { jobId: job.id } };
    },
    searchLibrary: async ({ query }) => {
      const q = query.toLowerCase();
      const tracks = db.tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)).slice(0, 5);
      const artists = [...new Set(db.tracks.filter(t => t.artist.toLowerCase().includes(q)).map(t => t.artist))].map(name => ({name})).slice(0, 3);
      const albums = [...new Map(db.tracks.filter(t => t.album.toLowerCase().includes(q)).map(t => [`${t.album}-${t.artist}`, {name: t.album, artist: t.artist, coverArt: t.album_art_url}])).values()].slice(0, 3);
      return { data: { tracks, artists, albums } };
    },
    getRecommendations: async () => ({ data: { heavyRotation: { title: "Heavy Rotation", tracks: db.tracks.slice(0, 8) }, recentlyAdded: { title: "Recently Added", tracks: db.tracks.slice(8, 16) } } }),
    logPlay: async ({ trackId }) => {
      const track = await LocalSDK.entities.Track.get(trackId);
      if (track) await LocalSDK.entities.Track.update(trackId, { play_count: (track.play_count || 0) + 1, last_played: new Date().toISOString() });
    },
    getStats: async () => ({ data: { totalPlays: 1234, totalListeningTime: 567890, totalTracks: db.tracks.length, topTracksAllTime: db.tracks.slice(0,5), topTracksWeekly: db.tracks.slice(5,10) } }),
    runLibraryMaintenance: async () => ({ data: { details: "Local maintenance complete." } }),
    updateSmartPlaylists: async () => ({ data: { message: "Smart playlists updated." } }),
    // Inside the `functions` object in src/lib/local-sdk.js

    processAudioFiles: async ({ trackIds, operation, targetFormat }) => {
      console.log(`Simulating audio processing:`, { operation, targetFormat, count: trackIds.length });
      
      // Simulate a delay as if files were being processed
      await new Promise(resolve => setTimeout(resolve, 2500)); 

      // Simulate the outcome
      for (const id of trackIds) {
          const track = await LocalSDK.entities.Track.get(id);
          if (track) {
              if (operation === 'transcode') {
                  // Simulate changing the file format in the database
                  await LocalSDK.entities.Track.update(id, { file_format: targetFormat });
              } else if (operation === 'normalize') {
                  // Simulate adding ReplayGain data to the track
                  await LocalSDK.entities.Track.update(id, { replay_gain_track: -7.5 });
              }
          }
      }

      return { 
        data: { 
          processed: trackIds.length, 
          failed: 0,
          totalSpaceSaved: operation === 'transcode' ? trackIds.length * 2000000 : 0 // Simulate 2MB saved per track
        } 
      };
    },
    exportLibraryData: async () => ({ data: db }),
    findDuplicateTracks: async () => ({ data: [] }),
    lookupTrackMetadata: async () => ({ data: null }), // Mocked
    analyzeTrackVolume: async () => ({ data: null }), // Mocked
  },
  integrations: {
    Core: {
        UploadFile: async ({ file }) => ({ file_url: `/${file.name}` }),
        // Add other Core integrations as empty functions to prevent errors
        InvokeLLM: async () => ({ data: { response: "This is a mock AI response." } }),
        SendEmail: async () => ({ success: true }),
        GenerateImage: async () => ({ data: { url: "" } }),
        ExtractDataFromUploadedFile: async () => ({ data: {} }),
    }
  },
  auth: { /* Empty auth object */ }
};

seedDatabase();
// --- END OF FILE src/lib/local-sdk.js ---