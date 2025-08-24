
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  MoreHorizontal,
  Shuffle,
  Repeat,
  ChevronDown,
  ChevronUp,
  Maximize2,
  StepForward,
  ListPlus,
  ListMusic,
  Plus,
  Info,
  Trash2,
  Disc,
  Folder
} from "lucide-react";
import { usePlayer } from './PlayerContext';
import { Track } from '@/api/entities';
import EditTrackDialog from "../tracks/EditTrackDialog";
import { Playlist } from '@/api/entities';
import { useData } from '@/components/providers/DataProvider';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDER_IMAGE_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0ea546a18_2025-08-05140056.jpg';

export default function NowPlayingBar() {
  const {
    currentTrack: track,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isPlayerMinimized,
    play,
    pause,
    seek,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setVolumeLevel,
    toggleMute,
    togglePlayerSize,
  } = usePlayer();

  const [isFavorite, setIsFavorite] = React.useState(track?.is_favorite || false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const { playlists, loadPlaylists } = useData();
  const navigate = useNavigate();

  // Update favorite state when track changes
  React.useEffect(() => {
    setIsFavorite(track?.is_favorite || false);
  }, [track?.is_favorite, track?.id]);

  // Load playlists when component mounts
  React.useEffect(() => {
    if (playlists.length === 0) {
      loadPlaylists();
    }
  }, [playlists.length, loadPlaylists]);

  const toggleFavorite = async () => {
    if (!track) return;
    
    try {
      const newFavoriteStatus = !isFavorite;
      await Track.update(track.id, { is_favorite: newFavoriteStatus });
      setIsFavorite(newFavoriteStatus);
      
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = newFavoriteStatus ? 'Added to Favorites' : 'Removed from Favorites';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    } catch (error) {
      console.error("Error updating favorite status:", error);
    }
  };

  const handlePlayNext = () => {
    console.warn("PlayerContext: 'Play Next' functionality not yet implemented.");
  };

  const handleAddToUpNext = () => {
    console.warn("PlayerContext: 'Add to Up Next' functionality not yet implemented.");
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!track) return;
    
    try {
      const playlist = await Playlist.get(playlistId);
      const updatedTrackIds = [...(playlist.track_ids || []), track.id];
      const uniqueTrackIds = Array.from(new Set(updatedTrackIds));
      await Playlist.update(playlistId, { track_ids: uniqueTrackIds });
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-16 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `Added "${track.title}" to "${playlist.name}"`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2500);

    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  const handleShowAlbum = () => {
    if (!track) return;
    if (track.album && track.artist) {
      navigate(createPageUrl(`Albums?name=${encodeURIComponent(track.album)}&artist=${encodeURIComponent(track.artist)}`));
    }
  };

  const handleShowInFinder = () => {
    console.warn("Native filesystem access is not available in web applications.");
  };

  const handleDelete = async () => {
    if (!track) return;
    if (window.confirm(`Are you sure you want to delete "${track.title}" from your library? This cannot be undone.`)) {
      try {
        await Track.delete(track.id);
        // The track will be removed and playback will naturally stop
      } catch (error) {
        console.error("Error deleting track:", error);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (values) => {
    seek(values[0]);
  };

  const handleVolumeChange = (values) => {
    setVolumeLevel(values[0]);
  };

  if (!track) return null;

  return (
    <AnimatePresence initial={false}>
      {isPlayerMinimized ? (
        <motion.div
          key="minimized"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 dark:bg-slate-800/95 dark:border-slate-700 shadow-xl z-50"
          style={{ width: 'auto', maxWidth: '400px' }}
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={playPrevious} className="ripple-effect w-8 h-8 hover:bg-slate-100 dark:hover:bg-slate-700">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => (isPlaying ? pause() : play(track))} 
              className="w-8 h-8 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} className="ripple-effect w-8 h-8 hover:bg-slate-100 dark:hover:bg-slate-700">
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="min-w-0 px-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{track.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{track.artist}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={togglePlayerSize} className="ripple-effect w-8 h-8 hover:bg-slate-100 dark:hover:bg-slate-700">
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="maximized"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-t border-slate-200 p-4 material-elevation-2 dark:bg-slate-800 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-14 h-14 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  backgroundImage: `url(${track.album_art_url || PLACEHOLDER_IMAGE_URL})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{track.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{track.artist}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFavorite}
                className={`flex-shrink-0 ripple-effect ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleShuffle} className={`ripple-effect ${isShuffled ? 'text-blue-600' : ''}`}>
                  <Shuffle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={playPrevious} className="ripple-effect">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button onClick={() => (isPlaying ? pause() : play(track))} className="w-10 h-10 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={playNext} className="ripple-effect">
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleRepeat} className={`ripple-effect ${repeatMode !== 'off' ? 'text-blue-600' : ''}`}>
                  <Repeat className="w-4 h-4" />
                  {repeatMode === 'one' && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 w-96">
                <span className="text-xs text-slate-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                <Slider value={[currentTime]} max={track.duration || 100} step={1} onValueChange={handleSeek} className="flex-1 progress-slider" />
                <span className="text-xs text-slate-500 font-mono w-10">{formatTime(track.duration || 0)}</span>
              </div>
            </div>

            {/* Volume & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 w-28">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="ripple-effect">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1 volume-slider" />
              </div>
              <Button variant="ghost" size="icon" onClick={togglePlayerSize} className="ripple-effect">
                <ChevronDown className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ripple-effect">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 dark:bg-slate-800 dark:border-slate-700">
                  <DropdownMenuItem onClick={() => play(track)} className="dark:focus:bg-slate-700">
                    <Play className="mr-2 h-4 w-4" />
                    <span>Play</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePlayNext} className="dark:focus:bg-slate-700">
                    <StepForward className="mr-2 h-4 w-4" />
                    <span>Play Next</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddToUpNext} className="dark:focus:bg-slate-700">
                    <ListPlus className="mr-2 h-4 w-4" />
                    <span>Add to Up Next</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="dark:focus:bg-slate-700">
                      <ListMusic className="mr-2 h-4 w-4" />
                      <span>Add to Playlist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 dark:bg-slate-800 dark:border-slate-700">
                      <DropdownMenuItem disabled className="dark:focus:bg-slate-700">
                         <Plus className="mr-2 h-4 w-4" />
                         <span>New Playlist...</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="dark:bg-slate-700" />
                      {playlists.map((p) => (
                        <DropdownMenuItem key={p.id} onClick={() => handleAddToPlaylist(p.id)} className="dark:focus:bg-slate-700">
                          <span>{p.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="dark:focus:bg-slate-700">
                    <Info className="mr-2 h-4 w-4" />
                    <span>Get Info</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowAlbum} className="dark:focus:bg-slate-700">
                    <Disc className="mr-2 h-4 w-4" />
                    <span>Show Album</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowInFinder} disabled className="dark:focus:bg-slate-700">
                    <Folder className="mr-2 h-4 w-4" />
                    <span>Show in Finder</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                  <DropdownMenuItem className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete from Library</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      )}
      
      <EditTrackDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        track={track}
        onUpdate={() => {
          // Track updated, could refresh current track data if needed
        }}
      />
    </AnimatePresence>
  );
}
