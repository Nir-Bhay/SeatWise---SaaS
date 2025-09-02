import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: localStorage.getItem('examwise_token'),
    isAuthenticated: false,
    loading: true
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            localStorage.setItem('examwise_token', action.payload.token);
            return {
                ...state,
                user: action.payload.university,
                token: action.payload.token,
                isAuthenticated: true,
                loading: false
            };
        case 'LOGOUT':
            localStorage.removeItem('examwise_token');
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'AUTH_ERROR':
            localStorage.removeItem('examwise_token');
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('examwise_token');
            if (token) {
                try {
                    // Verify token validity by making a test request
                    const response = await authService.verifyToken();
                    if (response.success) {
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: {
                                token,
                                university: response.university
                            }
                        });
                    } else {
                        dispatch({ type: 'AUTH_ERROR' });
                    }
                } catch (error) {
                    dispatch({ type: 'AUTH_ERROR' });
                }
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await authService.login(credentials);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: response
            });
            return { success: true };
        } catch (error) {
            dispatch({ type: 'AUTH_ERROR' });
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await authService.register(userData);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: response
            });
            return { success: true };
        } catch (error) {
            dispatch({ type: 'AUTH_ERROR' });
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    const value = {
        ...state,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};