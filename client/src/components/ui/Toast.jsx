import { CircleCheck, CircleAlert, TriangleAlert, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TYPES = {
  success: { icon: CircleCheck, className: 'border-success text-success' },
  danger: { icon: CircleAlert, className: 'border-danger text-danger' },
  warning: { icon: TriangleAlert, className: 'border-warning text-warning' },
  info: { icon: Info, className: 'border-info text-info' },
};

/** @param {{ type?: keyof typeof TYPES, message: string, onDismiss: () => void }} props */
export default function Toast({ type = 'info', message, onDismiss }) {
  const { icon: Icon, className } = TYPES[type] ?? TYPES.info;

  return (
    <div
      role="status"
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface p-4 shadow-lg',
        'animate-[slideUp_250ms_ease-out]',
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 text-ink-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
