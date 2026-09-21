'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import ReportCard from '@/components/report/ReportCard';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

// rules.md §5 — list endpoints cap at 100. A single citizen's own reports fit in one
// page in practice, which is what makes the client-side tabs below correct. If the cap
// is ever hit, the "Open"/"Resolved" counts would under-report — the real fix is a
// `status` param on GET /me/reports (memory.md D36), not a bigger cap.
const FETCH_LIMIT = 100;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
];

/**
 * `/my-reports` — the citizen's own submissions (`GET /me/reports`). `middleware.js`
 * already redirects guests to sign-in; the fetch still waits for Clerk's `isLoaded`
 * because the request needs the token.
 *
 * Tabs are client-side (All / Open / Resolved) and reflect the fetched page — accurate
 * for a typical account. See FETCH_LIMIT note above for the edge case.
 */
export default function MyReportsPage() {
  const { request, isLoaded } = useApi();
  const router = useRouter();

  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.myReports({ page: 1, pageSize: FETCH_LIMIT }))
      .then((res) => {
        if (active) setReports(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request]);

  const counts = useMemo(() => {
    const list = reports ?? [];
    return {
      all: list.length,
      open: list.filter((r) => r.status === 'reported' || r.status === 'in_progress').length,
      resolved: list.filter((r) => r.status === 'resolved').length,
    };
  }, [reports]);

  const visible = useMemo(() => {
    if (!reports) return null;
    if (tab === 'open') return reports.filter((r) => r.status === 'reported' || r.status === 'in_progress');
    if (tab === 'resolved') return reports.filter((r) => r.status === 'resolved');
    return reports;
  }, [reports, tab]);

  return (
    <div className={cn('flex w-full flex-col gap-6 py-8 md:py-10', PAGE_PADDING)}>
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">My Reports</h1>
        <p className="mt-1 text-ink-muted">Track the status of everything you have submitted.</p>
      </div>

      {/* Tabs — client-side filter over the fetched list */}
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Report filters">
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = reports ? counts[key] : null;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition',
                active
                  ? 'text-primary-600'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {label}
              {count !== null && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    active ? 'bg-primary-50 text-primary-600' : 'bg-bg text-ink-subtle',
                  )}
                >
                  {count}
                </span>
              )}
              {active && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <EmptyState
          title="Couldn't load your reports"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && reports === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && reports?.length === 0 && (
        <EmptyState
          icon={FileText}
          title="You haven't reported anything yet"
          description="Spotted a pothole, a broken streetlight or overflowing garbage? Let the city know."
          actionLabel="Report an issue"
          onAction={() => router.push('/report/new')}
        />
      )}

      {!error && reports?.length > 0 && visible?.length === 0 && (
        <EmptyState
          title={`No ${tab} reports`}
          description="Nothing matches this tab yet."
        />
      )}

      {!error && visible?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((r) => (
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
      )}
    </div>
  );
}