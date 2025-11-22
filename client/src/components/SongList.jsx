import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

// Ensure this matches your Render URL exactly
const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const SongList = ({ onPlay, role, view, searchQuery, playlistId, onPlaylistClick }) => {
  const [songs, setSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  
  // Modal States
  const [showUpload, setShowUpload] = useState(false);
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
    } catch (err) { console.error(err); }
  };

  const fetchUserPlaylists = async () => {
      try {
        const res = await api.get('/playlists/user', { headers: { 'Authorization': localStorage.getItem('token') } });
        setUserPlaylists(res.data || []);
      } catch(e) {}
  };

  // --- ROBUST UPLOAD LOGIC ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    const toastId = toast.loading("Uploading & Analyzing...");

    try {
      await api.post('/upload', formData, { headers: { 'Authorization': localStorage.getItem('token') } });
      toast.success("Song Added!", { id: toastId });
      setShowUpload(false);
      setFile(null);
      fetchSongs();
    } catch (err) { 
        console.error(err);
        toast.error("Upload Failed. Check file size.", { id: toastId });
    } 
    finally { setUploading(false); } // Always reset button
  };

  // --- EDIT LOGIC ---
  const startEdit = (song) => {
      setEditMode(song._id);
      setEditData({ title: song.title, artist: song.artist });
  };

  const saveEdit = async (e) => {
      e.preventDefault();
      try {
          await api.put(`/songs/${editMode}`, editData, { headers: { 'Authorization': localStorage.getItem('token') } });
          toast.success("Updated");
          setEditMode(null);
          fetchSongs();
      } catch (err) { toast.error("Update Failed"); }
  };

  const deleteSong = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("Delete this song?")) return;
      try {
          await api.delete(`/songs/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } });
          toast.success("Deleted");
          fetchSongs();
      } catch(e) { toast.error("Failed"); }
  };

  const deletePlaylist = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("Delete playlist?")) return;
      try {
          await api.delete(`/playlists/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } });
          fetchPublicPlaylists(); 
      } catch (e) { toast.error("Failed"); }
  };

  const toggleLike = async (e, id) => {
    e.stopPropagation();
    setSongs(c => c.map(s => s._id === id ? { ...s, isLiked: !s.isLiked } : s));
    try { await api.post(`/songs/like/${id}`, {}, { headers: { 'Authorization': localStorage.getItem('token') } }); } catch(e) {}
  };

  const addToPlaylist = async (pid, sid) => {
      try {
          await api.post(`/playlists/${pid}/add`, { songId: sid }, { headers: { 'Authorization': localStorage.getItem('token') } });
          toast.success("Added");
          setShowAddToPlaylist(null);
      } catch(e) { toast.error("Failed"); }
  };

  const filteredSongs = songs.filter(s => 
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const PlaylistCover = ({ songs }) => {
      if (!songs || songs.length === 0) return <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💿</div>;
      return <img src={`${BACKEND_URL}/songs/${songs[0]._id}/cover`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  };

  return (
    <div style={{ padding: '30px', paddingBottom: '140px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="fade-in" style={{ fontSize: '32px', fontWeight: '800', margin: 0, textTransform: 'capitalize', letterSpacing: '-1px' }}>
            {view === 'playlist' ? playlistName || 'Playlist' : view === 'home' ? 'Home' : 'Liked Songs'}
        </h1>
        
        {role === 'admin' && (
          <button onClick={() => setShowUpload(true)} style={{ background: '#f8fafc', color: '#0f172a', border: 'none', padding: '10px 24px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
            + Upload Song
          </button>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Upload New Track</h3>
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="file" onChange={e => setFile(e.target.files[0])} accept="audio/*" style={{ color: '#fff' }} required />
                    <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#818cf8', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        {uploading ? 'Processing...' : 'Upload Track'}
                    </button>
                </form>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '15px' }}>Metadata will be auto-extracted.</p>
            </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editMode && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Edit Song Details</h3>
                  <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} placeholder="Title" />
                      <input value={editData.artist} onChange={e => setEditData({...editData, artist: e.target.value})} placeholder="Artist" />
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="button" onClick={() => setEditMode(null)} style={{ flex: 1, background: 'transparent', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ flex: 1, background: '#818cf8', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* FEATURED PLAYLISTS */}
      {view === 'home' && publicPlaylists.length > 0 && (
          <div className="fade-in" style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginBottom: '15px' }}>FEATURED PLAYLISTS</h3>
              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {publicPlaylists.map((pl) => (
                      <div key={pl._id} className="card-hover" style={{ minWidth: '160px', maxWidth: '160px', padding: '16px', cursor: 'pointer', position: 'relative' }}>
                          <div onClick={() => onPlaylistClick(pl._id)}>
                              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                  <PlaylistCover songs={pl.songs} />
                              </div>
                              <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>Curated</div>
                          </div>
                          {role === 'admin' && (
                              <button onClick={(e) => deletePlaylist(e, pl._id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ef4444', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* SONG GRID */}
      {filteredSongs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>No songs found.</div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {filteredSongs.map((song, i) => (
              <div key={song._id} className="card-hover fade-in" style={{ padding: '16px', cursor: 'pointer', position: 'relative', animationDelay: `${i * 0.05}s` }}>
                
                <div onClick={() => onPlay(song, filteredSongs)}>
                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '12px', position: 'relative', overflow: 'hidden', background: '#1e293b' }}>
                        <img 
                            src={`${BACKEND_URL}/songs/${song._id}/cover`} 
                            alt={song.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} 
                        />
                        <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                            <span style={{ fontSize: '30px' }}>🎵</span>
                        </div>
                        
                        {/* Centered Play Button */}
                        <div className="play-btn">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{song.title}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{song.artist}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                    <button onClick={(e) => toggleLike(e, song._id)} style={{ background: 'none', border: 'none', color: song.isLiked ? '#818cf8' : '#64748b', fontSize: '18px', cursor: 'pointer' }}>{song.isLiked ? '♥' : '♡'}</button>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowAddToPlaylist(song._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>+</button>
                        {role === 'admin' && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); startEdit(song); }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>✎</button>
                                <button onClick={(e) => deleteSong(e, song._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer' }}>🗑</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Add to Playlist Popup */}
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
      )}
    </div>
  );
};
export default SongList;