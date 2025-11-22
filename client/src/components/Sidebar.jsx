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
      const name = prompt("Enter Playlist Frequency ID:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          fetchPlaylists(); 
      } catch (err) { toast.error("Creation Failed"); }
  };

  const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
          const token = localStorage.getItem('token');
          await api.post('/users/avatar', formData, { headers: { 'Authorization': token } });
          toast.success("Avatar Uploaded");
      } catch (err) { toast.error("Upload Failed"); }
  };

  const getStyle = (viewName) => `sidebar-btn ${currentView === viewName ? 'active' : ''}`;

  return (
    <div style={{ background: '#050505', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', borderRight: '1px solid rgba(0, 243, 255, 0.1)', paddingBottom: '120px' }}>
      
      <h2 className="desktop-only" style={{ marginBottom: '30px', fontFamily: 'Orbitron', fontSize: '22px', color: '#fff', textShadow: '0 0 5px #00f3ff' }}>
        <span style={{ color: '#00f3ff' }}>DC</span> Music & Co.
      </h2>

      <div style={{ marginBottom: '30px' }}>
        <input placeholder="SEARCH DATABASE..." onChange={(e) => onSearch(e.target.value)} style={{ width: '100%' }} />
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

      <div className="desktop-only" style={{ marginTop: '20px', borderTop: '1px solid #222', paddingTop: '15px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: '1px solid #333', color: '#555', padding: '5px', borderRadius: '0', fontSize: '10px', width: '100%', cursor: 'pointer', fontFamily: 'Orbitron' }}>[ UPDATE AVATAR ]</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
      </div>

      {role === 'admin' && (
        <div className="desktop-only" style={{ marginTop: '10px' }}>
            <div className={getStyle('users')} onClick={() => setView('users')}>[ ADMIN PANEL ]</div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;