import Link from 'next/link';
import { CATEGORY_LABELS, getCategoryIcon } from '@/lib/utils/categories';

// The six categories are fixed lookup data (mirrors the seeded `categories` table 1:1,
// same source `ReportCard` already trusts), so this stays static instead of an extra
// network round trip for something that never changes at runtime.
const SLUGS = Object.keys(CATEGORY_LABELS);

export default function CategoryGrid() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Browse by Category</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
        {SLUGS.map((slug) => {
          const Icon = getCategoryIcon(slug);
          return (
            <Link
              key={slug}
              href={`/reports?category=${slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
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
