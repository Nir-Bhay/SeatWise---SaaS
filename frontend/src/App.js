import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Buildings from './pages/Buildings';
import Exams from './pages/Exams';
import Templates from './pages/Templates';
import Layout from './components/Layout';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/students" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Students />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/buildings" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Buildings />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/exams" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Exams />
                                </Layout>
                            </ProtectedRoute>
                        } />
                        <Route path="/templates" element={
                            <ProtectedRoute>
                                <Layout>
                                    <Templates />
                                </Layout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;