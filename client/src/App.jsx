import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SongList from './components/SongList';
import Player from './components/Player';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import UserList from './components/UserList';

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [songQueue, setSongQueue] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedName = localStorage.getItem('username');
    if (token) {
        setRole(savedRole);
        setUsername(savedName);
    }
  }, []);

  const handleLogin = (newRole, newName) => {
      setRole(newRole);
      setUsername(newName);
      setView('home');
  };

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setCurrentSong(null);
    setView('home');
  };

  const handlePlaylistClick = (id) => {
      setActivePlaylistId(id);
      setView('playlist');
  };

  const handlePlaySong = (song, allSongs) => {
      setCurrentSong(song);
      setSongQueue(allSongs);
  };

  const handleNext = () => {
      if (!currentSong || songQueue.length === 0) return;
      const currentIndex = songQueue.findIndex(s => s._id === currentSong._id);
      const nextIndex = (currentIndex + 1) % songQueue.length;
      setCurrentSong(songQueue[nextIndex]);
  };

  const handlePrev = () => {
      if (!currentSong || songQueue.length === 0) return;
      const currentIndex = songQueue.findIndex(s => s._id === currentSong._id);
      const prevIndex = currentIndex === 0 ? songQueue.length - 1 : currentIndex - 1;
      setCurrentSong(songQueue[prevIndex]);
  };

  if (!role) return (
    <>
        {/* FIX: Position set to top-center for Login Screen */}
        <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        <Login onLogin={handleLogin} />
    </>
  );

  return (
    <div className="app-layout">
      {/* FIX: Position set to top-center for Main App */}
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      
      <div className="sidebar-container">
          <Sidebar 
            role={role} 
            onLogout={handleLogout} 
            setView={setView} 
            currentView={view}
            onSearch={setSearchQuery} 
            onPlaylistClick={handlePlaylistClick}
          />
      </div>
      
      <div className="main-view">
        <div style={{ padding: '15px 30px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
             <div style={{ color: '#aaa', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {view}
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ background: '#1DB954', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                    {username.charAt(0).toUpperCase()}
                </span>
                {username}
             </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg, #1e1e1e 0%, #121212 40%)' }}>
           {view === 'users' && role === 'admin' ? (
               <UserList />
           ) : (
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
      
      <Player currentSong={currentSong} onNext={handleNext} onPrev={handlePrev} />
    </div>
  );
}
export default App;