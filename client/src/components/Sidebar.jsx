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
          setPlaylists(res.data || []);
      } catch (err) { console.error(err); }
  };

  const createPlaylist = async () => {
      const name = prompt("Playlist Name:");
      if (!name) return;
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/playlists', { name }, { headers: { 'Authorization': token } });
          toast.success("Created");
          fetchPlaylists(); 
      } catch (err) { toast.error("Failed"); }
  };

  const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/users/avatar', formData, { headers: { 'Authorization': token } });
          toast.success("Avatar Updated");
      } catch (err) { toast.error("Upload Failed"); }
  };

  const getStyle = (viewName) => ({
      padding: '12px 16px', margin: '4px 0', borderRadius: '12px', cursor: 'pointer',
      color: currentView === viewName ? '#fff' : '#94a3b8',
      backgroundColor: currentView === viewName ? 'rgba(255,255,255,0.1)' : 'transparent',
      fontWeight: currentView === viewName ? '600' : '400',
      display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
  });

  return (
    <div style={{ 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        boxSizing: 'border-box', 
        overflowY: 'auto',
        // FIX: Massive padding ensures buttons scroll ABOVE the player bar
        paddingBottom: '160px' 
    }}>
      
      <h2 className="desktop-only" style={{ marginBottom: '40px', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        DC Music.
      </h2>

      <div style={{ marginBottom: '30px' }}>
        <input placeholder="Search songs..." onChange={(e) => onSearch(e.target.value)} style={{ width: '100%', border: 'none' }} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={getStyle('home')} onClick={() => setView('home')}>
             <span>🏠</span> <span className="desktop-only">Home</span>
          </div>
          <div style={getStyle('liked')} onClick={() => setView('liked')}>
             <span>💜</span> <span className="desktop-only">Liked</span>
          </div>
      </div>
      
      <div className="desktop-only" style={{ marginTop: '40px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px', color: '#94a3b8', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
          YOUR LIBRARY
          <span onClick={createPlaylist} style={{ cursor: 'pointer', color: '#fff', fontSize: '16px' }}>+</span>
      </div>

      <div className="desktop-only" style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
          {playlists.map(pl => (
              <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} style={{ padding: '8px 0', fontSize: '14px', color: '#cbd5e1', cursor: 'pointer', opacity: 0.8, transition: '0.2s' }} onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0.8}>
                  {pl.name}
              </div>
          ))}
      </div>

      <div className="desktop-only" style={{ marginTop: '20px' }}>
          <button onClick={() => fileInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '10px', borderRadius: '10px', fontSize: '12px', width: '100%', cursor: 'pointer' }}>Edit Avatar</button>
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