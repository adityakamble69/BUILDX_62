'use client';

import { Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';

/**
 * Phase 8 AI suggestion on the report wizard (PRD FR5). Pre-fill is applied by the
 * parent when the citizen hasn't picked a category yet; this card explains what happened
 * and lets them re-run the classifier after typing a title/description.
 *
 * @param {{
 *  loading?: boolean,
 *  enabled?: boolean | null,
 *  suggestion?: { category: string, severity: number } | null,
 *  applied?: boolean,
 *  onApply?: () => void,
 *  onSuggest?: () => void,
 * }} props
 */
export default function AiSuggestionCard({
  loading,
  enabled,
  suggestion,
  applied,
  onApply,
  onSuggest,
}) {
  if (enabled === false) return null;

  if (loading) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
        <Sparkles className="h-4 w-4 animate-pulse text-primary-600" aria-hidden="true" />
        Looking at your photo for a category suggestion…
      </p>
    );
  }

  if (suggestion && applied) {
    return (
      <Card className="border-primary-600/30 bg-primary-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-primary-600" aria-hidden="true" />
            Prefill from photo: {getCategoryLabel(suggestion.category)} ·{' '}
            {getSeverityLabel(suggestion.severity)} severity — change the fields if it&apos;s wrong.
          </p>
          {onSuggest && (
            <Button type="button" variant="ghost" size="sm" onClick={onSuggest}>
              Suggest again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (suggestion && !applied) {
    return (
      <Card className="border-primary-600/30 bg-primary-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-primary-600" aria-hidden="true" />
            AI suggests {getCategoryLabel(suggestion.category)} · {getSeverityLabel(suggestion.severity)}{' '}
            severity
          </p>
          <div className="flex flex-wrap gap-2">
            {onApply && (
              <Button type="button" variant="secondary" size="sm" onClick={onApply}>
                Use suggestion
              </Button>
            )}
            {onSuggest && (
              <Button type="button" variant="ghost" size="sm" onClick={onSuggest}>
                Suggest again
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (enabled && onSuggest) {
    return (
      <Card className="border-dashed border-border bg-bg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Sparkles className="h-4 w-4 text-primary-600" aria-hidden="true" />
            Couldn&apos;t read a category from this photo. Add a title and try again.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onSuggest}>
            Suggest with AI
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
