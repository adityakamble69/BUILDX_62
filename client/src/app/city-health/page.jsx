'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { getStatsPublic, getReportsMap, listReports } from '@/lib/api';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import CategoryBreakdownChart from '@/components/admin/CategoryBreakdownChart';
import ReportsTrendChart from '@/components/admin/ReportsTrendChart';
import TopOpenReportsList from '@/components/city-health/TopOpenReportsList';
import TopAreasList from '@/components/city-health/TopAreasList';
import DynamicMapView from '@/components/map/DynamicMapView';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatAvgResolveTime } from '@/lib/utils/duration';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

const TREND_DAYS = 7;
const REPORTS_SAMPLE = 100; // rules.md §5 — list endpoints cap at 100

/**
 * Top areas from a page of reports. Client-side because there's no public
 * "top areas" endpoint (a dedicated RPC is a Phase 9 improvement; this is fine for demo).
 */
function computeTopAreas(reports, limit = 5) {
  const counts = new Map();
  reports.forEach((r) => {
    if (!r.area_name) return;
    counts.set(r.area_name, (counts.get(r.area_name) ?? 0) + 1);
  });
  const total = reports.length || 1;
  return Array.from(counts, ([area, count]) => ({
    area,
    count,
    pct: Math.round((count / total) * 100),
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Per-day reported/resolved counts over the last N days, from the same page of reports.
 * `in_progress` is filled with 0 because reconstructing it needs `status_history`, which
 * the public reports endpoint doesn't return — the chart hides it via its `series` prop.
 */
function computeTrend(reports, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: days }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - 1 - i));
    return { day: day.toISOString().slice(0, 10), reported: 0, resolved: 0 };
  });
  const byDay = new Map(buckets.map((b) => [b.day, b]));

  reports.forEach((r) => {
    if (r.created_at) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      if (byDay.has(d)) byDay.get(d).reported += 1;
    }
    if (r.resolved_at) {
      const d = new Date(r.resolved_at).toISOString().slice(0, 10);
      if (byDay.has(d)) byDay.get(d).resolved += 1;
    }
  });

  return buckets.map((b) => ({ ...b, in_progress: 0 }));
}

/**
 * `/city-health` — public accountability page (PRD F12/FR16, phases.md Phase 8). No auth,
 * no admin-only numbers. Three parallel fetches: public stats (totals + category breakdown
 * + top open issues), map points (markers), and a page of reports for client-side
 * aggregation of the top-areas list and the trend chart. `StatCard`/`ChartCard` are shared
 * with the admin dashboard by design (architecture.md §15).
 */
export default function CityHealthPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [mapPoints, setMapPoints] = useState(null);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getStatsPublic(controller.signal),
      getReportsMap({}, controller.signal),
      listReports({ pageSize: REPORTS_SAMPLE, sort: 'newest' }, controller.signal),
    ])
      .then(([statsRes, mapRes, reportsRes]) => {
        setStats(statsRes.data);
        setMapPoints(mapRes.data);
        setReports(reportsRes.data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);

  const areas = useMemo(() => (reports ? computeTopAreas(reports) : []), [reports]);
  const trend = useMemo(() => (reports ? computeTrend(reports, TREND_DAYS) : []), [reports]);

  const loading = !error && (!stats || !mapPoints || !reports);

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

      {loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </>
      )}

      {!error && stats && mapPoints && reports && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Reports" value={stats.total} icon={ClipboardList} tone="primary" />
            <StatCard
              label="Resolved"
              value={`${stats.resolved_pct ?? 0}%`}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard label="In Progress" value={stats.in_progress} icon={Hourglass} tone="info" />
            <StatCard
              label="Avg Fix Time"
              value={formatAvgResolveTime(stats.avg_hours_to_resolve)}
              icon={Clock}
              tone="warning"
            />
          </div>

          {/* Row 2 — Category donut + City map */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Reports by Category">
              <CategoryBreakdownChart data={stats.byCategory} />
            </ChartCard>
            <ChartCard title="City Map" height={280}>
              {mapPoints.length > 0 ? (
                <DynamicMapView
                  mode="browse"
                  reports={mapPoints}
                  className="h-full"
                  zoom={12}
                  onMarkerClick={(id) => router.push(`/reports/${id}`)}
                />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-ink-muted">
                  No reports to map yet.
                </p>
              )}
            </ChartCard>
          </div>

          {/* Row 3 — Top Areas + Trend */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Top Areas" height="auto">
              <TopAreasList data={areas} />
            </ChartCard>
            <ChartCard title={`Reports Trend (last ${TREND_DAYS} days)`}>
              <ReportsTrendChart trend={trend} series={['reported', 'resolved']} />
            </ChartCard>
          </div>

          {/* Row 4 — Top open issues (already existed) */}
          <ChartCard title="Top Open Issues" height="auto">
            <TopOpenReportsList data={stats.topOpenReports} />
          </ChartCard>
        </>
      )}
    </div>
  );
}