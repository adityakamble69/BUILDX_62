'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, Percent } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import CategoryBreakdownChart from '@/components/admin/CategoryBreakdownChart';
import StatusBreakdownChart from '@/components/admin/StatusBreakdownChart';
import ReportsTrendChart from '@/components/admin/ReportsTrendChart';
import DepartmentPerformanceTable from '@/components/admin/DepartmentPerformanceTable';
import DynamicMapView from '@/components/map/DynamicMapView';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatAvgResolveTime } from '@/lib/utils/duration';

/**
 * `/admin/analytics` — insights page (design brief §8). Fetches `GET /admin/analytics`
 * (KPIs, category breakdown, department performance, status distribution) + two existing
 * endpoints reused as-is: `GET /admin/stats` for the 7-day trend and `GET /admin/heatmap`
 * for the hotspot map.
 */
const TREND_DAYS = 7;

export default function AdminAnalyticsPage() {
  const { request, isLoaded } = useApi();

  const [analytics, setAnalytics] = useState(null);
  const [trend, setTrend] = useState(null);
  const [heatPoints, setHeatPoints] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    Promise.all([
      request(authPaths.adminAnalytics),
      request(authPaths.adminStats({ trendDays: TREND_DAYS })),
      request(authPaths.adminHeatmap),
    ])
      .then(([a, s, h]) => {
        if (!active) return;
        setAnalytics(a.data);
        setTrend(s.data.trend);
        setHeatPoints(h.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request]);

  const loading = !error && (!analytics || !trend || !heatPoints);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Analytics</h1>
        <p className="mt-1 text-ink-muted">
          Insights and performance metrics for better city decisions.
        </p>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load analytics"
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
        </>
      )}

      {!error && analytics && trend && heatPoints && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Reports"
              value={analytics.kpis.total ?? 0}
              icon={ClipboardList}
              tone="primary"
            />
            <StatCard
              label="Resolved"
              value={analytics.kpis.resolved ?? 0}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Resolution Rate"
              value={`${analytics.kpis.resolution_rate ?? 0}%`}
              icon={Percent}
              tone="info"
            />
            <StatCard
              label="Avg Fix Time"
              value={formatAvgResolveTime(analytics.kpis.avg_fix_hours)}
              icon={Clock}
              tone="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Reports by Category">
              <CategoryBreakdownChart data={analytics.byCategory} />
            </ChartCard>
            <ChartCard title="Status Distribution">
              <StatusBreakdownChart stats={analytics.statusDistribution} />
            </ChartCard>
          </div>

          <ChartCard title={`Reports Trend (last ${TREND_DAYS} days)`}>
            <ReportsTrendChart trend={trend} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="City Hotspot Map" height={340}>
              {heatPoints.length > 0 ? (
                <DynamicMapView mode="heat" heatPoints={heatPoints} className="h-full" />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-ink-muted">
                  No reports to map yet.
                </p>
              )}
            </ChartCard>
            <ChartCard title="Department Performance" height={340}>
              <DepartmentPerformanceTable data={analytics.byDepartment} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}