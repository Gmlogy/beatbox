
import React, { useState, useEffect } from "react";
import { Track } from "@/api/entities";
import { Playlist } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Play,
  Pause,
  Search,
  Plus,
  Shuffle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Music,
  Users,
  Disc
} from "lucide-react";
import { usePlayer } from "@/components/player/PlayerContext";
import EditPlaylistDialog from "./EditPlaylistDialog";

export default function PlaylistView({ playlist, onBack, onUpdate }) {
  const [tracks, setTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [selections, setSelections] = useState({ tracks: [], artists: [], albums: [] });
  const [tracksToRemove, setTracksToRemove] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { play, pause, isPlaying, currentTrack } = usePlayer();

  useEffect(() => {
    loadPlaylistTracks();
    loadAllTracks();
    setTracksToRemove([]);
  }, [playlist]);

  const loadPlaylistTracks = async () => {
    if (!playlist.track_ids || playlist.track_ids.length === 0) {
      setTracks([]);
      setIsLoading(false);
      return;
    }

    try {
      const allTracksData = await Track.list('-created_date', 1000);
      const playlistTracks = allTracksData.filter(track =>
        playlist.track_ids.includes(track.id)
      );
      setTracks(playlistTracks);
    } catch (error) {
      console.error("Error loading playlist tracks:", error);
      setTracks([]);
    }
    setIsLoading(false);
  };

  const loadAllTracks = async () => {
    try {
      const data = await Track.list('-created_date', 1000);
      setAllTracks(data);

      const artistMap = {};
      const albumMap = {};

      data.forEach((track) => {
        if (!playlist.track_ids?.includes(track.id)) {
            const artistName = track.artist;
            if (artistName) {
                if (!artistMap[artistName]) {
                    artistMap[artistName] = { name: artistName, tracks: [], trackCount: 0 };
                }
                artistMap[artistName].tracks.push(track);
                artistMap[artistName].trackCount++;
            }
            
            const albumName = track.album;
            if (albumName && artistName) {
                const albumKey = `${albumName}-${artistName}`;
                if (!albumMap[albumKey]) {
                    albumMap[albumKey] = { name: albumName, artist: track.artist, tracks: [], trackCount: 0, coverArt: track.album_art_url };
                }
                albumMap[albumKey].tracks.push(track);
                albumMap[albumKey].trackCount++;
            }
        }
      });
      setAllArtists(Object.values(artistMap).sort((a,b) => a.name.localeCompare(b.name)));
      setAllAlbums(Object.values(albumMap).sort((a,b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error("Error loading all tracks:", error);
    }
  };

  const handleAddTracks = async () => {
    if (selections.tracks.length === 0 && selections.artists.length === 0 && selections.albums.length === 0) return;

    try {
        const trackIdsToAdd = new Set(selections.tracks);

        // Add tracks from selected artists
        selections.artists.forEach(artistName => {
            const artist = allArtists.find(a => a.name === artistName);
            artist?.tracks.forEach(track => trackIdsToAdd.add(track.id));
        });

        // Add tracks from selected albums
        selections.albums.forEach(albumKey => {
            const album = allAlbums.find(a => `${a.name}-${a.artist}` === albumKey);
            album?.tracks.forEach(track => trackIdsToAdd.add(track.id));
        });

        // Get current playlist data
        const currentPlaylist = await Playlist.get(playlist.id);
        const currentTrackIds = currentPlaylist.track_ids || [];
        
        // Filter out tracks that are already in the playlist
        const newTrackIds = Array.from(trackIdsToAdd).filter(id => !currentTrackIds.includes(id));
        
        if (newTrackIds.length === 0) {
            // Show message that no new tracks were added
            const toast = document.createElement('div');
            toast.className = 'fixed top-16 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            toast.textContent = 'All selected tracks are already in this playlist';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2500);
            
            setSelections({ tracks: [], artists: [], albums: [] });
            setShowAddTracks(false);
            return;
        }

        // Combine existing and new track IDs
        const updatedTrackIds = [...currentTrackIds, ...newTrackIds];
        
        // Update the playlist
        await Playlist.update(playlist.id, { track_ids: updatedTrackIds });

        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `Added ${newTrackIds.length} track${newTrackIds.length !== 1 ? 's' : ''} to playlist`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 2500);

        // Reset selections and close the add tracks section
        setSelections({ tracks: [], artists: [], albums: [] });
        setShowAddTracks(false);
        
        // Reload playlist tracks and refresh data
        await loadPlaylistTracks();
        await loadAllTracks();
        onUpdate(); // Notify parent component to refresh

    } catch (error) {
        console.error("Error adding tracks:", error);
        
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'fixed top-16 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = 'Failed to add tracks to playlist';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 2500);
    }
  };

  const handleRemoveTracks = async (trackIds) => {
    try {
      const updatedTrackIds = playlist.track_ids.filter(id => !trackIds.includes(id));
      await Playlist.update(playlist.id, { track_ids: updatedTrackIds });

      loadPlaylistTracks();
      loadAllTracks(); // Added this line to refresh addable tracks
      setTracksToRemove([]);
      onUpdate();
    } catch (error) {
      console.error("Error removing tracks:", error);
    }
  };
  
  const handleUpdatePlaylist = async (updatedData) => {
    try {
      await Playlist.update(playlist.id, updatedData);
      onUpdate();
    } catch(error) {
      console.error("Failed to update playlist", error);
    }
  };
  
  const handleSelectToRemove = (trackId, isSelected) => {
    if (isSelected) {
      setTracksToRemove(prev => [...prev, trackId]);
    } else {
      setTracksToRemove(prev => prev.filter(id => id !== trackId));
    }
  };

  const handleSelectAllToRemove = (isChecked) => {
    if (isChecked) {
      setTracksToRemove(tracks.map(t => t.id));
    } else {
      setTracksToRemove([]);
    }
  };

  const handleSelectionChange = (type, value, isChecked) => {
    setSelections(prev => {
        const currentSelection = prev[type];
        const newSelection = isChecked 
            ? [...currentSelection, value]
            : currentSelection.filter(item => item !== value);
        return { ...prev, [type]: newSelection };
    });
  };

  const filteredAllTracks = allTracks.filter(track =>
    !playlist.track_ids?.includes(track.id) &&
    (track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     track.album?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAddedTrackCount = () => {
    const trackIdsToAdd = new Set(selections.tracks);
    selections.artists.forEach(artistName => {
        const artist = allArtists.find(a => a.name === artistName);
        artist?.tracks.forEach(track => trackIdsToAdd.add(track.id));
    });
    selections.albums.forEach(albumKey => {
        const album = allAlbums.find(a => `${a.name}-${a.artist}` === albumKey);
        album?.tracks.forEach(track => trackIdsToAdd.add(track.id));
    });
    return trackIdsToAdd.size;
  }

  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const formatTotalDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={onBack} className="ripple-effect dark:bg-slate-700 dark:border-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{playlist.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {tracks.length} tracks • {formatTotalDuration(totalDuration)}
              {playlist.description && ` • ${playlist.description}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (tracks.length > 0) {
                play(tracks[0], tracks)
              }
            }}
            disabled={tracks.length === 0}
            className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Play All
          </Button>
          <Button variant="outline" disabled={tracks.length === 0} className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
             onClick={() => {
              if (tracks.length > 0) {
                const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                play(shuffled[0], shuffled);
              }
            }}>
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddTracks(!showAddTracks)}
            className="ripple-effect dark:bg-slate-700 dark:border-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tracks
          </Button>
          <Button variant="outline" className="ripple-effect dark:bg-slate-700 dark:border-slate-600" onClick={() => setShowEditDialog(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {showAddTracks && (
        <div className="bg-blue-50 dark:bg-slate-800/50 border-b border-blue-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">Add to Playlist</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleAddTracks}
                disabled={getAddedTrackCount() === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 ripple-effect text-white"
              >
                Add {getAddedTrackCount()} Track{getAddedTrackCount() !== 1 ? 's' : ''}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddTracks(false);
                  setSelections({ tracks: [], artists: [], albums: [] });
                }}
                className="dark:bg-slate-700 dark:border-slate-600"
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg max-h-[40vh] overflow-auto material-elevation-1">
             <Tabs defaultValue="tracks" className="w-full">
                <TabsList className="grid w-full grid-cols-3 sticky top-0 z-20 bg-slate-50 dark:bg-slate-700/50">
                  <TabsTrigger value="tracks" className="flex items-center gap-2 dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-slate-100"><Music className="w-4 h-4" />Tracks</TabsTrigger>
                  <TabsTrigger value="artists" className="flex items-center gap-2 dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-slate-100"><Users className="w-4 h-4" />Artists</TabsTrigger>
                  <TabsTrigger value="albums" className="flex items-center gap-2 dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-slate-100"><Disc className="w-4 h-4" />Albums</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tracks" className="p-1">
                  {filteredAllTracks.slice(0, 100).map((track) => (
                    <div key={track.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded">
                      <Checkbox id={`add-track-${track.id}`} checked={selections.tracks.includes(track.id)} onCheckedChange={(checked) => handleSelectionChange('tracks', track.id, checked)} className="sync-checkbox"/>
                      <Label htmlFor={`add-track-${track.id}`} className="flex-1 text-sm cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundImage: track.album_art_url ? `url(${track.album_art_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {!track.album_art_url && (<Music className="w-4 h-4 text-slate-400" />)}
                          </div>
                          <div>
                            <div>{track.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{track.artist}</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="artists" className="p-1">
                  {allArtists.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((artist) => (
                    <div key={artist.name} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded">
                      <Checkbox id={`add-artist-${artist.name}`} checked={selections.artists.includes(artist.name)} onCheckedChange={(checked) => handleSelectionChange('artists', artist.name, checked)} className="sync-checkbox"/>
                      <Label htmlFor={`add-artist-${artist.name}`} className="flex-1 text-sm cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{artist.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">({artist.trackCount} songs)</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="albums" className="p-1">
                  {allAlbums.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.artist.toLowerCase().includes(searchQuery.toLowerCase())).map((album) => {
                    const albumKey = `${album.name}-${album.artist}`;
                    return (
                      <div key={albumKey} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded">
                        <Checkbox id={`add-album-${albumKey}`} checked={selections.albums.includes(albumKey)} onCheckedChange={(checked) => handleSelectionChange('albums', albumKey, checked)} className="sync-checkbox"/>
                        <Label htmlFor={`add-album-${albumKey}`} className="flex-1 text-sm cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundImage: album.coverArt ? `url(${album.coverArt})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {!album.coverArt && (<Disc className="w-4 h-4 text-slate-400" />)}
                            </div>
                            <div>
                              <div>{album.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{album.artist} • {album.trackCount} songs</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </TabsContent>
             </Tabs>
          </div>
        </div>
      )}
      
      {tracksToRemove.length > 0 && (
         <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
            <span className="font-medium">{tracksToRemove.length} track{tracksToRemove.length > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-3">
               <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveTracks(tracksToRemove)}
               >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove from Playlist
               </Button>
               <Button variant="ghost" size="sm" onClick={() => setTracksToRemove([])}>Cancel</Button>
            </div>
         </div>
      )}


      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 p-4">
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tracks.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl material-elevation-1 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="border-b border-slate-200 dark:border-slate-700">
                  <TableHead className="w-24">
                     <div className="flex items-center gap-3">
                        <Checkbox 
                           checked={tracks.length > 0 && tracksToRemove.length === tracks.length}
                           onCheckedChange={handleSelectAllToRemove}
                           className="sync-checkbox"
                        />
                        <span className="text-sm text-slate-500 font-mono w-8 text-right opacity-0">00</span>
                     </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Title</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Artist</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Album</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Duration</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="dark:divide-slate-700">
                {tracks.map((track, index) => (
                  <TableRow key={track.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-700/60 ${tracksToRemove.includes(track.id) ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`} onClick={() => play(track, tracks)}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                           checked={tracksToRemove.includes(track.id)}
                           onCheckedChange={(checked) => handleSelectToRemove(track.id, checked)}
                           onClick={(e) => e.stopPropagation()}
                           className="sync-checkbox"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); isPlaying && currentTrack?.id === track.id ? pause() : play(track, tracks) }}
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity ripple-effect dark:hover:bg-slate-700"
                        >
                          {isPlaying && currentTrack?.id === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </Button>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-mono w-8 text-right group-hover:opacity-0 transition-opacity">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                       </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded overflow-hidden flex-shrink-0"
                          style={{
                            backgroundImage: track.album_art_url ? `url(${track.album_art_url})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {!track.album_art_url && (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">♪</div>
                          )}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{track.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-slate-700 dark:text-slate-300">{track.artist}</TableCell>
                    <TableCell className="py-3 text-slate-600 dark:text-slate-400">{track.album}</TableCell>
                    <TableCell className="py-3 text-slate-600 dark:text-slate-400 font-mono text-sm">
                      {Math.floor((track.duration || 0) / 60)}:{((track.duration || 0) % 60).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRemoveTracks([track.id]); 
                        }}
                        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Empty Playlist</h3>
            <p className="text-sm text-center mb-4">
              This playlist doesn't have any tracks yet.
            </p>
            <Button
              onClick={() => setShowAddTracks(true)}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 ripple-effect text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tracks
            </Button>
          </div>
        )}
      </div>

       <EditPlaylistDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        playlist={playlist}
        onUpdatePlaylist={handleUpdatePlaylist}
      />
    </div>
  );
}
