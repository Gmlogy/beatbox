// --- START OF FILE src/components/player/PlayerContext.jsx ---
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { logPlay } from '@/api/functions';
import { getAudioSource } from '../library/ImportDialog'; // Import our new helper

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, all, one
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  
  const audioRef = useRef(new Audio());
  const playPromiseRef = useRef(null);
  const playbackStartTimeRef = useRef(null);
  const currentTrackRef = useRef(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  
  const handlePlaybackStop = (wasSkipped = false) => {
    if (playbackStartTimeRef.current && currentTrackRef.current) {
      const durationPlayed = (Date.now() - playbackStartTimeRef.current) / 1000;
      if (durationPlayed > 5) {
        logPlay({ trackId: currentTrackRef.current.id, durationPlayed: Math.round(durationPlayed), wasSkipped });
      }
    }
    playbackStartTimeRef.current = null;
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      handlePlaybackStop(false);
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        safePlay();
      } else if (repeatMode === 'all' || currentIndex < playlist.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };
    const handleLoadedMetadata = () => { if (isPlaying) safePlay(); };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isPlaying, repeatMode, currentIndex, playlist]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack) {
      audio.pause();
      setCurrentTime(0);

      // THIS IS THE KEY CHANGE FOR LOCAL PLAYBACK
      // We ask our helper function for the local audio source.
      const localAudioSource = getAudioSource(currentTrack.id);
      
      if (localAudioSource) {
        audio.src = localAudioSource; // Play the imported local file
      } else {
        // Fallback for the initial seeded data which doesn't have a local file
        audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      }
      
      audio.load();
      if (isPlaying) {
        safePlay();
      }
    }
  }, [currentTrack, isPlaying]); // Added isPlaying dependency

  const safePlay = async () => {
    const audio = audioRef.current;
    if (playPromiseRef.current) {
      try { await playPromiseRef.current; } catch (e) { /* ignore */ }
    }
    try {
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      if (!playbackStartTimeRef.current) playbackStartTimeRef.current = Date.now();
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Audio play error:', error);
    }
  };

  const safePause = () => {
    handlePlaybackStop(true);
    audioRef.current.pause();
  };

  const play = (track, trackList = null) => {
    if (isPlaying && currentTrack?.id !== track.id) {
      handlePlaybackStop(true);
    }
    
    if (track?.id !== currentTrack?.id) {
      setCurrentTrack(track);
      if (trackList) {
        setPlaylist(trackList);
        setCurrentIndex(trackList.findIndex(t => t.id === track.id));
      }
    }
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
    safePause();
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    handlePlaybackStop(true);
    let nextIndex = isShuffled ? Math.floor(Math.random() * playlist.length) : currentIndex + 1;
    if (nextIndex >= playlist.length) {
      if (repeatMode === 'all') nextIndex = 0;
      else { setIsPlaying(false); return; }
    }
    setCurrentIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    handlePlaybackStop(true);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffled(!isShuffled);
  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  };
  const togglePlayerSize = () => setIsPlayerMinimized(prev => !prev);
  const setVolumeLevel = (newVolume) => { setVolume(newVolume); setIsMuted(false); };
  const toggleMute = () => setIsMuted(!isMuted);

  const value = { currentTrack, isPlaying, currentTime, volume, isMuted, isShuffled, repeatMode, playlist, currentIndex, isPlayerMinimized, play, pause, seek, playNext, playPrevious, toggleShuffle, toggleRepeat, setVolumeLevel, toggleMute, togglePlayerSize };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
// --- END OF FILE src/components/player/PlayerContext.jsx ---