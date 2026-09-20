'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { listReports } from '@/lib/api';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { CATEGORY_LABELS } from '@/lib/utils/categories';
import { STATUS_META } from '@/components/ui/StatusBadge';
import ReportCard from '@/components/report/ReportCard';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'upvotes', label: 'Sort: Most upvoted' },
];

const PAGE_SIZE = 12;

export default function ReportsPage() {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    listReports(
      { category: category || undefined, status: status || undefined, sort, page, pageSize: PAGE_SIZE },
      controller.signal,
    )
      .then((res) => {
        setReports(res.data);
        setTotal(res.meta.total);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, [category, status, sort, page]);

  const hasActiveFilters = category || status || sort !== 'newest';

  function clearFilters() {
    setCategory('');
    setStatus('');
    setSort('newest');
    setPage(1);
  }

  // Any filter/sort change invalidates the current page (e.g. page 3 may no longer
  // exist under the new filter) — jump back to page 1 rather than showing an empty page.
  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Reports</h1>
        <p className="mt-1 text-ink-muted">Browse civic issues reported across the city.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Category"
            hideLabel
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => updateFilter(setCategory)(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => updateFilter(setStatus)(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Sort"
            hideLabel
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => updateFilter(setSort)(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters} className="text-ink-muted">
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
        <span className="ml-auto self-center text-sm text-ink-muted">
          {reports && !error ? `${total} report${total === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load reports"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && reports === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && reports?.length === 0 && (
        <EmptyState
          title="No reports match these filters"
          description="Try a different category or status."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      )}

      {!error && reports?.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                id={r.id}
                title={r.title}
                status={r.status}
                category={r.category?.slug}
                areaName={r.area_name}
                upvoteCount={r.upvote_count}
                createdAt={r.created_at}
                thumbnailUrl={getThumbnailUrl(r.images)}
              />
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
