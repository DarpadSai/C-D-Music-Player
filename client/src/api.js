import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // This MUST be here
});

export default api;