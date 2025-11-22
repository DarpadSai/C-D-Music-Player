import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import SongList from './components/SongList';
import Player from './components/Player';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile'; // Import new component

function App() {
  // ... state ...
  const [currentSong, setCurrentSong] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [songQueue, setSongQueue] = useState([]);
  
  // NEW: Dropdown State
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ... useEffect for token ...
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedRole = localStorage.getItem('role') || sessionStorage.getItem('role');
    const savedName = localStorage.getItem('username') || sessionStorage.getItem('username');
    if (token) { setRole(savedRole); setUsername(savedName); }
  }, []);

  // ... handlers (handlePlaySong, handleNext, etc - keep same) ...
  const handlePlaySong = (song, allSongs) => { setCurrentSong(song); setSongQueue(allSongs); };
  const handleNext = () => { /* ... keep logic ... */ };
  const handlePrev = () => { /* ... keep logic ... */ };
  const handlePlaylistClick = (id) => { setActivePlaylistId(id); setView('playlist'); };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setRole(null);
    setCurrentSong(null);
    setView('home');
    setShowUserMenu(false);
  };

  if (!role) return <><Toaster position="top-center" toastOptions={{style:{background:'#000', color:'#00f3ff', border:'1px solid #00f3ff'}}} /><Login onLogin={(r, u) => {setRole(r); setUsername(u); setView('home');}} /></>;

  const contentHeight = currentSong ? 'calc(100vh - 90px)' : '100vh';

  return (
    <div className="app-layout">
      <Toaster position="top-center" toastOptions={{style:{background:'#000', color:'#00f3ff', border:'1px solid #00f3ff'}}} />
      
      <div className="sidebar-container" style={{height: contentHeight}}>
          {/* Pass empty onLogout because we removed the button from sidebar */}
          <Sidebar role={role} onLogout={() => {}} setView={setView} currentView={view} onSearch={setSearchQuery} onPlaylistClick={handlePlaylistClick} />
      </div>
      
      <div className="main-view" style={{height: contentHeight}}>
        {/* HEADER WITH DROPDOWN */}
        <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 243, 255, 0.1)' }}>
             <div style={{ color: '#bc13fe', fontFamily: 'Orbitron', letterSpacing: '2px' }}>
                {view === 'home' && 'MAINFRAME // HOME'}
                {view === 'library' && 'DATABASE // PLAYLISTS'}
                {view === 'profile' && 'USER // SETTINGS'}
             </div>
             
             {/* USER DROPDOWN AREA */}
             <div style={{ position: 'relative' }}>
                 <div 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{ cursor: 'pointer', border: '1px solid #00f3ff', padding: '8px 20px', color: '#00f3ff', fontFamily: 'Orbitron', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 243, 255, 0.05)' }}
                 >
                    {username} ▾
                 </div>

                 {showUserMenu && (
                     <div className="dropdown-menu">
                         <div className="dropdown-item" onClick={() => { setView('profile'); setShowUserMenu(false); }}>User Details</div>
                         <div className="dropdown-item" style={{ color: '#ff0055' }} onClick={handleLogout}>Logout / Terminate</div>
                     </div>
                 )}
             </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
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