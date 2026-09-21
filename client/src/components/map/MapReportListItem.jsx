import Link from 'next/link';
import { ArrowUp, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';
import { timeAgo } from '@/lib/utils/timeAgo';

/**
 * Deliberately not a single big `<Link>` (like `ReportCard`) — clicking the row should
 * re-center the map, while the chevron is the only thing that navigates to the detail
 * page, so the two interactions don't collide inside one anchor.
 */
export default function MapReportListItem({
  id,
  title,
  status,
  category,
  areaName,
  upvoteCount = 0,
  createdAt,
  thumbnailUrl,
  active = false,
  onFocus,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFocus();
        }
      }}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-primary-600 bg-primary-50' : 'border-border bg-surface hover:bg-bg'
      }`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- fixed small thumbnail, next/image isn't worth it here.
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-subtle">
            No photo
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">
          {[category && getCategoryLabel(category), areaName].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={status} />
          <span className="inline-flex items-center gap-0.5 text-xs text-ink-subtle">
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
            {upvoteCount}
          </span>
          <span className="text-xs text-ink-subtle">·</span>
          <span className="text-xs text-ink-subtle">{timeAgo(createdAt)}</span>
        </div>
      </div>

      <Link
        href={`/reports/${id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`View details for ${title}`}
        className="shrink-0 self-center rounded p-1 text-ink-subtle hover:bg-border/60 hover:text-ink"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}