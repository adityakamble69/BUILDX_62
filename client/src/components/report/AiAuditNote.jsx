'use client';

import { Sparkles } from 'lucide-react';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';

/**
 * Shown on report detail when `POST /reports` stored the Phase 8 audit fields.
 *
 * @param {{
 *  categorySlug?: string | null,
 *  severity?: number | null,
 *  filedCategorySlug?: string | null,
 *  filedSeverity?: number | null,
 * }} props
 */
export default function AiAuditNote({ categorySlug, severity, filedCategorySlug, filedSeverity }) {
  if (!categorySlug && severity == null) return null;

  const suggested = [
    categorySlug ? getCategoryLabel(categorySlug) : null,
    severity != null ? `${getSeverityLabel(severity)} severity` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const overridden =
    (categorySlug && filedCategorySlug && categorySlug !== filedCategorySlug) ||
    (severity != null && filedSeverity != null && Number(severity) !== Number(filedSeverity));

  return (
    <p className="inline-flex flex-wrap items-center gap-2 rounded-md border border-primary-600/20 bg-primary-50 px-3 py-2 text-sm text-ink-muted">
      <Sparkles className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
      <span>
        <span className="font-semibold text-ink">AI suggested {suggested}</span>
        {overridden ? ' — the reporter chose a different category or severity.' : '.'}
      </span>
    </p>
  );
}
