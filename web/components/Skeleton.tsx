'use client';

import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A single shimmering placeholder block. Compose these to mirror the
 * layout of whatever content is loading so the page doesn't jump.
 */
export default function Skeleton({ width, height = 16, radius = 6, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
