import Link from 'next/link';
import Logo from '@/components/layout/Logo';
import { cn } from '@/lib/utils/cn';
import { PAGE_PADDING } from '@/lib/utils/layout';

const LINKS = [
  { href: '/map', label: 'Map' },
  { href: '/city-health', label: 'City Health' },
  { href: '/about', label: 'About' },
  { href: '/report/new', label: 'Report an Issue' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div
        className={cn(
          'flex w-full flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between',
          PAGE_PADDING,
        )}
      >
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-ink-muted">
            Report civic issues, back the ones that matter, and see them fixed. Built for cleaner
            streets and stronger communities.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted hover:text-primary-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-ink-subtle">
        © {new Date().getFullYear()} Civic Fix. Built for BUILD-X.
      </div>
    </footer>
  );
}
