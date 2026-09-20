'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useApi } from '@/lib/useApi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const ENDPOINTS = [
  { path: '/api/v1/me', label: 'GET /api/v1/me', note: 'Any signed-in user' },
  { path: '/api/v1/admin/ping', label: 'GET /api/v1/admin/ping', note: 'Admin only — 403 for citizens' },
];

export default function AuthCheck() {
  const { request, isLoaded } = useApi();
  const { user } = useUser();
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    let active = true;

    const run = async () => {
      const settled = await Promise.all(
        ENDPOINTS.map(async (endpoint) => {
          try {
            const json = await request(endpoint.path);
            return { ...endpoint, ok: true, body: json.data };
          } catch (err) {
            return { ...endpoint, ok: false, body: { code: err.code, status: err.status, message: err.message } };
          }
        }),
      );
      if (active) setResults(settled);
    };

    run();
    return () => {
      active = false;
    };
  }, [isLoaded, request]);

  if (!isLoaded || !results) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Token round-trip</h2>
        <Badge tone={user ? 'success' : 'neutral'}>
          {user ? `Clerk role: ${user.publicMetadata?.role ?? 'citizen'}` : 'Signed out'}
        </Badge>
      </div>

      <ul className="mt-4 space-y-3">
        {results.map((result) => (
          <li key={result.path} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-medium">{result.label}</code>
              <Badge tone={result.ok ? 'success' : 'danger'}>{result.ok ? 'OK' : 'Blocked'}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">{result.note}</p>
            <pre className="mt-2 overflow-x-auto rounded bg-bg p-2 text-xs text-ink-muted">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </Card>
  );
}
