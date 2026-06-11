'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Text, FlexLayout } from '@salt-ds/core';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './Navigation.module.css';

const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/songs', label: 'Songs' },
  { href: '/playlists', label: 'Playlists' },
  { href: '/users', label: 'Users' },
  { href: '/profile', label: 'Profile' },
  { href: '/about', label: 'About' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { mode, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/feed" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sonora-logo-new.svg" alt="Sonora" className={styles.logoImg} />
        </Link>

        <FlexLayout gap={1} className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname.startsWith(link.href) ? styles.linkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </FlexLayout>

        <div className={styles.actions}>
          <Text className={styles.username}>@{user?.username}</Text>
          <button
            className={styles.themeToggle}
            onClick={toggle}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? '☀' : '☾'}
          </button>
          <Button variant="secondary" onClick={handleLogout} className={styles.logoutBtn}>
            Log out
          </Button>
        </div>
      </div>
    </nav>
  );
}
