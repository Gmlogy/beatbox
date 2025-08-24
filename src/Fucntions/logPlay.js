import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const { trackId, durationPlayed, wasSkipped } = await req.json();

        if (!trackId || durationPlayed === undefined) {
            return new Response(JSON.stringify({ error: 'trackId and durationPlayed are required' }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Log the detailed play event
        const historyRecord = await base44.entities.PlayHistory.create({
            track_id: trackId,
            duration_played: durationPlayed,
            was_skipped: wasSkipped
        });

        // Also update the simple play count on the track itself
        // We only do this for "significant" plays
        if (durationPlayed > 30 && !wasSkipped) {
            const track = await base44.entities.Track.get(trackId);
            if (track) {
                await base44.entities.Track.update(trackId, {
                    play_count: (track.play_count || 0) + 1,
                    last_played: new Date().toISOString()
                });
            }
        }

        return new Response(JSON.stringify(historyRecord), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error logging play:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});