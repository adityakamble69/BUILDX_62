import { z } from 'zod';
import { paginationSchema } from '../utils/pagination.js';
import { REPORT_STATUSES, reportIdParamsSchema } from './reportValidators.js';
import { commentIdParamsSchema } from './commentValidators.js';

export { reportIdParamsSchema, commentIdParamsSchema };

// --- Phase 7 — Reports / Departments ---

export const adminReportListQuerySchema = paginationSchema.extend({
  category: z.string().trim().min(1).optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  department: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(['newest', 'upvotes', 'severity']).default('newest'),
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

// --- Phase 7.5 — Tasks / Submissions / Incomplete / Analytics ---

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const TASK_STATUSES = ['pending', 'in_progress', 'completed'];
export const SUBMISSION_STATUSES = ['pending_review', 'approved', 'needs_revision'];

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const taskListQuerySchema = paginationSchema.extend({
  status: z.enum(TASK_STATUSES).optional(),
  department: z.coerce.number().int().positive().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const taskCreateSchema = z.object({
  reportId: z.string().uuid(),
  departmentId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  assignedTo: z.string().trim().max(120).optional(),
  assignedToId: z.string().trim().min(1).max(200).optional(), // Clerk userId of the worker
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  taskDate: optionalDate,
  dueDate: optionalDate,
});

export const taskStatusChangeSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const taskIdParamsSchema = z.object({ id: z.string().uuid() });

export const submissionListQuerySchema = paginationSchema.extend({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  department: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(120).optional(),
});

export const submissionCreateSchema = z.object({
  taskId: z.string().uuid(),
  reportId: z.string().uuid(),
  assignedPerson: z.string().trim().min(2).max(120),
  resolutionImagePath: z.string().trim().min(1).optional(),
  details: z.string().trim().max(2000).optional(),
});

export const submissionReviewSchema = z
  .object({
    status: z.enum(['approved', 'needs_revision']),
    grade: z.enum(['A', 'B', 'C', 'D']).optional(),
    remarks: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.status !== 'needs_revision' || (v.remarks && v.remarks.length > 0), {
    message: 'A remark is required when requesting changes',
    path: ['remarks'],
  });

export const submissionIdParamsSchema = z.object({ id: z.string().uuid() });

export const incompleteQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  department: z.coerce.number().int().positive().optional(),
});