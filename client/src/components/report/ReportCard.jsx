import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';
import { timeAgo } from '@/lib/utils/timeAgo';

/**
 * Compact report summary — used on the landing page, `/reports` feed, and `/my-reports`.
 * Title is clamped to 2 lines with a fixed min-height so cards in a row stay aligned even
 * when their titles wrap differently.
 *
 * @param {{
 *  id: string,
 *  title: string,
 *  status: 'reported' | 'in_progress' | 'resolved' | 'rejected',
 *  category: string,
 *  areaName?: string,
 *  upvoteCount?: number,
 *  createdAt: string,
 *  thumbnailUrl?: string,
 * }} props
 */
export default function ReportCard({
  id,
  title,
  status,
  category,
  areaName,
  upvoteCount = 0,
  createdAt,
  thumbnailUrl,
}) {
  return (
    <Link
      href={`/reports/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
    >
      <div className="relative aspect-video w-full bg-bg">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`Photo for report: ${title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-subtle">
            No photo
          </div>
        )}
        <StatusBadge status={status} className="absolute left-3 top-3 bg-surface/95 backdrop-blur-sm" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
          {title}
        </h3>
        <p className="line-clamp-1 text-xs text-ink-muted">
          {[getCategoryLabel(category), areaName].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-ink-subtle">
          <span className="inline-flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            {upvoteCount}
          </span>
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}