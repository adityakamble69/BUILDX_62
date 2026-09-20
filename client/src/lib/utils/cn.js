/** Joins truthy class name fragments. Keeps us from adding a clsx dependency for one function. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
