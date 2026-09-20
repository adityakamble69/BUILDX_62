// Small "time ago" formatter so we don't pull in a date library for one function.
const UNITS = [
  { max: 3600, div: 60, abbr: 'm' },
  { max: 86400, div: 3600, abbr: 'h' },
  { max: 604800, div: 86400, abbr: 'd' },
  { max: 2629800, div: 604800, abbr: 'w' },
  { max: 31557600, div: 2629800, abbr: 'mo' },
  { max: Infinity, div: 31557600, abbr: 'y' },
];

/**
 * @param {string | number | Date} date
 * @returns {string} e.g. "2h ago", "just now"
 */
export function timeAgo(date) {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 30) return 'just now';

  const bucket = UNITS.find((u) => seconds < u.max) ?? UNITS[UNITS.length - 1];
  const value = Math.floor(seconds / bucket.div);
  return `${value}${bucket.abbr} ago`;
}
