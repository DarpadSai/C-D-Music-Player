import React, { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/users', { headers: { 'Authorization': token } });
            setUsers(res.data);
        } catch (err) { toast.error("Failed to load users"); }
    };

    const deleteUser = async (id) => {
        if(!window.confirm("Permanently delete this user?")) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/users/${id}`, { headers: { 'Authorization': token } });
            toast.success("User deleted");
            fetchUsers();
        } catch (err) { toast.error("Failed to delete"); }
    };

    return (
        <div className="animate-enter" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>User Management</h1>
            <div style={{ display: 'grid', gap: '10px' }}>
                {users.map(user => (
                    <div key={user._id} style={{ background: '#282828', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.username}</div>
                            <div style={{ color: '#aaa', fontSize: '14px' }}>Role: {user.role}</div>
                        </div>
                        {user.role !== 'admin' && (
                            <button onClick={() => deleteUser(user._id)} style={{ background: '#ff5555', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
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