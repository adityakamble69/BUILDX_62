import { Check, Clock3 } from 'lucide-react';
import { STATUS_META } from '@/components/ui/StatusBadge';
import { timeAgo } from '@/lib/utils/timeAgo';

// design.md §2 — same hex values as StatusBadge / map markers.
const DOT_COLOR = {
  reported: 'bg-status-reported',
  in_progress: 'bg-status-progress',
  resolved: 'bg-status-resolved',
  rejected: 'bg-status-rejected',
};

/**
 * Renders the report's full lifecycle (Reported → In Progress → Resolved → After Photo)
 * as a vertical timeline. Steps that have a matching `status_history` row are filled with
 * a checkmark, timestamp and note; steps that haven't happened yet render gray with
 * "Pending" — so a citizen sees at a glance how far along the fix is (landing mockup).
 *
 * Rejected reports show Reported → Rejected instead of the 4-step happy path.
 *
 * @param {{
 *   history?: Array<{ id: string|number, to_status: string, note?: string, created_at: string }>,
 *   status?: string, // current report status — drives whether future steps are pending
 *   images?: Array<{ kind: string, created_at?: string }>, // to detect an attached after-photo
 * }} props
 */
export default function StatusTimeline({ history = [], status = 'reported', images = [] }) {
  const find = (s) => history.find((h) => h.to_status === s);
  const afterPhoto = images.find((img) => img.kind === 'after');

  let steps;
  if (status === 'rejected') {
    steps = [
      { key: 'reported', label: 'Reported', color: DOT_COLOR.reported, entry: find('reported') },
      { key: 'rejected', label: 'Rejected', color: DOT_COLOR.rejected, entry: find('rejected') },
    ];
  } else {
    steps = [
      { key: 'reported', label: 'Reported', color: DOT_COLOR.reported, entry: find('reported') },
      { key: 'in_progress', label: 'In Progress', color: DOT_COLOR.in_progress, entry: find('in_progress') },
      { key: 'resolved', label: 'Resolved', color: DOT_COLOR.resolved, entry: find('resolved') },
      {
        key: 'after_photo',
        label: 'After Photo',
        color: DOT_COLOR.resolved,
        entry: afterPhoto ? { created_at: afterPhoto.created_at } : null,
      },
    ];
  }

  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const done = !!step.entry;
        return (
          <li key={step.key} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-6px)] w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done ? `${step.color} text-white` : 'border-2 border-border bg-surface text-ink-subtle'
              }`}
              aria-hidden="true"
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Clock3 className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className={`font-semibold ${done ? 'text-ink' : 'text-ink-muted'}`}>
                  {step.label}
                </p>
                {done && step.entry?.created_at && (
                  <span className="text-xs text-ink-subtle">{timeAgo(step.entry.created_at)}</span>
                )}
                {!done && <span className="text-xs text-ink-subtle">Pending</span>}
              </div>
              {done && step.entry?.note && (
                <p className="mt-0.5 text-sm text-ink-muted">{step.entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}