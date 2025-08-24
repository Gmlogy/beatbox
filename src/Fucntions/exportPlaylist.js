import { createClient } from 'npm:@base44/sdk@0.1.0';

// Initialize the base44 client
const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    await base44.auth.me(); // Verify token

    const { playlistId } = await req.json();
    const playlist = await base44.entities.Playlist.get(playlistId);

    if (!playlist) {
      return new Response(JSON.stringify({ error: "Playlist not found" }), { status: 404 });
    }

    const tracks = playlist.track_ids?.length > 0 
      ? await base44.entities.Track.filter({ id: { in: playlist.track_ids } }) 
      : [];

    let m3uContent = `#EXTM3U\n#PLAYLIST:${playlist.name}\n`;
    tracks.forEach(track => {
      // In a real app, file_path would be a URL or a relative path the player understands
      m3uContent += `#EXTINF:${track.duration || -1},${track.artist} - ${track.title}\n`;
      m3uContent += `${track.file_path || track.title}\n`;
    });

    return new Response(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'audio/x-mpegurl',
        'Content-Disposition': `attachment; filename="${playlist.name.replace(/[^a-z0-9]/gi, '_')}.m3u"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});