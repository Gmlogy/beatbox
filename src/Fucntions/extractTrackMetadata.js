import { createClient } from 'npm:@base44/sdk@0.1.0';
import { parseBuffer } from 'npm:music-metadata@10.5.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const body = await req.json();
        const { file_url } = body;

        if (!file_url) {
            return new Response(JSON.stringify({ error: 'file_url is required' }), { status: 400 });
        }

        // Download the audio file
        const fileResponse = await fetch(file_url);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Parse metadata
        const metadata = await parseBuffer(buffer);

        // Extract basic metadata
        const trackData = {
            title: metadata.common.title || 'Unknown Title',
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            genre: metadata.common.genre?.[0] || null,
            year: metadata.common.year || null,
            track_number: metadata.common.track?.no || null,
            duration: Math.round(metadata.format.duration || 0),
            bitrate: metadata.format.bitrate ? `${Math.round(metadata.format.bitrate / 1000)} kbps` : null,
            file_format: (metadata.format.container || 'UNKNOWN').toUpperCase(),
            file_size: buffer.length,
            file_path: file_url,
            is_favorite: false,
            play_count: 0
        };

        // Extract and upload album art if present
        let albumArtUrl = null;
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            try {
                const picture = metadata.common.picture[0]; // Get the first picture
                const imageBuffer = picture.data;
                const mimeType = picture.format;
                
                // Determine file extension from MIME type
                let extension = 'jpg';
   