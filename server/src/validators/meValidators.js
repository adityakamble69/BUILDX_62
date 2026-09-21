import { z } from 'zod';

export const workerSubmissionSchema = z.object({
  resolutionImagePath: z.string().trim().min(1).optional(),
  details: z.string().trim().max(2000).optional(),
});

export const workerTaskIdParamsSchema = z.object({
  id: z.string().uuid(),
});