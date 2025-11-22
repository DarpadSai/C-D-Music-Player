import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Login = ({ onLogin }) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '', adminKey: '' });
  const [rememberMe, setRememberMe] = useState(false); // State for Checkbox

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Accessing Mainframe...');

    try {
      if (view === 'login') {
        const res = await api.post('/login', formData);
        
        // REMEMBER ME LOGIC
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', res.data.token);
        storage.setItem('role', res.data.role);
        storage.setItem('username', res.data.username);
        
        toast.dismiss(loadingToast);
        toast.success(`ACCESS GRANTED: ${res.data.username}`);
        setFormData({ username: '', password: '', adminKey: '' });
        onLogin(res.data.role, res.data.username); 
      } 
      else if (view === 'register') {
        await api.post('/register', formData);
        toast.dismiss(loadingToast);
        toast.success('Identity Created. Login Required.');
        setFormData({ username: '', password: '', adminKey: '' });
        setView('login');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('ACCESS DENIED');
    }
  };

  return (
    <div className="login-bg" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
      <div className="fade-in" style={{ background: 'rgba(0,0,0,0.8)', padding: '40px', border: '1px solid #00f3ff', width: '350px', boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)' }}>
        
        <h1 style={{ textAlign: 'center', fontFamily: 'Orbitron', color: '#00f3ff', textShadow: '0 0 10px #00f3ff', marginBottom: '5px', fontSize: '26px' }}>
          CYBER<span style={{color: '#bc13fe'}}>MIX</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#bc13fe', marginBottom: '30px', fontSize: '12px', letterSpacing: '2px' }}>SYSTEM V.2.0</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <input name="username" placeholder="IDENTIFIER" value={formData.username} onChange={handleChange} style={inputStyle} required autoComplete="off" />
          <input type="password" name="password" placeholder="PASSCODE" value={formData.password} onChange={handleChange} style={inputStyle} required />

          {view === 'register' && (
            <input type="password" name="adminKey" placeholder="ROOT KEY (OPTIONAL)" value={formData.adminKey} onChange={handleChange} style={inputStyle} autoComplete="off" />
          )}

          {/* REMEMBER ME CHECKBOX */}
          {view === 'login' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    style={{ width: '15px', height: '15px', margin: 0, border: '1px solid #00f3ff' }} 
                  />
                  Remember Session
              </label>
          )}

          <button type="submit" className="cyber-btn" style={{ padding: '15px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {view === 'login' ? 'INITIALIZE' : 'REGISTER'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '12px', color: '#555', fontFamily: 'Orbitron' }}>
          {view === 'login' ? (
            <span onClick={() => setView('register')} style={linkStyle}>[ CREATE NEW ID ]</span>
          ) : (
            <span onClick={() => setView('login')} style={linkStyle}>[ RETURN TO LOGIN ]</span>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = { padding: '15px', background: 'black', color: '#00f3ff', border: '1px solid #333', outline: 'none', fontSize: '14px' };
const linkStyle = { cursor: 'pointer', color: '#00f3ff', letterSpacing: '1px' };

export default Login;