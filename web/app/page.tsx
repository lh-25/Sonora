'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './landing.module.css';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) return null;

  return (
    <div className={styles.page}>
      {/* Minimal nav for public pages */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoIcon}>♪</span>
          <span className={styles.navLogoText}>Sonora</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/about" className={styles.navLink}>About</Link>
          <Link href="/login" className={styles.navLinkOutline}>Log In</Link>
          <Link href="/signup" className={styles.navLinkPrimary}>Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>♪ Music Social Platform</div>
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.gradient}>Sonora</span>
          </h1>
          <p className={styles.heroTagline}>The Music App of the Future</p>
          <p className={styles.heroDesc}>
            Discover, share, and connect through music. Share your Song of the Day,
            follow friends, and build the ultimate playlist collection.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.btnPrimary}>Get Started</Link>
            <Link href="/about" className={styles.btnSecondary}>Learn More</Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardSong}>
              <div className={styles.heroCardArt}>♫</div>
              <div>
                <div className={styles.heroCardTitle}>Song of the Day</div>
                <div className={styles.heroCardArtist}>Share what you're listening to</div>
              </div>
            </div>
            <div className={styles.heroCardQuote}>"Music is the shorthand of emotion."</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="page-container">
          <h2 className={styles.sectionTitle}>Why Choose Sonora?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🎶</span>
              <h3 className={styles.featureTitle}>Endless Playlists</h3>
              <p className={styles.featureDesc}>
                Discover and create playlists tailored to your mood and taste.
              </p>
            </div>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>👍</span>
              <h3 className={styles.featureTitle}>Community Favorites</h3>
              <p className={styles.featureDesc}>
                Explore trending songs and playlists shared by the Sonora community.
              </p>
            </div>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🔥</span>
              <h3 className={styles.featureTitle}>Hot Picks Daily</h3>
              <p className={styles.featureDesc}>
                Check out the Song of the Day, curated by music enthusiasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Dive Into Music?</h2>
          <p className={styles.ctaDesc}>
            Join Sonora today and unlock the ultimate music experience.
          </p>
          <Link href="/signup" className={styles.btnGradient}>Sign Up Now</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2024 Sonora Music App</p>
        <Link href="/about" className={styles.footerLink}>About</Link>
      </footer>
    </div>
  );
}
