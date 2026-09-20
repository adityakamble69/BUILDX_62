// The API only ever returns storage *paths* (e.g. "reports/<userId>/<uuid>.jpg"), never
// full URLs (architecture.md: the API is the only enforcement point, but the
// `report-images` bucket itself is public-read — see database.md §"Storage" / decision 16
// in memory.md). Building the public URL is a pure client-side string operation, so it
// lives here instead of round-tripping through Express.
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const BUCKET = 'report-images';

/**
 * @param {string | null | undefined} storagePath e.g. "reports/user_123/abc.jpg"
 * @returns {string | undefined} public URL, or undefined if there's no path (caller should
 *   fall back to a "no photo" placeholder — see ReportCard).
 */
export function getReportImageUrl(storagePath) {
  if (!storagePath) return undefined;
  if (!SUPABASE_URL) {
    // Missing env var — fail soft (no broken <img>) rather than throwing during render.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('NEXT_PUBLIC_SUPABASE_URL is not set; report images will not load.');
    }
    return undefined;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/**
 * Picks the "before" photo to show as a card thumbnail (the first uploaded image).
 * `images` is the `report_images` join from the API: [{ storage_path, kind, ... }].
 * @param {Array<{ storage_path: string, kind?: string }> | undefined} images
 */
export function getThumbnailUrl(images) {
  const before = images?.find((img) => img.kind !== 'after') ?? images?.[0];
  return getReportImageUrl(before?.storage_path);
}
