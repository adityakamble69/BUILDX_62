import { cn } from '@/lib/utils/cn';

// Matches server/sql `report_status` enum and design.md §2. Keep both in sync.
export const STATUS_META = {
  reported: { label: 'Reported', className: 'bg-status-reported/10 text-status-reported border-status-reported' },
  in_progress: { label: 'In progress', className: 'bg-status-progress/10 text-status-progress border-status-progress' },
  resolved: { label: 'Resolved', className: 'bg-status-resolved/10 text-status-resolved border-status-resolved' },
  rejected: { label: 'Rejected', className: 'bg-status-rejected/10 text-status-rejected border-status-rejected' },
};

/** @param {{ status: keyof typeof STATUS_META } & Record<string, any>} props */
export default function StatusBadge({ status, className, ...props }) {
  const meta = STATUS_META[status] ?? STATUS_META.reported;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        meta.className,
        className,
      )}
      {...props}
    >
      {meta.label}
    </span>
  );
}
