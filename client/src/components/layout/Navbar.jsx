'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, ClipboardCheck, FileText, Menu, ShieldCheck, X } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Logo from '@/components/layout/Logo';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/city-health', label: 'City Health' },
  { href: '/about', label: 'About' },
];

/**
 * Role-aware public navbar. Four visual variants driven by Clerk role:
 *
 *   Guest   → Sign In + Report an Issue (primary)
 *   Citizen → My Reports + Report an Issue (primary)
 *   Worker  → My Reports + My Tasks (primary)
 *   Admin   → My Reports + Admin Panel (primary)
 *
 * Workers and admins don't get "Report an Issue" in the topbar — their primary action
 * is My Tasks / Admin Panel respectively. They can still file a report through the
 * mobile drawer or by visiting /report/new directly.
 *
 * @param {{ unreadNotifications?: number }} props
 */
export default function Navbar({ unreadNotifications = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-surface">
      <div className={cn('flex h-full w-full items-center justify-between', PAGE_PADDING)}>
        <Link href="/" className="flex items-center" aria-label="Civic Fix home">
          <Logo />
        </Link>

        {/* Desktop nav links — same for everyone. */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition hover:text-primary-600"
            >
              {link.label}
            </Link>
          ))}
          <SignedIn>
            <Link
              href="/my-reports"
              className="text-sm font-medium text-ink-muted transition hover:text-primary-600"
            >
              My Reports
            </Link>
          </SignedIn>
        </nav>

        {/* Desktop actions — role-driven. */}
        <div className="hidden items-center gap-3 md:flex">
          <SignedIn>
            <Link
              href="/notifications"
              aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
              className="relative rounded-md p-2 text-ink-muted hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
            >
              <Bell className="h-5 w-5" />
              {!!unreadNotifications && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
              )}
            </Link>
            <UserButton
              afterSignOutUrl="/"
              userProfileMode="modal"
              appearance={{ elements: { avatarBox: 'h-9 w-9' } }}
            />
          </SignedIn>

          <SignedOut>
            <Button as="a" href="/sign-in" variant="secondary" size="sm">
              Sign In
            </Button>
          </SignedOut>

          {/* ADMIN — only Admin Panel in the topbar. */}
          {isAdmin && (
            <Button as="a" href="/admin" variant="primary" size="sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin Panel
            </Button>
          )}

          {/* WORKER — only My Tasks in the topbar. */}
          {isWorker && (
            <Button as="a" href="/worker/tasks" variant="primary" size="sm">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              My Tasks
            </Button>
          )}

          {/* CITIZEN and GUEST — Report an Issue is the primary action. */}
          {!isAdmin && !isWorker && (
            <Button as="a" href="/report/new" variant="primary" size="sm">
              Report an Issue
            </Button>
          )}
        </div>

        {/* Mobile: avatar + hamburger. Role-specific actions live in the drawer. */}
        <div className="flex items-center gap-2 md:hidden">
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          </SignedIn>
          <button
            type="button"
            className="rounded-md p-2 text-ink"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — role-aware actions. Report an Issue stays here for everyone
          so admin/worker can still file a report from mobile without leaving the app. */}
      <div
        className={cn(
          'absolute inset-x-0 top-16 border-b border-border bg-surface shadow-md transition-all md:hidden',
          menuOpen ? 'max-h-96 opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 p-4" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex h-11 items-center rounded-md px-3 text-base font-medium text-ink hover:bg-bg"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
            <SignedIn>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-md bg-primary-50 px-3 text-base font-semibold text-primary-700 hover:bg-primary-50/80"
                >
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Admin Panel
                </Link>
              )}
              {isWorker && (
                <Link
                  href="/worker/tasks"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-md bg-primary-50 px-3 text-base font-semibold text-primary-700 hover:bg-primary-50/80"
                >
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" /> My Tasks
                </Link>
              )}
              <Link
                href="/my-reports"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-base font-medium text-ink hover:bg-bg"
              >
                <FileText className="h-5 w-5" aria-hidden="true" /> My Reports
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center gap-3 rounded-md px-3 text-base font-medium text-ink hover:bg-bg"
              >
                <Bell className="h-5 w-5" aria-hidden="true" /> Notifications
              </Link>
            </SignedIn>

            <SignedOut>
              <Button as="a" href="/sign-in" variant="secondary" fullWidth>
                Sign In
              </Button>
            </SignedOut>

            <Button as="a" href="/report/new" variant="secondary" fullWidth>
              Report an Issue
            </Button>
          </div>
        </nav>
      </div>

      {/* Floating mobile FAB — hidden for admins (their primary action on mobile is
          the Admin Panel link in the drawer). */}
      {!isAdmin && (
        <Button
          as="a"
          href="/report/new"
          variant="accent"
          className="fixed bottom-[calc(1.5rem + env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-full p-0 text-2xl shadow-lg md:hidden"
          aria-label="Report an issue"
        >
          +
        </Button>
      )}
    </header>
  );
}