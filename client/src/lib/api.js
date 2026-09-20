// All calls to the Express API go through here (rules.md §4).
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * @param {string} path  Starts with "/" (e.g. "/api/v1/reports"; "/health" has no prefix).
 * @param {{ token?: string, signal?: AbortSignal, method?: string, body?: unknown }} [options]
 *   `token` is the Clerk session token (from useAuth().getToken) for protected routes.
 * @returns {Promise<any>} the parsed `{ data, meta }` envelope
 */
export async function apiFetch(path, { token, body, headers, ...options } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the server', { code: 'NETWORK_ERROR' });
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error?.message || 'Request failed', {
      status: res.status,
      code: json?.error?.code,
    });
  }
  return json;
}

export const checkHealth = (signal) => apiFetch('/health', { signal });

// --- Public reads (Phase 6). All are unauthenticated GETs. ---

export const getStatsPublic = (signal) => apiFetch('/api/v1/stats/public', { signal });

export const getCategories = (signal) => apiFetch('/api/v1/categories', { signal });

/** @param {{ page?: number, pageSize?: number, category?: string, status?: string, sort?: 'newest'|'upvotes' }} [params] */
export function listReports(params = {}, signal) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return apiFetch(`/api/v1/reports${query ? `?${query}` : ''}`, { signal });
}

export const getReportById = (id, signal) => apiFetch(`/api/v1/reports/${id}`, { signal });

/**
 * Lightweight marker points for the map (capped server-side at 1000, rules.md §16).
 * Returns bare `{ id, title, status, category_id, upvote_count, lat, lng }` rows — no
 * thumbnail/area/timestamp, unlike `listReports`. See `/map` page for how the two are
 * combined for richer popups.
 * @param {{ category?: string, status?: string }} [params]
 */
export function getReportsMap(params = {}, signal) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return apiFetch(`/api/v1/reports/map${query ? `?${query}` : ''}`, { signal });
}
