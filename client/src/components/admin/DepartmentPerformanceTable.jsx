import { cn } from '@/lib/utils/cn';

function formatHours(h) {
  if (h == null) return '—';
  if (h < 24) return `${Math.round(h)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

/**
 * Department performance table (design brief §8). Data from `get_department_performance`
 * (sql/007_tasks_submissions.sql) via `GET /admin/analytics`.
 * @param {{ data: Array<{ department_id, name, total, resolved, resolution_rate, avg_fix_hours }> }} props
 */
export default function DepartmentPerformanceTable({ data = [] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No departments yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            <th className="py-2 pr-3">Department</th>
            <th className="py-2 pr-3 text-right">Total</th>
            <th className="py-2 pr-3 text-right">Resolved</th>
            <th className="py-2 pr-3 text-right">Rate</th>
            <th className="py-2 text-right">Avg Fix</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const rate = d.resolution_rate ?? 0;
            const rateClass =
              rate >= 70 ? 'text-success' : rate >= 40 ? 'text-warning' : 'text-danger';
            return (
              <tr key={d.department_id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3 font-medium text-ink">{d.name}</td>
                <td className="py-2.5 pr-3 text-right text-ink-muted">{d.total}</td>
                <td className="py-2.5 pr-3 text-right text-ink-muted">{d.resolved}</td>
                <td className={cn('py-2.5 pr-3 text-right font-semibold', rateClass)}>
                  {rate}%
                </td>
                <td className="py-2.5 text-right text-ink-muted">{formatHours(d.avg_fix_hours)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}