'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Bell, CheckCheck } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useToast } from '@/lib/context/ToastContext';
import { timeAgo } from '@/lib/utils/timeAgo';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

/**
 * `/notifications` — in-app notifications only in v1 (memory.md D4). Citizen rows come
 * from `change_report_status`; worker rows come from `POST /admin/tasks` when a worker
 * account is assigned. Opening one marks it read and routes by role.
 */
export default function NotificationsPage() {
  const { request, isLoaded } = useApi();
  const { refresh } = useNotifications();
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const isWorker = user?.publicMetadata?.role === 'worker';

  const [page, setPage] = useState(1);
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!isLoaded) return undefined;
    let active = true;

    setError(false);
    request(authPaths.myNotifications({ page, pageSize: PAGE_SIZE }))
      .then((res) => {
        if (!active) return;
        setItems(res.data);
        setTotal(res.meta.total);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, page, request]);

  async function markAllRead() {
    setMarking(true);
    const previous = items;
    setItems((current) => current.map((n) => ({ ...n, is_read: true })));
    try {
      await request(authPaths.notificationsRead, { method: 'PATCH', body: { all: true } });
      refresh();
    } catch (err) {
      setItems(previous);
      toast(err?.message || 'Could not mark notifications as read', 'danger');
    } finally {
      setMarking(false);
    }
  }

  async function open(notification) {
    if (!notification.is_read) {
      setItems((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
      );
      // Fire-and-forget: a failed mark-read must not stop the user reaching the report.
      request(authPaths.notificationsRead, { method: 'PATCH', body: { id: notification.id } })
        .then(refresh)
        .catch(() => {});
    }
    if (isWorker) {
      router.push('/worker/tasks');
    } else if (notification.report_id) {
      router.push(`/reports/${notification.report_id}`);
    }
  }

  const unreadOnPage = items?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
          <p className="mt-1 text-ink-muted">
            {isWorker
              ? 'Updates when the city assigns you a task.'
              : 'Updates on the reports you have submitted.'}
          </p>
        </div>
        {unreadOnPage > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead} loading={marking}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </div>

      {error && (
        <EmptyState
          title="Couldn't load your notifications"
          description="The server may still be waking up — refresh in a few seconds."
        />
      )}

      {!error && items === null && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!error && items?.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description={
            isWorker
              ? "You'll hear from us when the city assigns you a task."
              : "You'll hear from us when the city updates one of your reports."
          }
        />
      )}

      {!error && items?.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition hover:shadow-md',
                    notification.is_read
                      ? 'border-border bg-surface'
                      : 'border-primary-600/30 bg-primary-50',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      notification.is_read ? 'bg-transparent' : 'bg-accent-500',
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{notification.message}</span>
                    <span className="mt-1 block text-xs text-ink-subtle">
                      {timeAgo(notification.created_at)}
                      {!notification.is_read && ' · Unread'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
