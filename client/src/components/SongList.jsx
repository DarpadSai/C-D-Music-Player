import React, { useState, useEffect } from 'react';
import api from '../api';

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
    try {
      const token = localStorage.getItem('token');
      await api.post('/upload', formData, { headers: { 'Authorization': token } });
      alert('Uploaded!');
      setShowUpload(false);
      fetchSongs();
    } catch (err) { alert('Upload Failed'); } 
    finally { setUploading(false); }
  };

  const deleteSong = async (e, songId) => {
      e.stopPropagation();
      if(!window.confirm("Delete song?")) return;
      try {
          const token = localStorage.getItem('token');
          await api.delete(`/songs/${songId}`, { headers: { 'Authorization': token } });
          fetchSongs();
      } catch(err) { alert("Failed"); }
  };

  const deletePlaylist = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("Delete playlist?")) return;
      try {
          const token = localStorage.getItem('token');
          await api.delete(`/playlists/${id}`, { headers: { 'Authorization': token } });
          fetchPublicPlaylists(); 
      } catch (err) { alert("Failed"); }
  }

  const addToPlaylist = async (playlistId, songId) => {
      const token = localStorage.getItem('token');
      try {
          await api.post(`/playlists/${playlistId}/add`, { songId }, { headers: { 'Authorization': token } });
          alert("Added");
          setShowAddToPlaylist(null);
      } catch (e) { alert("Failed"); }
  };

  const toggleLike = async (e, songId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    await api.post(`/songs/like/${songId}`, {}, { headers: { 'Authorization': token } });
    fetchSongs(); 
  };

  const PlaylistCover = ({ songs }) => {
      if (!songs || songs.length === 0) {
          return <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📜</div>;
      }
      if (songs.length >= 4) {
          return (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap' }}>
                  {songs.slice(0, 4).map(song => (
                      <img key={song._id} src={`/api/songs/${song._id}/cover`} alt="" style={{ width: '50%', height: '50%', objectFit: 'cover' }} />
                  ))}
              </div>
          );
      }
      return <img src={`/api/songs/${songs[0]._id}/cover`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  };

  const filteredSongs = songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '30px', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', textTransform: 'capitalize' }}>
            {view === 'playlist' ? playlistName || 'Playlist' : view}
        </h1>
        
        {role === 'admin' && (
          <button onClick={() => setShowUpload(!showUpload)} style={{ background: '#1DB954', border: 'none', padding: '12px 24px', borderRadius: '30px', color: 'black', fontWeight: 'bold', cursor: 'pointer' }}>
            {showUpload ? 'Close Upload' : 'Upload Song'}
          </button>
        )}
      </div>

      {/* FEATURED PLAYLISTS (Resized to match Song Cards) */}
      {view === 'home' && publicPlaylists.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'white' }}>Featured Playlists</h3>
              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {publicPlaylists.map((pl) => (
                      <div 
                        key={pl._id} 
                        onClick={() => onPlaylistClick(pl._id)}
                        className="card-hover" 
                        // FIXED: Width set to 200px max to match song tiles
                        style={{ 
                            minWidth: '180px', 
                            maxWidth: '200px', 
                            background: '#181818', 
                            padding: '16px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            position: 'relative' 
                        }}
                      >
                          <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                              <PlaylistCover songs={pl.songs} />
                          </div>
                          <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>By Admin</div>

                          {role === 'admin' && (
                              <button 
                                onClick={(e) => deletePlaylist(e, pl._id)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#ff5555', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                  🗑
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showUpload && (
        <div className="fade-in" style={{ background: '#282828', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <h3>Upload New Track</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="file" onChange={e => setFile(e.target.files[0])} accept="audio/*" style={{ color: 'white' }} required />
                <button type="submit" disabled={uploading} style={{ padding: '10px 20px', background: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>{uploading ? 'Processing...' : 'Upload'}</button>
            </form>
        </div>
      )}

      {/* SONG LIST GRID (Standardized) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        {filteredSongs.map((song, i) => (
          <div key={song._id} className="card-hover fade-in" style={{ background: '#181818', padding: '16px', borderRadius: '8px', position: 'relative' }}>
            <div onClick={() => onPlay(song, filteredSongs)} style={{ cursor: 'pointer' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '6px', marginBottom: '16px', position: 'relative', overflow: 'hidden', background: '#333' }}>
                    <img 
                        src={`/api/songs/${song._id}/cover`} 
                        alt={song.title}
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'none', width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${i * 50}, 60%, 50%), hsl(${i * 50 + 40}, 60%, 30%))`, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0 }}>
                        <span style={{ fontSize: '40px' }}>🎵</span>
                    </div>
                    <div className="play-btn">▶</div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                <div style={{ fontSize: '14px', color: '#b3b3b3' }}>{song.artist}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={(e) => toggleLike(e, song._id)} style={{ background: 'none', border: 'none', color: song.isLiked ? '#1DB954' : '#b3b3b3', fontSize: '20px', cursor: 'pointer' }}>{song.isLiked ? '♥' : '♡'}</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowAddToPlaylist(song._id)} style={{ background: 'none', border: 'none', color: '#b3b3b3', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    {role === 'admin' && (
                        <button onClick={(e) => deleteSong(e, song._id)} style={{ background: 'none', border: 'none', color: '#ff5555', fontSize: '20px', cursor: 'pointer' }}>🗑</button>
                    )}
                </div>
            </div>
            {showAddToPlaylist === song._id && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#282828', padding: '10px', borderRadius: '4px', zIndex: 10, width: '100%', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Add to:</div>
                    {userPlaylists.length === 0 ? <div style={{fontSize: '12px', color: '#777'}}>No playlists</div> : userPlaylists.map(pl => (
                        <div key={pl._id} onClick={() => addToPlaylist(pl._id, song._id)} style={{ padding: '5px', cursor: 'pointer', fontSize: '13px', color: 'white', borderBottom: '1px solid #333' }}>{pl.name}</div>
                    ))}
                    <div onClick={() => setShowAddToPlaylist(null)} style={{ color: 'red', fontSize: '12px', marginTop: '5px', cursor: 'pointer', textAlign: 'center' }}>Cancel</div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default SongList;