import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';

/**
 * design.md §15 `ChartCard` / §10 "no chart without a title". A fixed height keeps
 * Chart.js's `maintainAspectRatio: false` canvases from collapsing to 0px.
 *
 * Optional `href` turns the title into a link with a hover arrow — used on the admin
 * dashboard so each panel (mini map, recent reports, top categories, chart) can send
 * the admin to its full page, since the dashboard itself is only a glance.
 *
 * @param {{
 *   title: string,
 *   children: React.ReactNode,
 *   height?: number,
 *   href?: string,
 *   hrefLabel?: string,
 * }} props
 */
export default function ChartCard({ title, children, height = 280, href, hrefLabel }) {
  return (
    <Card>
      {href ? (
        <Link
          href={href}
          className="group flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1 transition hover:bg-bg"
          aria-label={hrefLabel ?? `Open ${title}`}
        >
          <h3 className="text-lg font-semibold text-ink group-hover:text-primary-600">{title}</h3>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-primary-600"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      )}
      <div className="mt-4" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}