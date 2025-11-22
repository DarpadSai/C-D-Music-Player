import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const UserProfile = () => {
    const [data, setData] = useState({ username: '', password: '' });

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = getToken();
        try {
            const res = await axios.put(`${BACKEND_URL}/users/profile`, data, { headers: { 'Authorization': token } });
            toast.success("Credentials Updated");
            if(res.data.username) {
                if(localStorage.getItem('username')) localStorage.setItem('username', res.data.username);
                if(sessionStorage.getItem('username')) sessionStorage.setItem('username', res.data.username);
            }
        } catch(err) { toast.error("Update Failed"); }
    };

    return (
        <div className="fade-in" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px', fontWeight: '800', fontSize: '32px' }}>User Settings</h1>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px' }}>
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: '600' }}>NEW USERNAME</label>
                        <input placeholder="Leave blank to keep current" onChange={e => setData({...data, username: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: '600' }}>NEW PASSWORD</label>
                        <input type="password" placeholder="Leave blank to keep current" onChange={e => setData({...data, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <button type="submit" style={{ padding: '12px', marginTop: '10px', background: '#818cf8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Update Profile</button>
                </form>
            </div>
        </div>
    );
};
export default UserProfile;