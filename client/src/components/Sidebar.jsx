import React, { useState, useEffect } from 'react';
import api from '../api';

const Sidebar = ({ role, onLogout, setView, currentView, onSearch, onPlaylistClick }) => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
      fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
      try {
          const token = localStorage.getItem('token');
          // FIX: Fetch only USER playlists
          const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
          setPlaylists(res.data);
      } catch (err) { console.error(err); }
  };

  const createPlaylist = async () => {
      const name = prompt("Enter Playlist Name:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          fetchPlaylists(); 
      } catch (err) { alert("Failed to create"); }
  };

  const getStyle = (viewName) => `sidebar-btn ${currentView === viewName ? 'active' : ''}`;

  return (
    <div style={{ 
        background: 'black', padding: '24px', display: 'flex', flexDirection: 'column', 
        height: '100%', borderRight: '1px solid #222', boxSizing: 'border-box', overflowY: 'auto' 
    }}>
      <h2 style={{ marginBottom: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '28px' }}>🎧</span> CloudMix
      </h2>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '20px' }}>
        <input 
            placeholder="🔍 Search Songs..." 
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', background: '#282828', color: 'white' }}
        />
      </div>
      
      <div className={getStyle('home')} onClick={() => setView('home')}>🏠 Home</div>
      <div className={getStyle('liked')} onClick={() => setView('liked')}>💜 Liked Songs</div>
      
      <div style={{ marginTop: '30px', paddingLeft: '15px', fontSize: '12px', color: '#aaa', letterSpacing: '1px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          YOUR PLAYLISTS
          <span onClick={createPlaylist} style={{ cursor: 'pointer', fontSize: '18px', color: 'white' }}>+</span>
      </div>

      {/* USER PLAYLISTS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
          {playlists.map(pl => (
              <div key={pl._id} className="sidebar-btn" onClick={() => onPlaylistClick(pl._id)}>
                  🎵 {pl.name}
              </div>
          ))}
      </div>

      {role === 'admin' && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>ADMIN</div>
            <div className="sidebar-btn" onClick={() => alert('Admin Panel')}>📤 Uploads</div>
        </div>
      )}

      <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <div className="sidebar-btn" onClick={onLogout} style={{ color: '#ff5555' }}>
          🚪 Logout
        </div>
      </div>
    </div>
  );
};
export default Sidebar;