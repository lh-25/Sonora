import Link from 'next/link';
import AboutNav from './AboutNav';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* Minimal nav — only shown to logged-out visitors */}
      <AboutNav />

      {/* About Hero */}
      <section className={styles.aboutHero}>
        <h1 className={styles.heroTitle}>About Sonora</h1>
        <p className={styles.heroDesc}>
          Sonora is a platform where music enthusiasts can share and discover playlists
          and songs of the day. At Sonora, we aim to bring people together through the
          universal language of music. Whether you're creating, sharing, or discovering
          playlists, Sonora is your hub for musical inspiration.
        </p>
      </section>

      {/* Mission */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.sectionText}>
            At Sonora, we aim to bring people together through the universal language
            of music. Whether you're creating, sharing, or discovering playlists,
            Sonora is your hub for musical inspiration.
          </p>
        </div>
      </section>

      {/* Creator */}
      <section className={styles.creatorSection}>
        <h2 className={styles.creatorHeading}>Meet the Creator</h2>
        <div className={styles.creatorCard}>
          <div className={styles.creatorAvatar}>
            <span className={styles.creatorAvatarIcon}>♪</span>
          </div>
          <h3 className={styles.creatorName}>Leah</h3>
          <p className={styles.creatorBio}>
            Hi! I'm the sole developer and designer of Sonora. I created this platform
            to make sharing and discovering music easier and more enjoyable for everyone.
            Thank you for being a part of the Sonora community!
          </p>
        </div>
      </section>

      {/* Back CTA */}
      <div className={styles.backRow}>
        <Link href="/" className={styles.backLink}>← Back to Home</Link>
        <Link href="/signup" className={styles.joinBtn}>Join Sonora</Link>
      </div>

      <footer className={styles.footer}>
        <p>© 2024 Sonora Music App</p>
      </footer>
    </div>
  );
}
