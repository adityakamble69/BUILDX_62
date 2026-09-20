import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

/**
 * KPI card for the admin dashboard (design.md §15 `StatCard`). `tone` only colors the
 * icon chip — the number itself stays `ink` so the cards read consistently at a glance.
 * @param {{
 *  label: string,
 *  value: string | number,
 *  icon: React.ComponentType<{ className?: string }>,
 *  tone?: 'primary' | 'warning' | 'success' | 'info',
 *  delta?: string,
 * }} props
 */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', delta }) {
  const TONE_CLASSES = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-muted">{label}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
      {delta && <p className="mt-2 text-xs text-ink-subtle">{delta}</p>}
    </Card>
  );
}
