import { cn } from '@/lib/utils/cn';

const TONES = {
  success: 'bg-success/10 text-success border-success',
  warning: 'bg-warning/10 text-warning border-warning',
  danger: 'bg-danger/10 text-danger border-danger',
  info: 'bg-info/10 text-info border-info',
  neutral: 'bg-bg text-ink-muted border-border',
};

/** @param {{ tone?: keyof typeof TONES } & Record<string, any>} props */
export default function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
