import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Calculate similarity between two tracks
const calculateTrackSimilarity = (track1, track2) => {
    let score = 0;
    let factors = 0;

    // Artist similarity (highest weight)
    if (track1.artist && track2.artist) {
        if (track1.artist.toLowerCase() === track2.artist.toLowerCase()) {
            score += 0.4;
        }
        factors += 0.4;
    }

    // Genre similarity
    if (track1.genre && track2.genre) {
        if (track1.genre.toLowerCase() === track2.genre.toLowerCase()) {
            score += 0.3;
        }
        factors += 0.3;
    }

    // Year similarity (within 5 years)
    if (track1.year && track2.year) {
        const yearDiff = Math.abs(track1.year - track2.year);
        if (yearDiff <= 5) {
            score += (0.2 * (1 - yearDiff / 10));
        }
        factors += 0.2;
    }

    // Duration similarity (within 30 seconds)
    if (track1.duration && track2.duration) {
        const durationDiff = Math.abs(track1.duration - track2.duration);
        if (durationDiff <= 30) {
            score += (0.1 * (1 - durationDiff / 60));
        }
        factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
};

// Get user preferences based on listening history
const analyzeUserPreferences = (playHistory, tracks) => {
    const preferences = {
        genres: {},
        artists: {},
        years: {},
        avgDuration: 0
    };

    let totalDuration = 0;
    let trackCount = 0;

    playHistory.forEach(play => {
        const track = tracks.find(t => t.id === play.track_id);
        if (!track) return;

        trackCount++;
        
        // Count genres
        if (track.genre) {
            preferences.genres[track.genre] = (preferences.genres[track.genre] || 0) + 1;
        }

        // Count artists
        if (track.artist) {
            preferences.artists[track.artist] = (preferences.artists[track.artist] || 0) + 1;
        }

        // Collect years
        if (track.year) {
            preferences.years[track.year] = (preferences.years[track.year] || 0) + 1;
        }

        // Sum duration
        if (track.duration) {
            totalDuration += track.duration;
        }
    });

    preferences.avgDuration = trackCount > 0 ? totalDuration / trackCount : 0;

    return preferences;
};

// Score track based on user preferences
const scoreTrackByPreferences = (track, preferences) => {
    let score = 0;
    let factors = 0;

    // Genre preference
    if (track.genre && preferences.genres[track.genre]) {
        const genreScore = preferences.genres[track.genre] / 
            Math.max(...Object.values(preferences.genres));
        score += genreScore * 0.4;
        factors += 0.4;
    }

    // Artist preference
    if (track.artist && preferences.artists[track.artist]) {
        const artistScore = preferences.artists[track.artist] / 
            Math.max(...Object.values(preferences.artists));
        score += artistScore * 0.3;
        factors += 0.3;
    }

    // Year preference
    if (track.year && Object.keys(preferences.years).length > 0) {
        const yearScore = preferences.years[track.year] || 0;
        const maxYearScore = Math.max(...Object.values(preferences.years));
        if (maxYearScore > 0) {
            score += (yearScore / maxYearScore) * 0.2;
        }
        factors += 0.2;
    }

    // Duration preference
    if (track.duration && preferences.avgDuration > 0) {
        const durationDiff = Math.abs(track.duration - preferences.avgDuration);
        const durationScore = Math.max(0, 1 - (durationDiff / preferences.avgDuration));
        score += durationScore * 0.1;
        factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
};

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);

        const body = await req.json();
        const { 
            basedOnTrackId, 
            limit = 20,
            excludeAlreadyPlayed = true 
        } = body;

        const allTracks = await base44.entities.Track.list(null, 10000);
        const playHistory = await base44.entities.PlayHistory.list('-created_date', 1000);
        
        let recommendations = [];

        if (basedOnTrackId) {
            // Track-based recommendations
            const baseTrack = allTracks.find(t => t.id === basedOnTrackId);
            if (!baseTrack) {
                return new Response(JSON.stringify({ error: 'Track not found' }), { status: 404 });
            }

            recommendations = allTracks
                .filter(track => track.id !== basedOnTrackId)
                .map(track => ({
                    ...track,
                    similarity: calculateTrackSimilarity(baseTrack, track)
                }))
                .filter(track => track.similarity > 0.2)
                .sort((a, b) => b.similarity - a.similarity);

        } else {
            // User preference-based recommendations
            const preferences = analyzeUserPreferences(playHistory, allTracks);
            const playedTrackIds = new Set(playHistory.map(p => p.track_id));

            recommendations = allTracks
                .filter(track => !excludeAlreadyPlayed || !playedTrackIds.has(track.id))
                .map(track => ({
                    ...track,
                    preferenceScore: scoreTrackByPreferences(track, preferences)
                }))
                .filter(track => track.preferenceScore > 0.1)
                .sort((a, b) => b.preferenceScore - a.preferenceScore);
        }

        // Add some randomness to avoid repetitive recommendations
        const finalRecommendations = recommendations
            .slice(0, Math.min(limit * 2, recommendations.length))
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);

        return new Response(JSON.stringify(finalRecommendations), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});