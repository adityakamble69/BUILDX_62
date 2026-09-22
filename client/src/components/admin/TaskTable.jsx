'use client';

import Link from 'next/link';
import { Calendar, User, BadgeCheck } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { getCategoryLabel } from '@/lib/utils/categories';

const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' };
const STATUS_TONE = { pending: 'neutral', in_progress: 'info', completed: 'success' };
const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(task) {
  return (
    task.due_date &&
    task.status !== 'completed' &&
    new Date(task.due_date) < new Date(new Date().toDateString())
  );
}

/**
 * Assign Task table. Two layouts:
 *   - md+ : classic 8-column table
 *   - < md: card list (a `min-w-[900px]` table on a 360px phone is unusable)
 *
 * @param {{ tasks: Array<object> }} props
 */
export default function TaskTable({ tasks = [] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
        No tasks assigned yet. Use the form above to assign your first one.
      </div>
    );
  }

  return (
    <>
      {/* -------------------- Desktop / tablet table -------------------- */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const overdue = isOverdue(t);
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3">
                    <span className="block max-w-[200px] truncate font-medium text-ink">
                      {t.title}
                    </span>
                    <span className="block text-xs text-ink-subtle">#{t.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.report ? (
                      <Link
                        href={`/admin/reports/${t.report.id}`}
                        className="block max-w-[220px] truncate font-medium text-ink hover:text-primary-600"
                      >
                        {t.report.title}
                      </Link>
                    ) : (
                      <span className="text-ink-subtle">—</span>
                    )}
                    {t.report?.category && (
                      <span className="block text-xs text-ink-subtle">
                        {getCategoryLabel(t.report.category.slug)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {t.assigned_to ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t.assigned_to}</span>
                        {t.assigned_to_id && (
                          <BadgeCheck
                            className="h-3.5 w-3.5 text-primary-600"
                            aria-label="Worker account assigned"
                            title="Assigned to a registered worker"
                          />
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>
                      {PRIORITY_LABEL[t.priority] ?? t.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.due_date ? (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue ? 'font-semibold text-danger' : 'text-ink-muted'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDate(t.due_date)}
                      </span>
                    ) : (
                      <span className="text-ink-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[t.status] ?? 'neutral'}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.report && (
                      <Link
                        href={`/admin/reports/${t.report.id}`}
                        className="text-xs font-semibold text-primary-600 hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -------------------- Mobile card list -------------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {tasks.map((t) => {
          const overdue = isOverdue(t);
          const reportHref = t.report ? `/admin/reports/${t.report.id}` : null;
          const CardWrapper = reportHref ? Link : 'div';
          const wrapperProps = reportHref ? { href: reportHref } : {};
          return (
            <li key={t.id}>
              <CardWrapper
                {...wrapperProps}
                className="block overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-subtle">#{t.id.slice(0, 8)}</p>
                    </div>
                    <Badge tone={STATUS_TONE[t.status] ?? 'neutral'} className="shrink-0">
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </div>

                  {t.report && (
                    <p className="truncate text-xs text-ink-muted">
                      Issue: {t.report.title}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>
                      {PRIORITY_LABEL[t.priority] ?? t.priority}
                    </Badge>
                    {t.department?.name && (
                      <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                        {t.department.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-subtle">
                    {t.assigned_to && (
                      <span className="inline-flex items-center gap-0.5">
                        <User className="h-3 w-3" aria-hidden="true" />
                        <span className="truncate max-w-[140px]">{t.assigned_to}</span>
                        {t.assigned_to_id && (
                          <BadgeCheck className="h-3 w-3 text-primary-600" aria-hidden="true" />
                        )}
                      </span>
                    )}
                    {t.due_date && (
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          overdue ? 'font-semibold text-danger' : ''
                        }`}
                      >
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        Due {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </CardWrapper>
            </li>
          );
        })}
      </ul>
    </>
  );
}