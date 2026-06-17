'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type Variant = 'success' | 'error' | 'info';
type ToastItem = { id: string; message: string; variant: Variant };

const COLORS: Record<Variant, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(29,185,84,0.10)',  border: '#1db954', icon: '✓' },
  error:   { bg: 'rgba(255,64,64,0.10)',  border: '#ff4040', icon: '✕' },
  info:    { bg: 'rgba(0,212,255,0.10)',  border: '#00d4ff', icon: 'ℹ' },
};

function Toast({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const c = COLORS[item.variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: 'var(--sonora-surface)',
      border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      color: 'var(--sonora-text)', fontSize: 14, fontWeight: 500,
      maxWidth: 360, minWidth: 220,
      boxShadow: 'var(--sonora-card-shadow)',
      pointerEvents: 'all',
      animation: 'sonoraToastIn 0.2s ease',
    }}>
      <span style={{ color: c.border, fontWeight: 700, fontSize: 15, flexShrink: 0, marginTop: 1 }}>
        {c.icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.45 }}>{item.message}</span>
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', color: 'var(--sonora-text-muted)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

const Ctx = createContext<(msg: string, v?: Variant) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, variant: Variant = 'info') => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  return (
    <Ctx.Provider value={add}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', top: 76, right: 20, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 8,
          alignItems: 'flex-end', pointerEvents: 'none',
        }}>
          {toasts.map((t) => (
            <Toast key={t.id} item={t} onRemove={() => remove(t.id)} />
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const add = useContext(Ctx);
  return {
    success: (msg: string) => add(msg, 'success'),
    error:   (msg: string) => add(msg, 'error'),
    info:    (msg: string) => add(msg, 'info'),
  };
}
