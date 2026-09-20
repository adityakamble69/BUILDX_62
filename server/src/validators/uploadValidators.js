import { z } from 'zod';

// Restricted to JPEG/PNG/WebP, max 3 per report (rules.md §7, database.md §4).
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadSignSchema = z.object({
  count: z.coerce.number().int().min(1).max(3).default(1),
  contentType: z.enum(ALLOWED_MIME_TYPES),
});
