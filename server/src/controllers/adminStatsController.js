import { getAdminStats, getHeatmapPoints } from '../services/statsService.js';

export async function getAdminStatsController(req, res) {
  const data = await getAdminStats(req.query.trendDays);
  res.json({ data });
}

export async function getAdminHeatmap(_req, res) {
  const data = await getHeatmapPoints();
  res.json({ data });
}
