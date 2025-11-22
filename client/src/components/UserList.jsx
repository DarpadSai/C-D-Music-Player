import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Use axios directly to bypass api.js issues
import toast from 'react-hot-toast';

// CONFIGURATION
const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => { fetchUsers(); }, []);

    // Helper to find token
    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const fetchUsers = async () => {
        try {
            const token = getToken();
            // FIX: Use Direct URL
            const res = await axios.get(`${BACKEND_URL}/users`, { headers: { 'Authorization': token } });
            setUsers(res.data);
        } catch (err) { 
            console.error(err);
            toast.error("Failed to load users"); 
        }
    };

    const deleteUser = async (id) => {
        if(!window.confirm("Permanently delete this user?")) return;
        try {
            const token = getToken();
            await axios.delete(`${BACKEND_URL}/users/${id}`, { headers: { 'Authorization': token } });
            toast.success("User deleted");
            fetchUsers();
        } catch (err) { toast.error("Failed to delete"); }
    };

    return (
        <div className="fade-in" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>User Management</h1>
            <div style={{ display: 'grid', gap: '10px' }}>
                {users.map(user => (
                    <div key={user._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* Avatar Preview */}
                            <img 
                                src={`${BACKEND_URL}/users/${user.username}/avatar`} 
                                alt={user.username}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=1e293b&color=fff`}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{user.username}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{user.role}</div>
                            </div>
                        </div>
                        
                        {user.role !== 'admin' && (
                            <button onClick={() => deleteUser(user._id)} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default UserList;