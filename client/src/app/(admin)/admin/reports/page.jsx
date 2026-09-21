'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Search, X } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { CATEGORY_LABELS } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';
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

/** Escapes a CSV cell (RFC 4180: wrap in quotes, double any internal quotes). */
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds a CSV from the currently loaded rows and triggers a browser download. */
function exportRowsToCsv(rows) {
  const header = [
    'Report ID',
    'Title',
    'Category',
    'Area',
    'Status',
    'Severity',
    'Upvotes',
    'Department',
    'Created',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.title,
        r.category?.slug ?? '',
        r.area_name ?? '',
        r.status,
        getSeverityLabel(r.severity),
        r.upvote_count,
        r.department?.name ?? '',
        r.created_at,
      ]
        .map(csvCell)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `civic-fix-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AdminReportsPageInner() {
  const { request, isLoaded } = useApi();
  const searchParams = useSearchParams();

  // Initial state seeded from the URL so the topbar search lands here correctly.
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [departmentOptions, setDepartmentOptions] = useState([
    { value: '', label: 'All Departments' },
  ]);
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
        search: search.trim() || undefined,
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
  }, [isLoaded, category, status, department, search, sort, page, request]);

  const hasActiveFilters = category || status || department || search || sort !== 'newest';

  function clearFilters() {
    setCategory('');
    setStatus('');
    setDepartment('');
    setSearch('');
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
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[28px] font-bold leading-9">Reports</h1>
          <p className="mt-1 text-ink-muted">Manage and update all civic issue reports.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportRowsToCsv(reports ?? [])}
          disabled={!reports?.length}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <input
            type="search"
            placeholder="Search by title or area…"
            value={search}
            onChange={(e) => updateFilter(setSearch)(e.target.value)}
            aria-label="Search reports"
            className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            suppressHydrationWarning
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
        </div>
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
          description="Try a different category, status, department or search term."
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

/** Suspense wrapper — `useSearchParams()` requires one at build time in App Router. */
export default function AdminReportsPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-[1400px]" />}>
      <AdminReportsPageInner />
    </Suspense>
  );
}