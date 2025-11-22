import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

// CONFIGURATION
const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const SongList = ({ onPlay, role, view, searchQuery, playlistId, onPlaylistClick }) => {
  const [songs, setSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  
  // Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSongs(); fetchUserPlaylists(); }, [view, playlistId]);

  useEffect(() => {
      if (view === 'home') fetchPublicPlaylists();
  }, [view]);

  const fetchPublicPlaylists = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await api.get('/playlists/public', { headers: { 'Authorization': token } });
          setPublicPlaylists(res.data);
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
            setSongs(res.data.songs);
            setPlaylistName(res.data.name);
        } else {
            res = await api.get('/songs', { headers: { 'Authorization': token } });
            setSongs(res.data);
        }
    } catch (err) { console.error(err); }
  };

  const fetchUserPlaylists = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await api.get('/playlists/user', { headers: { 'Authorization': token } });
        setUserPlaylists(res.data);
      } catch(e) { console.error("Playlist fetch error", e); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    await toast.promise(
        api.post('/upload', formData, { headers: { 'Authorization': localStorage.getItem('token') } }),
        {
            loading: 'Uploading & Extracting Metadata...',
            success: 'Song Added Successfully!',
            error: 'Upload Failed. Check file size.',
        }
    );

    setUploading(false);
    setShowUpload(false);
    fetchSongs();
  };

  const deleteSong = (e, songId) => {
      e.stopPropagation();
      toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Delete this song?</span>
              <button onClick={async () => {
                    toast.dismiss(t.id);
                    await api.delete(`/songs/${songId}`, { headers: { 'Authorization': localStorage.getItem('token') } });
                    toast.success("Deleted");
                    fetchSongs();
                }} style={{ background: '#ff5555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Yes</button>
              <button onClick={() => toast.dismiss(t.id)} style={{ background: '#444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>No</button>
          </div>
      ), { duration: 5000, icon: '🗑️' });
  };

  const deletePlaylist = (e, id) => {
      e.stopPropagation();
      toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Delete Playlist?</span>
              <button onClick={async () => {
                    toast.dismiss(t.id);
                    await api.delete(`/playlists/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } });
                    toast.success("Playlist Removed");
                    fetchPublicPlaylists(); 
                }} style={{ background: '#ff5555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Yes</button>
              <button onClick={() => toast.dismiss(t.id)} style={{ background: '#444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>No</button>
          </div>
      ));
  }

  const addToPlaylist = async (playlistId, songId) => {
      const token = localStorage.getItem('token');
      try {
          await api.post(`/playlists/${playlistId}/add`, { songId }, { headers: { 'Authorization': token } });
          toast.success("Added to Playlist", { icon: '🎵' });
          setShowAddToPlaylist(null);
      } catch (e) { toast.error("Failed to add"); }
  };

  const toggleLike = async (e, songId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    setSongs(current => current.map(s => s._id === songId ? { ...s, isLiked: !s.isLiked } : s));
    try { await api.post(`/songs/like/${songId}`, {}, { headers: { 'Authorization': token } }); } catch(err) { toast.error("Connection Error"); }
  };

  const PlaylistCover = ({ songs }) => {
      if (!songs || songs.length === 0) {
          return <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📜</div>;
      }
      if (songs.length >= 4) {
          return (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap' }}>
                  {songs.slice(0, 4).map(song => (
                      <img key={song._id} src={`${BACKEND_URL}/songs/${song._id}/cover`} alt="" style={{ width: '50%', height: '50%', objectFit: 'cover' }} />
                  ))}
              </div>
          );
      }
      return <img src={`${BACKEND_URL}/songs/${songs[0]._id}/cover`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  };

  const filteredSongs = songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '30px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', textTransform: 'capitalize', color: '#00f3ff', textShadow: '0 0 10px rgba(0, 243, 255, 0.5)' }}>
            {view === 'playlist' ? playlistName || 'Playlist' : view}
        </h1>
        
        {role === 'admin' && (
          <button onClick={() => setShowUpload(!showUpload)} className="cyber-btn" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 'bold' }}>
            {showUpload ? 'CANCEL UPLOAD' : 'UPLOAD TRACK'}
          </button>
        )}
      </div>

      {/* FEATURED PLAYLISTS */}
      {view === 'home' && publicPlaylists.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#bc13fe', fontFamily: 'Orbitron', letterSpacing: '1px' }}>FEATURED PLAYLISTS</h3>
              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {publicPlaylists.map((pl) => (
                      <div key={pl._id} onClick={() => onPlaylistClick(pl._id)} className="card-hover" style={{ minWidth: '180px', maxWidth: '200px', padding: '16px', borderRadius: '4px', cursor: 'pointer', position: 'relative' }}>
                          <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '4px', marginBottom: '10px', overflow: 'hidden', border: '1px solid #333' }}>
                              <PlaylistCover songs={pl.songs} />
                          </div>
                          <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{pl.name}</div>
                          <div style={{ fontSize: '12px', color: '#00f3ff' }}>[ SYSTEM ]</div>

                          {role === 'admin' && (
                              <button onClick={(e) => deletePlaylist(e, pl._id)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.8)', border: '1px solid #ff0055', color: '#ff0055', borderRadius: '0', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* UPLOAD FORM (FIXED STYLE) */}
      {showUpload && (
        <div className="fade-in" style={{ background: 'rgba(10, 10, 10, 0.95)', padding: '25px', border: '1px solid #00f3ff', marginBottom: '30px', boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)' }}>
            <h3 style={{color: '#00f3ff', fontFamily: 'Orbitron', marginTop: 0}}>INITIALIZE UPLOAD PROTOCOL</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                {/* Fix input visibility for Cyberpunk Theme */}
                <input 
                    type="file" 
                    onChange={e => setFile(e.target.files[0])} 
                    accept="audio/*" 
                    style={{ padding: '10px', background: '#000', border: '1px solid #333', color: '#fff', flex: 1, minWidth: '200px' }} 
                    required 
                />
                <button type="submit" disabled={uploading} className="cyber-btn" style={{ padding: '10px 30px' }}>
                    {uploading ? 'PROCESSING...' : 'EXECUTE'}
                </button>
            </form>
            <p style={{ color: '#bc13fe', fontSize: '12px', marginTop: '15px', fontFamily: 'Orbitron' }}>
                >> SYSTEM WILL AUTO-EXTRACT METADATA (ID3 TAGS)
            </p>
        </div>
      )}

      {/* SONG LIST GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        {filteredSongs.map((song, i) => (
          <div key={song._id} className="card-hover fade-in" style={{ padding: '16px', borderRadius: '4px', position: 'relative' }}>
            
            <div onClick={() => onPlay(song, filteredSongs)} style={{ cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '4px', marginBottom: '16px', position: 'relative', overflow: 'hidden', background: '#000', border: '1px solid #333' }}>
                    <img 
                        src={`${BACKEND_URL}/songs/${song._id}/cover`} 
                        alt={song.title}
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'none', width: '100%', height: '100%', background: `linear-gradient(135deg, #000, #111)`, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0 }}>
                        <span style={{ fontSize: '40px', color: '#00f3ff' }}>❖</span>
                    </div>
                    <div className="play-btn">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="black" style={{ marginLeft: '4px' }}><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', fontFamily: 'Rajdhani' }}>{song.title}</div>
                <div style={{ fontSize: '14px', color: '#00f3ff' }}>{song.artist}</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={(e) => toggleLike(e, song._id)} style={{ background: 'none', border: 'none', color: song.isLiked ? '#bc13fe' : '#555', fontSize: '20px', cursor: 'pointer', transition: '0.2s' }}>{song.isLiked ? '♥' : '♡'}</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddToPlaylist(song._id)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    {role === 'admin' && (
                        <button onClick={(e) => deleteSong(e, song._id)} style={{ background: 'none', border: 'none', color: '#ff0055', fontSize: '18px', cursor: 'pointer' }}>X</button>
                    )}
                </div>
            </div>

            {showAddToPlaylist === song._id && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#000', border: '1px solid #00f3ff', padding: '10px', zIndex: 10, width: '100%', boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)' }}>
                    <div style={{ fontSize: '12px', color: '#00f3ff', marginBottom: '5px', fontFamily: 'Orbitron' }}>ADD TO MATRIX:</div>
                    {userPlaylists.length === 0 ? <div style={{fontSize: '12px', color: '#555'}}>NO DESTINATIONS</div> : userPlaylists.map(pl => (
                        <div key={pl._id} onClick={() => addToPlaylist(pl._id, song._id)} style={{ padding: '5px', cursor: 'pointer', fontSize: '13px', color: 'white', borderBottom: '1px solid #333' }}>{pl.name}</div>
                    ))}
                    <div onClick={() => setShowAddToPlaylist(null)} style={{ color: '#ff0055', fontSize: '12px', marginTop: '10px', cursor: 'pointer', textAlign: 'center' }}>[ ABORT ]</div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default SongList;