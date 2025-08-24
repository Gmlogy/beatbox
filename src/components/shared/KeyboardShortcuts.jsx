import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { usePlayer } from '@/components/player/PlayerContext';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isPlaying,
    play,
    pause,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    volume,
    setVolumeLevel,
    togglePlayerSize,
    currentTrack,
    playlist
  } = usePlayer();

  const [altPressed, setAltPressed] = React.useState(false);
  const [sequence, setSequence] = React.useState('');
  const [sequenceTimeout, setSequenceTimeout] = React.useState(null);

  const resetSequence = useCallback(() => {
    setSequence('');
    setAltPressed(false);
    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout);
      setSequenceTimeout(null);
    }
  }, [sequenceTimeout]);

  const handleKeyDown = useCallback((e) => {
    // Handle Alt key press
    if (e.key === 'Alt') {
      setAltPressed(true);
      return;
    }

    // Handle direct media shortcuts (without Alt)
    if (!altPressed && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // Prevent shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else if (currentTrack) {
            play(currentTrack, playlist);
          }
          break;
        case 'Enter':
          // Play highlighted track (would need additional context)
          e.preventDefault();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playPrevious();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolumeLevel(Math.min(100, volume + 5));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolumeLevel(Math.max(0, volume - 5));
          break;
      }
      return;
    }

    // Handle Ctrl + Alt shortcuts
    if (e.ctrlKey && e.altKey) {
      switch (e.code) {
        case 'ArrowRight':
          e.preventDefault();
          // Fast forward (seek forward 10 seconds)
          // Note: This would need seek implementation in player context
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Rewind (seek backward 10 seconds)
          // Note: This would need seek implementation in player context
          break;
      }
      return;
    }

    // Handle Alt + key sequences
    if (altPressed || e.altKey) {
      e.preventDefault();
      const newSequence = sequence + e.key.toLowerCase();
      setSequence(newSequence);

      // Clear existing timeout
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
      }

      // Set new timeout to reset sequence
      const timeout = setTimeout(resetSequence, 2000);
      setSequenceTimeout(timeout);

      // Check for complete sequences
      handleSequence(newSequence);
    }
  }, [altPressed, sequence, sequenceTimeout, isPlaying, pause, play, currentTrack, playlist, playNext, playPrevious, volume, setVolumeLevel, resetSequence]);

  const handleSequence = (seq) => {
    switch (seq) {
      // Navigation shortcuts (Alt + N + ...)
      case 'nh':
        navigate(createPageUrl('index'));
        resetSequence();
        break;
      case 'ns':
        navigate(createPageUrl('Library'));
        resetSequence();
        break;
      case 'na':
        navigate(createPageUrl('Artists'));
        resetSequence();
        break;
      case 'nb':
        navigate(createPageUrl('Albums'));
        resetSequence();
        break;
      case 'np':
        navigate(createPageUrl('Playlists'));
        resetSequence();
        break;
      case 'nf':
        navigate(createPageUrl('Favorites'));
        resetSequence();
        break;
      case 'nr':
        navigate(createPageUrl('Recent'));
        resetSequence();
        break;
      case 'nd':
        navigate(createPageUrl('Discover'));
        resetSequence();
        break;
      case 'nt':
        navigate(createPageUrl('Stats'));
        resetSequence();
        break;
      case 'ny':
        navigate(createPageUrl('Sync'));
        resetSequence();
        break;
      case 'ne':
        navigate(createPageUrl('Settings'));
        resetSequence();
        break;

      // Playback shortcuts (Alt + L + ...)
      case 'lp':
        if (isPlaying) {
          pause();
        } else if (currentTrack) {
          play(currentTrack, playlist);
        }
        resetSequence();
        break;
      case 'ln':
        playNext();
        resetSequence();
        break;
      case 'lb':
        playPrevious();
        resetSequence();
        break;
      case 'ls':
        toggleShuffle();
        resetSequence();
        break;
      case 'lr':
        toggleRepeat();
        resetSequence();
        break;
      case 'lq':
        togglePlayerSize();
        resetSequence();
        break;
      case 'lv':
        // Volume control mode - show toast with instructions
        showVolumeToast();
        resetSequence();
        break;
    }
  };

  const showVolumeToast = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = `Volume: ${volume}% (Use ↑↓ arrow keys to adjust)`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 2000);
  };

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Alt') {
      // Don't immediately reset on Alt release to allow for sequences
      setTimeout(() => {
        if (sequence === '') {
          setAltPressed(false);
        }
      }, 100);
    }
  }, [sequence]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
      }
    };
  }, [handleKeyDown, handleKeyUp, sequenceTimeout]);

  // Show sequence indicator when Alt is pressed
  if (altPressed && sequence) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-mono">
        Alt + {sequence.split('').join(' + ')}
      </div>
    );
  }

  return null;
}