import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Sidebar = ({ role, setView, currentView, onSearch, onPlaylistClick }) => {
  const [playlists, setPlaylists] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
          setPlaylists(res.data || []);
      } catch (err) { console.error(err); }
  };

  const createPlaylist = async () => {
      const name = prompt("Playlist Name:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          toast.success("Playlist Created");
          fetchPlaylists(); 
      } catch (err) { toast.error("Failed"); }
  };

  const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
          const token = localStorage.getItem('token');
          await api.post('/users/avatar', formData, { headers: { 'Authorization': token } });
          toast.success("Avatar Updated");
      } catch (err) { toast.error("Upload Failed"); }
  };

  const getStyle = (viewName) => ({
      padding: '10px 12px',
      margin: '4px 0',
      borderRadius: '8px',
      cursor: 'pointer',
      color: currentView === viewName ? '#fff' : '#94a3b8',
      background: currentView === viewName ? 'rgba(255,255,255,0.1)' : 'transparent',
      fontWeight: currentView === viewName ? '600' : '400',
      display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s'
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <h2 className="desktop-only" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '30px', letterSpacing: '-0.5px' }}>
        <span style={{ color: '#818cf8' }}>DC</span> Music.
      </h2>

      <div style={{ marginBottom: '25px' }}>
        <input placeholder="Search..." onChange={(e) => onSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={getStyle('home')} onClick={() => setView('home')}>🏠 <span className="desktop-only">Home</span></div>
          <div style={getStyle('liked')} onClick={() => setView('liked')}>💜 <span className="desktop-only">Liked</span></div>
      </div>
      
      <div className="desktop-only" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>
          LIBRARY
          <span onClick={createPlaylist} style={{ cursor: 'pointer', fontSize: '16px', color: '#fff' }}>+</span>
      </div>

      <div className="desktop-only" style={{ flex: 1, overflowY: 'auto' }}>
          {playlists.map(pl => (
              <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} style={{ padding: '8px 0', fontSize: '14px', color: '#cbd5e1', cursor: 'pointer', opacity: 0.8 }} onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0.8}>
                  {pl.name}
              </div>
          ))}
      </div>

      <div className="desktop-only" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px', borderRadius: '8px', fontSize: '11px', width: '100%', cursor: 'pointer' }}>Change Avatar</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
      </div>

      {role === 'admin' && (
        <div className="desktop-only" style={{ marginTop: '10px' }}>
            <div style={getStyle('users')} onClick={() => setView('users')}>👥 Users</div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;