'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './about.module.css';

export default function AboutNav() {
  const { isAuthenticated } = useAuth();
  // When logged in, the global Navigation is already shown by AppShell.
  if (isAuthenticated) return null;

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <span className={styles.navLogoIcon}>♪</span>
        <span className={styles.navLogoText}>Sonora</span>
      </Link>
      <div className={styles.navLinks}>
        <Link href="/login" className={styles.navLink}>Log In</Link>
        <Link href="/signup" className={styles.navLinkPrimary}>Sign Up</Link>
      </div>
    </nav>
  );
}
