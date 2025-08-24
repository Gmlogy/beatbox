import React, { useState, useEffect, useRef } from 'react';
import { searchLibrary } from '@/api/functions';
import { Loader2, Music, Users, Disc } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { usePlayer } from '@/components/player/PlayerContext';

const GlobalSearchResults = ({ query, onResultClick }) => {
    const [results, setResults] = useState({ tracks: [], artists: [], albums: [] });
    const [loading, setLoading] = useState(false);
    const { play } = usePlayer();

    useEffect(() => {
        if (query.length < 2) {
            setResults({ tracks: [], artists: [], albums: [] });
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await searchLibrary({ query });
                setResults(data);
            } catch (error) {
                console.error('Search failed:', error);
            }
            setLoading(false);
        }, 300); // Debounce search requests

        return () => clearTimeout(handler);
    }, [query]);

    const handlePlayTrack = (e, track) => {
        e.stopPropagation();
        e.preventDefault();
        play(track, results.tracks);
        onResultClick();
    };

    const hasResults = results.tracks?.length > 0 || results.artists?.length > 0 || results.albums?.length > 0;

    return (
        <div className="absolute top-full mt-2 w-full max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {loading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
            ) : !hasResults && query.length > 1 ? (
                <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No results found for "{query}"</p>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {/* Tracks */}
                    {results.tracks?.length > 0 && (
                        <div>
                            <h3 className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Songs</h3>
                            {results.tracks.map(track => (
                                <a
                                    key={`track-${track.id}`}
                                    href="#"
                                    onClick={(e) => handlePlayTrack(e, track)}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <img src={track.album_art_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg'} alt="art" className="w-8 h-8 rounded-sm object-cover" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{track.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                    {/* Artists */}
                    {results.artists?.length > 0 && (
                        <div>
                            <h3 className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Artists</h3>
                            {results.artists.map(artist => (
                                <a
                                    key={`artist-${artist.name}`}
                                    href={createPageUrl(`Artists?name=${encodeURIComponent(artist.name)}`)}
                                    onClick={onResultClick}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{artist.name}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                    {/* Albums */}
                    {results.albums?.length > 0 && (
                         <div>
                            <h3 className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Albums</h3>
                            {results.albums.map(album => (
                                <a
                                    key={`album-${album.name}-${album.artist}`}
                                    href={createPageUrl(`Albums?name=${encodeURIComponent(album.name)}&artist=${encodeURIComponent(album.artist)}`)}
                                    onClick={onResultClick}
                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <img src={album.coverArt || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg'} alt="art" className="w-8 h-8 rounded-sm object-cover" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{album.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{album.artist}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearchResults;