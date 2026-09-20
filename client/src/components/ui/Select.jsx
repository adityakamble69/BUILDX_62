'use client';

import { forwardRef, useId } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * @param {{
 *  label: string,
 *  helperText?: string,
 *  error?: string,
 *  required?: boolean,
 *  placeholder?: string,
 *  options: { value: string, label: string }[],
 * } & Record<string, any>} props
 */
const Select = forwardRef(function Select(
  { label, hideLabel = false, helperText, error, required, id, className, placeholder, options, value, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;
  // Uncontrolled by default (defaultValue=""); a caller passing `value` (e.g. a filter
  // toolbar synced to the URL) gets a normal controlled select instead — React warns if
  // both defaultValue and value are set on the same element.
  const valueProps = value !== undefined ? { value } : { defaultValue: '' };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={cn('text-sm font-medium text-ink', hideLabel && 'sr-only')}>
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          {...valueProps}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          // See Input.jsx — same false-positive from form-filler browser extensions.
          suppressHydrationWarning
          className={cn(
            'h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-base text-ink',
            'focus:outline-none focus:ring-2 focus:ring-primary-600',
            error && 'border-danger focus:ring-danger',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
      </div>
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

export default Select;
