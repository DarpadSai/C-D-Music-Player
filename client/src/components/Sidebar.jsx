import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Sidebar = ({ role, setView, currentView, onSearch, onPlaylistClick, onAvatarUpdate }) => {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false); // Controls the Custom Popup
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
          setPlaylists(res.data || []);
      } catch (err) {}
  };

  const handleCreatePlaylist = async (e) => {
      e.preventDefault();
      if (!newPlaylistName) return;
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/playlists', { name: newPlaylistName }, { headers: { 'Authorization': token } });
          toast.success("Playlist Created");
          setNewPlaylistName('');
          setShowCreateModal(false); // Close the custom modal
          fetchPlaylists(); 
      } catch (err) { toast.error("Failed"); }
  };

  const handleAvatarUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      const load = toast.loading("Uploading...");
      try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          await api.post('/users/avatar', formData, { headers: { 'Authorization': token } });
          toast.success("Avatar Updated");
          if (onAvatarUpdate) onAvatarUpdate();
      } catch (err) { toast.error("Upload Failed"); }
      finally { toast.dismiss(load); }
  };

  const getStyle = (viewName) => ({
      padding: '12px 16px', margin: '4px 0', borderRadius: '12px', cursor: 'pointer',
      color: currentView === viewName ? '#fff' : '#94a3b8',
      background: currentView === viewName ? 'rgba(255,255,255,0.1)' : 'transparent',
      fontWeight: currentView === viewName ? '600' : '400',
      display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
  });

  return (
    <div style={{ 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        boxSizing: 'border-box',
        // FIX 1: Massive padding to ensure User buttons are NEVER hidden
        paddingBottom: '200px',
        overflowY: 'auto'
    }}>
      
      <h2 className="desktop-only" style={{ marginBottom: '30px', fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
        <span style={{ color: '#818cf8' }}>DC</span> Music & Co.
      </h2>

      <div style={{ marginBottom: '25px' }}>
        <input 
            placeholder="Search..." 
            onChange={(e) => onSearch(e.target.value)} 
            style={{ 
                width: '100%', 
                background: 'rgba(255,255,255,0.08)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '12px 16px', 
                borderRadius: '20px', 
                color: 'white',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box'
            }} 
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={getStyle('home')} onClick={() => setView('home')}>🏠 <span className="desktop-only">Home</span></div>
          <div style={getStyle('liked')} onClick={() => setView('liked')}>💜 <span className="desktop-only">Liked</span></div>
      </div>
      
      <div className="desktop-only" style={{ marginTop: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px', color: '#64748b', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          LIBRARY
          {/* FIX 2: Opens Custom Modal, NOT prompt() */}
          <span onClick={() => setShowCreateModal(true)} style={{ cursor: 'pointer', fontSize: '16px', color: '#fff' }}>+</span>
      </div>

      <div className="desktop-only" style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
          {playlists.map(pl => (
              <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} style={{ padding: '8px 0', fontSize: '14px', color: '#cbd5e1', cursor: 'pointer', opacity: 0.8 }}>{pl.name}</div>
          ))}
      </div>

      {/* FIX 3: The Custom Modal JSX */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '320px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create Playlist</h3>
                <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        autoFocus 
                        placeholder="Playlist Name" 
                        value={newPlaylistName} 
                        onChange={e => setNewPlaylistName(e.target.value)} 
                        required 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            background: 'rgba(0,0,0,0.3)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'white', 
                            borderRadius: '8px' 
                        }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, background: '#818cf8', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* User Options (Now safe from overlap) */}
      <div className="desktop-only" style={{ marginTop: 'auto' }}>
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <button onClick={() => fileInputRef.current.click()} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px', borderRadius: '8px', fontSize: '11px', width: '100%', cursor: 'pointer' }}>Change Avatar</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
          </div>

          {role === 'admin' && (
            <div style={{ marginTop: '10px' }}>
                <div style={getStyle('users')} onClick={() => setView('users')}>👥 Users</div>
            </div>
          )}
      </div>
    </div>
  );
};
export default Sidebar;