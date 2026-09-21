// Same categorical palette as CategoryBreakdownChart so the two read as one system
// (design.md §10: primary-600 / accent-500 / secondary-600 + on-token neutrals).
const PALETTE = ['#0F766E', '#F59E0B', '#1E293B', '#16A34A', '#DC2626', '#2563EB'];

/**
 * Horizontal bar list — plain divs rather than Chart.js, since it's just proportional
 * widths against one max value (same reasoning as DepartmentBreakdownList).
 * @param {{ data: Array<{ slug: string, name: string, total: number }> }} props
 *   `data` is `get_category_breakdown()`'s rows, as returned by `GET /admin/stats`.
 */
export default function TopCategoriesList({ data = [] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No categories yet.</p>;
  }

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...sorted.map((d) => d.total));

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((cat, i) => (
        <li key={cat.slug ?? cat.name} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-ink-muted">{cat.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(4, (cat.total / max) * 100)}%`,
                backgroundColor: PALETTE[i % PALETTE.length],
              }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink">{cat.total}</span>
        </li>
      ))}
    </ul>
  );
}