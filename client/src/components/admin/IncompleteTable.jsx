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

const PRIORITY_LABEL = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

function urgency(days) {
  if (days >= 4) return { tone: 'danger', label: 'Urgent', cls: 'text-danger' };
  if (days >= 2) return { tone: 'warning', label: 'Warning', cls: 'text-warning' };
  return { tone: 'neutral', label: 'Normal', cls: 'text-ink-muted' };
}

function formatDay(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Incomplete reports. Two layouts:
 *   - md+ : classic 8-column table
 *   - < md: card list with urgency color-coding
 *
 * Days-pending drives a color-coded urgency: 1 day normal, 2–3 warning, 4+ urgent.
 *
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
    <>
      {/* -------------------- Desktop / tablet table -------------------- */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
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
                    <span className="block max-w-[240px] truncate font-medium text-ink">
                      {r.title}
                    </span>
                    <span className="block text-xs text-ink-subtle">
                      #{r.report_id.slice(0, 8)}
                    </span>
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
                  <td className="px-4 py-3 text-ink-muted">{formatDay(r.last_update)}</td>
                  <td className="px-4 py-3">
                    {r.priority ? (
                      <Badge tone={PRIORITY_TONE[r.priority] ?? 'neutral'}>
                        {PRIORITY_LABEL[r.priority] ?? r.priority}
                      </Badge>
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

      {/* -------------------- Mobile card list -------------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {reports.map((r) => {
          const u = urgency(r.days_pending);
          return (
            <li key={r.report_id}>
              <Link
                href={`/admin/reports/${r.report_id}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 transition hover:border-primary-600/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      #{r.report_id.slice(0, 8)} · {getCategoryLabel(r.category_slug)}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${u.cls}`}>
                    {u.label === 'Urgent' ? (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {r.days_pending}d
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {r.priority ? (
                    <Badge tone={PRIORITY_TONE[r.priority] ?? 'neutral'}>
                      {PRIORITY_LABEL[r.priority] ?? r.priority}
                    </Badge>
                  ) : (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-ink-subtle">
                      No task
                    </span>
                  )}
                  {r.department_name && (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      {r.department_name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-subtle">
                  {r.assigned_to ? (
                    <span className="inline-flex items-center gap-0.5">
                      <User className="h-3 w-3" aria-hidden="true" />
                      <span className="truncate max-w-[160px]">{r.assigned_to}</span>
                    </span>
                  ) : (
                    <span className="italic">Unassigned</span>
                  )}
                  <span>Updated {formatDay(r.last_update)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}