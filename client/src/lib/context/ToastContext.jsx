'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Toast from '@/components/ui/Toast';

const ToastContext = createContext(null);
const AUTO_DISMISS_MS = 4000;

/** Wrap the app once in `layout.jsx` so any component can call `useToast()`. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:items-end"
      >
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** @returns {{ toast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void }} */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
