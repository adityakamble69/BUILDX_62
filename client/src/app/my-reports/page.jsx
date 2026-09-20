'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import ReportCard from '@/components/report/ReportCard';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 12;

/**
 * `/my-reports` — the citizen's own submissions (`GET /me/reports`, newest first).
 * `middleware.js` already redirects guests to sign-in, so this page assumes a session;
 * it still waits for Clerk's `isLoaded` before calling, since the request needs the token.
 *
 * No status tabs: `/me/reports` only takes pagination, so an "Open / Resolved" tab would
 * have to filter the current page client-side and would silently miss matching reports on
 * other pages — the same reason `/reports` has no client-side search box. If tabs are
 * wanted, the endpoint needs a `status` param first (architecture.md would change too).
 */
export default function MyReportsPage() {
  const { request, isLoaded } = useApi();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [reports, setReports] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.myReports({ page, pageSize: PAGE_SIZE }))
      .then((res) => {
        if (!active) return;
        setReports(res.data);
        setTotal(res.meta.total);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, page, request]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">My reports</h1>
        <p className="mt-1 text-ink-muted">Track the status of everything you have submitted.</p>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load your reports"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && reports === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {!error && reports?.length > 0 && (
        <>
          <p className="text-sm text-ink-muted">
            {total} report{total === 1 ? '' : 's'} submitted
          </p>
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
