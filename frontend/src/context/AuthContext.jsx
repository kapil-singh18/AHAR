import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const establishSession = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const data = response.data?.data;
      setAccessToken(data?.accessToken || null);
      setUser(data?.user || null);
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    establishSession();
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const data = response.data.data;
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (details) => {
    const response = await api.post('/auth/register', details);
    const data = response.data.data;
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user)
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
