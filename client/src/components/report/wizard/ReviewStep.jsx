'use client';

import Link from 'next/link';
import { ArrowUp, CircleAlert, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import { getCategoryLabel } from '@/lib/utils/categories';
import { getSeverityLabel } from '@/lib/utils/severity';

/**
 * Step 4 — review + duplicate check. The wizard runs `GET /reports/nearby-duplicates`
 * when this step opens and passes the result in; matches are shown as a *warning*, not a
 * block — only the reporter can tell whether a nearby open report is really the same issue
 * (PRD §duplicates). Upvoting the existing one is offered as the better action.
 *
 * @param {{
 *  values: { title: string, description: string, category: string, severity: string, areaName: string },
 *  location: { lat: number, lng: number },
 *  photoCount: number,
 *  duplicates: Array<{ id: string, title: string, upvote_count: number, distance_m: number }> | null,
 *  duplicatesLoading: boolean,
 * }} props
 */
export default function ReviewStep({ values, location, photoCount, duplicates, duplicatesLoading }) {
  const facts = [
    { label: 'Category', value: getCategoryLabel(values.category) },
    { label: 'Severity', value: getSeverityLabel(Number(values.severity)) },
    { label: 'Area', value: values.areaName || '—' },
    { label: 'Coordinates', value: `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` },
    { label: 'Photos', value: `${photoCount} attached` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Review and submit</h2>
        <p className="mt-1 text-sm text-ink-muted">Check the details before sending this to the city.</p>
      </div>

      {duplicatesLoading && (
        <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking for similar reports nearby…
        </p>
      )}

      {!duplicatesLoading && duplicates?.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CircleAlert className="h-4 w-4 text-warning" aria-hidden="true" />
            Someone may have already reported this
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Upvoting an existing report pushes it up the city&apos;s list faster than a second entry.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {duplicates.map((dup) => (
              <li key={dup.id}>
                <Link
                  href={`/reports/${dup.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 hover:shadow-md"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{dup.title}</span>
                    <span className="text-xs text-ink-subtle">{Math.round(dup.distance_m)} m away</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-muted">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    {dup.upvote_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-subtle">
            If none of these is your issue, carry on and submit.
          </p>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-semibold">{values.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{values.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs font-medium text-ink-subtle">{fact.label}</dt>
              <dd className="text-sm font-semibold text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
