'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button, Input, MultilineInput, FormField, FormFieldLabel,
  Text, H2, StackLayout, FlexLayout,
} from '@salt-ds/core';
import { useAuth } from '@/contexts/AuthContext';
import styles from './signup.module.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) { setError('Please fill in all required fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await signup(username, email, password, bio);
    } catch (err: any) {
      try {
        const msg = JSON.parse(err.message);
        const first = Object.values(msg)[0] as any;
        setError(Array.isArray(first) ? first[0] : String(first));
      } catch {
        setError('Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <FlexLayout gap={1} align="center" justify="center" className={styles.header}>
          <span className={styles.logoIcon}>♪</span>
          <H2 className={styles.logoText}>Create Account</H2>
        </FlexLayout>

        <form onSubmit={handleSubmit}>
          <StackLayout gap={2}>
            <FormField>
              <FormFieldLabel>Username *</FormFieldLabel>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" />
            </FormField>

            <FormField>
              <FormFieldLabel>Email *</FormFieldLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </FormField>

            <FormField>
              <FormFieldLabel>Password *</FormFieldLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </FormField>

            <FormField>
              <FormFieldLabel>Bio</FormFieldLabel>
              <MultilineInput
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself (optional)"
                rows={3}
              />
            </FormField>

            {error && <Text styleAs="help" className={styles.error}>{error}</Text>}

            <Button type="submit" variant="primary" loading={loading} className={styles.submitBtn}>
              Create Account
            </Button>
          </StackLayout>
        </form>

        <FlexLayout justify="center" gap={1} align="center">
          <Text styleAs="help" className={styles.footerText}>Already have an account?</Text>
          <Link href="/login" className={styles.link}>Log in</Link>
        </FlexLayout>
      </div>
    </div>
  );
}
