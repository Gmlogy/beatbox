
import React, { useState, useEffect } from 'react';
import { getStats } from '@/api/functions';
import { Loader2, BarChart2, Music, Clock, Users, Disc, TrendingUp, Calendar, Headphones, Play, Pause } from 'lucide-react';
import { usePlayer } from '@/components/player/PlayerContext';

const StatCard = ({ icon, label, value, color = "blue", size = "normal" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    };

    const cardSize = size === "small" ? "p-3" : "p-4";
    const iconSize = size === "small" ? "w-3 h-3" : "w-4 h-4";
    const valueSize = size === "small" ? "text-lg" : "text-2xl";

    return (
        <div className={`bg-slate-50 dark:bg-slate-800 ${cardSize} rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center gap-3">
                <div className={`${colorClasses[color]} p-2 rounded-lg`}>
                    {React.cloneElement(icon, { className: iconSize })}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</p>
                    <p className={`${valueSize} font-bold text-slate-900 dark:text-slate-100`}>{value}</p>
                </div>
            </div>
        </div>
    );
};

const CompactTrackList = ({ title, tracks, icon, color = "blue" }) => {
    const { play, pause, isPlaying, currentTrack } = usePlayer();
    
    if (!tracks || tracks.length === 0) return null;

    const colorClasses = {
        blue: "text-blue-600 dark:text-blue-400",
        green: "text-green-600 dark:text-green-400",
        purple: "text-purple-600 dark:text-purple-400"
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    {React.cloneElement(icon, { className: `w-4 h-4 ${colorClasses[color]}` })}
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                </div>
            </div>
            <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                {tracks.slice(0, 8).map((track, index) => (
                    <div 
                        key={track.id} 
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors duration-150 group"
                        onClick={() => play(track, tracks)}
                    >
                        <div className="flex items-center justify-center w-6 h-6 text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:opacity-0 transition-opacity">
                            {index + 1}
                        </div>
                        <div className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity absolute">
                            {isPlaying && currentTrack?.id === track.id ? (
                                <Pause className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            ) : (
                                <Play className="w-4 h-4 text-slate-600 dark:text-slate-300 ml-0.5" />
                            )}
                        </div>
                        <img 
                            src={track.album_art_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg'} 
                            alt={track.album} 
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-slate-800 dark:text-slate-200">{track.title}</p>
                            <p className="text-xs truncate text-slate-600 dark:text-slate-400">{track.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{track.play_count}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">plays</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function StatsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours.toLocaleString()}h ${minutes}m`;
        }
        return `${minutes.toLocaleString()}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Loading your stats...</p>
                </div>
            </div>
        );
    }
    
    if (!stats) {
        return (
            <div className="flex items-center justify-center h-full bg-white dark:bg-slate-900">
                <div className="text-center">
                    <BarChart2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Could not load statistics</h3>
                    <p className="text-slate-500 dark:text-slate-400">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 sticky top-0 z-10 material-elevation-1">
                <div className="flex items-center gap-3">
                    <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Statistics</h1>
                        <p className="text-slate-600 dark:text-slate-400">Insights into your music listening habits</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Overview Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        icon={<Headphones />} 
                        label="Total Plays" 
                        value={stats.totalPlays.toLocaleString()} 
                        color="blue" 
                    />
                    <StatCard 
                        icon={<Clock />} 
                        label="Listening Time" 
                        value={formatDuration(stats.totalListeningTime)} 
                        color="green" 
                    />
                    <StatCard 
                        icon={<Disc />} 
                        label="Tracks in Library" 
                        value={stats.totalTracks.toLocaleString()} 
                        color="purple" 
                    />
                    <StatCard 
                        icon={<TrendingUp />} 
                        label="Weekly Plays" 
                        value={stats.topTracksWeekly?.reduce((sum, track) => sum + track.play_count, 0) || 0} 
                        color="orange" 
                    />
                </div>
                
                {/* Top Tracks Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CompactTrackList 
                        title="Top Tracks (All Time)" 
                        tracks={stats.topTracksAllTime} 
                        icon={<TrendingUp />}
                        color="blue"
                    />
                    <CompactTrackList 
                        title="Top Tracks (Last 7 Days)" 
                        tracks={stats.topTracksWeekly} 
                        icon={<Calendar />}
                        color="green"
                    />
                </div>
            </div>
        </div>
    );
}
