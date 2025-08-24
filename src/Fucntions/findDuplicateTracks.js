import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Function to normalize string for comparison
const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Function to check if durations are similar (within a tolerance)
const areDurationsSimilar = (d1, d2, tolerance = 3) => {
    return Math.abs((d1 || 0) - (d2 || 0)) <= tolerance;
};

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);

        const allTracks = await base44.entities.Track.list(null, 10000);
        const potentialDuplicates = new Map();

        // First pass: Group tracks by a normalized key (artist + title)
        for (const track of allTracks) {
            const key = `${normalize(track.artist)}-${normalize(track.title)}`;
            if (!potentialDuplicates.has(key)) {
                potentialDuplicates.set(key, []);
            }
            potentialDuplicates.get(key).push(track);
        }

        const duplicateGroups = [];

        // Second pass: Refine groups into actual duplicates based on duration
        for (const group of potentialDuplicates.values()) {
            if (group.length < 2) continue;

            const checkedTracks = new Set();
            for (let i = 0; i < group.length; i++) {
                if (checkedTracks.has(group[i].id)) continue;

                const currentDuplicateSet = [group[i]];
                for (let j = i + 1; j < group.length; j++) {
                    if (checkedTracks.has(group[j].id)) continue;

                    if (areDurationsSimilar(group[i].duration, group[j].duration)) {
                        currentDuplicateSet.push(group[j]);
                        checkedTracks.add(group[j].id);
                    }
   