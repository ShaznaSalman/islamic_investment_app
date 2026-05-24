'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getUser, setUser, setToken, clearAuth } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = getUser();
    if (cached) {
      setUserState(cached);
      // Verify token is still valid
      api.get('/api/auth/me')
        .then((res) => { setUserState(res.data); setUser(res.data); })
        .catch(() => { clearAuth(); setUserState(null); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    setUserState(data.user);
  }

  function logout() {
    clearAuth();
    setUserState(null);
  }

  function refreshUser(updated: User) {
    setUser(updated);
    setUserState(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
