import { z } from 'zod';

export const commentCreateSchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export const commentIdParamsSchema = z.object({
  id: z.string().uuid('Invalid comment id'),
});
