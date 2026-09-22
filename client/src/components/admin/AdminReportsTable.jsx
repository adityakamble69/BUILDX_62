import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';
import { timeAgo } from '@/lib/utils/timeAgo';
import { assignTaskHref } from '@/lib/utils/assignTaskHref';

/**
 * design.md §7 "Tables (admin)": sticky header, row hover, thumbnail/title/category/
 * status/upvotes/severity/department/created columns. Wrapped in its own
 * `overflow-x-auto` (design.md §12 — tables scroll horizontally on small screens rather
 * than becoming cards, since every column here still matters at a glance).
 * @param {{ reports: Array<object> }} props Rows from `admin_reports_view` (ADMIN_REPORT_SELECT).
 */
export default function AdminReportsTable({ reports }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
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
                      <Image src={getThumbnailUrl(r.images)} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[220px] truncate font-medium text-ink hover:text-primary-600">
                      {r.title}
                    </span>
                    <span className="block truncate text-xs text-ink-subtle">{r.area_name || '—'}</span>
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
  );
}
