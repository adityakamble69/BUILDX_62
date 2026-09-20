'use client';

import { Doughnut } from 'react-chartjs-2';
import '@/components/admin/chartSetup';
import { STATUS_META } from '@/components/ui/StatusBadge';

// design.md §2 — same hex values as the status badges and map markers.
const STATUS_COLORS = { reported: '#F59E0B', in_progress: '#2563EB', resolved: '#16A34A', rejected: '#6B7280' };
const ORDER = ['reported', 'in_progress', 'resolved', 'rejected'];

/**
 * @param {{ stats: { reported: number, in_progress: number, resolved: number, rejected: number } }} props
 *   `stats` is `get_admin_stats()`'s single row, as returned by `GET /admin/stats`.
 */
export default function StatusBreakdownChart({ stats }) {
  const values = ORDER.map((key) => Number(stats?.[key] ?? 0));
  const hasData = values.some((v) => v > 0);

  if (!hasData) {
    return <p className="flex h-full items-center justify-center text-sm text-ink-muted">No data yet.</p>;
  }

  return (
    <Doughnut
      data={{
        labels: ORDER.map((key) => STATUS_META[key].label),
        datasets: [
          {
            data: values,
            backgroundColor: ORDER.map((key) => STATUS_COLORS[key]),
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        },
      }}
    />
  );
}
