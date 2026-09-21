/**
 * Formats `get_public_stats()`'s `avg_hours_to_resolve` (numeric hours, possibly null when
 * nothing is resolved yet) for display — design.md's City Health mockup shows this as
 * "2.6 days", so anything under a day is shown in hours instead of "0.2 days".
 * @param {number | null | undefined} hours
 * @returns {string}
 */
export function formatAvgResolveTime(hours) {
  if (hours === null || hours === undefined || Number.isNaN(Number(hours))) return '—';
  const n = Number(hours);
  if (n < 24) return `${n.toFixed(1)} hrs`;
  return `${(n / 24).toFixed(1)} days`;
}
