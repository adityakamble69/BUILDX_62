'use client';

import { useState } from 'react';
import { Check, CheckCheck, Copy } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/lib/context/ToastContext';

/**
 * Acknowledgement receipt (BUILD-X Track 3 scenario: "submits a written application
 * with no receipt"). Gives the citizen a reference number, the exact timestamp, the
 * assigned department, and a copy button — the concrete proof of submission that a
 * paper form never provides.
 *
 * Shown for every status (including resolved/rejected): the reference is still the
 * citizen's record of what they filed, regardless of how the report was handled.
 *
 * @param {{ report: {
 *   id: string, status: string, created_at: string,
 *   department?: { name: string } | null,
 * } }} props
 */
export default function ReportReceipt({ report }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(report.id);
      setCopied(true);
      toast('Reference copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy — select and copy manually', 'danger');
    }
  }

  const reportedAt = new Date(report.created_at).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const shortId = report.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary-600/25 bg-primary-50 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <div className="flex items-center gap-3 sm:max-w-xs">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
          <Check className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-700">Report received</p>
          <p className="text-xs leading-snug text-primary-700/70">
            Save this reference — you&rsquo;ll be notified on every update.
          </p>
        </div>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-x-6">
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-primary-700/60">
            Reference
          </dt>
          <dd className="mt-0.5 flex items-center gap-1.5">
            <code className="truncate font-mono text-xs font-semibold text-primary-700">
              {shortId}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy full reference number"
              title={copied ? 'Copied' : 'Copy full reference'}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-primary-700/70 transition hover:bg-primary-600/10 hover:text-primary-700"
            >
              {copied ? (
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </dd>
        </div>

        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-primary-700/60">
            Reported
          </dt>
          <dd className="mt-0.5 text-xs font-medium text-primary-700">{reportedAt}</dd>
        </div>

        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-primary-700/60">
            Department
          </dt>
          <dd className="mt-0.5 truncate text-xs font-medium text-primary-700">
            {report.department?.name ?? 'Pending assignment'}
          </dd>
        </div>

        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-primary-700/60">
            Status
          </dt>
          <dd className="mt-0.5">
            <StatusBadge status={report.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}