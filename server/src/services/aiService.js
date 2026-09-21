import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { listCategories } from './categoryService.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 12_000; // phases.md Phase 8 completion criteria: "within a few seconds"

/**
 * Whether the AI feature is switched on at all (PRD §16, architecture.md §13). Checked
 * up front so a disabled deployment never spends a request building a prompt or hitting
 * the network — `aiController` uses this to short-circuit before calling `classifyReport`.
 */
export function isAiEnabled() {
  return env.AI_ENABLED && !!env.AI_API_KEY;
}

function buildPrompt(categories, title, description) {
  const categoryList = categories.map((c) => `- ${c.slug}: ${c.name}`).join('\n');
  const details = [title && `Title: ${title}`, description && `Description: ${description}`]
    .filter(Boolean)
    .join('\n');

  return [
    'You are triaging a civic issue report for a city complaints platform from a photo (and',
    "optional text). Pick the single best-fitting category slug from this exact list — never",
    'invent a new one:',
    categoryList,
    '',
    'Also estimate severity as an integer from 1 (low, cosmetic) to 5 (critical, urgent safety',
    'risk).',
    '',
    details || '(No title or description was provided yet — judge from the photo alone.)',
    '',
    'Respond with ONLY a single JSON object, no prose, no markdown fences, in exactly this',
    'shape: {"category": "<slug>", "severity": <1-5 integer>}',
  ].join('\n');
}

/** Strips ```json fences etc. in case the model doesn't follow the "JSON only" instruction. */
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

/**
 * Calls the Anthropic Messages API with the report's photo (+ any text typed so far) and
 * returns a suggested category slug + severity, or `null` if the AI is disabled, the call
 * fails, or the response can't be trusted (rules.md §"graceful fallback" — a suggestion is
 * a convenience, never a dependency of the reporting flow).
 * @param {{ title?: string, description?: string, imageBase64: string, mimeType: string }} input
 * @returns {Promise<{ category: string, severity: number } | null>}
 */
export async function classifyReport({ title, description, imageBase64, mimeType }) {
  if (!isAiEnabled()) return null;

  const categories = await listCategories();
  const validSlugs = new Set(categories.map((c) => c.slug));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.AI_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
              { type: 'text', text: buildPrompt(categories, title, description) },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error('AI classify request failed', { status: res.status, body: body.slice(0, 500) });
      return null;
    }

    const data = await res.json();
    const text = data?.content?.find((block) => block.type === 'text')?.text;
    if (!text) {
      logger.error('AI classify response had no text block', { data });
      return null;
    }

    const parsed = JSON.parse(extractJson(text));
    const category = String(parsed.category ?? '').trim();
    const severity = Number(parsed.severity);

    if (!validSlugs.has(category)) {
      logger.warn('AI classify returned an unknown category — discarding suggestion', { category });
      return null;
    }
    if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
      logger.warn('AI classify returned an invalid severity — discarding suggestion', { severity });
      return null;
    }

    return { category, severity };
  } catch (err) {
    // Network error, timeout (AbortError), or a malformed JSON response — all treated the
    // same way: log for diagnosis, return null so the form still works (rules.md §10).
    logger.error('AI classify failed', { message: err?.message });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
