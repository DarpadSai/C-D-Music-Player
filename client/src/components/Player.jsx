import React, { useState, useRef, useEffect } from 'react';

// CONFIGURATION
const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const Player = ({ currentSong, onNext, onPrev }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(1); 
  
  const audioRef = useRef(null);

  useEffect(() => {
      if (currentSong && audioRef.current) {
          audioRef.current.play().catch(e => console.error("Auto-play blocked:", e));
      }
  }, [currentSong]);

  useEffect(() => {
      if(audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  if (!currentSong) return null;
  
  const songUrl = `${BACKEND_URL}/play/${encodeURIComponent(currentSong.filename)}`;
  const coverUrl = `${BACKEND_URL}/songs/${currentSong._id}/cover`;

  const togglePlay = (e) => {
      e.stopPropagation();
      if (audioRef.current.paused) {
          audioRef.current.play();
      } else {
          audioRef.current.pause();
      }
  };

  const handleTimeUpdate = () => {
      if (audioRef.current && !isDragging) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration);
      }
  };

  const handleSeekChange = (e) => {
      setIsDragging(true);
      setCurrentTime(e.target.value);
  };

  const handleSeekCommit = (e) => {
      const newTime = e.target.value;
      if (audioRef.current) audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setIsDragging(false);
  };

  const formatTime = (s) => {
      if (!s || isNaN(s)) return "0:00";
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- UI COMPONENTS ---

  const VolumeControl = () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100px' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>{volume === 0 ? '🔇' : '🔊'}</span>
          <input 
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ 
                width: '100%', height: '4px', cursor: 'pointer',
                accentColor: '#818cf8', // Indigo Accent
                background: 'rgba(255,255,255,0.1)', borderRadius: '2px'
            }}
          />
      </div>
  );

  const ProgressBar = () => (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '11px', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
          <span style={{ minWidth: '30px', textAlign: 'right' }}>{formatTime(currentTime)}</span>
          <input 
            type="range" 
            min="0" max={duration || 0} 
            value={currentTime} 
            onChange={handleSeekChange} 
            onMouseUp={handleSeekCommit} 
            onTouchEnd={handleSeekCommit} 
            style={{ 
                flex: 1, height: '4px', cursor: 'pointer',
                accentColor: '#818cf8', // Indigo Accent
                background: 'rgba(255,255,255,0.1)', borderRadius: '2px'
            }} 
          />
          <span style={{ minWidth: '30px' }}>{formatTime(duration)}</span>
      </div>
  );

  const Controls = ({ size = 'small' }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: size === 'big' ? '32px' : '20px' }}>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: size === 'big' ? '32px' : '20px', cursor: 'pointer', transition: '0.2s' }}>
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button onClick={togglePlay} style={{ 
              background: '#f8fafc', border: 'none', borderRadius: '50%', 
              width: size === 'big' ? '64px' : '40px', height: size === 'big' ? '64px' : '40px', 
              fontSize: size === 'big' ? '24px' : '18px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a',
              boxShadow: '0 4px 12px rgba(255,255,255,0.2)'
          }}>
              {isPlaying ? (
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
              )} 
          </button>

          <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: size === 'big' ? '32px' : '20px', cursor: 'pointer', transition: '0.2s' }}>
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
      </div>
  );

  return (
    <>
      <audio 
        ref={audioRef} 
        src={songUrl} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={onNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay
      />

      {/* MINI PLAYER */}
      <div className="glass-player" 
           onClick={() => setIsExpanded(true)}
           style={{ 
               display: isExpanded ? 'none' : 'flex', 
               position: 'fixed', bottom: 0, left: 0, right: 0, height: '90px', 
               alignItems: 'center', padding: '0 24px', color: 'white', zIndex: 200, cursor: 'pointer',
               background: 'rgba(30, 41, 59, 0.8)', // Minimalist Slate
               borderTop: '1px solid rgba(255,255,255,0.05)',
               backdropFilter: 'blur(12px)'
           }}>
        
        <div style={{ width: '30%', display: 'flex', alignItems: 'center' }}>
          <img src={coverUrl} alt="cover" style={{ width: '56px', height: '56px', borderRadius: '8px', marginRight: '16px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{currentSong.title}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{currentSong.artist}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
           <Controls />
           <div style={{ width: '80%', marginTop: '8px' }} onClick={e => e.stopPropagation()}>
               <ProgressBar />
           </div>
        </div>

        <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center' }}>
             <VolumeControl />
             <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
             </button>
        </div>
      </div>

      {/* MAXIMIZED PLAYER */}
      <div style={{ 
          display: isExpanded ? 'flex' : 'none', 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)', 
          zIndex: 300, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white'
      }}>
          <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', fontSize: '24px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </button>

          <div style={{ 
              width: '320px', height: '320px', borderRadius: '24px', marginBottom: '40px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)'
          }}>
              <img src={coverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h1 style={{ fontSize: '32px', marginBottom: '8px', fontWeight: '700', letterSpacing: '-0.5px' }}>{currentSong.title}</h1>
          <h3 style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', fontWeight: '400' }}>{currentSong.artist}</h3>

          <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px', padding: '0 20px' }}>
              <ProgressBar />
          </div>

          <Controls size="big" />
          
          <div style={{ marginTop: '50px' }}>
              <VolumeControl />
          </div>
      </div>
    </>
  );
};
export default Player;