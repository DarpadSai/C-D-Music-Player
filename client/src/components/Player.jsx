import React, { useState, useRef, useEffect } from 'react';

const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const Player = ({ currentSong, onNext, onPrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(1); 
  const audioRef = useRef(null);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
      const handleKeyDown = (e) => {
          // Ignore if typing in input
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

          switch(e.code) {
              case 'Space':
                  e.preventDefault();
                  togglePlay();
                  break;
              case 'ArrowRight':
                  if (audioRef.current) audioRef.current.currentTime += 5;
                  break;
              case 'ArrowLeft':
                  if (audioRef.current) audioRef.current.currentTime -= 5;
                  break;
              case 'KeyN':
                  onNext();
                  break;
              case 'KeyP':
                  onPrev();
                  break;
              default: break;
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSong]); // Re-bind when song changes

  useEffect(() => {
      if (currentSong && audioRef.current) audioRef.current.play().catch(e => console.error(e));
  }, [currentSong]);

  useEffect(() => { if(audioRef.current) audioRef.current.volume = volume; }, [volume]);

  if (!currentSong) return null;
  
  const songUrl = `${BACKEND_URL}/play/${encodeURIComponent(currentSong.filename)}`;
  const coverUrl = `${BACKEND_URL}/songs/${currentSong._id}/cover`;

  const togglePlay = (e) => {
      if(e) e.stopPropagation();
      audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause(); 
  };

  const handleTimeUpdate = () => { if (audioRef.current && !isDragging) { setCurrentTime(audioRef.current.currentTime); setDuration(audioRef.current.duration); } };
  const handleSeekChange = (e) => { setIsDragging(true); setCurrentTime(e.target.value); };
  const handleSeekCommit = (e) => { const newTime = e.target.value; audioRef.current.currentTime = newTime; setCurrentTime(newTime); setIsDragging(false); };
  const formatTime = (s) => { if (!s || isNaN(s)) return "0:00"; const mins = Math.floor(s / 60); const secs = Math.floor(s % 60); return `${mins}:${secs < 10 ? '0' : ''}${secs}`; };

  const VolumeControl = () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: '16px' }}>{volume === 0 ? '🔇' : '🔊'}</span>
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} style={{ width: '100%', height: '4px', accentColor: '#1DB954', cursor: 'pointer' }} />
      </div>
  );

  const ProgressBar = () => ( <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', color: '#b3b3b3', fontSize: '12px' }}> <span>{formatTime(currentTime)}</span> <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeekChange} onMouseUp={handleSeekCommit} onTouchEnd={handleSeekCommit} style={{ flex: 1, accentColor: '#1DB954', cursor: 'pointer', height: '4px', borderRadius: '2px' }} /> <span>{formatTime(duration)}</span> </div> );
  
  const Controls = ({ size = 'small' }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: size === 'big' ? '30px' : '15px' }}>
          {/* SHUFFLE BUTTON */}
          <button onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }} style={{ background: 'none', border: 'none', color: isShuffle ? '#1DB954' : '#b3b3b3', fontSize: '18px', cursor: 'pointer' }}>🔀</button>

          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: size === 'big' ? '40px' : '24px', cursor: 'pointer' }}>⏮</button>
          <button onClick={togglePlay} style={{ background: 'white', border: 'none', borderRadius: '50%', width: size === 'big' ? '60px' : '35px', height: size === 'big' ? '60px' : '35px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}> {isPlaying ? '⏸' : '▶'} </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: size === 'big' ? '40px' : '24px', cursor: 'pointer' }}>⏭</button>
          
          {/* REPEAT BUTTON (0=Grey, 1=Green, 2=Green with 1) */}
          <button onClick={(e) => { e.stopPropagation(); setRepeatMode((prev) => (prev + 1) % 3); }} style={{ background: 'none', border: 'none', color: repeatMode > 0 ? '#1DB954' : '#b3b3b3', fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
              🔁
              {repeatMode === 2 && <span style={{position:'absolute', fontSize:'10px', top:'2px', right:'-2px', fontWeight:'bold'}}>1</span>}
          </button>
      </div>
  );

  // Handle Auto-Next based on Repeat Logic
  const handleEnd = () => {
      if (repeatMode === 2) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
      } else {
          onNext();
      }
  };

  return (
    <>
      <audio ref={audioRef} src={songUrl} onTimeUpdate={handleTimeUpdate} onEnded={handleEnd} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} autoPlay />

      <div className="glass-player" onClick={() => setIsExpanded(true)} style={{ display: isExpanded ? 'none' : 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, height: '90px', alignItems: 'center', padding: '0 20px', color: 'white', zIndex: 200, cursor: 'pointer' }}>
        <div style={{ width: '30%', display: 'flex', alignItems: 'center' }}>
          <img src={coverUrl} alt="cover" style={{ width: '56px', height: '56px', borderRadius: '4px', marginRight: '14px', objectFit: 'cover' }} />
          <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentSong.title}</div><div style={{ fontSize: '11px', color: '#b3b3b3' }}>{currentSong.artist}</div></div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
           <Controls />
           <div style={{ width: '80%', marginTop: '5px' }} onClick={e => e.stopPropagation()}> <ProgressBar /> </div>
        </div>
        <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center' }}><VolumeControl /><div style={{ fontSize: '20px' }}>⤢</div></div>
      </div>

      <div style={{ display: isExpanded ? 'flex' : 'none', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(180deg, #444 0%, #000 100%)', zIndex: 300, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <button onClick={() => setIsExpanded(false)} style={{ position: 'absolute', top: '30px', left: '30px', background: 'none', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer' }}>⌄</button>
          <img src={coverUrl} alt="cover" style={{ width: '300px', height: '300px', borderRadius: '10px', marginBottom: '40px', boxShadow: '0 10px 50px rgba(0,0,0,0.5)', objectFit: 'cover' }} />
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{currentSong.title}</h1>
          <h3 style={{ fontSize: '18px', color: '#aaa', marginBottom: '40px' }}>{currentSong.artist}</h3>
          <div style={{ width: '80%', maxWidth: '600px', marginBottom: '30px' }}> <ProgressBar /> </div>
          <Controls size="big" />
          <div style={{ marginTop: '30px' }}> <VolumeControl /> </div>
      </div>
    </>
  );
};
export default Player;