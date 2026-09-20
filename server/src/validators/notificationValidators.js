import { z } from 'zod';

// Body is optional: omitted or { all: true } marks every notification read;
// { id } marks a single one.
export const notificationsReadSchema = z
  .object({
    id: z.string().uuid().optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.id || v.all, { message: 'Provide either "id" or "all"' });
