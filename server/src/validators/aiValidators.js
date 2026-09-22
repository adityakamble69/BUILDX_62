import { z } from 'zod';

// Same allow-list as uploadValidators.js (rules.md §7) — PhotoStep always compresses to
// JPEG (client/src/lib/utils/compressImage.js), but the other two are accepted in case
// that ever changes.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ~1.5MB of base64 text, comfortably under PhotoStep's ~1MB-blob cap (which inflates to
// ~1.37MB as base64) plus headroom for the rest of the JSON body, and under index.js's
// 2mb express.json() limit for this route.
const MAX_BASE64_LENGTH = 2_000_000;

export const aiClassifySchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  imageBase64: z
    .string()
    .min(1, 'A photo is required for AI classification')
    .max(MAX_BASE64_LENGTH, 'Image is too large')
    .transform((value) => {
      const marker = 'base64,';
      const index = value.indexOf(marker);
      return index >= 0 ? value.slice(index + marker.length) : value;
    }),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});
