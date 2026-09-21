'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Clock, Hourglass, CircleCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { getCategoryLabel } from '@/lib/utils/categories';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import CategoryBreakdownChart from '@/components/admin/CategoryBreakdownChart';
import StatusBreakdownChart from '@/components/admin/StatusBreakdownChart';
import ReportsTrendChart from '@/components/admin/ReportsTrendChart';
import DepartmentBreakdownList from '@/components/admin/DepartmentBreakdownList';
import RecentReportsTable from '@/components/admin/RecentReportsTable';
import TopCategoriesList from '@/components/admin/TopCategoriesList';
import DynamicMapView from '@/components/map/DynamicMapView';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Select from '@/components/ui/Select';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
];

const RECENT_LIMIT = 5;
const MAP_LIMIT = 12;

/**
 * Simple direction indicator for a KPI card, computed from `get_reports_trend`'s series:
 * split the window in half and compare the sums. This is NOT a true week-over-week
 * comparison (the RPC doesn't return the previous period) — it's the intra-window
 * direction, which is honest and needs no backend change.
 */
function trendDelta(values) {
  if (!values || values.length < 4) return null;
  const half = Math.floor(values.length / 2);
  const first = values.slice(0, half).reduce((a, b) => a + Number(b || 0), 0);
  const second = values.slice(half).reduce((a, b) => a + Number(b || 0), 0);
  if (first === 0 && second === 0) return null;
  if (first === 0) return { pct: 100, dir: 'up' };
  const raw = Math.round(((second - first) / first) * 100);
  return { pct: Math.abs(raw), dir: raw > 0 ? 'up' : raw < 0 ? 'down' : 'flat' };
}

export default function AdminDashboardPage() {
  const { request, isLoaded } = useApi();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState(false);
  const [trendDays, setTrendDays] = useState(7);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    Promise.all([
      request(authPaths.adminStats({ trendDays })),
      request(authPaths.adminReports({ pageSize: MAP_LIMIT, sort: 'newest' })),
    ])
      .then(([statsRes, reportsRes]) => {
        if (!active) return;
        setStats(statsRes.data);
        setRecent(reportsRes.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request, trendDays, reloadKey]);

  const deltas = useMemo(() => {
    if (!stats?.trend) return {};
    return {
      reported: trendDelta(stats.trend.map((d) => d.reported)),
      in_progress: trendDelta(stats.trend.map((d) => d.in_progress)),
      resolved: trendDelta(stats.trend.map((d) => d.resolved)),
    };
  }, [stats]);

  const mapReports = useMemo(
    () =>
      (recent ?? []).map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        title: r.title,
        categoryLabel: getCategoryLabel(r.category?.slug),
        areaName: r.area_name,
        upvoteCount: r.upvote_count,
        thumbnailUrl: getThumbnailUrl(r.images),
        createdAt: r.created_at,
      })),
    [recent],
  );

  const loading = !error && (!stats || !recent);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-[28px] font-bold leading-9">Dashboard</h1>
          <p className="mt-1 text-ink-muted">Overview of all reports and system activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Select
              label="Period"
              hideLabel
              options={PERIOD_OPTIONS}
              value={String(trendDays)}
              onChange={(e) => setTrendDays(Number(e.target.value))}
            />
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Refresh dashboard"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface text-ink-muted hover:text-primary-600"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load the dashboard"
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </>
      )}

      {!error && stats && recent && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Reports"
              value={stats.total}
              icon={ClipboardList}
              tone="primary"
              delta={deltas.reported}
            />
            <StatCard
              label="In Progress"
              value={stats.in_progress}
              icon={Hourglass}
              tone="info"
              delta={deltas.in_progress}
            />
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon={CircleCheck}
              tone="success"
              delta={deltas.resolved}
            />
            <StatCard label="Pending" value={stats.reported} icon={Clock} tone="warning" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Reports Map" href="/map" hrefLabel="Open the full map" height={260}>
              {mapReports.length > 0 ? (
                <DynamicMapView mode="browse" reports={mapReports} className="h-full" zoom={12} />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-ink-muted">
                  No reports to map yet.
                </p>
              )}
            </ChartCard>

            <ChartCard
              title="Recent Reports"
              href="/admin/reports"
              hrefLabel="View all reports"
              height={260}
            >
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto">
                  <RecentReportsTable reports={(recent ?? []).slice(0, RECENT_LIMIT)} />
                </div>
                <Link
                  href="/admin/reports"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                >
                  View all reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </ChartCard>

            <ChartCard
              title="Top Categories"
              href="/admin/reports"
              hrefLabel="Browse reports by category"
              height={260}
            >
              <div className="h-full overflow-y-auto">
                <TopCategoriesList data={stats.byCategory} />
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Reports by Category"
              href="/admin/reports"
              hrefLabel="Browse reports by category"
            >
              <CategoryBreakdownChart data={stats.byCategory} />
            </ChartCard>
            <ChartCard
              title="Reports by Status"
              href="/admin/reports"
              hrefLabel="Browse reports by status"
            >
              <StatusBreakdownChart stats={stats} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title={`Reports Trend (last ${trendDays} days)`}
              href="/admin/reports"
              hrefLabel="Browse reports"
            >
              <ReportsTrendChart trend={stats.trend} />
            </ChartCard>
            <ChartCard
              title="Department-wise"
              href="/admin/departments"
              hrefLabel="Manage departments"
            >
              <DepartmentBreakdownList data={stats.byDepartment} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}