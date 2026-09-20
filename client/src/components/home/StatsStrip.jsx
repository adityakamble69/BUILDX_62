'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { getStatsPublic } from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';

const CARDS = [
  { key: 'total', label: 'Reports filed', icon: ClipboardList },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'in_progress', label: 'In progress', icon: Clock },
];

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

export default function StatsStrip() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getStatsPublic(controller.signal)
      .then((res) => setStats(res.data))
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  // Quietly disappears rather than showing a broken strip on the landing page — the
  // rest of the page (hero, categories) doesn't depend on this data.
  if (error) return null;

  return (
    <section
      aria-label="Live city-wide report stats"
      className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm md:gap-6 md:p-6"
    >
      {CARDS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {stats ? (
              <p className="text-xl font-bold leading-tight text-ink md:text-2xl">
                {formatCount(stats[key])}
              </p>
            ) : (
              <Skeleton variant="text" className="w-12" />
            )}
            <p className="truncate text-xs text-ink-muted md:text-sm">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
