'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Inbox,
  AlertCircle,
  BarChart3,
  Flame,
  Building2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import Logo from '@/components/layout/Logo';
import { cn } from '@/lib/utils/cn';

// Two groups: "operations" is the daily workflow (report → assign → submit → review →
// resolve); "insights & setup" holds the tools.
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/tasks', label: 'Assign Task', icon: ClipboardCheck },
      { href: '/admin/submissions', label: 'Submissions', icon: Inbox },
      { href: '/admin/incomplete', label: 'Incomplete', icon: AlertCircle },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/heatmap', label: 'Heatmap', icon: Flame },
      { href: '/admin/departments', label: 'Departments', icon: Building2 },
    ],
  },
];

/**
 * Admin sidebar. The user profile block lives in `AdminTopbar` (which opens Clerk's
 * user-profile modal, sign-out included) — not duplicated here, so the sidebar stays
 * purely navigation.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const NavList = ({ onNavigate }) => (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/80 transition',
                  active ? 'bg-primary-600 text-white shadow-sm' : 'hover:bg-white/10',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop rail — logo + nav only */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-secondary-600 md:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Logo mode="dark" />
        </div>
        <NavList onNavigate={undefined} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-secondary-600 px-4 md:hidden">
        <Logo mode="dark" />
        <button
          type="button"
          aria-label={open ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-white"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[rgba(15,23,42,0.5)]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 flex-col bg-secondary-600">
            <NavList onNavigate={() => setOpen(false)} />
            {/* Mobile drawer keeps a sign-out button — on mobile the topbar profile
                still works, but a one-tap logout here is worth the extra row. */}
            <div className="border-t border-white/10 p-4">
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white/80 hover:bg-white/10"
                  suppressHydrationWarning
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" /> Log out
                </button>
              </SignOutButton>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}