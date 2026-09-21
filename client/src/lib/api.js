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

// --- Public reads ---
export const getStatsPublic = (signal) => apiFetch('/api/v1/stats/public', { signal });
export const getCategories = (signal) => apiFetch('/api/v1/categories', { signal });

export function listReports(params = {}, signal) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return apiFetch(`/api/v1/reports${query ? `?${query}` : ''}`, { signal });
}

export const getReportById = (id, signal) => apiFetch(`/api/v1/reports/${id}`, { signal });

const toQuery = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();

export const authPaths = {
  // --- Citizen ---
  reportDetail: (id) => `/api/v1/reports/${id}`,
  reportUpvote: (id) => `/api/v1/reports/${id}/upvote`,
  reportComments: (id) => `/api/v1/reports/${id}/comments`,
  comment: (id) => `/api/v1/comments/${id}`,
  uploadSign: '/api/v1/uploads/sign',
  myReports: (params) => { const q = toQuery(params); return `/api/v1/me/reports${q ? `?${q}` : ''}`; },
  myNotifications: (params) => { const q = toQuery(params); return `/api/v1/me/notifications${q ? `?${q}` : ''}`; },
  notificationsRead: '/api/v1/me/notifications/read',
  reports: '/api/v1/reports',
  nearbyDuplicates: (params) => { const q = toQuery(params); return `/api/v1/reports/nearby-duplicates${q ? `?${q}` : ''}`; },
  aiClassify: '/api/v1/ai/classify',

  // --- Worker (Phase 5-worker) ---
  myTasks: '/api/v1/me/tasks',
  myTaskSubmission: (id) => `/api/v1/me/tasks/${id}/submission`,

  // --- Admin ---
  adminReports: (params) => { const q = toQuery(params); return `/api/v1/admin/reports${q ? `?${q}` : ''}`; },
  adminReportStatus: (id) => `/api/v1/admin/reports/${id}/status`,
  adminReportAssign: (id) => `/api/v1/admin/reports/${id}/assign`,
  adminResolutionImage: (id) => `/api/v1/admin/reports/${id}/resolution-image`,
  adminDeleteReport: (id) => `/api/v1/admin/reports/${id}`,
  adminDeleteComment: (id) => `/api/v1/admin/comments/${id}`,
  adminStats: (params) => { const q = params ? toQuery(params) : ''; return `/api/v1/admin/stats${q ? `?${q}` : ''}`; },
  adminHeatmap: '/api/v1/admin/heatmap',
  adminDepartments: '/api/v1/admin/departments',
  adminDepartment: (id) => `/api/v1/admin/departments/${id}`,
  adminTasks: (params) => { const q = params ? toQuery(params) : ''; return `/api/v1/admin/tasks${q ? `?${q}` : ''}`; },
  adminTaskStatus: (id) => `/api/v1/admin/tasks/${id}/status`,
  adminSubmissions: (params) => { const q = params ? toQuery(params) : ''; return `/api/v1/admin/submissions${q ? `?${q}` : ''}`; },
  adminSubmissionReview: (id) => `/api/v1/admin/submissions/${id}/review`,
  adminIncomplete: (params) => { const q = params ? toQuery(params) : ''; return `/api/v1/admin/incomplete${q ? `?${q}` : ''}`; },
  adminAnalytics: '/api/v1/admin/analytics',
  adminWorkers: '/api/v1/admin/workers',
};

export function getReportsMap(params = {}, signal) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return apiFetch(`/api/v1/reports/map${query ? `?${query}` : ''}`, { signal });
}