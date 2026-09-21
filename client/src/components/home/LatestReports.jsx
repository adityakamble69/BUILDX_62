'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listReports } from '@/lib/api';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import ReportCard from '@/components/report/ReportCard';
import { ReportCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

// 3 cards, matching the landing mockup (was 4).
const PAGE_SIZE = 3;

export default function LatestReports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listReports({ pageSize: PAGE_SIZE, sort: 'newest' }, controller.signal)
      .then((res) => setReports(res.data))
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Latest Reports</h2>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load reports"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && reports === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && reports?.length === 0 && (
        <EmptyState
          title="No reports yet"
          description="Be the first to flag something that needs fixing."
          actionLabel="Report an Issue"
          onAction={() => {
            window.location.href = '/report/new';
          }}
        />
      )}

      {!error && reports?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </section>
  );
}