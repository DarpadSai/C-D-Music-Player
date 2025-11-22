import React, { useState, useEffect } from 'react';
import SongList from './components/SongList';
import Player from './components/Player';
import Login from './components/Login';
import Sidebar from './components/Sidebar';

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
        setUsername(savedName || 'User');
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setCurrentSong(null);
  };

  // THIS FUNCTION NEEDS TO BE PASSED DOWN
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

  if (!role) return <Login onLogin={(r, u) => { setRole(r); setUsername(u); }} />;

  const contentHeight = currentSong ? 'calc(100vh - 90px)' : '100vh';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#121212' }}>
      
      <div style={{ height: contentHeight, width: '240px' }}>
          <Sidebar 
            role={role} 
            onLogout={handleLogout} 
            setView={setView} 
            currentView={view}
            onSearch={setSearchQuery} 
            onPlaylistClick={handlePlaylistClick}
          />
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: contentHeight }}>
        <div style={{ padding: '15px 30px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ color: '#aaa', fontSize: '14px', textTransform: 'capitalize' }}>{view}</div>
             <div style={{ background: '#282828', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                <span style={{ background: '#555', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{username.charAt(0).toUpperCase()}</span>
                {username}
             </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg, #222 0%, #121212 40%)' }}>
           <SongList 
                onPlay={handlePlaySong} 
                role={role} 
                view={view} 
                searchQuery={searchQuery} 
                playlistId={activePlaylistId}
                onPlaylistClick={handlePlaylistClick} // <--- NEW PROP PASSED HERE
           />
        </div>
      </div>
      
      <Player currentSong={currentSong} onNext={handleNext} onPrev={handlePrev} />
    </div>
  );
}
export default App;