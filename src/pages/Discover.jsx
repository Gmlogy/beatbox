
import React, { useState, useEffect } from 'react';
import { getRecommendations } from '@/api/functions';
import TrackCarousel from '../components/discover/TrackCarousel';
import { Loader2, Compass, Sparkles, Clock, TrendingUp, Music2 } from 'lucide-react';

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
        <div className="flex gap-3 overflow-hidden">
          {Array(6).fill(0).map((_, j) => (
            <div key={j} className="w-32 flex-shrink-0">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function DiscoverPage() {
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const { data } = await getRecommendations();
                setRecommendations(data);
            } catch (error) {
                console.error("Failed to get recommendations:", error);
            }
            setLoading(false);
        };

        fetchRecommendations();
    }, []);

    const getSectionIcon = (title) => {
        if (title.includes('Heavy Rotation')) return <TrendingUp className="w-4 h-4 text-red-500" />;
        if (title.includes('Recently Added')) return <Clock className="w-4 h-4 text-blue-500" />;
        if (title.includes('More from')) return <Music2 className="w-4 h-4 text-purple-500" />;
        if (title.includes('Explore')) return <Compass className="w-4 h-4 text-green-500" />;
        if (title.includes('Forgotten')) return <Sparkles className="w-4 h-4 text-amber-500" />;
        return <Music2 className="w-4 h-4 text-slate-500" />;
    };

    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 sticky top-0 z-10 material-elevation-1">
                <div className="flex items-center gap-3">
                    <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Discover</h1>
                        <p className="text-slate-600 dark:text-slate-400">Personalized suggestions from your library</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <LoadingSkeleton />
                ) : recommendations ? (
                    <div className="space-y-8">
                        {/* Heavy Rotation */}
                        {recommendations.heavyRotation?.tracks?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {getSectionIcon(recommendations.heavyRotation.title)}
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {recommendations.heavyRotation.title}
                                    </h2>
                                </div>
                                <TrackCarousel tracks={recommendations.heavyRotation.tracks} compact={true} />
                            </div>
                        )}

                        {/* Recently Added */}
                        {recommendations.recentlyAdded?.tracks?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {getSectionIcon(recommendations.recentlyAdded.title)}
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {recommendations.recentlyAdded.title}
                                    </h2>
                                </div>
                                <TrackCarousel tracks={recommendations.recentlyAdded.tracks} compact={true} />
                            </div>
                        )}
                        
                        {/* More from Top Artists */}
                        {recommendations.fromTopArtists?.map(section => (
                            section.tracks.length > 0 && (
                                <div key={section.title} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        {getSectionIcon(section.title)}
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {section.title}
                                        </h2>
                                    </div>
                                    <TrackCarousel tracks={section.tracks} compact={true} />
                                </div>
                            )
                        ))}
                        
                        {/* Explore Genre */}
                        {recommendations.exploreGenre?.tracks?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {getSectionIcon(recommendations.exploreGenre.title)}
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {recommendations.exploreGenre.title}
                                    </h2>
                                </div>
                                <TrackCarousel tracks={recommendations.exploreGenre.tracks} compact={true} />
                            </div>
                        )}

                        {/* Forgotten Gems */}
                        {recommendations.forgottenGems?.tracks?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {getSectionIcon(recommendations.forgottenGems.title)}
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {recommendations.forgottenGems.title}
                                    </h2>
                                </div>
                                <TrackCarousel tracks={recommendations.forgottenGems.tracks} compact={true} />
                            </div>
                        )}
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <Compass className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Not enough data</h3>
                        <p className="text-sm text-center">
                          Play some music to generate personalized recommendations.
                        </p>
                      </div>
                )}
            </div>
        </div>
    );
}
