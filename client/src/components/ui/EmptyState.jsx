import { Inbox } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * @param {{
 *  icon?: React.ComponentType<{ className?: string }>,
 *  title: string,
 *  description?: string,
 *  actionLabel?: string,
 *  onAction?: () => void,
 * }} props
 */
export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-ink-subtle" aria-hidden="true" />
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
