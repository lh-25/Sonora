'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearTokens, getAccessToken, getMe, login, signup } from '@/services/api';
import type { User, Profile } from '@/services/api';

type AuthState = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, bio?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      getMe()
        .then((data) => { setUser(data.user); setProfile(data.profile); })
        .catch(() => clearTokens())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
    const me = await getMe();
    setUser(me.user);
    setProfile(me.profile);
  };

  const handleSignup = async (username: string, email: string, password: string, bio?: string) => {
    await signup(username, email, password, bio);
    const me = await getMe();
    setUser(me.user);
    setProfile(me.profile);
  };

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const me = await getMe();
    setUser(me.user);
    setProfile(me.profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
