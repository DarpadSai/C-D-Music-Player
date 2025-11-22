import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SongList from './components/SongList';
import Player from './components/Player';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import UserList from './components/UserList';

function App() {
  // State
  const [currentSong, setCurrentSong] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [songQueue, setSongQueue] = useState([]);
  
  // NEW FEATURES STATE
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: All, 2: One

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('username');
    if (token) { setRole(savedRole); setUsername(savedName); }
  }, []);

  const handleLogin = (newRole, newName) => { setRole(newRole); setUsername(newName); setView('home'); };
  const handleLogout = () => { localStorage.clear(); setRole(null); setCurrentSong(null); setView('home'); };
  const handlePlaylistClick = (id) => { setActivePlaylistId(id); setView('playlist'); };
  const handlePlaySong = (song, allSongs) => { setCurrentSong(song); setSongQueue(allSongs); };

  // --- ADVANCED PLAYBACK LOGIC ---
  
  const handleNext = () => {
      if (!currentSong || songQueue.length === 0) return;
      
      // Repeat One Logic handled in Player (it won't call next), 
      // but if called manually:
      if (repeatMode === 2) { 
          // Just replay same song (Frontend player will handle seeking to 0)
          return; 
      }

      let nextIndex;
      if (isShuffle) {
          // Random Index
          nextIndex = Math.floor(Math.random() * songQueue.length);
      } else {
          // Sequential
          const currentIndex = songQueue.findIndex(s => s._id === currentSong._id);
          nextIndex = currentIndex + 1;
          
          // Repeat All Logic
          if (nextIndex >= songQueue.length) {
              if (repeatMode === 1) nextIndex = 0; // Loop back
              else return; // Stop at end
          }
      }
      setCurrentSong(songQueue[nextIndex]);
  };

  const handlePrev = () => {
      if (!currentSong || songQueue.length === 0) return;
      const currentIndex = songQueue.findIndex(s => s._id === currentSong._id);
      const prevIndex = currentIndex === 0 ? songQueue.length - 1 : currentIndex - 1;
      setCurrentSong(songQueue[prevIndex]);
  };

  if (!role) return <><Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} /><Login onLogin={handleLogin} /></>;

  // Calculate Avatar URL
  const avatarUrl = username ? `https://dc-music-player-backend.onrender.com/users/${username}/avatar?t=${new Date().getTime()}` : null;

  return (
    <div className="app-layout">
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      
      <div className="sidebar-container">
          <Sidebar 
            role={role} 
            onLogout={handleLogout} 
            setView={setView} 
            currentView={view}
            onSearch={setSearchQuery} 
            onPlaylistClick={handlePlaylistClick}
            username={username} // Pass for profile pic update
          />
      </div>
      
      <div className="main-view">
        <div style={{ padding: '15px 30px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
             <div style={{ color: '#aaa', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{view}</div>
             
             {/* PROFILE HEADER */}
             <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={avatarUrl} alt="User" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                {username}
             </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg, #1e1e1e 0%, #121212 40%)' }}>
           {view === 'users' && role === 'admin' ? <UserList /> : (
               <SongList 
                    onPlay={handlePlaySong} 
                    role={role} 
                    view={view} 
                    searchQuery={searchQuery} 
                    playlistId={activePlaylistId}
                    onPlaylistClick={handlePlaylistClick}
               />
           )}
        </div>
      </div>
      
      {/* Pass new props to Player */}
      <Player 
        currentSong={currentSong} 
        onNext={handleNext} 
        onPrev={handlePrev}
        isShuffle={isShuffle}
        setIsShuffle={setIsShuffle}
        repeatMode={repeatMode}
        setRepeatMode={setRepeatMode}
      />
    </div>
  );
}
export default App;