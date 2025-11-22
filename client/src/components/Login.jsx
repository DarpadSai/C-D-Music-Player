import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast'; // New Notification Library

const Login = ({ onLogin }) => {
  const [view, setView] = useState('login'); 
  // Initialize state
  const [formData, setFormData] = useState({ username: '', password: '', adminKey: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Processing...'); // Show loading spinner

    try {
      if (view === 'login') {
        const res = await api.post('/login', formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('username', res.data.username);
        
        toast.dismiss(loadingToast);
        toast.success(`Welcome back, ${res.data.username}!`);
        
        // Clear fields
        setFormData({ username: '', password: '', adminKey: '' });
        
        // Force Home View
        onLogin(res.data.role, res.data.username); 
      } 
      else if (view === 'register') {
        await api.post('/register', formData);
        toast.dismiss(loadingToast);
        toast.success('Account Created! Please Login.');
        
        // Clear fields & Switch view
        setFormData({ username: '', password: '', adminKey: '' });
        setView('login');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.err || 'Request Failed');
    }
  };

  return (
    <div className="login-bg" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
      <div className="animate-enter" style={{ background: 'rgba(0,0,0,0.85)', padding: '40px', borderRadius: '16px', width: '350px', backdropFilter: 'blur(15px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: 'white' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', marginBottom: '5px', background: 'linear-gradient(to right, #1DB954, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DC Music & Co.
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px', fontSize: '14px' }}>Premium Sound Experience</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* AutoComplete OFF prevents dropdowns history */}
          <input 
            name="username" 
            placeholder="Username" 
            value={formData.username}
            onChange={handleChange} 
            style={inputStyle} 
            required 
            autoComplete="off" 
          />

          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange} 
            style={inputStyle} 
            required 
            autoComplete="new-password" 
          />

          {view === 'register' && (
            <input 
                type="password" /* Hides Admin Key */
                name="adminKey" 
                placeholder="Admin Key (Confidential)" 
                value={formData.adminKey}
                onChange={handleChange} 
                style={inputStyle} 
                autoComplete="off"
            />
          )}

          <button type="submit" style={btnStyle}>
            {view === 'login' ? 'Enter Studio' : 'Join the Club'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#bbb' }}>
          {view === 'login' ? (
            <span onClick={() => setView('register')} style={linkStyle}>Create an Account</span>
          ) : (
            <span onClick={() => setView('login')} style={linkStyle}>Back to Login</span>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', outline: 'none', fontSize: '14px', transition: '0.2s' };
const btnStyle = { padding: '14px', borderRadius: '30px', border: 'none', background: '#1DB954', color: 'black', fontWeight: '800', cursor: 'pointer', marginTop: '10px', fontSize: '15px', letterSpacing: '0.5px', transition: 'transform 0.2s' };
const linkStyle = { cursor: 'pointer', color: '#1DB954', fontWeight: 'bold' };

export default Login;