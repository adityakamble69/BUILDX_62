'use client';

import { forwardRef, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * @param {{ label: string, helperText?: string, error?: string, required?: boolean } & Record<string, any>} props
 */
const Input = forwardRef(function Input(
  { label, helperText, error, required, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={cn(
          'h-11 rounded-md border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-subtle',
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

export default Input;
