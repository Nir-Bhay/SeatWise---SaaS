import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('examwise_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('examwise_token');
            window.location.href = '/login';
        }

        const message = error.response?.data?.message || 'An error occurred';
        toast.error(message);

        return Promise.reject(error);
    }
);

export const studentService = {
    getAll: (params = {}) => api.get('/students', { params }),
    upload: (formData) => api.post('/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getTemplate: () => api.get('/students/template', { responseType: 'blob' }),
    getExamEligible: (filters) => api.post('/students/exam-eligible', filters),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`)
};

export const buildingService = {
    getAll: () => api.get('/buildings'),
    getById: (id) => api.get(`/buildings/${id}`),
    create: (data) => api.post('/buildings', data),
    update: (id, data) => api.put(`/buildings/${id}`, data),
    delete: (id) => api.delete(`/buildings/${id}`),
    getAvailableRooms: (filters) => api.post('/buildings/available-rooms', filters)
};

export const examService = {
    getAll: () => api.get('/exams'),
    getById: (id) => api.get(`/exams/${id}`),
    create: (data) => api.post('/exams', data),
    update: (id, data) => api.put(`/exams/${id}`, data),
    delete: (id) => api.delete(`/exams/${id}`),
    generateSeating: (id, data) => api.post(`/exams/${id}/generate-seating`, data)
};

export const pdfService = {
    generateSeating: (examId, roomIndex) =>
        api.post(`/pdf/seating/${examId}/${roomIndex}`, {}, { responseType: 'blob' }),
    generateAttendance: (examId, roomIndex) =>
        api.post(`/pdf/attendance/${examId}/${roomIndex}`, {}, { responseType: 'blob' }),
    generateMaster: (examId) =>
        api.post(`/pdf/master/${examId}`, {}, { responseType: 'blob' }),
    generateBulk: (examId) =>
        api.post(`/pdf/bulk/${examId}`, {}, { responseType: 'blob' })
};

export default api;