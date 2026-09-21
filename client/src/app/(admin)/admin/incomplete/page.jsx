'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import IncompleteTable from '@/components/admin/IncompleteTable';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils/cn';

/**
 * `/admin/incomplete` — reports still waiting on action (design brief §7).
 * Tabs are Reports-only for now: Comments and Other have no incomplete concept in the
 * current schema; the tab UI is present so they can be filled later without re-laying
 * out the page.
 */
const TABS = [
  { key: 'reports', label: 'Reports' },
  { key: 'comments', label: 'Comments', disabled: true },
  { key: 'other', label: 'Other', disabled: true },
];

export default function AdminIncompletePage() {
  const { request, isLoaded } = useApi();

  const [tab, setTab] = useState('reports');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  const [departmentOptions, setDepartmentOptions] = useState([{ value: '', label: 'All Departments' }]);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    request(authPaths.adminDepartments)
      .then((res) =>
        setDepartmentOptions([
          { value: '', label: 'All Departments' },
          ...res.data.map((d) => ({ value: String(d.id), label: d.name })),
        ]),
      )
      .catch(() => {});
  }, [isLoaded, request]);

  useEffect(() => {
    if (!isLoaded || tab !== 'reports') return undefined;
    let active = true;

    setError(false);
    request(
      authPaths.adminIncomplete({
        search: search.trim() || undefined,
        department: department || undefined,
      }),
    )
      .then((res) => {
        if (active) setReports(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, tab, search, department, request]);

  const hasActiveFilters = search || department;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Incomplete</h1>
        <p className="mt-1 text-ink-muted">
          Track pending reports and follow-ups that need attention.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Incomplete filters">
        {TABS.map(({ key, label, disabled }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => !disabled && setTab(key)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition',
                active ? 'text-primary-600' : 'text-ink-muted hover:text-ink',
                disabled && 'cursor-not-allowed opacity-40 hover:text-ink-muted',
              )}
            >
              {label}
              {active && (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {tab === 'reports' && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <Input
                label="Search"
                hideLabel
                placeholder="Search by report title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Department"
                hideLabel
                options={departmentOptions}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearch('');
                  setDepartment('');
                }}
                className="text-ink-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            )}
            <span className="ml-auto self-center text-sm text-ink-muted">
              {reports && !error ? `${reports.length} pending` : ''}
            </span>
          </div>

          {error && (
            <EmptyState
              title="Couldn't load incomplete reports"
              description="The server may still be waking up — refresh in a few seconds."
            />
          )}

          {!error && reports === null && <Skeleton className="h-96 w-full" />}

          {!error && reports && <IncompleteTable reports={reports} />}

          <p className="text-xs text-ink-subtle">
            Pending messages are automatically removed after 48 hours.
          </p>
        </>
      )}
    </div>
  );
}