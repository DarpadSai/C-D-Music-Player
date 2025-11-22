import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// CONFIGURATION
const BACKEND_URL = "https://dc-music-player-backend.onrender.com";

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => { fetchUsers(); }, []);

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const fetchUsers = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${BACKEND_URL}/users`, { headers: { 'Authorization': token } });
            setUsers(res.data);
        } catch (err) { 
            console.error(err);
            toast.error("Failed to load users"); 
        }
    };

    // FIX: Custom Toast instead of window.confirm
    const deleteUser = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                <span>Permanently delete user?</span>
                <button 
                    onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            const token = getToken();
                            await axios.delete(`${BACKEND_URL}/users/${id}`, { headers: { 'Authorization': token } });
                            toast.success("User Deleted");
                            fetchUsers();
                        } catch (err) { toast.error("Failed to delete"); }
                    }}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                    Yes
                </button>
                <button 
                    onClick={() => toast.dismiss(t.id)}
                    style={{ background: '#334155', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                    No
                </button>
            </div>
        ), { duration: 5000, style: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' } });
    };

    return (
        <div className="fade-in" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: '800' }}>User Management</h1>
            <div style={{ display: 'grid', gap: '15px' }}>
                {users.map(user => (
                    <div key={user._id} className="card-hover" style={{ padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <img 
                                src={`${BACKEND_URL}/users/${user.username}/avatar`} 
                                alt={user.username}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=1e293b&color=fff`}
                            />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{user.username}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{user.role}</div>
                            </div>
                        </div>
                        
                        {user.role !== 'admin' && (
                            <button 
                                onClick={() => deleteUser(user._id)} 
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', transition: '0.2s' }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                            >
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