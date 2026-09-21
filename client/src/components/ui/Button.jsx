import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-surface text-ink border border-border hover:bg-bg',
  accent: 'bg-accent-500 text-secondary-600 hover:brightness-95',
  danger: 'bg-danger text-white hover:brightness-90',
  ghost: 'bg-transparent text-ink hover:bg-primary-50',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * @param {{
 *  variant?: keyof typeof VARIANTS,
 *  size?: keyof typeof SIZES,
 *  loading?: boolean,
 *  fullWidth?: boolean,
 *  as?: 'button' | 'a',
 * } & Record<string, any>} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  as = 'button',
  disabled,
  className,
  children,
  ...props
}) {
  const Comp = as;
  const isDisabled = disabled || loading;

  return (
    <Comp
      // suppressHydrationWarning: browser extensions (LastPass & similar) stamp a
      // `fdprocessedid` attribute onto interactive elements before React hydrates —
      // same false positive as memory.md D32/D44. This only silences the warning on
      // this element; the subtree is untouched.
      suppressHydrationWarning
      // Buttons rendered as <a> still need the disabled look; real disabling of a link is handled by the caller.
      disabled={as === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span className={loading ? 'opacity-90' : undefined}>{children}</span>
    </Comp>
  );
}