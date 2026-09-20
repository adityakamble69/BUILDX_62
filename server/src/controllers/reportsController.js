import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { toMeta } from '../utils/pagination.js';
import {
  listReports,
  getMapPoints,
  getReportDetail,
  findNearbyDuplicates,
  createReport,
  toggleUpvote,
} from '../services/reportService.js';

export async function getReports(req, res) {
  const { rows, total } = await listReports(req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function getReportsMap(req, res) {
  const data = await getMapPoints(req.query);
  res.json({ data });
}

export async function getReportById(req, res) {
  const data = await getReportDetail(req.params.id);
  res.json({ data });
}

export async function getNearbyDuplicates(req, res) {
  const data = await findNearbyDuplicates(req.query);
  res.json({ data });
}

export async function postReport(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId);
  const data = await createReport(userId, req.body);
  res.status(201).json({ data });
}

export async function postUpvote(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId);
  const data = await toggleUpvote(req.params.id, userId);
  res.json({ data });
}
