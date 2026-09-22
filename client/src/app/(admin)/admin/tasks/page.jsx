'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import TaskForm from '@/components/admin/TaskForm';
import TaskTable from '@/components/admin/TaskTable';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PAGE_SIZE = 20;

/**
 * `/admin/tasks` — Assign Task page (design brief §5). Form on top, filterable table
 * below. Backed by `GET /admin/tasks` (paginated, joins report + department) and
 * `POST /admin/tasks` (which also auto-assigns the report's department if missing).
 *
 * `?reportId=&title=&departmentId=` pre-fills the form from a report manage/table link.
 */
function AdminTasksPageInner() {
  const { request, isLoaded } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultReportId = searchParams.get('reportId') || undefined;
  const defaultTitle = searchParams.get('title') || undefined;
  const defaultDepartmentId = searchParams.get('departmentId') || undefined;

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  const [departmentOptions, setDepartmentOptions] = useState([{ value: '', label: 'All Departments' }]);
  const [tasks, setTasks] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(
      authPaths.adminTasks({
        status: status || undefined,
        priority: priority || undefined,
        department: department || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    )
      .then((res) => {
        if (!active) return;
        setTasks(res.data);
        setTotal(res.meta.total);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, status, priority, department, page, request, reloadKey]);

  const hasActiveFilters = status || priority || department;

  function clearFilters() {
    setStatus('');
    setPriority('');
    setDepartment('');
    setPage(1);
  }

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function handleCreated() {
    setReloadKey((k) => k + 1);
    if (defaultReportId) router.replace('/admin/tasks');
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-[28px] font-bold leading-9">Assign Task</h1>
        <p className="mt-1 text-ink-muted">
          Assign reports for resolution and track responsibility.
        </p>
      </div>

      <TaskForm
        defaultReportId={defaultReportId}
        defaultTitle={defaultTitle}
        defaultDepartmentId={defaultDepartmentId}
        onCreated={handleCreated}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => updateFilter(setStatus)(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            label="Priority"
            hideLabel
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(e) => updateFilter(setPriority)(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Department"
            hideLabel
            options={departmentOptions}
            value={department}
            onChange={(e) => updateFilter(setDepartment)(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters} className="text-ink-muted">
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
        <span className="ml-auto self-center text-sm text-ink-muted">
          {tasks && !error ? `${total} task${total === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      {error && (
        <EmptyState
          title="Couldn't load tasks"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && tasks === null && <Skeleton className="h-96 w-full" />}

      {!error && tasks?.length > 0 && (
        <>
          <TaskTable tasks={tasks} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

/** Suspense wrapper — `useSearchParams()` requires one at build time in App Router. */
export default function AdminTasksPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-[1200px]" />}>
      <AdminTasksPageInner />
    </Suspense>
  );
}
