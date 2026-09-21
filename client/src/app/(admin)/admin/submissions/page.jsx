'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import SubmissionTable from '@/components/admin/SubmissionTable';
import SubmissionReviewModal from '@/components/admin/SubmissionReviewModal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_revision', label: 'Needs Revision' },
];

const PAGE_SIZE = 20;

/**
 * `/admin/submissions` — review submitted resolution work (design brief §6). Filterable
 * table + review modal. Approving a submission goes through `review_submission`, which
 * closes the loop: task completed, resolution image attached to the report, citizen
 * notified, report marked resolved (sql/007_tasks_submissions.sql).
 */
export default function AdminSubmissionsPage() {
  const { request, isLoaded } = useApi();
  const { toast } = useToast();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [submissions, setSubmissions] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(
      authPaths.adminSubmissions({
        status: status || undefined,
        search: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    )
      .then((res) => {
        if (!active) return;
        setSubmissions(res.data);
        setTotal(res.meta.total);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, status, search, page, request, reloadKey]);

  const hasActiveFilters = status || search;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Submissions</h1>
        <p className="mt-1 text-ink-muted">
          Review completed task submissions and resolution updates.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <Input
            label="Search"
            hideLabel
            placeholder="Search by assigned person…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setStatus('');
              setSearch('');
              setPage(1);
            }}
            className="text-ink-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
        <span className="ml-auto self-center text-sm text-ink-muted">
          {submissions && !error ? `${total} submission${total === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load submissions"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && submissions === null && <Skeleton className="h-96 w-full" />}

      {!error && submissions && (
        <SubmissionTable submissions={submissions} onReview={setReviewing} />
      )}

      {!error && submissions?.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}

      <SubmissionReviewModal
        open={!!reviewing}
        submission={reviewing}
        onClose={() => setReviewing(null)}
        onReviewed={() => setReloadKey((k) => k + 1)}
        request={request}
        reviewPath={reviewing ? authPaths.adminSubmissionReview(reviewing.id) : ''}
        toast={toast}
      />
    </div>
  );
}