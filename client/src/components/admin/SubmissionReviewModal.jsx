'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, ImageOff, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { getReportImageUrl } from '@/lib/utils/imageUrl';
import { timeAgo } from '@/lib/utils/timeAgo';

const GRADE_OPTIONS = [
  { value: '', label: 'No grade' },
  { value: 'A', label: 'A — Excellent' },
  { value: 'B', label: 'B — Good' },
  { value: 'C', label: 'C — Acceptable' },
  { value: 'D', label: 'D — Poor' },
];

/**
 * Submission review modal (design brief §6). Side-by-side before/after, work details,
 * grade + remarks, and the two decisions: Approve or Request Changes.
 *
 * Approving calls `PATCH /admin/submissions/:id/review` with `status: 'approved'`, which
 * via `review_submission` also closes the task, copies the resolution image to the
 * report's `after` gallery, and fires the citizen's "resolved" notification.
 *
 * @param {{
 *   open: boolean,
 *   submission: object | null,
 *   onClose: () => void,
 *   onReviewed: () => void,
 *   request: (path: string, options?: object) => Promise<any>,
 *   reviewPath: string,
 *   toast: (message: string, tone: string) => void,
 * }} props
 */
export default function SubmissionReviewModal({
  open,
  submission,
  onClose,
  onReviewed,
  request,
  reviewPath,
  toast,
}) {
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!submission) return null;

  const beforeImg = submission.report?.images?.find((i) => i.kind === 'before');
  const afterUrl = submission.resolution_image_path
    ? getReportImageUrl(submission.resolution_image_path)
    : null;
  const beforeUrl = beforeImg ? getReportImageUrl(beforeImg.storage_path) : null;

  async function submit(decision) {
    if (decision === 'needs_revision' && !remarks.trim()) {
      setError('Add a remark explaining what needs revising.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await request(reviewPath, {
        method: 'PATCH',
        body: {
          status: decision,
          grade: grade || undefined,
          remarks: remarks.trim() || undefined,
        },
      });
      toast(
        decision === 'approved'
          ? 'Submission approved — citizen notified'
          : 'Changes requested',
        'success',
      );
      onReviewed();
      onClose();
    } catch (err) {
      toast(err?.message || 'Could not review the submission', 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review submission"
      closeOnOverlay={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => submit('needs_revision')}
            loading={busy}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Request changes
          </Button>
          <Button size="sm" onClick={() => submit('approved')} loading={busy}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Approve & resolve
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            {submission.task?.title ?? submission.report?.title ?? 'Submission'}
          </p>
          <p className="text-xs text-ink-subtle">
            {submission.assigned_person} · submitted {timeAgo(submission.submitted_at)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Before
            </p>
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-bg">
              {beforeUrl ? (
                <Image src={beforeUrl} alt="Before fix" fill sizes="240px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-subtle">
                  <ImageOff className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              After
            </p>
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-bg">
              {afterUrl ? (
                <Image src={afterUrl} alt="After fix" fill sizes="240px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-subtle">
                  <ImageOff className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>

        {submission.details && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Work details
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{submission.details}</p>
          </div>
        )}

        {submission.status !== 'pending_review' && (
          <div className="rounded-md border border-border bg-bg p-3">
            <Badge tone="neutral">Already {submission.status.replace('_', ' ')}</Badge>
            {submission.remarks && (
              <p className="mt-2 text-sm text-ink-muted">{submission.remarks}</p>
            )}
          </div>
        )}

        <Select
          label="Grade (optional)"
          options={GRADE_OPTIONS}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />

        <Textarea
          label="Remarks"
          placeholder="Required if requesting changes; otherwise optional."
          maxLength={500}
          value={remarks}
          error={error}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (error) setError('');
          }}
        />
      </div>
    </Modal>
  );
}