import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Function to generate smart tags based on track metadata
const generateSmartTags = (track) => {
    const tags = new Set();
    
    // Decade tags
    if (track.year) {
        const decade = Math.floor(track.year / 10) * 10;
        tags.add(`${decade}s`);
        
        if (track.year >= 2020) tags.add('Recent');
        else if (track.year >= 2010) tags.add('2010s');
        else if (track.year >= 2000) tags.add('2000s');
        else if (track.year >= 1990) tags.add('90s');
        else if (track.year >= 1980) tags.add('80s');
        else if (track.year >= 1970) tags.add('70s');
        else if (track.year >= 1960) tags.add('60s');
        else if (track.year < 1960) tags.add('Classic');
    }
    
    // Genre-based tags
    if (track.genre) {
        const genre = track.genre.toLowerCase();
        if (genre.includes('rock')) tags.add('Rock');
        if (genre.includes('pop')) tags.add('Pop');
        if (genre.includes('jazz')) tags.add('Jazz');
        if (genre.includes('classical')) tags.add('Classical');
        if (genre.includes('electronic')) tags.add('Electronic');
        if (genre.includes('hip hop') || genre.includes('rap')) tags.add('Hip Hop');
        if (genre.includes('country')) tags.add('Country');
        if (genre.includes('blues')) tags.add('Blues');
        if (genre.includes('folk')) tags.add('Folk');
        if (genre.includes('metal')) tags.add('Metal');
    }
    
    // Duration-based tags
    if (track.duration) {
        if (track.duration < 180) tags.add('Short');
        else if (track.duration > 360) tags.add('Long');
        
        if (track.duration > 600) tags.add('Epic');
    }
    
    // Quality tags
    if (track.file_format === 'FLAC') tags.add('Lossless');
    if (track.bitrate && parseInt(track.bitrate) >= 320) tags.add('High Quality');
    
   