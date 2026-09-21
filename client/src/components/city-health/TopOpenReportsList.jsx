import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getSeverityLabel } from '@/lib/utils/severity';
import { timeAgo } from '@/lib/utils/timeAgo';

/**
 * FR16's "top upvoted open issues" (`get_top_open_reports`, sql/006_phase8.sql). No
 * thumbnails here — the RPC deliberately stays lightweight (same reasoning as the map
 * RPC, memory.md D31) — so this is a ranked list rather than a `ReportCard` grid.
 * @param {{ data: Array<{
 *   id: string, title: string, status: string, severity: number, upvote_count: number,
 *   area_name?: string, created_at: string, category_slug: string, category_name: string,
 * }> }} props
 */
export default function TopOpenReportsList({ data = [] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-muted">No open reports right now — the city is caught up.</p>;
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {data.map((report, i) => (
        <li key={report.id}>
          <Link
            href={`/reports/${report.id}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary-600"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{report.title}</span>
              <span className="block truncate text-xs text-ink-muted">
                {[report.category_name, report.area_name, getSeverityLabel(report.severity)]
                  .filter(Boolean)
                  .join(' · ')}{' '}
                · {timeAgo(report.created_at)}
              </span>
            </span>
            <StatusBadge status={report.status} className="hidden shrink-0 sm:inline-flex" />
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-muted">
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              {report.upvote_count}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
