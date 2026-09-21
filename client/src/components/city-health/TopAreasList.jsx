/**
 * Ranked horizontal bars for the busiest areas (City Health mockup). Data is computed
 * client-side from a page of `/reports` (see city-health/page.jsx's `computeTopAreas`)
 * because there's no dedicated public "top areas" endpoint yet — it therefore reflects
 * the fetched page, not the whole DB.
 * @param {{ data: Array<{ area: string, count: number, pct: number }> }} props
 */
export default function TopAreasList({ data = [] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No area data yet.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <ul className="flex flex-col gap-3">
      {data.map((area, i) => (
        <li key={area.area} className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{area.area}</span>
          </span>
          <span className="w-16 shrink-0 text-right text-sm font-semibold text-ink">
            {area.count}
          </span>
          <span className="w-14 shrink-0 text-right text-xs text-ink-subtle">{area.pct}%</span>
        </li>
      ))}
    </ul>
  );
}