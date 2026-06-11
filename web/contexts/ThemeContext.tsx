'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Mode = 'dark' | 'light';

const ThemeContext = createContext<{ mode: Mode; toggle: () => void }>({
  mode: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('sonora_theme') as Mode | null;
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-sonora-theme', mode);
    localStorage.setItem('sonora_theme', mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
