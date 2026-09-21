import { getAnalytics, getIncompleteReports } from '../services/analyticsService.js';

export async function getAdminAnalytics(_req, res) {
  const data = await getAnalytics();
  res.json({ data });
}

export async function getAdminIncomplete(req, res) {
  const { rows } = await getIncompleteReports(req.query);
  res.json({ data: rows });
}