import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Sidebar = ({ role, onLogout, setView, currentView, onSearch, onPlaylistClick }) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
          setPlaylists(res.data);
      } catch (err) { console.error(err); }
  };

  const createPlaylist = async () => {
      const name = prompt("Playlist Name:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          toast.success('Playlist Created');
          fetchPlaylists(); 
      } catch (err) { toast.error("Failed to create"); }
  };

  const getStyle = (viewName) => `sidebar-btn ${currentView === viewName ? 'active' : ''}`;

  return (
    <div style={{ 
        background: 'black', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        boxSizing: 'border-box', 
        overflowY: 'auto',
        // FIX: Extra padding at bottom to prevent Player overlap
        paddingBottom: '120px' 
    }}>
      <h2 className="desktop-only" style={{ marginBottom: '25px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
        <span style={{ color: '#1DB954' }}>l|l</span> DC Music & Co.
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <input 
            placeholder="🔍 Search..." 
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '20px', border: 'none', background: '#282828', color: 'white', textIndent: '10px' }}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div className={getStyle('home')} onClick={() => setView('home')}>🏠 <span className="desktop-only">Home</span></div>
          <div className={getStyle('liked')} onClick={() => setView('liked')}>💜 <span className="desktop-only">Liked</span></div>
      </div>
      
      <div className="desktop-only" style={{ marginTop: '30px', paddingLeft: '10px', fontSize: '11px', color: '#aaa', letterSpacing: '1px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          LIBRARY
          <span onClick={createPlaylist} style={{ cursor: 'pointer', fontSize: '18px', color: 'white', background: '#282828', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
      </div>

      <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', flex: 1, overflowY: 'auto' }}>
          {playlists.map(pl => (
              <div key={pl._id} className="sidebar-btn" onClick={() => onPlaylistClick(pl._id)} style={{ fontSize: '14px' }}>
                  🎵 {pl.name}
              </div>
          ))}
      </div>

      {role === 'admin' && (
        <div style={{ marginTop: 'auto', borderTop: '1px solid #222', paddingTop: '15px' }}>
            <div className="desktop-only" style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>ADMIN</div>
            <div className={getStyle('users')} onClick={() => setView('users')}>👥 <span className="desktop-only">Users</span></div>
        </div>
      )}

      <div className="desktop-only" style={{ marginTop: '10px' }}>
        <div className="sidebar-btn" onClick={onLogout} style={{ color: '#ff5555' }}>
          🚪 Logout
        </div>
      </div>
    </div>
  );
};
export default Sidebar;