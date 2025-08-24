import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Fuzzy matching algorithm - Levenshtein distance
const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
};

// Calculate similarity score (0-1)
const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
};

// Advanced search scoring
const calculateSearchScore = (track, query, searchFields) => {
    let totalScore = 0;
    let fieldCount = 0;
    
    const queryLower = query.toLowerCase();
    
    searchFields.forEach(field => {
        const value = track[field];
        if (!value) return;
        
        const valueLower = value.toString().toLowerCase();
        let fieldScore = 0;
        
        // Exact match gets highest score
        if (valueLower === queryLower) {
            fieldScore = 1.0;
        }
        // Starts with query gets high score
        else if (valueLower.startsWith(queryLower)) {
            fieldScore = 0.9;
        }
        // Contains query gets medium score
        else if (valueLower.includes(queryLower)) {
            fieldScore = 0.7;
        }
        // Fuzzy match for typos
        else {
            const similarity = calculateSimilarity(valueLower, queryLower);
            if (similarity > 0.6) {
                fieldScore = similarity * 0.5;
            }
        }
        
        // Weight different fields differently
        const fieldWeights = {
            title: 3,
            artist: 2,
            album: 2,
            genre: 1,
            tags: 1
        };
        
        const weight = fieldWeights[field] || 1;
        totalScore += fieldScore * weight;
        fieldCount += weight;
    });
    
    return fieldCount > 0 ? totalScore / fieldCount : 0;
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
            query, 
            searchFields = ['title', 'artist', 'album', 'genre'], 
            limit = 50,
            minScore = 0.1 
        } = body;

        if (!query || query.length < 2) {
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const allTracks = await base44.entities.Track.list(null, 10000);
        
        // Calculate scores for all tracks
        const scoredTracks = allTracks.map(track => ({
            ...track,
            searchScore: calculateSearchScore(track, query, searchFields)
        }));

        // Filter by minimum score and sort by relevance
        const results = scoredTracks
            .filter(track => track.searchScore >= minScore)
            .sort((a, b) => b.searchScore - a.searchScore)
            .slice(0, limit);

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});