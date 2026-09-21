'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { getCategoryLabel } from '@/lib/utils/categories';

const PRIORITY_TONE = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

function urgency(days) {
  if (days >= 4) return { tone: 'danger', label: 'Urgent', cls: 'text-danger' };
  if (days >= 2) return { tone: 'warning', label: 'Warning', cls: 'text-warning' };
  return { tone: 'neutral', label: 'Normal', cls: 'text-ink-muted' };
}

/**
 * Incomplete reports table (design brief §7). Days-pending drives a color-coded
 * urgency: 1 day normal, 2–3 warning, 4+ urgent. Data from `GET /admin/incomplete`
 * (`get_incomplete_reports`, sql/007_tasks_submissions.sql).
 * @param {{ reports: Array<object> }} props
 */
export default function IncompleteTable({ reports = [] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
        Nothing incomplete — the city is caught up.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            <th className="px-4 py-3">Report</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Assigned To</th>
            <th className="px-4 py-3">Days Pending</th>
            <th className="px-4 py-3">Last Update</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => {
            const u = urgency(r.days_pending);
            return (
              <tr key={r.report_id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3">
                  <span className="block max-w-[240px] truncate font-medium text-ink">{r.title}</span>
                  <span className="block text-xs text-ink-subtle">#{r.report_id.slice(0, 8)}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{getCategoryLabel(r.category_slug)}</td>
                <td className="px-4 py-3 text-ink-muted">{r.department_name || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.assigned_to ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {r.assigned_to}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 font-semibold ${u.cls}`}>
                    {u.label === 'Urgent' ? (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {r.days_pending}d
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(r.last_update).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  {r.priority ? (
                    <Badge tone={PRIORITY_TONE[r.priority] ?? 'neutral'}>{r.priority}</Badge>
                  ) : (
                    <span className="text-xs text-ink-subtle">No task</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/reports/${r.report_id}`}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}