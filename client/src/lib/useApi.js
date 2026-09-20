'use client';

import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';

/**
 * Calls the Express API with the current Clerk session token attached.
 * `lib/api.js` stays Clerk-free (rules.md §4: one fetch wrapper); this hook is the
 * only place that turns a Clerk session into an Authorization header.
 *
 * Usage:
 *   const { request, isLoaded, isSignedIn } = useApi();
 *   const { data } = await request('/api/v1/me');
 */
export function useApi() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const request = useCallback(
    async (path, options = {}) => {
      // Guests still get a real call — public endpoints do not need a token.
      const token = isSignedIn ? await getToken() : undefined;
      return apiFetch(path, { ...options, token });
    },
    [getToken, isSignedIn],
  );

  return { request, isLoaded, isSignedIn };
}
