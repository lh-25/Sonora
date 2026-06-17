'use client';

import { H3, Text } from '@salt-ds/core';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  /** One of the built-in illustrations, or pass a custom node via `icon`. */
  variant?: 'music' | 'posts' | 'playlists' | 'users' | 'comments' | 'search';
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Optional call-to-action rendered below the text (e.g. a Button). */
  action?: React.ReactNode;
}

const GLYPHS: Record<NonNullable<EmptyStateProps['variant']>, string> = {
  music: 'M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm12-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM9 17.5V6l12-2v9.5',
  posts: 'M4 5h16M4 10h16M4 15h10',
  playlists: 'M4 6h11M4 11h11M4 16h7M18 9v8.5a2 2 0 1 1-2-2c.7 0 1.4.2 2 .6V9Z',
  users: 'M16 18v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm11 9v-1a4 4 0 0 0-3-3.9M16 2.2a4 4 0 0 1 0 7.6',
  comments: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 4 12a8.5 8.5 0 1 1 17 0Z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
};

/**
 * A consistent, branded empty state: gradient-haloed illustration, a title,
 * an optional description, and an optional action. Use this instead of a bare
 * heading so empty screens feel intentional rather than broken.
 */
export default function EmptyState({
  variant = 'music',
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.wrapper} role="status">
      <div className={styles.illustration} aria-hidden="true">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={GLYPHS[variant]} />
          </svg>
        )}
      </div>
      <H3 className={styles.title}>{title}</H3>
      {description && <Text className={styles.description}>{description}</Text>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
