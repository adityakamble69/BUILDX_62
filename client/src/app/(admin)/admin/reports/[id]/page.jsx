'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowUp, Clock, MapPin } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';
import { timeAgo } from '@/lib/utils/timeAgo';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGallery from '@/components/report/PhotoGallery';
import StatusTimeline from '@/components/report/StatusTimeline';
import AssignDepartmentForm from '@/components/admin/AssignDepartmentForm';
import StatusChangeForm from '@/components/admin/StatusChangeForm';
import ResolutionImageUpload from '@/components/admin/ResolutionImageUpload';
import AdminCommentsModeration from '@/components/admin/AdminCommentsModeration';
import DeleteReportButton from '@/components/admin/DeleteReportButton';

/**
 * `/admin/reports/[id]` — the resolution workflow: assign a department, change status
 * with a note, attach an after photo, moderate comments, delete (phases.md Phase 7).
 *
 * There's no `GET /admin/reports/:id` — this reuses the public `GET /reports/:id`
 * (architecture.md's endpoint list has no admin-only detail route), fetched through
 * `useApi` so the admin's token rides along like any other authenticated call.
 */
export default function AdminReportManagePage() {
  const { id } = useParams();
  const { request, isLoaded } = useApi();

  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !id) return undefined;
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

  // Re-fetches after any admin action rather than patching local state field-by-field —
  // a status change also rewrites statusHistory, and a resolution-image upload also
  // rewrites images, so a full refetch is simpler and no more expensive than a page load.
  function refetch() {
    setReport(null);
    request(authPaths.reportDetail(id)).then((res) => setReport(res.data));
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[700px]">
        <EmptyState
          title={error.status === 404 ? 'Report not found' : "Couldn't load this report"}
          description={
            error.status === 404
              ? 'It may have been deleted, or the link is wrong.'
              : 'The server may still be waking up — try again in a few seconds.'
          }
        />
        <div className="mt-6 text-center">
          <Link href="/admin/reports" className="text-sm font-semibold text-primary-600 hover:underline">
            ← Back to reports
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return <ManageSkeleton />;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <Link
        href="/admin/reports"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to reports
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <PhotoGallery images={report.images} title={report.title} />

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold">{report.title}</h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {report.area_name || `${report.lat?.toFixed(5)}, ${report.lng?.toFixed(5)}`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {timeAgo(report.created_at)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                {report.upvote_count} upvotes
              </span>
              <span>Reported by {report.reporter?.display_name || 'a citizen'}</span>
            </p>
          </div>

          <p className="whitespace-pre-line text-ink-muted">{report.description}</p>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Category', value: getCategoryLabel(report.category?.slug) },
              { label: 'Severity', value: getSeverityLabel(report.severity) },
              { label: 'Department', value: report.department?.name ?? 'Not assigned' },
            ].map((fact) => (
              <div key={fact.label} className="rounded-lg border border-border bg-surface p-3">
                <dt className="text-xs font-medium text-ink-subtle">{fact.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <AdminCommentsModeration comments={report.comments} />
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold">Assign department</h2>
            <div className="mt-3">
              <AssignDepartmentForm
                reportId={report.id}
                currentDepartmentId={report.department?.id}
                onAssigned={refetch}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Change status</h2>
            <div className="mt-3">
              <StatusChangeForm reportId={report.id} currentStatus={report.status} onChanged={refetch} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">After photo</h2>
            <div className="mt-3">
              <ResolutionImageUpload reportId={report.id} onUploaded={refetch} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Status history</h2>
            <div className="mt-4">
              {report.statusHistory?.length > 0 ? (
                <StatusTimeline history={report.statusHistory} />
              ) : (
                <p className="text-sm text-ink-muted">No status updates yet.</p>
              )}
            </div>
          </Card>

          <DeleteReportButton reportId={report.id} reportTitle={report.title} />
        </aside>
      </div>
    </div>
  );
}

function ManageSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton variant="text" className="h-7 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
