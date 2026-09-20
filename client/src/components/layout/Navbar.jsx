'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Logo from '@/components/layout/Logo';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/city-health', label: 'City Health' },
  { href: '/about', label: 'About' },
];

/**
 * Auth state comes from Clerk. The unread notification count is wired to the real
 * API in Phase 6; until then the bell renders without a dot.
 * @param {{ unreadNotifications?: number }} props
 */
export default function Navbar({ unreadNotifications = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center" aria-label="Civic Fix home">
          <Logo />
        </Link>

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
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm font-medium text-primary-600 transition hover:text-primary-700"
            >
              Admin
            </Link>
          )}
        </nav>

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
          <Button as="a" href="/report/new" variant="primary" size="sm">
            Report an Issue
          </Button>
        </div>

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

      {/* Mobile drawer */}
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
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 items-center rounded-md px-3 text-base font-medium text-primary-600 hover:bg-bg"
            >
              Admin
            </Link>
          )}
          <div className="mt-2 border-t border-border pt-3">
            <SignedIn>
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
          </div>
        </nav>
      </div>

      {/* Floating "Report an issue" CTA, mobile only (design.md §13). */}
      <Button
        as="a"
        href="/report/new"
        variant="accent"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-full p-0 text-2xl shadow-lg md:hidden"
        aria-label="Report an issue"
      >
        +
      </Button>
    </header>
  );
}
