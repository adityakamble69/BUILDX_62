'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, RefreshCw, Search } from 'lucide-react';
import { useUser, useClerk, SignOutButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils/cn';

/**
 * Admin top navigation (design brief §1). Search box (Enter → `/admin/reports?search=`),
 * notification bell, refresh, admin profile (opens Clerk's user-profile modal), and a
 * dedicated log-out button (Clerk `SignOutButton`) for one-click exit.
 *
 * All action buttons carry `suppressHydrationWarning` because password-manager browser
 * extensions (LastPass & similar) stamp a `fdprocessedid` attribute onto buttons before
 * React hydrates — same false positive as memory.md D32 for form fields.
 *
 * @param {{ adminName?: string, adminEmail?: string }} props
 */
export default function AdminTopbar({ adminName = 'Admin', adminEmail = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const clerk = useClerk();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const adminRole = user?.publicMetadata?.role === 'admin' ? 'Administrator' : 'Admin';
  const initials = adminName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/admin/reports?search=${encodeURIComponent(q)}` : '/admin/reports');
  }

  function handleRefresh() {
    setRefreshing(true);
    window.location.reload();
  }

  function openProfile() {
    clerk.openUserProfile();
  }

  const isOnNotifications = pathname?.startsWith('/notifications');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:px-6">
      {/* Search — capped width, left-aligned. */}
      <form onSubmit={handleSearch} role="search" className="relative w-full max-w-sm shrink">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports, categories or locations…"
          aria-label="Search reports"
          className="h-10 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          suppressHydrationWarning
        />
      </form>

      {/* Push the actions + profile to the far right regardless of the search width. */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Refresh data"
          title="Refresh data"
          onClick={handleRefresh}
          disabled={refreshing}
          suppressHydrationWarning
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-primary-600/40 hover:text-primary-600',
            refreshing && 'opacity-60',
          )}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Open notifications"
          title="Notifications"
          onClick={() => router.push('/notifications')}
          suppressHydrationWarning
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-primary-600/40 hover:text-primary-600',
            isOnNotifications && 'border-primary-600/40 text-primary-600',
          )}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Profile — opens Clerk's user-profile modal. */}
        <button
          type="button"
          onClick={openProfile}
          aria-label="Open account menu"
          suppressHydrationWarning
          className="flex h-10 shrink-0 items-center gap-2.5 rounded-md border border-border bg-surface pl-1.5 pr-2 transition hover:border-primary-600/40 hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 md:gap-3 md:pl-2 md:pr-3"
        >
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Clerk avatar URL, fixed size
            <img src={user.imageUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-semibold text-white"
              aria-hidden="true"
            >
              {initials || 'AD'}
            </span>
          )}
          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="truncate text-sm font-semibold text-ink">{adminName}</span>
            <span className="truncate text-[11px] font-medium text-ink-subtle">{adminRole}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-ink-subtle md:block" aria-hidden="true" />
        </button>

        {/* Log out — a one-click exit via Clerk's SignOutButton. */}
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            suppressHydrationWarning
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-danger/40 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}