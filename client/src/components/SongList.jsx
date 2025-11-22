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
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSongs(); fetchUserPlaylists(); }, [view, playlistId]);
  useEffect(() => { if (view === 'home') fetchPublicPlaylists(); }, [view]);

  // ... fetch functions (keep same logic as before, just copy them) ... 
  const fetchPublicPlaylists = async () => { try { const res = await api.get('/playlists/public', { headers: { 'Authorization': localStorage.getItem('token') } }); setPublicPlaylists(res.data); } catch (err) {} }
  const fetchSongs = async () => { /* ... keep same ... */ 
      const token = localStorage.getItem('token'); setPlaylistName(''); try { let res; if (view === 'liked') { res = await api.get('/songs', { headers: { 'Authorization': token } }); setSongs(res.data.filter(s => s.isLiked)); } else if (view === 'playlist' && playlistId) { res = await api.get(`/playlists/${playlistId}`, { headers: { 'Authorization': token } }); setSongs(res.data.songs); setPlaylistName(res.data.name); } else { res = await api.get('/songs', { headers: { 'Authorization': token } }); setSongs(res.data); } } catch (err) {} 
  };
  const fetchUserPlaylists = async () => { try { const res = await api.get('/playlists/user', { headers: { 'Authorization': localStorage.getItem('token') } }); setUserPlaylists(res.data); } catch(e) {} };
  const handleUpload = async (e) => { e.preventDefault(); if (!file) return; const formData = new FormData(); formData.append('file', file); setUploading(true); await toast.promise(api.post('/upload', formData, { headers: { 'Authorization': localStorage.getItem('token') } }), { loading: 'Analyzing...', success: 'Added', error: 'Failed' }); setUploading(false); setShowUpload(false); fetchSongs(); };
  const deleteSong = (e, id) => { e.stopPropagation(); toast(t => ( <span>Delete? <button onClick={async () => { toast.dismiss(t.id); await api.delete(`/songs/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } }); fetchSongs(); }}>Yes</button></span> )); };
  const toggleLike = async (e, id) => { e.stopPropagation(); setSongs(c => c.map(s => s._id === id ? { ...s, isLiked: !s.isLiked } : s)); try { await api.post(`/songs/like/${id}`, {}, { headers: { 'Authorization': localStorage.getItem('token') } }); } catch(e) {} };
  const addToPlaylist = async (pid, sid) => { try { await api.post(`/playlists/${pid}/add`, { songId: sid }, { headers: { 'Authorization': localStorage.getItem('token') } }); toast.success("Added"); setShowAddToPlaylist(null); } catch(e) {} };

  const PlaylistCover = ({ songs }) => {
      if (!songs || songs.length === 0) return <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>💿</div>;
      return <img src={`${BACKEND_URL}/songs/${songs[0]._id}/cover`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  };

  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: '40px', paddingBottom: '140px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="fade-in" style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1px', margin: 0, textTransform: 'capitalize' }}>
            {view === 'playlist' ? playlistName || 'Playlist' : view}
        </h1>
        {role === 'admin' && (
          <button onClick={() => setShowUpload(!showUpload)} style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,255,255,0.2)' }}>
            {showUpload ? 'Close' : 'Upload Track'}
          </button>
        )}
      </div>

      {/* FEATURED PLAYLISTS */}
      {view === 'home' && publicPlaylists.length > 0 && (
          <div className="fade-in" style={{ marginBottom: '50px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '20px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>FEATURED COLLECTIONS</h3>
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px' }}>
                  {publicPlaylists.map((pl) => (
                      <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} className="card-hover" style={{ minWidth: '200px', padding: '20px', cursor: 'pointer' }}>
                          <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                              <PlaylistCover songs={pl.songs} />
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{pl.name}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>Curated by Admin</div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showUpload && (
        <div className="fade-in" style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
            <h3 style={{ marginTop: 0 }}>Add New Music</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input type="file" onChange={e => setFile(e.target.files[0])} accept="audio/*" style={{ width: 'auto', flex: 1 }} required />
                <button type="submit" disabled={uploading} style={{ padding: '12px 30px', background: '#818cf8', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    {uploading ? 'Processing...' : 'Upload'}
                </button>
            </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
        {filteredSongs.map((song, i) => (
          <div key={song._id} className="card-hover fade-in" style={{ padding: '16px', cursor: 'pointer', position: 'relative', animationDelay: `${i * 0.05}s` }}>
            <div onClick={() => onPlay(song, filteredSongs)}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', marginBottom: '16px', position: 'relative', overflow: 'hidden', background: '#1e293b' }}>
                    <img src={`${BACKEND_URL}/songs/${song._id}/cover`} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; }} />
                    <div className="play-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{song.artist}</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <button onClick={(e) => toggleLike(e, song._id)} style={{ background: 'none', border: 'none', color: song.isLiked ? '#818cf8' : '#64748b', fontSize: '18px', cursor: 'pointer' }}>{song.isLiked ? '♥' : '♡'}</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddToPlaylist(song._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    {role === 'admin' && <button onClick={(e) => deleteSong(e, song._id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer' }}>🗑</button>}
                </div>
            </div>

            {showAddToPlaylist === song._id && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#1e293b', padding: '10px', borderRadius: '8px', zIndex: 10, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>ADD TO:</div>
                    {userPlaylists.map(pl => <div key={pl._id} onClick={() => addToPlaylist(pl._id, song._id)} style={{ padding: '6px', cursor: 'pointer', fontSize: '13px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{pl.name}</div>)}
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