'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useApi } from '@/lib/useApi';

const NotificationContext = createContext(null);
const POLL_MS = 60_000; // low-frequency poll; a bell dot doesn't need to be second-accurate

/**
 * Wrap the app once in `layout.jsx` (inside ClerkProvider, since it needs `useAuth`).
 * Exposes the signed-in user's unread notification count for `Navbar`'s bell, and a
 * `refresh()` any page can call after marking notifications read.
 */
export function NotificationProvider({ children }) {
  const { request, isLoaded, isSignedIn } = useApi();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await request('/api/v1/me/notifications/unread-count');
      setUnreadCount(data.count);
    } catch {
      // A failed poll shouldn't disturb the rest of the app — the bell just keeps its
      // last known count until the next successful refresh.
    }
  }, [isSignedIn, request]);

  useEffect(() => {
    if (!isLoaded) return undefined;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [isLoaded, refresh]);

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/** @returns {{ unreadCount: number, refresh: () => Promise<void> }} */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
