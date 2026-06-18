'use client';

import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return this.props.fallback ?? (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--sonora-text)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</p>
        <p style={{ color: 'var(--sonora-text-muted)', fontSize: 14, marginBottom: 24 }}>
          An unexpected error occurred. Try reloading the page.
        </p>
        <button
          onClick={() => this.setState({ hasError: false })}
          style={{
            padding: '10px 24px', borderRadius: 25, border: 'none',
            background: 'linear-gradient(90deg, #00d4ff, #ff40ff)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
