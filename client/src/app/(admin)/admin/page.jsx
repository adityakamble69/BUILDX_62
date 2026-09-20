'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Clock, Hourglass, CircleCheck } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import CategoryBreakdownChart from '@/components/admin/CategoryBreakdownChart';
import StatusBreakdownChart from '@/components/admin/StatusBreakdownChart';
import ReportsTrendChart from '@/components/admin/ReportsTrendChart';
import DepartmentBreakdownList from '@/components/admin/DepartmentBreakdownList';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const TREND_DAYS = 7;

/**
 * `/admin` — KPI cards + Chart.js charts (phases.md Phase 7). Replaces the Phase 4
 * placeholder that only proved the role guard worked.
 */
export default function AdminDashboardPage() {
  const { request, isLoaded } = useApi();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.adminStats({ trendDays: TREND_DAYS }))
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Dashboard</h1>
        <p className="mt-1 text-ink-muted">Overview of all reports and system activity.</p>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load the dashboard"
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
            <StatCard label="In Progress" value={stats.in_progress} icon={Hourglass} tone="info" />
            <StatCard label="Resolved" value={stats.resolved} icon={CircleCheck} tone="success" />
            <StatCard label="Pending" value={stats.reported} icon={Clock} tone="warning" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Reports by Category">
              <CategoryBreakdownChart data={stats.byCategory} />
            </ChartCard>
            <ChartCard title="Reports by Status">
              <StatusBreakdownChart stats={stats} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title={`Reports Trend (last ${TREND_DAYS} days)`}>
              <ReportsTrendChart trend={stats.trend} />
            </ChartCard>
            <ChartCard title="Department-wise">
              <DepartmentBreakdownList data={stats.byDepartment} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
