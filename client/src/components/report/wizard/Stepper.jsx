'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Numbered step indicator for the report wizard (design.md §7 — forms are single-column,
 * the report form is a step wizard on mobile).
 * @param {{ steps: string[], current: number, onStepClick?: (index: number) => void }} props
 *   `current` is a 0-based index. `onStepClick` only ever receives an already-completed step.
 */
export default function Stepper({ steps, current, onStepClick }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={clickable ? () => onStepClick(i) : undefined}
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-md px-1 py-1 text-left',
                clickable && 'hover:text-primary-600',
                !clickable && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-primary-600 bg-primary-600 text-white',
                  active && 'border-primary-600 bg-primary-50 text-primary-600',
                  !done && !active && 'border-border bg-surface text-ink-subtle',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm font-medium sm:block',
                  active ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
