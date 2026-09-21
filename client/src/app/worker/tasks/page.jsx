'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import WorkerTaskCard from '@/components/worker/WorkerTaskCard';
import WorkerSubmissionModal from '@/components/worker/WorkerSubmissionModal';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

/**
 * `/worker/tasks` — the worker's own dashboard. Guarded by middleware.js (redirect to
 * `/` if role is not "worker"). Fetches `GET /me/tasks` which is worker-scoped server-side;
 * the tab filtering here is purely visual over that already-scoped list.
 */
export default function WorkerTasksPage() {
  const { request, isLoaded } = useApi();

  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('active');
  const [submitting, setSubmitting] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.myTasks)
      .then((res) => {
        if (active) setTasks(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, request, reloadKey]);

  const visible = tasks
    ? tab === 'all'
      ? tasks
      : tab === 'completed'
        ? tasks.filter((t) => t.status === 'completed')
        : tasks.filter((t) => t.status !== 'completed')
    : null;

  const counts = tasks
    ? {
        active: tasks.filter((t) => t.status !== 'completed').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        all: tasks.length,
      }
    : null;

  return (
    <div className={cn('flex w-full flex-col gap-6 py-8 md:py-10', PAGE_PADDING)}>
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">My Tasks</h1>
        <p className="mt-1 text-ink-muted">
          Civic issues assigned to you. Upload a resolution photo when the work is done.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Task filters">
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = counts?.[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition',
                active ? 'text-primary-600' : 'text-ink-muted hover:text-ink',
              )}
            >
              {label}
              {count !== undefined && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    active ? 'bg-primary-50 text-primary-600' : 'bg-bg text-ink-subtle',
                  )}
                >
                  {count}
                </span>
              )}
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

      {error && (
        <EmptyState
          title="Couldn't load your tasks"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && tasks === null && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {!error && tasks?.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No tasks assigned yet"
          description="When the city assigns you a task, it will show up here."
        />
      )}

      {!error && tasks?.length > 0 && visible?.length === 0 && (
        <EmptyState
          title={`No ${tab} tasks`}
          description={tab === 'completed' ? "You haven't completed any tasks yet." : 'Nothing to do right now.'}
        />
      )}

      {!error && visible?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <WorkerTaskCard key={t.id} task={t} onSubmit={setSubmitting} />
          ))}
        </div>
      )}

      <WorkerSubmissionModal
        open={!!submitting}
        task={submitting}
        onClose={() => setSubmitting(null)}
        onSubmitted={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}