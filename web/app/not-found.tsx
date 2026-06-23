import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code} aria-hidden="true">404</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          This page doesn't exist or has been moved.
        </p>
        <Link href="/feed" className={styles.btn}>
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
