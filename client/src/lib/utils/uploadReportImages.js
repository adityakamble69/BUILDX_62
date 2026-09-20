// Photos go straight from the browser to Supabase Storage using short-lived signed URLs
// issued by `POST /uploads/sign` (architecture.md D5 — the free-tier server never proxies
// image bytes). Like `imageUrl.js`, this is Storage-only: it never touches the database and
// never needs a Supabase client, just a PUT to a URL Express handed us (rules.md §7 —
// "don't import Supabase in Next.js code").
import { authPaths } from '@/lib/api';

// `compressImage` always re-encodes as JPEG, and POST /uploads/sign takes one contentType
// per batch (uploadValidators.js), so the whole batch is JPEG.
const CONTENT_TYPE = 'image/jpeg';

/**
 * @param {(path: string, options?: object) => Promise<any>} request `useApi().request`
 * @param {Blob[]} blobs compressed images, in the order they should be attached
 * @returns {Promise<string[]>} storage paths to send as `imagePaths` on POST /reports
 */
export async function uploadReportImages(request, blobs) {
  const { data: slots } = await request(authPaths.uploadSign, {
    method: 'POST',
    body: { count: blobs.length, contentType: CONTENT_TYPE },
  });

  await Promise.all(
    blobs.map(async (blob, i) => {
      const res = await fetch(slots[i].signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE },
        body: blob,
      });
      if (!res.ok) throw new Error('Could not upload one of your photos');
    }),
  );

  return slots.map((slot) => slot.path);
}
