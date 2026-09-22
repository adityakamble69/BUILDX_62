'use client';

import { CheckCircle2, Eye, ImageOff, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getReportImageUrl } from '@/lib/utils/imageUrl';
import { timeAgo } from '@/lib/utils/timeAgo';

const STATUS_TONE = {
  pending_review: 'warning',
  approved: 'success',
  needs_revision: 'danger',
};

const STATUS_LABEL = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  needs_revision: 'Needs Revision',
};

/**
 * Submissions table. Two layouts:
 *   - md+ : classic 7-column table
 *   - < md: card list with a full-width "Review" button
 *
 * @param {{ submissions: Array<object>, onReview: (submission: object) => void }} props
 */
export default function SubmissionTable({ submissions = [], onReview }) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
        No submissions yet. They appear here once teams upload resolution evidence.
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
              <th className="px-4 py-3">Submission</th>
              <th className="px-4 py-3">Task / Report</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Resolution</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const imageUrl = s.resolution_image_path
                ? getReportImageUrl(s.resolution_image_path)
                : null;
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">#{s.id.slice(0, 8)}</span>
                    {s.grade && (
                      <span className="block text-xs text-ink-subtle">Grade {s.grade}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block max-w-[240px] truncate font-medium text-ink">
                      {s.task?.title ?? s.report?.title ?? '—'}
                    </span>
                    <span className="block max-w-[240px] truncate text-xs text-ink-subtle">
                      {s.report?.area_name ?? ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{s.assigned_person}</td>
                  <td className="px-4 py-3 text-ink-muted">{timeAgo(s.submitted_at)}</td>
                  <td className="px-4 py-3">
                    {imageUrl ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                        Attached
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
                        <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[s.status] ?? 'neutral'}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => onReview(s)}>
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Review
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -------------------- Mobile card list -------------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {submissions.map((s) => {
          const imageUrl = s.resolution_image_path
            ? getReportImageUrl(s.resolution_image_path)
            : null;
          return (
            <li
              key={s.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                    {s.task?.title ?? s.report?.title ?? '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-subtle">
                    #{s.id.slice(0, 8)}
                    {s.grade ? ` · Grade ${s.grade}` : ''}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[s.status] ?? 'neutral'} className="shrink-0">
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-subtle">
                <span className="inline-flex items-center gap-0.5">
                  <User className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate max-w-[160px]">{s.assigned_person}</span>
                </span>
                <span>{timeAgo(s.submitted_at)}</span>
                {imageUrl ? (
                  <span className="inline-flex items-center gap-0.5 text-success">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Photo attached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5">
                    <ImageOff className="h-3 w-3" aria-hidden="true" />
                    No photo
                  </span>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => onReview(s)}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                Review submission
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}