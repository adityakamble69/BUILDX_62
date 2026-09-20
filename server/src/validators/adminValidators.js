import { z } from 'zod';
import { paginationSchema } from '../utils/pagination.js';
import { REPORT_STATUSES, reportIdParamsSchema } from './reportValidators.js';
import { commentIdParamsSchema } from './commentValidators.js';

export { reportIdParamsSchema, commentIdParamsSchema };

export const adminReportListQuerySchema = paginationSchema.extend({
  category: z.string().trim().min(1).optional(), // category slug
  status: z.enum(REPORT_STATUSES).optional(),
  department: z.coerce.number().int().positive().optional(), // department id
  sort: z.enum(['newest', 'upvotes']).default('newest'),
});

export const departmentIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const statusChangeSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const assignDepartmentSchema = z.object({
  departmentId: z.coerce.number().int().positive(),
});

export const resolutionImageSchema = z.object({
  // Storage path returned by POST /uploads/sign, already uploaded to Storage —
  // same contract as reportCreateSchema's imagePaths (reportValidators.js).
  storagePath: z.string().trim().min(1),
});

export const adminStatsQuerySchema = z.object({
  trendDays: z.coerce.number().int().min(1).max(90).default(7),
});

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const departmentUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.isActive !== undefined, {
    message: 'Provide "name" and/or "isActive"',
  });
