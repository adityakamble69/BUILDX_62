'use client';

import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';

/**
 * Compact dashboard table (mockup): ID/Title/Category/Status/Department/Action.
 * Deliberately lighter than AdminReportsTable — no thumbnails, no severity/upvotes —
 * because on the dashboard it's a glance, not a triage surface (that's `/admin/reports`).
 * @param {{ reports: Array<object> }} props Rows from `admin_reports_view`.
 */
export default function RecentReportsTable({ reports = [] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-ink-muted">No reports yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            <th className="pb-2 pr-3 font-semibold">Title</th>
            <th className="pb-2 pr-3 font-semibold">Category</th>
            <th className="pb-2 pr-3 font-semibold">Status</th>
            <th className="pb-2 pr-3 font-semibold">Department</th>
            <th className="pb-2 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="py-2.5 pr-3">
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="block max-w-[200px] truncate font-medium text-ink hover:text-primary-600"
                >
                  {r.title}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-ink-muted">{getCategoryLabel(r.category?.slug)}</td>
              <td className="py-2.5 pr-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2.5 pr-3 text-ink-muted">{r.department?.name || '—'}</td>
              <td className="py-2.5 text-right">
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}