'use client';

import { useCallback, useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

// Temporary Phase 1 widget: proves the deployed client can reach the deployed server.
// Remove once real pages call the API (Phase 5/6).
const COLD_START_MS = 5000;
const GIVE_UP_MS = 60000;

const BADGES = {
  checking: { label: 'Checking', className: 'border-info text-info bg-info/10' },
  waking: { label: 'Waking up', className: 'border-warning text-warning bg-warning/10' },
  ok: { label: 'Connected', className: 'border-success text-success bg-success/10' },
  error: { label: 'Unreachable', className: 'border-danger text-danger bg-danger/10' },
};

export default function ApiStatus() {
  const [state, setState] = useState('checking');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState('checking');
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const wakeTimer = setTimeout(() => setState((s) => (s === 'checking' ? 'waking' : s)), COLD_START_MS);
    const giveUpTimer = setTimeout(() => controller.abort(), GIVE_UP_MS);

    checkHealth(controller.signal)
      .then(() => setState('ok'))
      .catch(() => setState('error'))
      .finally(() => {
        clearTimeout(wakeTimer);
        clearTimeout(giveUpTimer);
      });

    return () => {
      clearTimeout(wakeTimer);
      clearTimeout(giveUpTimer);
      controller.abort();
    };
  }, [attempt]);

  const badge = BADGES[state];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm md:p-6" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Server connection</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {state === 'waking' && 'Waking up the server, hang tight…'}
            {state === 'checking' && 'Contacting the API…'}
            {state === 'ok' && 'The API responded to the health check.'}
            {state === 'error' && 'The API did not respond. Check NEXT_PUBLIC_API_URL and that the server is running.'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {state === 'error' && (
        <button
          type="button"
          onClick={retry}
          className="mt-4 h-11 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:bg-bg active:scale-[0.98]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
