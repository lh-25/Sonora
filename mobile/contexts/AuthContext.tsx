import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearTokens, getMe, getAccessToken, login, signup } from '@/services/api';
import type { User, Profile } from '@/services/api';

type AuthState = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, bio?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const data = await getMe();
          setUser(data.user);
          setProfile(data.profile);
        } catch {
          await clearTokens();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const data = await login(username, password);
    setUser(data.user);
    const me = await getMe();
    setProfile(me.profile);
  };

  const handleSignup = async (username: string, email: string, password: string, bio?: string) => {
    await signup(username, email, password, bio);
    const me = await getMe();
    setUser(me.user);
    setProfile(me.profile);
  };

  const handleLogout = async () => {
    await clearTokens();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const me = await getMe();
      setUser(me.user);
      setProfile(me.profile);
    } catch {}
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
