/**
 * Builds `/admin/tasks?...` so the Assign Task form opens pre-filled from a report.
 * Title/department are hints only — the admin can still edit them on the form.
 */
export function assignTaskHref(report) {
  const query = new URLSearchParams({ reportId: report.id });
  if (report.title) query.set('title', report.title);
  if (report.department?.id) query.set('departmentId', String(report.department.id));
  return `/admin/tasks?${query.toString()}`;
}
