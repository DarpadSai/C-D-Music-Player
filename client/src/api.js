import axios from 'axios';

// Detect if we are on localhost or production
const isDev = window.location.hostname === 'localhost';

const api = axios.create({
    // In Production: Use the full backend URL directly
    // In Development: Use /api so Vite proxy works
    baseURL: isDev ? '/api' : 'https://dc-music-player-backend.onrender.com',
});

export default api;