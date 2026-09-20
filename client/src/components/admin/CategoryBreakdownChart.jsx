'use client';

import { Doughnut } from 'react-chartjs-2';
import '@/components/admin/chartSetup';

// design.md §10: categorical series use primary-600 / accent-500 / secondary-600, plus
// the other neutrals/semantics so all 6 seeded categories (pothole..other) get a
// distinct, on-token color rather than Chart.js's default palette.
const PALETTE = ['#0F766E', '#F59E0B', '#1E293B', '#16A34A', '#DC2626', '#2563EB'];

/**
 * @param {{ data: Array<{ slug: string, name: string, total: number }> }} props
 *   `data` is `get_category_breakdown()`'s rows, as returned by `GET /admin/stats`.
 */
export default function CategoryBreakdownChart({ data = [] }) {
  if (data.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-ink-muted">No data yet.</p>;
  }

  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.name),
        datasets: [
          {
            data: data.map((d) => d.total),
            backgroundColor: PALETTE,
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
