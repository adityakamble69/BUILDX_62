'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Clock, MapPin, TriangleAlert } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { getCategoryIcon, getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';
import { timeAgo } from '@/lib/utils/timeAgo';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGallery from '@/components/report/PhotoGallery';
import StatusTimeline from '@/components/report/StatusTimeline';
import UpvoteButton from '@/components/report/UpvoteButton';
import CommentsSection from '@/components/report/CommentsSection';
import DynamicMapView from '@/components/map/DynamicMapView';

/**
 * `GET /reports/:id` is a public route, but it's fetched through `useApi` (not the plain
 * `getReportById` helper) so a signed-in viewer's token rides along — the server uses it
 * to return `viewerHasUpvoted`, which `UpvoteButton` needs for correct initial state.
 * That's also why the fetch waits for Clerk's `isLoaded`: calling earlier would send no
 * token and show a signed-in user an un-upvoted button.
 */
export default function ReportDetailPage() {
  const { id } = useParams();
  const { request, isLoaded } = useApi();

  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !id) return;
    let active = true;

    setError(null);
    request(authPaths.reportDetail(id))
      .then((res) => {
        if (active) setReport(res.data);
      })
      .catch((err) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [id, isLoaded, request]);

  if (error) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-12 md:px-6">
        <EmptyState
          icon={TriangleAlert}
          title={error.status === 404 ? 'Report not found' : "Couldn't load this report"}
          description={
            error.status === 404
              ? 'It may have been removed, or the link is wrong.'
              : 'The server may still be waking up — try again in a few seconds.'
          }
        />
        <div className="mt-6 text-center">
          <Link href="/reports" className="text-sm font-semibold text-primary-600 hover:underline">
            ← Back to all reports
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return <ReportDetailSkeleton />;

  const CategoryIcon = getCategoryIcon(report.category?.slug);

  const facts = [
    { label: 'Category', value: getCategoryLabel(report.category?.slug), icon: CategoryIcon },
    { label: 'Severity', value: `${getSeverityLabel(report.severity)} (${report.severity}/5)`, icon: TriangleAlert },
    { label: 'Department', value: report.department?.name ?? 'Not assigned yet', icon: Building2 },
    { label: 'Reported', value: timeAgo(report.created_at), icon: Clock },
  ];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:px-6">
      <Link
        href="/reports"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to reports
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <PhotoGallery images={report.images} title={report.title} />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">{report.title}</h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {report.area_name || 'Location on map'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {timeAgo(report.created_at)}
              </span>
              <span>Reported by {report.reporter?.display_name || 'a citizen'}</span>
            </p>
          </div>

          {report.description && (
            <section aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-xl font-semibold">
                Description
              </h2>
              {/* Plain text render only (rules.md §7). */}
              <p className="mt-2 whitespace-pre-line text-ink-muted">{report.description}</p>
            </section>
          )}

          {report.status === 'rejected' && report.reject_reason && (
            <Card className="border-status-rejected/40 bg-status-rejected/5">
              <p className="text-sm font-semibold text-ink">Why this was rejected</p>
              <p className="mt-1 text-sm text-ink-muted">{report.reject_reason}</p>
            </Card>
          )}

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-lg border border-border bg-surface p-3">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-subtle">
                  <fact.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <CommentsSection reportId={report.id} initialComments={report.comments} />
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <UpvoteButton
              reportId={report.id}
              initialCount={report.upvote_count}
              initialUpvoted={report.viewerHasUpvoted}
            />
            <p className="mt-2 text-center text-xs text-ink-subtle">
              Upvotes help the city prioritise this issue.
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Status</h2>
            <div className="mt-4">
              {report.statusHistory?.length > 0 ? (
                <StatusTimeline history={report.statusHistory} />
              ) : (
                <p className="text-sm text-ink-muted">No status updates yet.</p>
              )}
            </div>
          </Card>

          {report.lat != null && report.lng != null && (
            <Card padding="none" className="overflow-hidden">
              <DynamicMapView
                className="h-[240px]"
                center={[report.lat, report.lng]}
                zoom={16}
                reports={[
                  {
                    id: report.id,
                    lat: report.lat,
                    lng: report.lng,
                    status: report.status,
                    title: report.title,
                    categoryLabel: getCategoryLabel(report.category?.slug),
                    areaName: report.area_name,
                    upvoteCount: report.upvote_count,
                  },
                ]}
              />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReportDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton variant="text" className="h-7 w-2/3" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
