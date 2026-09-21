import { classifyReport, isAiEnabled } from '../services/aiService.js';

/**
 * `enabled: false` is a normal 200, not an error — the client shows/hides its "Suggest
 * with AI" affordance off this flag rather than treating a disabled deployment as a
 * failure (phases.md Phase 8: "form still works when AI is turned off").
 */
export async function postAiClassify(req, res) {
  if (!isAiEnabled()) {
    return res.json({ data: { enabled: false, suggestion: null } });
  }

  const suggestion = await classifyReport(req.body);
  return res.json({ data: { enabled: true, suggestion } });
}
