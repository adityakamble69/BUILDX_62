// Matches `reports.severity` (smallint 1-5, database.md §4). No enum exists in the DB for
// this — it's a plain integer — so the label set lives here, once, for the form and detail page.
export const SEVERITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Critical' },
];

const LABEL_BY_VALUE = Object.fromEntries(SEVERITY_OPTIONS.map((o) => [o.value, o.label]));

/** @param {number} value 1-5 */
export function getSeverityLabel(value) {
  return LABEL_BY_VALUE[value] ?? 'Medium';
}
