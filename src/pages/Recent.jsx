
import React, { useState, useEffect } from "react";
import { Track } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  Play, 
  Pause,
  Search,
  RefreshCw,
  Shuffle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlayer } from "@/components/player/PlayerContext";
import TrackContextMenu from "../components/tracks/TrackContextMenu";

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a574b73a9_2025-08-05140056.jpg';

export default function RecentPage() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { play, pause, isPlaying, currentTrack } = usePlayer();

  useEffect(() => {
    loadRecentlyAdded();
  }, []);

  const loadRecentlyAdded = async () => {
    setIsLoading(true);
    try {
      const data = await Track.list('-created_date', 50);
      setTracks(data);
    } catch (error) {
      console.error("Error loading recently added tracks:", error);
      setTracks([]);
    }
    setIsLoading(false);
  };

  const filteredTracks = tracks.filter(track => 
    track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = (track) => {
    play(track, filteredTracks);
  };
  
  const formatAddedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 material-elevation-1">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Recently Added</h1>
            <p className="text-slate-600">
              {tracks.length} most recently added tracks
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search recent additions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-slate-300 focus:border-blue-500 transition-colors"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={loadRecentlyAdded}
              className="ripple-effect"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => filteredTracks.length > 0 && play(filteredTracks[0], filteredTracks)}
              disabled={filteredTracks.length === 0}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Play All
            </Button>
            <Button
              onClick={() => {
                 if (filteredTracks.length > 0) {
                    const shuffledTracks = [...filteredTracks].sort(() => Math.random() - 0.5);
                    play(shuffledTracks[0], shuffledTracks);
                  }
              }}
              disabled={filteredTracks.length === 0}
              variant="outline"
              className="ripple-effect"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="bg-white rounded-xl material-elevation-1 p-4 dark:bg-slate-800"><div className="space-y-3">{Array(10).fill(0).map((_, i) => (<div key={i} className="flex items-center gap-3 animate-pulse"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded"></div><div className="flex-1"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div></div></div>))}</div></div>
        ) : filteredTracks.length > 0 ? (
          <div className="bg-white rounded-xl material-elevation-1 overflow-hidden dark:bg-slate-800">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold text-slate-700">Title</TableHead>
                  <TableHead className="font-semibold text-slate-700">Artist</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date Added</TableHead>
                  <TableHead className="font-semibold text-slate-700">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="dark:divide-slate-700">
                {filteredTracks.map((track, index) => (
                  <TrackContextMenu track={track} onUpdate={loadRecentlyAdded} key={track.id}>
                    <TableRow 
                      className="group hover:bg-slate-50 transition-colors draggable-track cursor-pointer dark:hover:bg-slate-700/60"
                      onClick={() => handlePlay(track)}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({type: 'track', track: track}));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                    >
                      <TableCell className="py-3 px-4 w-12 text-center">
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); pause() }}
                            className="w-8 h-8 ripple-effect"
                          >
                            <Pause className="w-4 h-4 text-blue-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handlePlay(track) }}
                            className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity ripple-effect"
                          >
                            <Play className="w-4 h-4 ml-0.5" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-700 rounded overflow-hidden flex-shrink-0" style={{backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{track.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-slate-700 dark:text-slate-300">{track.artist}</TableCell>
                      <TableCell className="py-3 text-slate-600 dark:text-slate-400 text-sm">{formatAddedDate(track.created_date)}</TableCell>
                      <TableCell className="py-3 text-slate-600 dark:text-slate-400 font-mono text-sm">{Math.floor((track.duration || 0) / 60)}:{((track.duration || 0) % 60).toString().padStart(2, '0')}</TableCell>
                    </TableRow>
                  </TrackContextMenu>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Clock className="w-8 h-8" /></div>
            <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No tracks found" : "No tracks added"}</h3>
            <p className="text-sm text-center">{searchQuery ? "No tracks match your search." : "Import music to see your recently added tracks here."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
