'use client';

import { STATUS_META } from '@/components/ui/StatusBadge';
import { CATEGORY_LABELS } from '@/lib/utils/categories';

const CATEGORY_RADIOS = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

// `/reports/map` always excludes rejected reports (sql/002_functions.sql), so offering
// it here would silently empty the map while the list still showed results.
const STATUS_RADIOS = [
  { value: '', label: 'All Status' },
  ...Object.entries(STATUS_META)
    .filter(([value]) => value !== 'rejected')
    .map(([value, meta]) => ({ value, label: meta.label })),
];

// design.md §2 — same hex values as the map markers and status badges.
const LEGEND = [
  { color: '#F59E0B', label: 'Reported' },
  { color: '#2563EB', label: 'In Progress' },
  { color: '#16A34A', label: 'Resolved' },
  { color: '#6B7280', label: 'Rejected' },
];

function RadioGroup({ title, name, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</h3>
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-bg"
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
                suppressHydrationWarning
              />
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  checked ? 'border-primary-600' : 'border-border'
                }`}
                aria-hidden="true"
              >
                {checked && <span className="h-2 w-2 rounded-full bg-primary-600" />}
              </span>
              <span className={checked ? 'font-medium text-ink' : 'text-ink-muted'}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Left-rail filter panel (map page mockup). Radio groups instead of dropdowns so every
 * option is one glance away, plus a status legend at the bottom (design.md §9: color is
 * never the only status indicator — every dot has its label next to it).
 */
export default function MapFiltersPanel({
  category,
  status,
  area,
  areaOptions = [],
  onCategoryChange,
  onStatusChange,
  onAreaChange,
  onClearAll,
  hasActiveFilters,
}) {
  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <RadioGroup
        title="Category"
        name="map-category"
        options={CATEGORY_RADIOS}
        value={category}
        onChange={onCategoryChange}
      />

      <RadioGroup
        title="Status"
        name="map-status"
        options={STATUS_RADIOS}
        value={status}
        onChange={onStatusChange}
      />

      {areaOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Area</h3>
          <select
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-ink focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            suppressHydrationWarning
          >
            <option value="">All Areas</option>
            {areaOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-ink-muted">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}