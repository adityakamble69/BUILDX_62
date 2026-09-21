'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { getStatsPublic } from '@/lib/api';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import CategoryBreakdownChart from '@/components/admin/CategoryBreakdownChart';
import TopOpenReportsList from '@/components/city-health/TopOpenReportsList';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatAvgResolveTime } from '@/lib/utils/duration';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

/**
 * `/city-health` — public accountability page (PRD F12/FR16, phases.md Phase 8). No auth,
 * no admin-only numbers: same `GET /stats/public` the landing page's `StatsStrip` already
 * calls, extended in Phase 8 with `byCategory` and `topOpenReports`. `StatCard`/`ChartCard`
 * are shared with the admin dashboard by design (architecture.md §15).
 */
export default function CityHealthPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getStatsPublic(controller.signal)
      .then((res) => setStats(res.data))
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className={cn('flex w-full flex-col gap-6 py-8', PAGE_PADDING)}>
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">City Health</h1>
        <p className="mt-1 text-ink-muted">Real-time insights for a cleaner, healthier city.</p>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load City Health"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && !stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </>
      )}

      {!error && stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Reports" value={stats.total} icon={ClipboardList} tone="primary" />
            <StatCard label="Resolved" value={`${stats.resolved_pct ?? 0}%`} icon={CheckCircle2} tone="success" />
            <StatCard label="In Progress" value={stats.in_progress} icon={Hourglass} tone="info" />
            <StatCard label="Avg Fix Time" value={formatAvgResolveTime(stats.avg_hours_to_resolve)} icon={Clock} tone="warning" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Reports by Category">
              <CategoryBreakdownChart data={stats.byCategory} />
            </ChartCard>
            <ChartCard title="Top Open Issues" height="auto">
              <TopOpenReportsList data={stats.topOpenReports} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
