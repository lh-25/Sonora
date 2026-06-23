'use client';

import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  if (!isAuthenticated) return null;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/feed" className={styles.logo} onClick={closeMenu}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sonora-logo-new.svg" alt="Sonora" className={styles.logoImg} />
        </Link>

        {/* Desktop links */}
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

        {/* Desktop actions */}
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

        {/* Mobile hamburger */}
        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          <div id="mobile-menu" className={styles.mobileMenu}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileLink} ${pathname.startsWith(link.href) ? styles.mobileLinkActive : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className={styles.mobileDivider} />
            <div className={styles.mobileBottom}>
              <span className={styles.mobileUsername}>@{user?.username}</span>
              <div className={styles.mobileBottomActions}>
                <button
                  className={styles.themeToggle}
                  onClick={toggle}
                  aria-label="Toggle theme"
                  title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {mode === 'dark' ? '☀' : '☾'}
                </button>
                <Button
                  variant="secondary"
                  onClick={() => { handleLogout(); closeMenu(); }}
                  className={styles.logoutBtn}
                >
                  Log out
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
        </>
      )}
    </nav>
  );
}
