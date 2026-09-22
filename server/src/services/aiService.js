import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { listCategories } from './categoryService.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 12_000; // phases.md Phase 8: "within a few seconds"
const DEFAULT_MODELS = {
  anthropic: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-2.0-flash',
};

/**
 * Whether the AI feature is switched on at all (PRD §16, architecture.md §13). Checked
 * up front so a disabled deployment never spends a request building a prompt or hitting
 * the network — `aiController` uses this to short-circuit before calling `classifyReport`.
 */
export function isAiEnabled() {
  return env.AI_ENABLED && !!env.AI_API_KEY;
}

/**
 * `AI_PROVIDER=auto` (the default) infers from the key prefix so a Gemini `AIza…` key
 * doesn't get sent to Anthropic because `AI_MODEL` still had the Claude default.
 */
export function resolveAiProvider() {
  if (env.AI_PROVIDER === 'gemini' || env.AI_PROVIDER === 'anthropic') return env.AI_PROVIDER;
  return env.AI_API_KEY?.startsWith('sk-ant') ? 'anthropic' : 'gemini';
}

export function resolveAiModel() {
  return env.AI_MODEL || DEFAULT_MODELS[resolveAiProvider()];
}

function stripDataUrl(base64) {
  const marker = 'base64,';
  const index = base64.indexOf(marker);
  return index >= 0 ? base64.slice(index + marker.length) : base64;
}

function buildPrompt(categories, title, description) {
  const categoryList = categories.map((c) => `- ${c.slug}: ${c.name}`).join('\n');
  const details = [title && `Title: ${title}`, description && `Description: ${description}`]
    .filter(Boolean)
    .join('\n');

  return [
    'You are triaging a civic issue report for a city complaints platform from a photo (and',
    'optional text). Pick the single best-fitting category slug from this exact list — never',
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

function parseSuggestion(text, validSlugs) {
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
}

async function classifyWithAnthropic({ prompt, imageBase64, mimeType, signal }) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: resolveAiModel(),
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('AI classify request failed', { provider: 'anthropic', status: res.status, body: body.slice(0, 500) });
    return null;
  }

  const data = await res.json();
  return data?.content?.find((block) => block.type === 'text')?.text ?? null;
}

async function classifyWithGemini({ prompt, imageBase64, mimeType, signal }) {
  const model = encodeURIComponent(resolveAiModel());
  const res = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': env.AI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('AI classify request failed', { provider: 'gemini', status: res.status, body: body.slice(0, 500) });
    return null;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text).filter(Boolean).join('\n') || null;
}

/**
 * Calls the configured vision API (Gemini or Anthropic) with the report's photo (+ any
 * text typed so far) and returns a suggested category slug + severity, or `null` if the
 * AI is disabled, the call fails, or the response can't be trusted (rules.md graceful
 * fallback — a suggestion is a convenience, never a dependency of the reporting flow).
 * @param {{ title?: string, description?: string, imageBase64: string, mimeType: string }} input
 * @returns {Promise<{ category: string, severity: number } | null>}
 */
export async function classifyReport({ title, description, imageBase64, mimeType }) {
  if (!isAiEnabled()) return null;

  const categories = await listCategories();
  const validSlugs = new Set(categories.map((c) => c.slug));
  const prompt = buildPrompt(categories, title, description);
  const payload = { prompt, imageBase64: stripDataUrl(imageBase64), mimeType };
  const provider = resolveAiProvider();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const text =
      provider === 'anthropic'
        ? await classifyWithAnthropic({ ...payload, signal: controller.signal })
        : await classifyWithGemini({ ...payload, signal: controller.signal });

    if (!text) {
      logger.error('AI classify response had no text block', { provider });
      return null;
    }

    return parseSuggestion(text, validSlugs);
  } catch (err) {
    logger.error('AI classify failed', { provider, message: err?.message });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
