import React from 'react';
import { useGlobalStore } from '../store/globalStore';

export default function Toast() {
  const toast = useGlobalStore(state => state.toast);

  if (!toast || !toast.text) return null;

  const base = {
    position: 'fixed',
    right: 20,
    bottom: 24,
    zIndex: 9999,
    padding: '10px 14px',
    borderRadius: 8,
    minWidth: 180,
    maxWidth: 420,
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
    color: '#fff',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const typeColors = {
    success: '#059669',
    error: '#dc2626',
    info: '#2563eb',
    warning: '#b45309',
  };

  const bg = typeColors[toast.type] || '#111827';

  return (
    <div style={{ ...base, background: bg }} role="status" aria-live="polite">
      <div style={{ fontWeight: 700 }}>{toast.type?.toUpperCase()}</div>
      <div style={{ opacity: 0.95 }}>{toast.text}</div>
    </div>
  );
}
