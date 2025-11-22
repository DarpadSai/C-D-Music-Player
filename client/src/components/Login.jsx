import React, { useState } from 'react';
import api from '../api';

const Login = ({ onLogin }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [formData, setFormData] = useState({ username: '', password: '', adminKey: '', otp: '', newPassword: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (view === 'login') {
        const res = await api.post('/login', formData);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('username', formData.username); // Save name
        onLogin(res.data.role, formData.username);
      } 
      else if (view === 'register') {
        await api.post('/register', formData);
        alert('Account Created! Please Login.');
        setView('login');
      }
      else if (view === 'forgot') {
        await api.post('/forgot-password', { username: formData.username });
        alert('OTP generated! Check Server Console logs.');
        setView('reset');
      }
      else if (view === 'reset') {
        await api.post('/reset-password', { username: formData.username, otp: formData.otp, newPassword: formData.newPassword });
        alert('Password Reset! Please Login.');
        setView('login');
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.err || 'Request Failed'));
    }
  };

  return (
    <div className="login-container" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="fade-in" style={{ background: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '16px', width: '350px', backdropFilter: 'blur(10px)', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', color: 'white' }}>
        
        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '10px' }}>
          {view === 'login' && 'Welcome Back'}
          {view === 'register' && 'Join CloudMix'}
          {view === 'forgot' && 'Recovery'}
          {view === 'reset' && 'Set Password'}
        </h2>
        
        <p style={{ textAlign: 'center', color: '#bbb', marginBottom: '30px' }}>
          {view === 'forgot' ? 'Enter username to receive OTP' : 'Stream your favorite tracks'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Username Field (Always visible except maybe implicit in flows, but simplest to keep) */}
          <input name="username" placeholder="Username" onChange={handleChange} style={inputStyle} required />

          {/* Password Field (Login/Register) */}
          {(view === 'login' || view === 'register') && (
            <input type="password" name="password" placeholder="Password" onChange={handleChange} style={inputStyle} required />
          )}

          {/* Admin Key (Register Only) */}
          {view === 'register' && (
            <input name="adminKey" placeholder="Admin Key (Optional)" onChange={handleChange} style={inputStyle} />
          )}

          {/* OTP Flow */}
          {view === 'reset' && (
            <>
              <input name="otp" placeholder="Enter 4-digit OTP" onChange={handleChange} style={inputStyle} required />
              <input type="password" name="newPassword" placeholder="New Password" onChange={handleChange} style={inputStyle} required />
            </>
          )}

          <button type="submit" style={btnStyle}>
            {view === 'login' ? 'Log In' : view === 'register' ? 'Sign Up' : view === 'forgot' ? 'Send OTP' : 'Reset Password'}
          </button>
        </form>

        {/* Navigation Links */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#bbb' }}>
          {view === 'login' && (
            <>
              <span onClick={() => setView('register')} style={linkStyle}>Create Account</span>
              <span style={{ margin: '0 10px' }}>|</span>
              <span onClick={() => setView('forgot')} style={linkStyle}>Forgot Password?</span>
            </>
          )}
          {view !== 'login' && (
            <span onClick={() => setView('login')} style={linkStyle}>Back to Login</span>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = { padding: '14px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', outline: 'none', fontSize: '14px' };
const btnStyle = { padding: '14px', borderRadius: '30px', border: 'none', background: '#1DB954', color: 'black', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '16px', transition: '0.2s' };
const linkStyle = { cursor: 'pointer', color: 'white', textDecoration: 'underline' };

export default Login;