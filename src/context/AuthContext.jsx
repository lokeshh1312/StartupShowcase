import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, jsonBody } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  useEffect(() => {
    let active = true;
    apiRequest('/api/auth/me')
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoadingUser(false); });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST', body: jsonBody({ email, password }),
    });
    setUser(result.user);
    return result.user;
  };

  const register = async (name, email, password, role) => {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST', body: jsonBody({ name, email, password, role }),
    });
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: Boolean(user), loadingUser, login, register, logout,
      authModalOpen, authModalMode, setAuthModalMode, openAuthModal, closeAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
