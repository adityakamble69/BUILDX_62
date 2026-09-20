import { Check } from 'lucide-react';
import { STATUS_META } from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils/timeAgo';

// design.md §2 — same hex values as StatusBadge / map markers, used for the timeline dots.
const DOT_COLOR = {
  reported: 'bg-status-reported',
  in_progress: 'bg-status-progress',
  resolved: 'bg-status-resolved',
  rejected: 'bg-status-rejected',
};

/**
 * Renders `status_history` rows (oldest first, as returned by `GET /reports/:id`)
 * as a vertical timeline (architecture.md §15).
 * @param {{ history: Array<{ id: string|number, to_status: string, note?: string, created_at: string }> }} props
 */
export default function StatusTimeline({ history = [] }) {
  if (history.length === 0) return null;

  return (
    <ol className="flex flex-col gap-6">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        const meta = STATUS_META[entry.to_status] ?? STATUS_META.reported;
        return (
          <li key={entry.id} className="relative flex gap-4 pb-1">
            {!isLast && (
              <span className="absolute left-[11px] top-6 h-[calc(100%-4px)] w-px bg-border" aria-hidden="true" />
            )}
            <span
              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                DOT_COLOR[entry.to_status] ?? DOT_COLOR.reported
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{meta.label}</p>
                <span className="text-xs text-ink-subtle">{timeAgo(entry.created_at)}</span>
              </div>
              {entry.note && <p className="mt-0.5 text-sm text-ink-muted">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
