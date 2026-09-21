import { cn } from '@/lib/utils/cn';

/**
 * @param {{ variant?: 'text' | 'block' | 'circle', width?: string, height?: string } & Record<string, any>} props
 */
export default function Skeleton({ variant = 'block', width, height, className, style, ...props }) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height, ...style }}
      className={cn(
        'animate-pulse bg-border/70',
        variant === 'text' && 'h-4 rounded',
        variant === 'block' && 'rounded-lg',
        variant === 'circle' && 'rounded-full',
        className,
      )}
      {...props}
    />
  );
}

/** Preset matching `ReportCard`'s layout, for feed/map-list loading states. */
export function ReportCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
}