import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from '@/api/entities';
import { Playlist } from '@/api/entities';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState({ tracks: false, playlists: false });
  const [lastFetch, setLastFetch] = useState({ tracks: 0, playlists: 0 });
  const [error, setError] = useState({ tracks: null, playlists: null });

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;

  const shouldRefetch = (type) => {
    return Date.now() - lastFetch[type] > CACHE_DURATION;
  };

  const loadTracks = async (force = false) => {
    if (loading.tracks || (!force && !shouldRefetch('tracks') && tracks.length > 0)) {
      return tracks;
    }

    setLoading(prev => ({ ...prev, tracks: true }));
    setError(prev => ({ ...prev, tracks: null }));

    try {
      // Add delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await Track.list('-created_date', 500);
      setTracks(data);
      setLastFetch(prev => ({ ...prev, tracks: Date.now() }));
      return data;
    } catch (error) {
      console.error("Error loading tracks:", error);
      setError(prev => ({ ...prev, tracks: error.message }));
      // Return cached data if available
      return tracks;
    } finally {
      setLoading(prev => ({ ...prev, tracks: false }));
    }
  };

  const loadPlaylists = async (force = false) => {
    if (loading.playlists || (!force && !shouldRefetch('playlists') && playlists.length > 0)) {
      return playlists;
    }

    setLoading(prev => ({ ...prev, playlists: true }));
    setError(prev => ({ ...prev, playlists: null }));

    try {
      // Add delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const data = await Playlist.list('-created_date', 100);
      setPlaylists(data);
      setLastFetch(prev => ({ ...prev, playlists: Date.now() }));
      return data;
    } catch (error) {
      console.error("Error loading playlists:", error);
      setError(prev => ({ ...prev, playlists: error.message }));
      // Return cached data if available
      return playlists;
    } finally {
      setLoading(prev => ({ ...prev, playlists: false }));
    }
  };

  // Load initial data
  useEffect(() => {
    loadTracks();
    // Delay playlist loading slightly to avoid simultaneous requests
    setTimeout(() => loadPlaylists(), 200);
  }, []);

  const invalidateCache = (type) => {
    if (type === 'tracks' || type === 'all') {
      setLastFetch(prev => ({ ...prev, tracks: 0 }));
    }
    if (type === 'playlists' || type === 'all') {
      setLastFetch(prev => ({ ...prev, playlists: 0 }));
    }
  };

  const refreshData = async (type = 'all') => {
    if (type === 'tracks' || type === 'all') {
      await loadTracks(true);
    }
    if (type === 'playlists' || type === 'all') {
      // Add slight delay between requests
      setTimeout(() => loadPlaylists(true), 100);
    }
  };

  const value = {
    tracks,
    playlists,
    loading,
    error,
    loadTracks,
    loadPlaylists,
    refreshData,
    invalidateCache
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};