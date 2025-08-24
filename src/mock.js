
// In-memory database
let db = {
  tracks: [],
  playlists: [],
  syncDevices: [],
  syncJobs: [],
  playHistory: [],
};

// Helper to generate unique IDs
const newId = () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- SEED DATA ---
function seedDatabase() {
  if (db.tracks.length > 0) return; // Only seed once

  console.log("Seeding mock database...");

  // Seed Tracks
  const artists = ["Stellar Fusion", "Crimson Tide", "Echo Valley"];
  const albums = ["Cosmic Drift", "Oceanic Echoes", "Mountain Hymns"];
  let trackCounter = 1;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 10; j++) {
      db.tracks.push({
        id: newId(),
        title: `Track ${j + 1}`,
        artist: artists[i],
        album: albums[i],
        genre: "Rock",
        year: 2023,
        track_number: j + 1,
        duration: 180 + Math.floor(Math.random() * 60),
        bitrate: "320kbps",
        file_format: "MP3",
        file_size: 5000000 + Math.floor(Math.random() * 2000000),
        file_path: `/music/${artists[i]}/${albums[i]}/Track_${j + 1}.mp3`,
        album_art_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg',
        is_favorite: Math.random() > 0.8,
        play_count: Math.floor(Math.random() * 100),
        last_played: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 30).toISOString(),
        created_date: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 60).toISOString(),
      });
    }
  }

  // Seed Playlists
  db.playlists.push({
    id: newId(),
    name: "My Awesome Mix",
    description: "A collection of the best tracks.",
    track_ids: db.tracks.slice(0, 5).map(t => t.id),
    is_smart: false,
  });
  db.playlists.push({
    id: newId(),
    name: "Rock Anthems (Smart)",
    description: "Automatically updated rock playlist.",
    track_ids: db.tracks.filter(t => t.genre === 'Rock').map(t => t.id),
    is_smart: true,
    smart_criteria: { match_all: true, rules: [{ field: 'genre', operator: 'is', value: 'Rock' }] },
  });

  // Seed Sync Devices
  db.syncDevices.push({
    id: newId(),
    device_name: "Pixel 8 Pro (Mock)",
    device_model: "GP4BC",
    is_connected: true,
    storage_total: 256000000000,
    storage_used: 89000000000,
    last_sync: new Date().toISOString(),
    sync_enabled: true,
    auto_convert: true,
    selected_playlists: [db.playlists[0].id],
    synced_track_ids: db.playlists[0].track_ids,
  });

  console.log("Mock database seeded.");
}

// --- Generic CRUD Operations ---
const mockApi = (store) => ({
  list: async () => [...store],
  get: async (id) => store.find(item => item.id === id) || null,
  create: async (data) => {
    const newItem = { ...data, id: newId(), created_date: new Date().toISOString() };
    store.push(newItem);
    return newItem;
  },
  update: async (id, data) => {
    const index = store.findIndex(item => item.id === id);
    if (index === -1) return null;
    store[index] = { ...store[index], ...data };
    return store[index];
  },
  delete: async (id) => {
    const index = store.findIndex(item => item.id === id);
    if (index > -1) {
      store.splice(index, 1);
    }
    return { success: true };
  },
  filter: async (filters) => {
    return store.filter(item => {
      return Object.entries(filters).every(([key, value]) => item[key] === value);
    });
  },
});

// --- Mock API Implementations ---
export const mockTrackApi = mockApi(db.tracks);
export const mockPlaylistApi = mockApi(db.playlists);
export const mockSyncDeviceApi = mockApi(db.syncDevices);
export const mockSyncJobApi = mockApi(db.syncJobs);
export const mockPlayHistoryApi = mockApi(db.playHistory);

// --- Mock Functions ---
export const mockFunctions = {
  getRecommendations: async () => ({
    data: {
      heavyRotation: { title: "Heavy Rotation", tracks: db.tracks.slice(0, 5) },
      recentlyAdded: { title: "Recently Added", tracks: db.tracks.slice(5, 10) },
    }
  }),
  findDuplicateTracks: async () => ({ data: [] }),
  runLibraryMaintenance: async () => ({ data: { details: "Mock maintenance complete." } }),
  logPlay: async (playData) => {
    db.playHistory.push({ ...playData, id: newId(), timestamp: new Date().toISOString() });
    const track = await mockTrackApi.get(playData.trackId);
    if (track) {
      await mockTrackApi.update(track.id, {
        play_count: (track.play_count || 0) + 1,
        last_played: new Date().toISOString(),
      });
    }
    return { success: true };
  },
  searchLibrary: async ({ query }) => {
    const lowerQuery = query.toLowerCase();
    const tracks = db.tracks.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.artist.toLowerCase().includes(lowerQuery)).slice(0, 5);
    const artists = [...new Set(db.tracks.filter(t => t.artist.toLowerCase().includes(lowerQuery)).map(t => t.artist))].map(name => ({name})).slice(0, 3);
    const albums = [...new Map(db.tracks.filter(t => t.album.toLowerCase().includes(lowerQuery)).map(t => [`${t.album}-${t.artist}`, {name: t.album, artist: t.artist, coverArt: t.album_art_url}])).values()].slice(0, 3);
    return { data: { tracks, artists, albums } };
  },
  updateSmartPlaylists: async () => ({ data: { message: "Smart playlists updated." } }),
  exportPlaylist: async ({ playlistId }) => {
    const playlist = await mockPlaylistApi.get(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    const m3uContent = `#EXTM3U\n#PLAYLIST:${playlist.name}\n` + 
      playlist.track_ids.map(tid => {
        const track = db.tracks.find(t => t.id === tid);
        return track ? `#EXTINF:${track.duration},${track.artist} - ${track.title}\n${track.file_path}` : '';
      }).join('\n');
    return { data: m3uContent, error: null };
  },
  exportLibraryData: async () => ({ data: db, headers: {'content-disposition': 'attachment; filename="mock_export.json"'} }),
  processAudioFiles: async ({ trackIds }) => ({ data: { processed: trackIds.length, failed: 0, totalSpaceSaved: 12345678, totalProcessingTimeSeconds: 5 } }),
  extractTrackMetadata: async ({ file_url }) => ({ data: { title: 'New Track', artist: 'Unknown Artist', album: 'Unknown Album', file_format: 'MP3' } }),
  // Add other functions here as needed, returning plausible mock data.
};

// --- Mock Integrations ---
export const mockIntegrations = {
  UploadFile: async ({ file }) => ({ file_url: `/uploads/${file.name}` }),
};


// Initialize the database with seed data
seedDatabase();
