'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Inbox,
  CircleAlert,
  ChartColumn,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/assign', label: 'Assign Task', icon: ClipboardList },
  { href: '/admin/submissions', label: 'Submissions', icon: Inbox },
  { href: '/admin/incomplete', label: 'Incomplete', icon: CircleAlert },
  { href: '/admin/analytics', label: 'Analytics', icon: ChartColumn },
];

/** @param {{ adminName?: string, adminEmail?: string }} props */
export default function Sidebar({ adminName = 'Admin', adminEmail = '' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  const NavList = ({ onNavigate }) => (
    <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Admin">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/80 transition',
            isActive(href) ? 'bg-primary-600 text-white' : 'hover:bg-white/10',
          )}
          aria-current={isActive(href) ? 'page' : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col bg-secondary-600 md:flex">
        <div className="flex h-16 items-center px-4">
          <Logo mode="dark" />
        </div>
        <NavList onNavigate={undefined} />
        <div className="flex items-center gap-3 border-t border-white/10 p-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold">
            {adminName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{adminName}</p>
            {adminEmail && <p className="truncate text-xs text-white/60">{adminEmail}</p>}
          </div>
          <SignOutButton redirectUrl="/">
            <button type="button" aria-label="Log out" className="rounded p-1 hover:bg-white/10">
              <LogOut className="h-4 w-4" />
            </button>
          </SignOutButton>
        </div>
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
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.5)]" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-64 flex-col bg-secondary-600">
            <NavList onNavigate={() => setOpen(false)} />
            <div className="border-t border-white/10 p-4">
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white/80 hover:bg-white/10"
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
