import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { listSubmissions, createSubmission, reviewSubmission } from '../services/submissionService.js';
import { toMeta } from '../utils/pagination.js';

export async function getAdminSubmissions(req, res) {
  const { rows, total } = await listSubmissions(req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function postAdminSubmission(req, res) {
  const data = await createSubmission(req.body);
  res.status(201).json({ data });
}

export async function patchAdminSubmissionReview(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId); // submissions.reviewed_by → profiles.id (FK)
  await reviewSubmission(req.params.id, userId, req.body);
  res.status(204).send();
}