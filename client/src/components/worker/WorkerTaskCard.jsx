'use client';

import Link from 'next/link';
import { Calendar, MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getCategoryLabel } from '@/lib/utils/categories';

const PRIORITY_TONE = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const STATUS_TONE = {
  pending: 'neutral',
  in_progress: 'info',
  completed: 'success',
};

const STATUS_LABEL = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const SUBMISSION_TONE = {
  pending_review: 'warning',
  approved: 'success',
  needs_revision: 'danger',
};

const SUBMISSION_LABEL = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  needs_revision: 'Needs Revision',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * One task card for the worker dashboard. Shows what needs doing, where, by when, and
 * (if they've already submitted) the current review status of their submission. The
 * `Submit proof` button is hidden once a submission is pending review or approved —
 * re-submitting is only allowed when the previous one was sent back for revision.
 *
 * @param {{
 *   task: object,
 *   onSubmit: (task: object) => void,
 * }} props
 */
export default function WorkerTaskCard({ task, onSubmit }) {
  const overdue =
    task.due_date &&
    task.status !== 'completed' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  const canSubmit =
    task.status !== 'completed' &&
    (!task.latest_submission_status ||
      task.latest_submission_status === 'needs_revision');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
            {task.title}
          </h3>
          {task.report && (
            <Link
              href={`/reports/${task.report_id}`}
              className="mt-0.5 block text-xs text-ink-muted hover:text-primary-600"
            >
              Linked report: {task.report_title}
            </Link>
          )}
        </div>
        <Badge tone={STATUS_TONE[task.status] ?? 'neutral'}>
          {STATUS_LABEL[task.status] ?? task.status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone={PRIORITY_TONE[task.priority] ?? 'neutral'}>
          {task.priority}
        </Badge>
        {task.department_name && <Badge tone="neutral">{task.department_name}</Badge>}
        {task.category_slug && (
          <Badge tone="neutral">{getCategoryLabel(task.category_slug)}</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        {task.area_name && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {task.area_name}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-danger' : ''}`}>
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          Due {formatDate(task.due_date)}
        </span>
      </div>

      {task.description && (
        <p className="line-clamp-3 text-sm text-ink-muted">{task.description}</p>
      )}

      {task.latest_submission_status && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-xs">
          {task.latest_submission_status === 'approved' ? (
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          ) : task.latest_submission_status === 'needs_revision' ? (
            <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />
          ) : (
            <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
          )}
          <span className="text-ink-muted">
            Your submission:{' '}
            <span className="font-semibold">
              {SUBMISSION_LABEL[task.latest_submission_status]}
            </span>
          </span>
        </div>
      )}

      {canSubmit && (
        <div className="mt-1 flex justify-end">
          <Button size="sm" onClick={() => onSubmit(task)}>
            Submit proof
          </Button>
        </div>
      )}
    </div>
  );
}