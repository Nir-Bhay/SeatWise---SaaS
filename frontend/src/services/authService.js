import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to automatically add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('examwise_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('examwise_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    verifyToken: async () => {
        try {
            const response = await api.get('/auth/verify');
            return response.data;
        } catch (error) {
            throw new Error('Token verification failed');
        }
    },

    // Add logout method
    logout: async () => {
        try {
            // Call logout endpoint if your backend has one
            // await api.post('/auth/logout');
            localStorage.removeItem('examwise_token');
            return { success: true };
        } catch (error) {
            // Even if logout fails, clear local storage
            localStorage.removeItem('examwise_token');
            return { success: true };
        }
    }
};

export { authService };