import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCategoryLabel } from '@/lib/utils/categories';
import { timeAgo } from '@/lib/utils/timeAgo';

/**
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
export default function ReportCard({ id, title, status, category, areaName, upvoteCount = 0, createdAt, thumbnailUrl }) {
  return (
    <Link
      href={`/reports/${id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
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
          <div className="flex h-full items-center justify-center text-sm text-ink-subtle">No photo</div>
        )}
        <StatusBadge status={status} className="absolute left-3 top-3 bg-surface" />
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-ink">{title}</h3>
        <p className="text-xs text-ink-muted">
          {[getCategoryLabel(category), areaName].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-ink-subtle">
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
