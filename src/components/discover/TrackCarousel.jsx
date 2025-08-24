import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { usePlayer } from '@/components/player/PlayerContext';
import { useData } from '@/components/providers/DataProvider';
import TrackContextMenu from '../tracks/TrackContextMenu';

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function TrackCarousel({ tracks, compact = false }) {
    const { play, pause, isPlaying, currentTrack } = usePlayer();
    const { refreshData } = useData();

    if (!tracks || tracks.length === 0) {
        return null;
    }

    const cardSize = compact ? 'w-32' : 'w-40';
    const imageSize = compact ? 'h-32' : 'h-40';

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {tracks.map(track => (
                <TrackContextMenu key={track.id} track={track} onUpdate={() => refreshData('tracks')}>
                    <div className={`${cardSize} flex-shrink-0 group cursor-pointer`}>
                        <div
                            className={`${imageSize} bg-slate-700 rounded-lg overflow-hidden relative mb-2 shadow-md hover:shadow-lg transition-all duration-200`}
                            style={{
                                backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                            onClick={() => play(track, tracks)}
                        >
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <Button
                                    size="icon"
                                    className="w-10 h-10 bg-white/90 hover:bg-white shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isPlaying && currentTrack?.id === track.id ? pause() : play(track, tracks);
                                    }}
                                >
                                    {isPlaying && currentTrack?.id === track.id ? (
                                        <Pause className="w-5 h-5 text-slate-800" />
                                    ) : (
                                        <Play className="w-5 h-5 text-slate-800 ml-0.5" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className={`font-medium text-slate-900 dark:text-slate-100 truncate ${compact ? 'text-sm' : 'text-base'}`} title={track.title}>
                                {track.title}
                            </h3>
                            <p className={`text-slate-600 dark:text-slate-400 truncate ${compact ? 'text-xs' : 'text-sm'}`} title={track.artist}>
                                {track.artist}
                            </p>
                            {!compact && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 truncate" title={track.album}>
                                    {track.album}
                                </p>
                            )}
                        </div>
                    </div>
                </TrackContextMenu>
            ))}
        </div>
    );
}