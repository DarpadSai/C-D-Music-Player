import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Sidebar = ({ role, setView, currentView, onSearch, onPlaylistClick }) => {
  const [playlists, setPlaylists] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
          setPlaylists(res.data);
      } catch (err) { console.error(err); }
  };

  const createPlaylist = async () => {
      const name = prompt("Enter Neural Playlist ID:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          fetchPlaylists(); 
      } catch (err) { toast.error("Creation Error"); }
  };

  const getStyle = (viewName) => `sidebar-btn ${currentView === viewName ? 'active' : ''}`;

  return (
    <div style={{ background: '#050505', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', borderRight: '1px solid rgba(0, 243, 255, 0.1)' }}>
      
      <h2 className="desktop-only" style={{ marginBottom: '30px', fontFamily: 'Orbitron', fontSize: '22px', color: '#00f3ff', textShadow: '0 0 5px #00f3ff' }}>
        CYBER<span style={{color:'#bc13fe'}}>MIX</span>
      </h2>

      <div style={{ marginBottom: '30px' }}>
        <input placeholder="SEARCH DATABASE..." onChange={(e) => onSearch(e.target.value)} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div className={getStyle('home')} onClick={() => setView('home')}>HOME</div>
          <div className={getStyle('liked')} onClick={() => setView('liked')}>FAVORITES</div>
      </div>
      
      <div className="desktop-only" style={{ marginTop: '30px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px', color: '#bc13fe', fontSize: '12px', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between' }}>
          PLAYLISTS
          <span onClick={createPlaylist} style={{ cursor: 'pointer', color: '#00f3ff' }}>[+]</span>
      </div>

      <div className="desktop-only" style={{ flex: 1, overflowY: 'auto' }}>
          {playlists.map(pl => (
              <div key={pl._id} className="sidebar-btn" onClick={() => onPlaylistClick(pl._id)} style={{ fontSize: '12px', fontFamily: 'Orbitron' }}>
                  {pl.name}
              </div>
          ))}
      </div>

      {role === 'admin' && (
        <div className="desktop-only" style={{ marginTop: '20px' }}>
            <div className={getStyle('users')} onClick={() => setView('users')}>[ ADMIN PANEL ]</div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;