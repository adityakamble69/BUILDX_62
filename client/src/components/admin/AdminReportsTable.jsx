import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Calendar, MapPin, User } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { timeAgo } from '@/lib/utils/timeAgo';
import { assignTaskHref } from '@/lib/utils/assignTaskHref';

/**
 * Admin reports list. Two layouts:
 *   - md+ : classic table (design.md §7) with sticky header
 *   - < md: card list — a 5-column table on a 360px screen is unreadable even with
 *           horizontal scroll, so mobile gets a proper card view
 *
 * @param {{ reports: Array<object> }} props Rows from `admin_reports_view`.
 */
export default function AdminReportsTable({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-ink-muted">
        No reports found.
      </div>
    );
  }

  return (
    <>
      {/* -------------------- Desktop / tablet table -------------------- */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Upvotes</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-4 py-3">
                  <Link href={`/admin/reports/${r.id}`} className="flex items-center gap-3">
                    <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-bg">
                      {getThumbnailUrl(r.images) ? (
                        <Image
                          src={getThumbnailUrl(r.images)}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[220px] truncate font-medium text-ink hover:text-primary-600">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-ink-subtle">
                        {r.area_name || '—'}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{getCategoryLabel(r.category?.slug)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">{getSeverityLabel(r.severity)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-ink-muted">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    {r.upvote_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.department?.name || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{timeAgo(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={assignTaskHref(r)}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Assign
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------------------- Mobile card list -------------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {reports.map((r) => {
          const thumb = getThumbnailUrl(r.images);
          return (
            <li key={r.id} className="overflow-hidden rounded-lg border border-border bg-surface">
              <Link href={`/admin/reports/${r.id}`} className="flex gap-3 p-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
                  {thumb ? (
                    <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                      {r.title}
                    </span>
                    <StatusBadge status={r.status} className="shrink-0" />
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-muted">
                    {getCategoryLabel(r.category?.slug)}
                    {r.area_name ? ` · ${r.area_name}` : ''}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-subtle">
                    <span className="inline-flex items-center gap-0.5">
                      <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      {r.upvote_count}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {timeAgo(r.created_at)}
                    </span>
                    {r.department?.name && (
                      <span className="truncate">{r.department.name}</span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}