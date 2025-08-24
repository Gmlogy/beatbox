
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import all page components
import Layout from '@/pages/Layout.jsx';
import IndexPage from '@/pages/index.jsx';
import Library from '@/pages/Library.jsx';
import AlbumsPage from '@/pages/Albums.jsx';
import ArtistsPage from '@/pages/Artists.jsx';
import DiscoverPage from '@/pages/Discover.jsx';
import DuplicatesPage from '@/pages/Duplicates.jsx';
import FavoritesPage from '@/pages/Favorites.jsx';
import PlaylistsPage from '@/pages/Playlists.jsx';
import RecentPage from '@/pages/Recent.jsx';
import RecentlyPlayedPage from '@/pages/RecentlyPlayed.jsx';
import SettingsPage from '@/pages/Settings.jsx';
import StatsPage from '@/pages/Stats.jsx';
import SyncPage from '@/pages/Sync.jsx';

function App() {
  // The original content of App.jsx was incorrect, causing the router error.
  // The correct setup is to define all the application routes here,
  // wrapped in a BrowserRouter to provide routing context to all components.
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* The IndexPage is the entry point at "/", which just redirects to the library. */}
          <Route path="/" element={<IndexPage />} />

          {/* All other pages are rendered within the main Layout component, which includes the sidebar and player. */}
          <Route element={<Layout />}>
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/library" element={<Library />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/recentlyplayed" element={<RecentlyPlayedPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
