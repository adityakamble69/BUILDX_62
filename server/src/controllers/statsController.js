import { getPublicStats } from '../services/statsService.js';

export async function getStatsPublic(_req, res) {
  const data = await getPublicStats();
  res.json({ data });
}
