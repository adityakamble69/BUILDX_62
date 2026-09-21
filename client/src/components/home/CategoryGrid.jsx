import Link from 'next/link';
import { CATEGORY_LABELS, getCategoryIcon } from '@/lib/utils/categories';

// The six categories are fixed lookup data (mirrors the seeded `categories` table 1:1,
// same source `ReportCard` already trusts), so this stays static instead of an extra
// network round trip for something that never changes at runtime.
const SLUGS = Object.keys(CATEGORY_LABELS);

// Per-category tint using only design.md §2 tokens (no new hex values) — gives each
// chip a distinct but on-brand color, matching the landing mockup's tinted tiles.
const CATEGORY_TINTS = {
  pothole: 'bg-secondary-600/10 text-secondary-600',
  garbage: 'bg-accent-500/15 text-accent-500',
  streetlight: 'bg-warning/10 text-warning',
  water_leak: 'bg-info/10 text-info',
  drainage: 'bg-primary-50 text-primary-600',
  other: 'bg-bg text-ink-muted',
};

export default function CategoryGrid() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Browse by Category</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
        {SLUGS.map((slug) => {
          const Icon = getCategoryIcon(slug);
          const tint = CATEGORY_TINTS[slug] ?? CATEGORY_TINTS.other;
          return (
            <Link
              key={slug}
              href={`/reports?category=${slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tint}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink">{CATEGORY_LABELS[slug]}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}