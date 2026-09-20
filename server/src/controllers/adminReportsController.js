import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import {
  listReportsAdmin,
  updateReportStatus,
  assignReportDepartment,
  addResolutionImage,
  deleteReport,
} from '../services/reportService.js';
import { toMeta } from '../utils/pagination.js';

export async function getAdminReports(req, res) {
  const { rows, total } = await listReportsAdmin(req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function patchReportStatus(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId); // status_history.changed_by is a FK to profiles
  await updateReportStatus(req.params.id, userId, req.body.status, req.body.note);
  res.status(204).send();
}

export async function patchReportAssign(req, res) {
  await assignReportDepartment(req.params.id, req.body.departmentId);
  res.status(204).send();
}

export async function postResolutionImage(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId); // report_images.uploaded_by is a FK to profiles
  const data = await addResolutionImage(req.params.id, req.body.storagePath, userId);
  res.status(201).json({ data });
}

export async function deleteAdminReport(req, res) {
  await deleteReport(req.params.id);
  res.status(204).send();
}
