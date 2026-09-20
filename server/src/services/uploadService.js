import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const BUCKET = 'report-images';

/**
 * Issues short-lived signed upload URLs so the client uploads photos straight to
 * Supabase Storage (architecture.md D5) instead of through this free-tier server.
 * Paths are namespaced per user so nothing can collide or overwrite another user's file.
 * @param {string} userId
 * @param {{ count: number, contentType: string }} params
 * @returns {Promise<{ path: string, token: string, signedUrl: string }[]>}
 */
export async function createSignedUploads(userId, { count, contentType }) {
  const ext = EXT_BY_MIME[contentType];

  const uploads = await Promise.all(
    Array.from({ length: count }, async () => {
      const path = `reports/${userId}/${randomUUID()}.${ext}`;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error) throw dbError('createSignedUploads', error, 'Could not create an upload URL');
      return { path: data.path, token: data.token, signedUrl: data.signedUrl };
    }),
  );

  return uploads;
}
