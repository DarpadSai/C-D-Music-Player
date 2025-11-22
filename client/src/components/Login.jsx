import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const Login = ({ onLogin }) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '', adminKey: '' });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Authenticating...');

    try {
      if (view === 'login') {
        const res = await api.post('/login', formData);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', res.data.token);
        storage.setItem('role', res.data.role);
        storage.setItem('username', res.data.username);
        
        toast.success(`Welcome, ${res.data.username}!`, { id: loadingToast });
        onLogin(res.data.role, res.data.username); 
      } 
      else if (view === 'register') {
        await api.post('/register', formData);
        toast.success('Account Created! Please Login.', { id: loadingToast });
        setFormData({ username: '', password: '', adminKey: '' });
        setView('login');
      }
    } catch (err) {
      toast.error(err.response?.data?.err || 'Access Denied', { id: loadingToast });
    }
  };

  return (
    <div className="login-bg" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
      <div className="fade-in" style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '40px', borderRadius: '24px', width: '360px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: 'white' }}>
          DC Music & Co.
        </h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px', fontSize: '14px' }}>Premium Audio Experience</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} style={inputStyle} required autoComplete="off" />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} style={inputStyle} required />

          {view === 'register' && (
            <input type="password" name="adminKey" placeholder="Admin Key (Optional)" value={formData.adminKey} onChange={handleChange} style={inputStyle} />
          )}

          {view === 'login' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#818cf8' }} />
                  Remember me
              </label>
          )}

          <button type="submit" style={btnStyle}>
            {view === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          {view === 'login' ? (
            <>Don't have an account? <span onClick={() => setView('register')} style={linkStyle}>Sign up</span></>
          ) : (
            <>Already have an account? <span onClick={() => setView('login')} style={linkStyle}>Log in</span></>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', fontSize: '14px', transition: '0.2s' };
const btnStyle = { padding: '14px', borderRadius: '12px', border: 'none', background: '#818cf8', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '15px', transition: 'transform 0.1s' };
const linkStyle = { cursor: 'pointer', color: '#818cf8', fontWeight: '600', marginLeft: '5px' };

export default Login;