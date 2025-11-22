import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SongList from './components/SongList';
import Player from './components/Player';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile';

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [songQueue, setSongQueue] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false); // Dropdown state

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
    sessionStorage.clear();
    setRole(null);
    setCurrentSong(null);
    setView('home');
    setShowUserMenu(false);
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
        <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
        <Login onLogin={handleLogin} />
    </>
  );

  return (
    <div className="app-layout">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      
      <div className="sidebar-container">
          {/* Pass empty onLogout because we use the top dropdown now */}
          <Sidebar 
            role={role} 
            onLogout={() => {}} 
            setView={setView} 
            currentView={view} 
            onSearch={setSearchQuery} 
            onPlaylistClick={handlePlaylistClick} 
          />
      </div>
      
      <div className="main-view">
        {/* TOP HEADER (User Profile Only) */}
        <div style={{ 
            padding: '20px 40px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            position: 'relative',
            zIndex: 100 
        }}>
             {/* USER DROPDOWN */}
             <div style={{ position: 'relative' }}>
                 <div 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{ 
                        cursor: 'pointer', 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        color: 'white', 
                        fontWeight: '600', 
                        fontSize: '13px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                 >
                    <span style={{ background: '#818cf8', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>
                        {username.charAt(0).toUpperCase()}
                    </span>
                    {username} ▾
                 </div>

                 {showUserMenu && (
                     <div className="fade-in" style={{ 
                         position: 'absolute', 
                         top: '45px', 
                         right: 0, 
                         background: '#1e293b', 
                         border: '1px solid rgba(255,255,255,0.1)', 
                         borderRadius: '12px', 
                         width: '180px', 
                         overflow: 'hidden', 
                         boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
                     }}>
                         <div 
                            onClick={() => { setView('profile'); setShowUserMenu(false); }} 
                            style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                         >
                             User Profile
                         </div>
                         <div 
                            onClick={handleLogout} 
                            style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '13px', color: '#ef4444' }}
                            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                         >
                             Logout
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
           {view === 'users' && role === 'admin' ? <UserList /> : 
            view === 'profile' ? <UserProfile /> : (
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