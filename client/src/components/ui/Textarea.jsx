'use client';

import { forwardRef, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * @param {{ label: string, helperText?: string, error?: string, required?: boolean, maxLength?: number, value?: string } & Record<string, any>} props
 */
const Textarea = forwardRef(function Textarea(
  { label, helperText, error, required, id, className, maxLength, value, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {maxLength && (
          <span className="text-xs text-ink-subtle">
            {(value ?? '').length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        id={inputId}
        maxLength={maxLength}
        value={value}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        rows={4}
        className={cn(
          'resize-y rounded-md border border-border bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-subtle',
          'focus:outline-none focus:ring-2 focus:ring-primary-600',
          error && 'border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-danger">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-ink-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
