import { z } from 'zod';
import { paginationSchema } from '../utils/pagination.js';

// Enum values must match database.md §3 exactly (rules.md §11).
export const REPORT_STATUSES = ['reported', 'in_progress', 'resolved', 'rejected'];

const latSchema = z.coerce.number().min(-90).max(90);
const lngSchema = z.coerce.number().min(-180).max(180);

export const reportListQuerySchema = paginationSchema.extend({
  category: z.string().trim().min(1).optional(), // category slug
  status: z.enum(REPORT_STATUSES).optional(),
  sort: z.enum(['newest', 'upvotes']).default('newest'),
});

export const reportMapQuerySchema = z.object({
  category: z.string().trim().min(1).optional(), // category slug
  status: z.enum(REPORT_STATUSES).optional(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().uuid('Invalid report id'),
});

export const nearbyDuplicatesQuerySchema = z.object({
  lat: latSchema,
  lng: lngSchema,
  category: z.string().trim().min(1), // category slug
  radius: z.coerce.number().int().positive().max(1000).default(50),
});

export const reportCreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(1).max(2000),
  category: z.string().trim().min(1), // category slug
  severity: z.coerce.number().int().min(1).max(5).default(2),
  lat: latSchema,
  lng: lngSchema,
  areaName: z.string().trim().max(200).optional(),
  // Storage paths returned by POST /uploads/sign, in the order they should be attached.
  imagePaths: z.array(z.string().trim().min(1)).min(1).max(3),
});
