'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './signup.module.css';

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
}

function validate(username: string, email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!username.trim()) {
    errs.username = 'Username is required.';
  } else if (username.trim().length < 3) {
    errs.username = 'Username must be at least 3 characters.';
  }
  if (!email.trim()) {
    errs.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errs.email = 'Enter a valid email address.';
  }
  if (!password) {
    errs.password = 'Password is required.';
  } else if (password.length < 8) {
    errs.password = 'Password must be at least 8 characters.';
  }
  return errs;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const handleBlur = (field: keyof FieldErrors) => {
    touch(field);
    setFieldErrors(validate(username, email, password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true });
    const errs = validate(username, email, password);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await signup(username, email, password, bio);
    } catch (err: any) {
      try {
        const msg = JSON.parse(err.message);
        const mapped: FieldErrors = {};
        if (msg.username) mapped.username = Array.isArray(msg.username) ? msg.username[0] : msg.username;
        if (msg.email) mapped.email = Array.isArray(msg.email) ? msg.email[0] : msg.email;
        if (msg.password) mapped.password = Array.isArray(msg.password) ? msg.password[0] : msg.password;
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          setTouched({ username: true, email: true, password: true });
        } else {
          const first = Object.values(msg)[0] as any;
          setFieldErrors({ username: Array.isArray(first) ? first[0] : String(first) });
        }
      } catch {
        setFieldErrors({ username: 'Sign up failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon}>♪</span>
          <h2 className={styles.logoText}>Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Username *</label>
            <input
              id="username"
              className={`${styles.input} ${touched.username && fieldErrors.username ? styles.inputError : ''}`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (touched.username) setFieldErrors(validate(e.target.value, email, password));
              }}
              onBlur={() => handleBlur('username')}
              placeholder="Choose a username"
              autoComplete="username"
              aria-describedby={touched.username && fieldErrors.username ? 'username-error' : undefined}
              aria-invalid={!!(touched.username && fieldErrors.username)}
            />
            {touched.username && fieldErrors.username && (
              <span id="username-error" className={styles.fieldError}>{fieldErrors.username}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email *</label>
            <input
              id="email"
              className={`${styles.input} ${touched.email && fieldErrors.email ? styles.inputError : ''}`}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setFieldErrors(validate(username, e.target.value, password));
              }}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={touched.email && fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={!!(touched.email && fieldErrors.email)}
            />
            {touched.email && fieldErrors.email && (
              <span id="email-error" className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password *</label>
            <input
              id="password"
              className={`${styles.input} ${touched.password && fieldErrors.password ? styles.inputError : ''}`}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setFieldErrors(validate(username, email, e.target.value));
              }}
              onBlur={() => handleBlur('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-describedby={touched.password && fieldErrors.password ? 'password-error' : undefined}
              aria-invalid={!!(touched.password && fieldErrors.password)}
            />
            {touched.password && fieldErrors.password && (
              <span id="password-error" className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself (optional)"
              rows={3}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>Already have an account?</span>
          <Link href="/login" className={styles.link}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
