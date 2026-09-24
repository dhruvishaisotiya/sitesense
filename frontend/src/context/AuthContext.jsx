import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [roleCapabilities, setRoleCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [userRes, capsRes] = await Promise.all([
        api.get('/auth/me/'),
        api.get('/auth/capabilities/')
      ]);
      
      setUser(userRes.data);
      setRoleCapabilities(capsRes.data.capabilities);
      localStorage.setItem('user_data', JSON.stringify(userRes.data));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile or capabilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setRoleCapabilities(null);
      setError('Session expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);

      // Fetch full role capabilities
      const capsRes = await api.get('/auth/capabilities/');
      setRoleCapabilities(capsRes.data.capabilities);

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (err) {
      console.warn('Logout API call error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setRoleCapabilities(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        roleCapabilities,
        loading,
        error,
        login,
        logout,
        fetchUserProfile,
        isAuthenticated: !!user && !!localStorage.getItem('access_token'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
