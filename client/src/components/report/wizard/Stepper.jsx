'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Numbered step indicator for the report wizard (design.md §7). Done + active steps both
 * show a filled teal circle — done uses a checkmark, active uses the number, so the two
 * states read differently without needing two colors. Future steps are outlined.
 *
 * @param {{ steps: string[], current: number, onStepClick?: (index: number) => void }} props
 *   `current` is a 0-based index. `onStepClick` only ever receives an already-completed step.
 */
export default function Stepper({ steps, current, onStepClick }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-3" aria-label="Report steps">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={clickable ? () => onStepClick(i) : undefined}
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition',
                clickable && 'hover:bg-bg',
                !clickable && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition',
                  (done || active) && 'border-primary-600 bg-primary-600 text-white',
                  !done && !active && 'border-border bg-surface text-ink-subtle',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm sm:block',
                  active && 'font-semibold text-ink',
                  done && 'text-ink-muted',
                  !done && !active && 'text-ink-subtle',
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