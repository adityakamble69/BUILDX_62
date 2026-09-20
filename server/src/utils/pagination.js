import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Shared query params for every list endpoint (rules.md §5: paginate all list endpoints). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/**
 * @param {{ page: number, pageSize: number }} parsed
 * @returns {{ from: number, to: number }} inclusive 0-based range for `.range()`
 */
export function toRange({ page, pageSize }) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/**
 * @param {{ page: number, pageSize: number }} parsed
 * @param {number} total
 */
export function toMeta({ page, pageSize }, total) {
  return { page, pageSize, total };
}
