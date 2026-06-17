'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

interface FieldErrors {
  username?: string;
  password?: string;
}

function validate(username: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!username.trim()) errs.username = 'Username is required.';
  if (!password) errs.password = 'Password is required.';
  return errs;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const handleBlur = (field: keyof FieldErrors) => {
    touch(field);
    setFieldErrors(validate(username, password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    const errs = validate(username, password);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setFormError('');
    try {
      await login(username, password);
    } catch {
      setFormError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon}>♪</span>
          <h1 className={styles.logoText}>Sonora</h1>
        </div>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              className={`${styles.input} ${touched.username && fieldErrors.username ? styles.inputError : ''}`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (touched.username) setFieldErrors(validate(e.target.value, password));
              }}
              onBlur={() => handleBlur('username')}
              placeholder="Enter your username"
              autoComplete="username"
              aria-describedby={touched.username && fieldErrors.username ? 'username-error' : undefined}
              aria-invalid={!!(touched.username && fieldErrors.username)}
            />
            {touched.username && fieldErrors.username && (
              <span id="username-error" className={styles.fieldError}>{fieldErrors.username}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              className={`${styles.input} ${touched.password && fieldErrors.password ? styles.inputError : ''}`}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setFieldErrors(validate(username, e.target.value));
              }}
              onBlur={() => handleBlur('password')}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-describedby={touched.password && fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={!!(touched.password && fieldErrors.password)}
            />
            {touched.password && fieldErrors.password && (
              <span id="password-error" className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {formError && <p className={styles.error} role="alert">{formError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Log In'}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>Don&apos;t have an account?</span>
          <Link href="/signup" className={styles.link}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
