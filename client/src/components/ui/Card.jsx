import { cn } from '@/lib/utils/cn';

/**
 * @param {{ clickable?: boolean, padding?: 'none' | 'md' } & Record<string, any>} props
 */
export default function Card({ clickable = false, padding = 'md', className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface shadow-sm transition-shadow',
        clickable && 'cursor-pointer hover:shadow-md',
        padding === 'md' && 'p-4 md:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
