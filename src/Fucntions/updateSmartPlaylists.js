import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const checkCondition = (trackValue, operator, ruleValue) => {
    // Ensure case-insensitive comparison for strings
    const tv = typeof trackValue === 'string' ? trackValue.toLowerCase() : trackValue;
    const rv = typeof ruleValue === 'string' ? ruleValue.toLowerCase() : ruleValue;

    switch (operator) {
        case 'is': return tv === rv;
        case 'is_not': return tv !== rv;
        case 'contains': return typeof tv === 'string' && tv.includes(rv);
        case 'does_not_contain': return typeof tv === 'string' && !tv.includes(rv);
        case 'starts_with': return typeof tv === 'string' && tv.startsWith(rv);
        case 'ends_with': return typeof tv === 'string' && tv.endsWith(rv);
        case 'is_greater_than': return tv > rv;
        case 'is_less_than': return tv < rv;
        case 'is_true': return !!trackValue;
        case 'is_false': return !trackValue;
        default: return false;
    }
};

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const allTracks = await base44.entities.Track.list(null, 10000); // Fetch all tracks once
        const smartPlaylists = await base44.entities.Playlist.filter({ is_smart: true });

        let updatedCount = 0;

        for (const playlist of smartPlaylists) {
            if (!playlist.smart_criteria || !playlist.smart_criteria.rules) continue;

            const { match_all, rules } = playlist.smart_criteria;

            const matchingTrackIds = allTracks.filter(track => {
                if (match_all) {
                    return rules.every(rule => checkCondition(track[rule.field], rule.operator, rule.value));
                } else {
                    return rules.some(rule => checkCondition(track[rule.field], rule.operator, rule.value));
                }
            }).map(track => track.id);
   