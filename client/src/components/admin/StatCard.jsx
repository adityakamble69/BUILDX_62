import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

/**
 * KPI card for the admin dashboard (design.md §15 `StatCard`). `tone` only colors the
 * icon chip — the number itself stays `ink` so the cards read consistently at a glance.
 * `delta` is an optional { pct, dir } computed client-side from the trend data (see
 * admin/page.jsx) — omitted when there isn't enough trend data to be meaningful.
 * @param {{
 *  label: string,
 *  value: string | number,
 *  icon: React.ComponentType<{ className?: string }>,
 *  tone?: 'primary' | 'warning' | 'success' | 'info',
 *  delta?: { pct: number, dir: 'up' | 'down' | 'flat' } | null,
 * }} props
 */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', delta }) {
  const TONE_CLASSES = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  };

  const DeltaIcon = delta?.dir === 'up' ? ArrowUp : delta?.dir === 'down' ? ArrowDown : Minus;
  const deltaClass =
    delta?.dir === 'up'
      ? 'text-success'
      : delta?.dir === 'down'
        ? 'text-danger'
        : 'text-ink-subtle';

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-muted">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none text-ink">{value}</p>
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {delta && (
        <p className="mt-3 flex items-center gap-1 text-xs">
          <DeltaIcon className={cn('h-3.5 w-3.5', deltaClass)} aria-hidden="true" />
          <span className={cn('font-semibold', deltaClass)}>{delta.pct}%</span>
          <span className="text-ink-subtle">vs previous week</span>
        </p>
      )}
    </Card>
  );
}