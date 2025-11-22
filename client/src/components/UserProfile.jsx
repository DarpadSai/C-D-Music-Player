import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const UserProfile = () => {
    const [data, setData] = useState({ username: '', password: '' });

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await api.put('/users/profile', data, { headers: { 'Authorization': token } });
            toast.success("Credentials Updated");
            if(res.data.username) localStorage.setItem('username', res.data.username);
        } catch(err) { toast.error("Update Failed"); }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
            <h1 style={{ color: '#00f3ff', fontFamily: 'Orbitron', marginBottom: '30px' }}>USER SETTINGS</h1>
            <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #333', padding: '30px' }}>
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ color: '#bc13fe', fontSize: '12px', display: 'block', marginBottom: '5px' }}>NEW USERNAME</label>
                        <input placeholder="Leave blank to keep current" onChange={e => setData({...data, username: e.target.value})} style={{ width: '100%', padding: '10px' }} />
                    </div>
                    <div>
                        <label style={{ color: '#bc13fe', fontSize: '12px', display: 'block', marginBottom: '5px' }}>NEW PASSWORD</label>
                        <input type="password" placeholder="Leave blank to keep current" onChange={e => setData({...data, password: e.target.value})} style={{ width: '100%', padding: '10px' }} />
                    </div>
                    <button type="submit" className="cyber-btn" style={{ padding: '12px', marginTop: '10px' }}>UPDATE PROFILE</button>
                </form>
            </div>
        </div>
    );
};
export default UserProfile;