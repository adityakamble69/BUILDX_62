'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, RefreshCw, Search } from 'lucide-react';
import { useUser, useClerk, SignOutButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils/cn';

/**
 * Admin top navigation. Responsive:
 *   - < sm: search + bell + avatar (refresh + logout hidden — reload/nav available elsewhere)
 *   - sm+  : all four action buttons + search
 *   - md+  : admin name + role shown next to the avatar
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
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6">
        {/* Search — takes remaining width on mobile, capped on md+ */}
        <form onSubmit={handleSearch} role="search" className="relative min-w-0 flex-1 md:max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle sm:left-3 sm:h-4 sm:w-4"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            aria-label="Search reports"
            className="h-9 w-full rounded-md border border-border bg-bg pl-8 pr-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-600/20 sm:h-10 sm:pl-9 sm:pr-3"
            suppressHydrationWarning
          />
        </form>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Refresh — hidden on mobile (user can pull-to-refresh or use browser refresh) */}
          <button
            type="button"
            aria-label="Refresh data"
            title="Refresh data"
            onClick={handleRefresh}
            disabled={refreshing}
            suppressHydrationWarning
            className={cn(
              'hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-primary-600/40 hover:text-primary-600 sm:flex',
              refreshing && 'opacity-60',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
          </button>

          {/* Bell — always visible */}
          <button
            type="button"
            aria-label="Open notifications"
            title="Notifications"
            onClick={() => router.push('/notifications')}
            suppressHydrationWarning
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-primary-600/40 hover:text-primary-600 sm:h-10 sm:w-10',
              isOnNotifications && 'border-primary-600/40 text-primary-600',
            )}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Profile — avatar always, name/role/chevron from md+ */}
          <button
            type="button"
            onClick={openProfile}
            aria-label="Open account menu"
            suppressHydrationWarning
            className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-surface pl-1 pr-1 transition hover:border-primary-600/40 hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 sm:h-10 sm:gap-2.5 sm:pl-1.5 sm:pr-2 md:gap-3 md:pl-2 md:pr-3"
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Clerk avatar URL, fixed size
              <img
                src={user.imageUrl}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
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
            <ChevronDown
              className="hidden h-4 w-4 shrink-0 text-ink-subtle md:block"
              aria-hidden="true"
            />
          </button>

          {/* Log out — hidden on mobile (available inside the Clerk profile modal) */}
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              aria-label="Log out"
              title="Log out"
              suppressHydrationWarning
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-ink-muted transition hover:border-danger/40 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger sm:flex"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}