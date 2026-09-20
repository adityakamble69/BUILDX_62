'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { getReportImageUrl } from '@/lib/utils/imageUrl';
import { cn } from '@/lib/utils/cn';

/**
 * Report photos (max 3 "before" + 1 admin "after", database.md §4) as one main image
 * with a thumbnail strip. `images` is the raw `report_images` join from `GET /reports/:id`:
 * [{ id, storage_path, kind, created_at }]. Before photos come first so the main image
 * defaults to what the citizen reported, not the resolution shot.
 *
 * @param {{ images?: Array<{ id: string, storage_path: string, kind?: string }>, title: string }} props
 */
export default function PhotoGallery({ images = [], title }) {
  const photos = [...images]
    .sort((a, b) => (a.kind === 'after' ? 1 : 0) - (b.kind === 'after' ? 1 : 0))
    .map((img) => ({ id: img.id, kind: img.kind, url: getReportImageUrl(img.storage_path) }))
    .filter((img) => img.url);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex];

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface text-ink-subtle">
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm">No photos for this report</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-bg">
        <Image
          key={active.id}
          src={active.url}
          alt={`Photo ${activeIndex + 1} of ${photos.length} for report: ${title}`}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        {active.kind === 'after' && (
          <Badge tone="success" className="absolute left-3 top-3 bg-surface">
            After fix
          </Badge>
        )}
      </div>

      {photos.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Show photo ${i + 1}${photo.kind === 'after' ? ' (after fix)' : ''}`}
                aria-current={i === activeIndex}
                className={cn(
                  'relative h-16 w-24 overflow-hidden rounded-md border-2 transition',
                  i === activeIndex ? 'border-primary-600' : 'border-border hover:border-ink-subtle',
                )}
              >
                <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
