import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const SongList = ({ onPlay, role, view, searchQuery, playlistId, onPlaylistClick }) => {
  const [songs, setSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  
  // Modal States
  const [showUpload, setShowUpload] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false); // New Admin Modal
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({ title: '', artist: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSongs(); fetchUserPlaylists(); }, [view, playlistId]);
  useEffect(() => { if (view === 'home') fetchPublicPlaylists(); }, [view]);

  const fetchPublicPlaylists = async () => {
      try {
          const res = await api.get('/playlists/public', { headers: { 'Authorization': localStorage.getItem('token') } });
          setPublicPlaylists(res.data || []);
      } catch (err) { console.error(err); }
  }

  const fetchSongs = async () => {
    const token = localStorage.getItem('token');
    setPlaylistName(''); 
    try {
        let res;
        if (view === 'liked') {
            res = await api.get('/songs', { headers: { 'Authorization': token } });
            setSongs(res.data.filter(s => s.isLiked));
        } else if (view === 'playlist' && playlistId) {
            res = await api.get(`/playlists/${playlistId}`, { headers: { 'Authorization': token } });
            setSongs(res.data.songs || []);
            setPlaylistName(res.data.name);
        } else {
            res = await api.get('/songs', { headers: { 'Authorization': token } });
            setSongs(res.data || []);
        }
    } catch (err) { toast.error("Failed to load songs"); }
  };

  const fetchUserPlaylists = async () => {
      try {
        const res = await api.get('/playlists/user', { headers: { 'Authorization': localStorage.getItem('token') } });
        setUserPlaylists(res.data || []);
      } catch(e) {}
  };

  const handleCreateAdminPlaylist = async (e) => {
      e.preventDefault();
      try {
          await api.post('/playlists', { name: newPlaylistName }, { headers: { 'Authorization': localStorage.getItem('token') } });
          toast.success("Featured Playlist Created");
          setNewPlaylistName('');
          setShowCreatePlaylist(false);
          fetchPublicPlaylists();
      } catch (e) { toast.error("Failed"); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    const toastId = toast.loading("Uploading...");
    try {
      await api.post('/upload', formData, { headers: { 'Authorization': localStorage.getItem('token') } });
      toast.success("Song Added!", { id: toastId });
      setShowUpload(false); setFile(null); fetchSongs();
    } catch (err) { toast.error("Upload Failed", { id: toastId }); } 
    finally { setUploading(false); }
  };

  // ... startEdit, saveEdit, deleteSong, deletePlaylist, toggleLike, addToPlaylist ...
  // (Copy existing functions here - NO CHANGES needed for them)
  const startEdit = (song) => { setEditMode(song._id); setEditData({ title: song.title, artist: song.artist }); };
  const saveEdit = async (e) => { e.preventDefault(); try { await api.put(`/songs/${editMode}`, editData, { headers: { 'Authorization': localStorage.getItem('token') } }); toast.success("Updated"); setEditMode(null); fetchSongs(); } catch (err) { toast.error("Update Failed"); } };
  const deleteSong = async (e, id) => { e.stopPropagation(); if(!window.confirm("Delete?")) return; try { await api.delete(`/songs/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } }); toast.success("Deleted"); fetchSongs(); } catch(e) { toast.error("Failed"); } };
  const deletePlaylist = async (e, id) => { e.stopPropagation(); if(!window.confirm("Delete playlist?")) return; try { await api.delete(`/playlists/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } }); fetchPublicPlaylists(); fetchUserPlaylists(); } catch (e) { toast.error("Failed"); } };
  const toggleLike = async (e, id) => { e.stopPropagation(); setSongs(c => c.map(s => s._id === id ? { ...s, isLiked: !s.isLiked } : s)); try { await api.post(`/songs/like/${id}`, {}, { headers: { 'Authorization': localStorage.getItem('token') } }); } catch(e) {} };
  const addToPlaylist = async (pid, sid) => { try { await api.post(`/playlists/${pid}/add`, { songId: sid }, { headers: { 'Authorization': localStorage.getItem('token') } }); toast.success("Added"); setShowAddToPlaylist(null); } catch(e) { toast.error("Failed"); } };

  const PlaylistCover = ({ songs }) => {
      if (!songs || songs.length === 0) return <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💿</div>;
      return <img src={`${BACKEND_URL}/songs/${songs[0]._id}/cover`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  };

  const filteredSongs = songs.filter(s => (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) || (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ padding: '30px', paddingBottom: '140px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="fade-in" style={{ fontSize: '32px', fontWeight: '800', margin: 0, textTransform: 'capitalize', letterSpacing: '-1px' }}>
            {view === 'playlist' ? playlistName || 'Playlist' : view === 'home' ? 'Home' : 'Liked Songs'}
        </h1>
        
        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '10px' }}>
              {/* NEW: ADMIN CREATE PLAYLIST BUTTON */}
              <button onClick={() => setShowCreatePlaylist(true)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                + New Playlist
              </button>
              <button onClick={() => setShowUpload(true)} style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '10px 24px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                + Upload Song
              </button>
          </div>
        )}
      </div>

      {/* FEATURED PLAYLISTS */}
      {view === 'home' && (
          <div className="fade-in" style={{ marginBottom: '40px' }}>
              {/* PUBLIC PLAYLISTS */}
              {publicPlaylists.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginBottom: '15px' }}>FEATURED COLLECTIONS</h3>
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {publicPlaylists.map((pl) => (
                            <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} className="card-hover" style={{ minWidth: '160px', padding: '16px', cursor: 'pointer', position: 'relative' }}>
                                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}><PlaylistCover songs={pl.songs} /></div>
                                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>Featured</div>
                                {role === 'admin' && <button onClick={(e) => deletePlaylist(e, pl._id)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ef4444', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>}
                            </div>
                        ))}
                    </div>
                  </>
              )}

              {/* NEW: USER PLAYLISTS ON HOME */}
              {userPlaylists.length > 0 && (
                  <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginBottom: '15px' }}>YOUR PLAYLISTS</h3>
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {userPlaylists.map((pl) => (
                            <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} className="card-hover" style={{ minWidth: '160px', padding: '16px', cursor: 'pointer', position: 'relative' }}>
                                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}><PlaylistCover songs={pl.songs} /></div>
                                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>By You</div>
                                <button onClick={(e) => deletePlaylist(e, pl._id)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ef4444', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>
                  </div>
              )}
          </div>
      )}

      {/* MODALS */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Upload Track</h3>
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <input type="file" onChange={e => setFile(e.target.files[0])} accept="audio/*" style={{ color: '#fff' }} required />
                    <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#818cf8', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>{uploading ? 'Processing...' : 'Upload'}</button>
                </form>
            </div>
        </div>
      )}

      {showCreatePlaylist && (
        <div className="modal-overlay" onClick={() => setShowCreatePlaylist(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Create Featured Playlist</h3>
                <form onSubmit={handleCreateAdminPlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <input placeholder="Playlist Name" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} required />
                    <button type="submit" style={{ padding: '12px', background: '#818cf8', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Create</button>
                </form>
            </div>
        </div>
      )}

      {/* SONG LIST GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
        {filteredSongs.map((song, i) => (
          <div key={song._id} className="card-hover fade-in" style={{ padding: '16px', cursor: 'pointer', position: 'relative', animationDelay: `${i * 0.05}s` }}>
            <div onClick={() => onPlay(song, filteredSongs)}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '12px', position: 'relative', overflow: 'hidden', background: '#1e293b' }}>
                    <img src={`${BACKEND_URL}/songs/${song._id}/cover`} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}><span style={{ fontSize: '30px' }}>🎵</span></div>
                    <div className="play-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg></div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{song.title}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{song.artist}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                <button onClick={(e) => toggleLike(e, song._id)} style={{ background: 'none', border: 'none', color: song.isLiked ? '#818cf8' : '#64748b', fontSize: '18px', cursor: 'pointer' }}>{song.isLiked ? '♥' : '♡'}</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowAddToPlaylist(song._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    {role === 'admin' && <button onClick={(e) => deleteSong(e, song._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer' }}>🗑</button>}
                </div>
            </div>
            {showAddToPlaylist === song._id && (
                <div style={{ position: 'absolute', top: '80%', left: 0, background: '#1e293b', padding: '10px', borderRadius: '8px', zIndex: 20, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>ADD TO:</div>
                    {userPlaylists.length === 0 ? <div style={{fontSize:'12px', color:'#64748b'}}>No Playlists</div> : userPlaylists.map(pl => (
                        <div key={pl._id} onClick={() => addToPlaylist(pl._id, song._id)} style={{ padding: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pl.name}</div>
                    ))}
                    <div onClick={() => setShowAddToPlaylist(null)} style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px', cursor: 'pointer', textAlign: 'center' }}>Close</div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default SongList;