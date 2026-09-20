'use client';

import { Line } from 'react-chartjs-2';
import '@/components/admin/chartSetup';

const SERIES = [
  { key: 'reported', label: 'Reported', color: '#F59E0B' },
  { key: 'in_progress', label: 'In progress', color: '#2563EB' },
  { key: 'resolved', label: 'Resolved', color: '#16A34A' },
];

/**
 * @param {{ trend: Array<{ day: string, reported: number, in_progress: number, resolved: number }> }} props
 *   `trend` is `get_reports_trend()`'s rows, as returned by `GET /admin/stats`.
 */
export default function ReportsTrendChart({ trend = [] }) {
  if (trend.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-ink-muted">No data yet.</p>;
  }

  const labels = trend.map((row) =>
    new Date(row.day).toLocaleDateString(undefined, { weekday: 'short' }),
  );

  return (
    <Line
      data={{
        labels,
        datasets: SERIES.map(({ key, label, color }) => ({
          label,
          data: trend.map((row) => Number(row[key] ?? 0)),
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          pointRadius: 3,
        })),
      }}
      options={{
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } },
        },
      }}
    />
  );
}
