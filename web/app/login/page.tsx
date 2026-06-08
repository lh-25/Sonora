'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button, Input, FormField, FormFieldLabel, FormFieldHelperText,
  Text, H1, StackLayout, FlexLayout,
} from '@salt-ds/core';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <StackLayout gap={3} align="center">
          <div className={styles.logo}>
            <span className={styles.logoIcon}>♪</span>
            <H1 className={styles.logoText}>Sonora</H1>
          </div>
          <Text styleAs="h4" className={styles.subtitle}>Sign in to your account</Text>
        </StackLayout>

        <form onSubmit={handleSubmit} className={styles.form}>
          <StackLayout gap={2}>
            <FormField>
              <FormFieldLabel>Username</FormFieldLabel>
              <Input
                value={username}
                onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
                placeholder="Enter your username"
              />
            </FormField>

            <FormField>
              <FormFieldLabel>Password</FormFieldLabel>
              <Input
                inputProps={{ type: 'password' }}
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="Enter your password"
              />
            </FormField>

            {error && (
              <Text styleAs="notation" className={styles.error}>{error}</Text>
            )}

            <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
              Log In
            </Button>
          </StackLayout>
        </form>

        <FlexLayout justify="center" gap={1} className={styles.footer}>
          <Text styleAs="notation" className={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="/signup" className={styles.link}>Sign up</Link>
        </FlexLayout>
      </div>
    </div>
  );
}
