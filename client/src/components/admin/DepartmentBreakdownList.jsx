/**
 * Simple horizontal bar list for department load — plain divs rather than a Chart.js
 * bar chart, since it's just proportional widths against one max value (design.md §10
 * still applies: it has a title, via `ChartCard`, its caller).
 * @param {{ data: Array<{ department_id: number, name: string, total: number }> }} props
 *   `data` is `get_department_breakdown()`'s rows, as returned by `GET /admin/stats`.
 */
export default function DepartmentBreakdownList({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.total));

  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No departments yet.</p>;
  }

  return (
    <ul className="flex h-full flex-col justify-center gap-3">
      {data.map((dep) => (
        <li key={dep.department_id} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-ink-muted">{dep.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
            <span
              className="block h-full rounded-full bg-primary-600"
              style={{ width: `${Math.max(4, (dep.total / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink">{dep.total}</span>
        </li>
      ))}
    </ul>
  );
}
