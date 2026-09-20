'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Prev/Next pager for API list endpoints returning `meta: { page, pageSize, total }`
 * (rules.md §5 — every list endpoint paginates). Renders nothing when there's only one
 * page, so callers can mount it unconditionally.
 * @param {{ page: number, pageSize: number, total: number, onPageChange: (page: number) => void }} props
 */
export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </Button>
      <span className="text-sm font-medium text-ink-muted" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
