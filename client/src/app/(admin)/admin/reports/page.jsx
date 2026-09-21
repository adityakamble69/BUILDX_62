'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { authPaths, getCategories } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { CATEGORY_LABELS } from '@/lib/utils/categories';
import { STATUS_META } from '@/components/ui/StatusBadge';
import AdminReportsTable from '@/components/admin/AdminReportsTable';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'upvotes', label: 'Sort: Most upvoted' },
  { value: 'severity', label: 'Sort: Highest severity' },
];

const PAGE_SIZE = 20;

/**
 * `/admin/reports` — full table with filters and sorting by upvotes (phases.md Phase 7).
 * `GET /admin/departments` doubles as the department filter's option list — it's the same
 * data the departments management page uses, just read here instead of managed.
 */
export default function AdminReportsPage() {
  const { request, isLoaded } = useApi();

  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [departmentOptions, setDepartmentOptions] = useState([{ value: '', label: 'All Departments' }]);
  const [reports, setReports] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    request(authPaths.adminDepartments)
      .then((res) => {
        setDepartmentOptions([
          { value: '', label: 'All Departments' },
          ...res.data.map((d) => ({ value: String(d.id), label: d.name })),
        ]);
      })
      .catch(() => {
        // Filter degrades to "All Departments" only — not worth a page-level error for this.
      });
  }, [isLoaded, request]);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(
      authPaths.adminReports({
        category: category || undefined,
        status: status || undefined,
        department: department || undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    )
      .then((res) => {
        if (!active) return;
        setReports(res.data);
        setTotal(res.meta.total);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, category, status, department, sort, page, request]);

  const hasActiveFilters = category || status || department || sort !== 'newest';

  function clearFilters() {
    setCategory('');
    setStatus('');
    setDepartment('');
    setSort('newest');
    setPage(1);
  }

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Reports</h1>
        <p className="mt-1 text-ink-muted">Every report in the system, filterable and sortable.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Category"
            hideLabel
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => updateFilter(setCategory)(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => updateFilter(setStatus)(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Department"
            hideLabel
            options={departmentOptions}
            value={department}
            onChange={(e) => updateFilter(setDepartment)(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Sort"
            hideLabel
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => updateFilter(setSort)(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters} className="text-ink-muted">
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
        <span className="ml-auto self-center text-sm text-ink-muted">
          {reports && !error ? `${total} report${total === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load reports"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && reports === null && <Skeleton className="h-96 w-full" />}

      {!error && reports?.length === 0 && (
        <EmptyState
          title="No reports match these filters"
          description="Try a different category, status or department."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      )}

      {!error && reports?.length > 0 && (
        <>
          <AdminReportsTable reports={reports} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
