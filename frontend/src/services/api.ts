/**
 * API client for ESG360 backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.esg360.digital/api/v1";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    // credentials: "include" ensures httpOnly cookies are sent with every request.
    // This enables both browser-session auth (cookie) and API-key auth (Bearer).
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (token) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.detail || `API Error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// --- Auth API ---
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    apiClient("/auth/register", { method: "POST", body: data }),

  login: (data: { email: string; password: string }) =>
    apiClient<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>(
      "/auth/login",
      { method: "POST", body: data }
    ),

  /** Restore session from httpOnly refresh_token cookie (called on page load). */
  restoreSession: () =>
    apiClient<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>(
      "/auth/session"
    ),

  /** Call backend to clear httpOnly cookies. */
  logout: () =>
    apiClient("/auth/logout", { method: "POST" }),

  refresh: (refreshToken: string) =>
    apiClient<{ access_token: string; refresh_token: string }>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    }),

  getMe: (token: string) =>
    apiClient("/auth/me", { token }),

  updateMe: (token: string, data: { full_name?: string }) =>
    apiClient("/auth/me", { method: "PATCH", body: data, token }),

  verifyEmail: (verificationToken: string) =>
    apiClient("/auth/verify-email", { method: "POST", body: { token: verificationToken } }),

  requestPasswordReset: (email: string) =>
    apiClient("/auth/password-reset/request", { method: "POST", body: { email } }),

  resetPassword: (resetToken: string, newPassword: string) =>
    apiClient("/auth/password-reset/confirm", {
      method: "POST",
      body: { token: resetToken, new_password: newPassword },
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    apiClient("/auth/change-password", {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
      token,
    }),

  googleLogin: () =>
    apiClient<{ authorization_url: string }>("/auth/google/login"),
};

// --- Company API ---
export const companyApi = {
  create: (token: string, data: { name: string; sector?: string; country?: string; size?: string }) =>
    apiClient("/companies/", { method: "POST", body: data, token }),

  list: (token: string) =>
    apiClient("/companies/", { token }),

  get: (token: string, companyId: string) =>
    apiClient(`/companies/${companyId}`, { token }),

  update: (token: string, companyId: string, data: Record<string, unknown>) =>
    apiClient(`/companies/${companyId}`, { method: "PATCH", body: data, token }),

  addMember: (token: string, companyId: string, data: { email: string; role: string }) =>
    apiClient(`/companies/${companyId}/members`, { method: "POST", body: data, token }),

  listMembers: (token: string, companyId: string) =>
    apiClient(`/companies/${companyId}/members`, { token }),

  removeMember: (token: string, companyId: string, userId: string) =>
    apiClient(`/companies/${companyId}/members/${userId}`, { method: "DELETE", token }),

  updateMemberRole: (token: string, companyId: string, userId: string, role: string) =>
    apiClient(`/companies/${companyId}/members/${userId}`, { method: "PATCH", body: { role }, token }),
};

// --- Data Points API ---
export const dataPointApi = {
  create: (token: string, companyId: string, data: Record<string, unknown>) =>
    apiClient(`/companies/${companyId}/data-points/`, { method: "POST", body: data, token }),

  createBulk: (token: string, companyId: string, dataPoints: Record<string, unknown>[]) =>
    apiClient(`/companies/${companyId}/data-points/bulk`, {
      method: "POST",
      body: { data_points: dataPoints },
      token,
    }),

  list: (token: string, companyId: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiClient(`/companies/${companyId}/data-points/${query}`, { token });
  },

  get: (token: string, companyId: string, dataPointId: string) =>
    apiClient(`/companies/${companyId}/data-points/${dataPointId}`, { token }),

  update: (token: string, companyId: string, dataPointId: string, data: Record<string, unknown>) =>
    apiClient(`/companies/${companyId}/data-points/${dataPointId}`, {
      method: "PATCH",
      body: data,
      token,
    }),

  delete: (token: string, companyId: string, dataPointId: string) =>
    apiClient(`/companies/${companyId}/data-points/${dataPointId}`, {
      method: "DELETE",
      token,
    }),

  exportCsv: async (token: string, companyId: string, params?: { year?: number; pillar?: string }) => {
    const query = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/data-points/export/csv${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("CSV export failed");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-points-${companyId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// --- Documents API ---
export const documentApi = {
  upload: async (token: string, companyId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new ApiError(error?.detail || "Upload failed", response.status);
    }

    return response.json();
  },

  list: (token: string, companyId: string) =>
    apiClient(`/companies/${companyId}/documents/`, { token }),

  get: (token: string, companyId: string, documentId: string) =>
    apiClient(`/companies/${companyId}/documents/${documentId}`, { token }),
};

// --- Dashboard API ---
export const dashboardApi = {
  getScores: (token: string, companyId: string, year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/companies/${companyId}/dashboard/scores${query}`, { token });
  },

  getAudit: (token: string, companyId: string, year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/companies/${companyId}/dashboard/audit${query}`, { token });
  },

  getFrameworkCoverage: (token: string, companyId: string, frameworkId: string, year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/companies/${companyId}/dashboard/framework-coverage/${frameworkId}${query}`, { token });
  },
};

// --- Frameworks API ---
export const frameworkApi = {
  list: (token: string) =>
    apiClient("/frameworks/", { token }),

  get: (token: string, frameworkId: string) =>
    apiClient(`/frameworks/${frameworkId}`, { token }),
};

// --- Reports API ---
export const reportApi = {
  create: (token: string, companyId: string, data: Record<string, unknown>) =>
    apiClient(`/companies/${companyId}/reports/`, { method: "POST", body: data, token }),

  list: (token: string, companyId: string) =>
    apiClient(`/companies/${companyId}/reports/`, { token }),

  get: (token: string, companyId: string, reportId: string) =>
    apiClient(`/companies/${companyId}/reports/${reportId}`, { token }),
};

// --- Admin API ---
export const adminApi = {
  getStats: (token: string) =>
    apiClient("/admin/stats", { token }),

  listUsers: (token: string, params?: { skip?: number; limit?: number; search?: string }) => {
    const query = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return apiClient(`/admin/users${query}`, { token });
  },

  updateUser: (token: string, userId: string, data: Record<string, unknown>) =>
    apiClient(`/admin/users/${userId}`, { method: "PATCH", body: data, token }),

  deleteUser: (token: string, userId: string) =>
    apiClient(`/admin/users/${userId}`, { method: "DELETE", token }),

  listCompaniesAdmin: (token: string, params?: { skip?: number; limit?: number; search?: string }) => {
    const query = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return apiClient(`/admin/companies${query}`, { token });
  },

  deleteCompany: (token: string, companyId: string) =>
    apiClient(`/admin/companies/${companyId}`, { method: "DELETE", token }),

  listFrameworksAdmin: (token: string) =>
    apiClient("/admin/frameworks", { token }),

  createFramework: (token: string, data: { name: string; code: string; version: string; description?: string }) =>
    apiClient("/admin/frameworks", { method: "POST", body: data, token }),

  updateFramework: (token: string, frameworkId: string, data: Record<string, unknown>) =>
    apiClient(`/admin/frameworks/${frameworkId}`, { method: "PATCH", body: data, token }),

  deleteFramework: (token: string, frameworkId: string) =>
    apiClient(`/admin/frameworks/${frameworkId}`, { method: "DELETE", token }),

  listAILogs: (token: string, params?: { status?: string; function_name?: string; limit?: number; skip?: number }) => {
    const query = params ? "?" + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : "";
    return apiClient(`/admin/ai-logs${query}`, { token });
  },
};

// --- Analytics API (ESG Engine) ---
export const analyticsApi = {
  /** Full ESG score with sub-indicator breakdown */
  getScores: (token: string, companyId: string, year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/analytics/scores/${companyId}${query}`, { token });
  },

  /** Industry benchmark comparison */
  getBenchmark: (token: string, companyId: string, year?: number, sector?: string) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (sector) params.set("sector", sector);
    const query = params.toString() ? `?${params}` : "";
    return apiClient(`/analytics/benchmark/${companyId}${query}`, { token });
  },

  /** Generated KPI recommendations */
  getKPIs: (token: string, companyId: string, year?: number, maxKpis?: number) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (maxKpis) params.set("max_kpis", String(maxKpis));
    const query = params.toString() ? `?${params}` : "";
    return apiClient(`/analytics/kpis/${companyId}${query}`, { token });
  },

  /** What-if simulation for specific actions */
  simulate: (token: string, companyId: string, actions: Record<string, unknown>[], year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/analytics/simulate/${companyId}${query}`, {
      method: "POST",
      body: { company_id: companyId, year: year || new Date().getFullYear(), actions },
      token,
    });
  },

  /** Multi-scenario projection (conservative/moderate/aggressive) */
  getScenarios: (token: string, companyId: string, year?: number) => {
    const query = year ? `?year=${year}` : "";
    return apiClient(`/analytics/scenarios/${companyId}${query}`, { token });
  },

  /** Compare multiple companies */
  compareCompanies: (token: string, companyIds: string[], year: number) =>
    apiClient("/analytics/compare", {
      method: "POST",
      body: { company_ids: companyIds, year },
      token,
    }),
};
// --- Stripe / Subscription API ---
export const stripeApi = {
  createCheckout: (token: string, plan: string, interval: "month" | "year") =>
    apiClient<{ checkout_url?: string; url?: string; admin_bypass?: boolean; plan?: string }>("/stripe/create-checkout", {
      method: "POST",
      body: { plan, interval },
      token,
    }),

  getPortalUrl: (token: string) =>
    apiClient<{ portal_url: string }>("/stripe/portal", { method: "POST", token }),

  getSubscription: (token: string) =>
    apiClient("/stripe/subscription", { token }),

  verifySession: (token: string, sessionId: string) =>
    apiClient("/stripe/verify-session", {
      method: "POST",
      body: { session_id: sessionId },
      token,
    }),

  cancelSubscription: (token: string) =>
    apiClient("/stripe/cancel", { method: "POST", token }),

  reactivateSubscription: (token: string) =>
    apiClient("/stripe/reactivate", { method: "POST", token }),
};

// =====================================================================
// Platform extensions: notifications, collaboration, audit, privacy,
// integrations (webhooks/API keys), ESG-AI (chat, recommendations,
// regulatory, autofill, greenwashing, materiality, csv mapping,
// emissions, benchmarks, templates, report versions).
// =====================================================================

// --- Notifications ---
export const notificationsApi = {
  list: (token: string, unreadOnly = false, limit = 50) =>
    apiClient<unknown[]>(`/notifications?unread_only=${unreadOnly}&limit=${limit}`, { token }),
  unreadCount: (token: string) =>
    apiClient<{ count: number }>("/notifications/unread-count", { token }),
  markRead: (token: string, id: string) =>
    apiClient(`/notifications/${id}/read`, { method: "POST", token }),
  markAllRead: (token: string) =>
    apiClient("/notifications/read-all", { method: "POST", token }),
  updatePrefs: (token: string, data: { email_enabled?: boolean; types?: string[] }) =>
    apiClient("/notifications/preferences", { method: "PUT", body: data, token }),
};

// --- Collaboration: comments + tasks ---
export const commentsApi = {
  list: (token: string, entityType: string, entityId: string) =>
    apiClient<unknown[]>(`/comments?entity_type=${entityType}&entity_id=${entityId}`, { token }),
  create: (token: string, data: { entity_type: string; entity_id: string; body: string; parent_id?: string }) =>
    apiClient("/comments", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: { body?: string; is_resolved?: boolean }) =>
    apiClient(`/comments/${id}`, { method: "PUT", body: data, token }),
  remove: (token: string, id: string) =>
    apiClient(`/comments/${id}`, { method: "DELETE", token }),
};

export const tasksApi = {
  list: (token: string, companyId: string, status?: string, assignee?: string) => {
    const params = new URLSearchParams({ company_id: companyId });
    if (status) params.set("status", status);
    if (assignee) params.set("assignee_id", assignee);
    return apiClient<unknown[]>(`/tasks?${params}`, { token });
  },
  create: (token: string, companyId: string, data: {
    title: string; description?: string; assignee_id?: string;
    priority?: string; due_date?: string; entity_type?: string; entity_id?: string;
  }) => apiClient(`/tasks?company_id=${companyId}`, { method: "POST", body: data, token }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiClient(`/tasks/${id}`, { method: "PUT", body: data, token }),
  remove: (token: string, id: string) =>
    apiClient(`/tasks/${id}`, { method: "DELETE", token }),
};

// --- Audit logs ---
export const auditApi = {
  list: (token: string, companyId: string, filters: { action?: string; entity_type?: string; limit?: number } = {}) => {
    const params = new URLSearchParams({ company_id: companyId });
    if (filters.action) params.set("action", filters.action);
    if (filters.entity_type) params.set("entity_type", filters.entity_type);
    if (filters.limit) params.set("limit", String(filters.limit));
    return apiClient<unknown[]>(`/audit-logs?${params}`, { token });
  },
};

// --- Privacy / LGPD-GDPR ---
export const privacyApi = {
  exportData: (token: string) =>
    apiClient("/privacy/export", { token }),
  downloadExport: (token: string) =>
    apiClient<Blob>("/privacy/export/download", { token }),
  deleteAccount: (token: string) =>
    apiClient("/privacy/account", { method: "DELETE", token }),
};

// --- Integrations: webhooks ---
export const webhooksApi = {
  list: (token: string, companyId: string) =>
    apiClient<unknown[]>(`/webhooks?company_id=${companyId}`, { token }),
  create: (token: string, companyId: string, data: { name: string; url: string; events: string[] }) =>
    apiClient(`/webhooks?company_id=${companyId}`, { method: "POST", body: data, token }),
  remove: (token: string, id: string) =>
    apiClient(`/webhooks/${id}`, { method: "DELETE", token }),
};

// --- Integrations: API keys ---
export const apiKeysApi = {
  list: (token: string, companyId: string) =>
    apiClient<unknown[]>(`/api-keys?company_id=${companyId}`, { token }),
  create: (token: string, companyId: string, data: { name: string; scopes?: string[]; expires_at?: string }) =>
    apiClient<{ plaintext_key: string } & Record<string, unknown>>(
      `/api-keys?company_id=${companyId}`,
      { method: "POST", body: data, token }
    ),
  remove: (token: string, id: string) =>
    apiClient(`/api-keys/${id}`, { method: "DELETE", token }),
};

// --- ESG AI: chat ---
export const chatApi = {
  conversations: (token: string, companyId: string) =>
    apiClient<unknown[]>(`/chat/conversations?company_id=${companyId}`, { token }),
  messages: (token: string, conversationId: string) =>
    apiClient<unknown[]>(`/chat/conversations/${conversationId}/messages`, { token }),
  send: (token: string, data: { company_id: string; message: string; conversation_id?: string; language?: string }) =>
    apiClient<{ conversation_id: string; message_id: string; answer: string; citations: unknown[] }>(
      "/chat/messages",
      { method: "POST", body: data, token }
    ),
};

// --- ESG AI: recommendations ---
export const recommendationsApi = {
  list: (token: string, companyId: string, language = "en", limit = 5) =>
    apiClient<{ recommendations: unknown[]; generated_at: string }>(
      `/recommendations?company_id=${companyId}&language=${language}&limit=${limit}`,
      { token }
    ),
};

// --- ESG AI: regulatory feed ---
export const regulatoryApi = {
  list: (token: string, params: { company_id?: string; region?: string; sector?: string; framework?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return apiClient<unknown[]>(`/regulatory/updates?${q}`, { token });
  },
};

// --- ESG AI: autofill ---
export const autofillApi = {
  suggest: (token: string, data: { company_id: string; year: number; framework_codes?: string[] }) =>
    apiClient("/autofill", { method: "POST", body: data, token }),
};

// --- ESG AI: greenwashing scan ---
export const greenwashingApi = {
  scan: (token: string, text: string, language = "en") =>
    apiClient(`/greenwashing/scan?text=${encodeURIComponent(text)}&language=${language}`, { method: "POST", token }),
};

// --- ESG AI: materiality matrix ---
export const materialityApi = {
  build: (token: string, companyId: string, language = "en") =>
    apiClient(`/materiality?company_id=${companyId}&language=${language}`, { token }),
};

// --- ESG AI: CSV column mapping ---
export const csvMappingApi = {
  fromText: (token: string, csvText: string, language = "en") =>
    apiClient("/csv/map", { method: "POST", body: { csv_text: csvText, language }, token }),
  fromFile: async (token: string, file: File, language = "en") => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE_URL}/csv/upload-map?language=${language}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new ApiError("Upload failed", res.status);
    return res.json();
  },
};

// --- Emissions ---
export const emissionsApi = {
  calculate: (token: string, data: {
    scope: number; category: string; activity: string; quantity: number; unit: string; region?: string;
  }) => apiClient("/emissions/calculate", { method: "POST", body: data, token }),
  record: (token: string, companyId: string, year: number, data: Record<string, unknown>) =>
    apiClient(`/emissions/record?company_id=${companyId}&year=${year}`, { method: "POST", body: data, token }),
  summary: (token: string, companyId: string, year: number) =>
    apiClient<{ year: number; total_kg: number; total_tonnes: number; scope_1_kg: number; scope_2_kg: number; scope_3_kg: number; by_category: Record<string, number> }>(
      `/emissions/summary?company_id=${companyId}&year=${year}`,
      { token }
    ),
  list: (token: string, companyId: string, year?: number) =>
    apiClient<unknown[]>(
      `/emissions?company_id=${companyId}${year ? `&year=${year}` : ""}`,
      { token }
    ),
};

// --- Benchmarks ---
export const benchmarksApi = {
  list: (token: string, sector: string, year: number) =>
    apiClient<unknown[]>(`/benchmarks?sector=${sector}&year=${year}`, { token }),
};

// --- Report templates ---
export const templatesApi = {
  list: (token: string, params: { sector?: string; region?: string; framework?: string; language?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    return apiClient<unknown[]>(`/report-templates?${q}`, { token });
  },
  get: (token: string, id: string) =>
    apiClient(`/report-templates/${id}`, { token }),
};

// --- Report versions ---
export const reportVersionsApi = {
  list: (token: string, reportId: string) =>
    apiClient<unknown[]>(`/reports/${reportId}/versions`, { token }),
  get: (token: string, reportId: string, version: number) =>
    apiClient(`/reports/${reportId}/versions/${version}`, { token }),
  diff: (token: string, reportId: string, v1: number, v2: number) =>
    apiClient(`/reports/${reportId}/diff/${v1}/${v2}`, { token }),
};

// --- Onboarding: framework recommendations ---
export const onboardingApi = {
  recommendFrameworks: (token: string, params: { sector?: string; country?: string; size?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    return apiClient<{ recommendations: { code: string; rationale: string }[] }>(
      `/onboarding/recommend-frameworks?${q}`,
      { token }
    );
  },
};

// =====================================================================
//  ESG Financial Intelligence layer
// =====================================================================

export interface FinancialScore {
  id?: string;
  company_id?: string;
  year?: number;
  score: number;
  components: { performance: number; disclosure: number; forward_risk: number };
  spread_bps: number;
  wacc_adjustment_bps: number;
  rating_band: string;
  sector?: string | null;
  sector_percentile?: number | null;
  drivers?: { top_positive?: Array<Record<string, unknown>>; top_negative?: Array<Record<string, unknown>> };
  explainability?: Record<string, unknown>;
  methodology_version?: string;
  created_at?: string;
}

export const financialScoreApi = {
  compute: (token: string, companyId: string, year?: number) =>
    apiClient<FinancialScore>(
      `/companies/${companyId}/financial-score/compute${year ? `?year=${year}` : ""}`,
      { method: "POST", token }
    ),
  latest: (token: string, companyId: string) =>
    apiClient<FinancialScore | { score: null; message: string }>(
      `/companies/${companyId}/financial-score/latest`,
      { token }
    ),
  history: (token: string, companyId: string, limit = 10) =>
    apiClient<{ items: FinancialScore[] }>(
      `/companies/${companyId}/financial-score/history?limit=${limit}`,
      { token }
    ),
  translate: (score: number) =>
    apiClient<{ score: number; spread_bps: number; rating_band: string; interpretation: string }>(
      `/companies/00000000-0000-0000-0000-000000000000/financial-score/translate?score=${score}`
    ).catch(() => ({ score, spread_bps: -0.8 * (score - 50), rating_band: "BB", interpretation: "" })),
};

export interface ClimateScenarioResult {
  id: string;
  scenario: string;
  horizon_years: number;
  physical_var: number;
  transition_var: number;
  total_var: number;
  ebitda_at_risk_pct: number;
  carbon_price_assumed?: number | null;
  exposed_assets?: Record<string, unknown>;
  methodology?: Record<string, unknown>;
  created_at?: string;
}

export const climateRiskApi = {
  scenarios: () =>
    apiClient<{ scenarios: Array<{ code: string; carbon_price_path: Record<string, number>; physical_risk_mult: number }> }>(
      `/companies/00000000-0000-0000-0000-000000000000/climate-risk/scenarios`
    ),
  compute: (token: string, companyId: string, scenario: string, horizonYears = 5, revenueUsd?: number) => {
    const q = new URLSearchParams({ scenario, horizon_years: String(horizonYears) });
    if (revenueUsd) q.set("revenue_usd", String(revenueUsd));
    return apiClient<ClimateScenarioResult>(`/companies/${companyId}/climate-risk/compute?${q}`, {
      method: "POST",
      token,
    });
  },
  computeAll: (token: string, companyId: string, horizonYears = 5) =>
    apiClient<{ items: ClimateScenarioResult[] }>(
      `/companies/${companyId}/climate-risk/compute-all?horizon_years=${horizonYears}`,
      { method: "POST", token }
    ),
};

export interface FundingReadiness {
  id: string;
  instrument: string;
  overall_score: number;
  status: "red" | "amber" | "green";
  checklist: Array<{ id: string; label: string; weight: number; completion_pct: number }>;
  gaps: Array<{ id: string; label: string; weight: number; completion_pct: number; severity: string }>;
  remediation_plan: Array<{ id: string; action: string; effort_weeks: number; owner_suggested: string }>;
  estimated_pricing_benefit_bps?: number | null;
  created_at?: string;
}

export const fundingReadinessApi = {
  instruments: (token: string, companyId: string) =>
    apiClient<{ instruments: Array<{ code: string; label: string; items: number; max_score: number }> }>(
      `/companies/${companyId}/funding-readiness/instruments`,
      { token }
    ),
  assess: (token: string, companyId: string, instrument: string) =>
    apiClient<FundingReadiness>(
      `/companies/${companyId}/funding-readiness/assess?instrument=${encodeURIComponent(instrument)}`,
      { method: "POST", token }
    ),
};

export interface CreditAssessment {
  id: string;
  counterparty_name: string;
  base_pd: number;
  esg_adjustment_bps: number;
  adjusted_pd: number;
  base_lgd?: number | null;
  adjusted_lgd?: number | null;
  exposure_usd?: number | null;
  rationale: Record<string, unknown>;
  created_at?: string;
}

export const creditIntelligenceApi = {
  assess: (
    token: string,
    companyId: string,
    payload: {
      counterparty_name: string;
      base_pd: number;
      base_lgd?: number;
      exposure_usd?: number;
      counterparty_company_id?: string;
      explicit_esg_score?: number;
    }
  ) =>
    apiClient<CreditAssessment>(`/companies/${companyId}/credit-intelligence/assess`, {
      method: "POST",
      body: payload,
      token,
    }),
  list: (token: string, companyId: string, limit = 100) =>
    apiClient<{
      items: CreditAssessment[];
      book_impact: { book_size_usd: number; expected_loss_delta_usd: number; avg_pd_shift_pct: number; counterparties: number };
    }>(`/companies/${companyId}/credit-intelligence?limit=${limit}`, { token }),
};

export interface ValuationResult {
  id: string;
  base_wacc: number;
  esg_adjusted_wacc: number;
  base_beta?: number | null;
  esg_adjusted_beta?: number | null;
  base_terminal_growth?: number | null;
  esg_adjusted_terminal_growth?: number | null;
  base_enterprise_value_usd?: number | null;
  esg_adjusted_enterprise_value_usd?: number | null;
  delta_pct?: number | null;
  inputs: Record<string, unknown>;
  methodology: Record<string, unknown>;
  created_at?: string;
}

export const valuationApi = {
  compute: (
    token: string,
    companyId: string,
    payload: {
      base_wacc?: number;
      base_beta?: number;
      base_terminal_growth?: number;
      free_cash_flow_usd?: number;
      debt_to_value?: number;
      equity_risk_premium?: number;
      explicit_score?: number;
    } = {}
  ) =>
    apiClient<ValuationResult>(`/companies/${companyId}/valuation/compute`, {
      method: "POST",
      body: payload,
      token,
    }),
  sensitivity: (token: string, companyId: string, baseWacc = 0.085, fcf = 10_000_000, growth = 0.025) =>
    apiClient<{ items: Array<{ wacc_delta_bps: number; wacc: number; enterprise_value_usd: number }> }>(
      `/companies/${companyId}/valuation/sensitivity?base_wacc=${baseWacc}&free_cash_flow_usd=${fcf}&growth=${growth}`,
      { token }
    ),
};

export interface AbatementOption {
  id: string;
  name: string;
  category: string;
  scope: number;
  abatement_potential_tco2e: number;
  cost_per_tonne_usd: number;
  capex_usd?: number | null;
  payback_years?: number | null;
  implementation_status: string;
  notes?: string | null;
}

export interface MaccCurve {
  bars: Array<{
    id: string;
    name: string;
    category: string;
    scope: number;
    abatement_tco2e: number;
    cost_per_tonne_usd: number;
    cumulative_start: number;
    cumulative_end: number;
    capex_usd: number;
    payback_years?: number | null;
    implementation_status: string;
  }>;
  total_options: number;
  total_abatement_tco2e: number;
  negative_cost_abatement_tco2e: number;
  weighted_avg_cost_per_tonne_usd: number;
  total_capex_usd: number;
}

export const maccApi = {
  get: (token: string, companyId: string) =>
    apiClient<{ items: AbatementOption[]; curve: MaccCurve }>(`/companies/${companyId}/macc`, { token }),
  create: (token: string, companyId: string, payload: Omit<AbatementOption, "id">) =>
    apiClient<AbatementOption>(`/companies/${companyId}/macc/options`, {
      method: "POST",
      body: payload,
      token,
    }),
  remove: (token: string, companyId: string, optionId: string) =>
    apiClient<{ deleted: boolean }>(`/companies/${companyId}/macc/options/${optionId}`, {
      method: "DELETE",
      token,
    }),
};

export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
  aum_usd?: number | null;
  base_currency: string;
  portfolio_type: string;
  created_at?: string;
}

export interface PortfolioHolding {
  id: string;
  portfolio_id: string;
  company_name: string;
  company_id?: string | null;
  ticker?: string | null;
  sector?: string | null;
  country?: string | null;
  weight_pct: number;
  market_value_usd?: number | null;
  last_esg_score?: number | null;
  last_climate_var_pct?: number | null;
  last_controversy_count: number;
  last_refreshed_at?: string | null;
}

export interface PortfolioAggregate {
  portfolio_id: string;
  name: string;
  holdings_count: number;
  coverage_pct: number;
  weighted_score: number;
  rating_band: string;
  weighted_spread_bps: number;
  weighted_climate_var_pct: number;
  top_contributors: Array<{ company_name: string; ticker?: string | null; weight_pct: number; esg_score: number; contribution: number; climate_var_pct?: number | null }>;
  bottom_contributors: Array<{ company_name: string; ticker?: string | null; weight_pct: number; esg_score: number; contribution: number; climate_var_pct?: number | null }>;
  sector_summary: Array<{ sector: string; weight_pct: number; weighted_score: number | null }>;
  aum_usd?: number | null;
}

export const portfolioApi = {
  list: (token: string, companyId: string) =>
    apiClient<{ items: Portfolio[] }>(`/companies/${companyId}/portfolios`, { token }),
  create: (token: string, companyId: string, payload: { name: string; description?: string; aum_usd?: number; portfolio_type?: string }) =>
    apiClient<Portfolio>(`/companies/${companyId}/portfolios`, { method: "POST", body: payload, token }),
  listHoldings: (token: string, companyId: string, portfolioId: string) =>
    apiClient<{ items: PortfolioHolding[] }>(`/companies/${companyId}/portfolios/${portfolioId}/holdings`, { token }),
  addHolding: (token: string, companyId: string, portfolioId: string, payload: Omit<PortfolioHolding, "id" | "portfolio_id" | "last_esg_score" | "last_climate_var_pct" | "last_controversy_count" | "last_refreshed_at">) =>
    apiClient<PortfolioHolding>(`/companies/${companyId}/portfolios/${portfolioId}/holdings`, { method: "POST", body: payload, token }),
  refresh: (token: string, companyId: string, portfolioId: string) =>
    apiClient<{ updated: number }>(`/companies/${companyId}/portfolios/${portfolioId}/refresh`, { method: "POST", token }),
  aggregate: (token: string, companyId: string, portfolioId: string) =>
    apiClient<PortfolioAggregate>(`/companies/${companyId}/portfolios/${portfolioId}/aggregate`, { token }),
};

export interface FrameworkMapping {
  id: string;
  source_framework: string;
  source_code: string;
  source_label: string;
  target_framework: string;
  target_code: string;
  target_label: string;
  relationship_type: string;
  confidence: number;
  notes?: string | null;
}

export const knowledgeGraphApi = {
  frameworks: () => apiClient<{ frameworks: string[] }>(`/knowledge-graph/frameworks`),
  coverage: () =>
    apiClient<{ frameworks: string[]; matrix: Record<string, Record<string, number>>; total_edges: number }>(
      `/knowledge-graph/coverage`
    ),
  mappings: (params: { source_framework?: string; target_framework?: string; source_code?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
    return apiClient<{ items: FrameworkMapping[] }>(`/knowledge-graph/mappings?${q}`);
  },
  equivalent: (sourceFramework: string, sourceCode: string) =>
    apiClient<{ items: Array<{ target_framework: string; target_code: string; target_label: string; relationship_type: string; confidence: number; notes: string | null }> }>(
      `/knowledge-graph/equivalent?source_framework=${encodeURIComponent(sourceFramework)}&source_code=${encodeURIComponent(sourceCode)}`
    ),
};

// --- Partner API ---
export const partnerApi = {
  getDashboard: (token: string) =>
    apiClient("/partners/dashboard", { token }),
  getClients: (token: string, stage?: string, search?: string) => {
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (search) params.set("search", search);
    const q = params.toString();
    return apiClient(`/partners/clients${q ? `?${q}` : ""}`, { token });
  },
  createClient: (token: string, data: unknown) =>
    apiClient("/partners/clients", { method: "POST", body: data, token }),
  updateClient: (token: string, id: string, data: unknown) =>
    apiClient(`/partners/clients/${id}`, { method: "PATCH", body: data, token }),
  deleteClient: (token: string, id: string) =>
    apiClient(`/partners/clients/${id}`, { method: "DELETE", token }),
  getCommissions: (token: string, status?: string) =>
    apiClient(`/partners/commissions${status ? `?status=${status}` : ""}`, { token }),
  updatePix: (token: string, data: unknown) =>
    apiClient("/partners/pix", { method: "PATCH", body: data, token }),
  getTasks: (token: string) =>
    apiClient("/partners/tasks", { token }),
  createTask: (token: string, data: unknown) =>
    apiClient("/partners/tasks", { method: "POST", body: data, token }),
  updateTask: (token: string, id: string, data: unknown) =>
    apiClient(`/partners/tasks/${id}`, { method: "PATCH", body: data, token }),
  deleteTask: (token: string, id: string) =>
    apiClient(`/partners/tasks/${id}`, { method: "DELETE", token }),
  getFollowUpRules: (token: string) =>
    apiClient("/partners/followup/rules", { token }),
  createFollowUpRule: (token: string, data: unknown) =>
    apiClient("/partners/followup/rules", { method: "POST", body: data, token }),
};

// --- Admin Extended API ---
export const adminExtApi = {
  getCoupons: (token: string) =>
    apiClient("/admin/ext/coupons", { token }),
  createCoupon: (token: string, data: unknown) =>
    apiClient("/admin/ext/coupons", { method: "POST", body: data, token }),
  updateCoupon: (token: string, id: string, data: unknown) =>
    apiClient(`/admin/ext/coupons/${id}`, { method: "PATCH", body: data, token }),
  deleteCoupon: (token: string, id: string) =>
    apiClient(`/admin/ext/coupons/${id}`, { method: "DELETE", token }),
  getErrorLogs: (token: string, resolved?: boolean) =>
    apiClient(`/admin/ext/error-logs${resolved !== undefined ? `?resolved=${resolved}` : ""}`, { token }),
  resolveErrorLog: (token: string, id: string) =>
    apiClient(`/admin/ext/error-logs/${id}/resolve`, { method: "PATCH", token }),
  deleteErrorLog: (token: string, id: string) =>
    apiClient(`/admin/ext/error-logs/${id}`, { method: "DELETE", token }),
  getPaymentsOverview: (token: string) =>
    apiClient("/admin/ext/payments/overview", { token }),
};

// --- Partner Admin API ---
export const partnerAdminApi = {
  listPartners: (token: string, status?: string) =>
    apiClient(`/partners/admin/list${status ? `?status=${status}` : ""}`, { token }),
  approvePartner: (token: string, id: string) =>
    apiClient(`/partners/admin/${id}/approve`, { method: "PATCH", token }),
  suspendPartner: (token: string, id: string) =>
    apiClient(`/partners/admin/${id}/suspend`, { method: "PATCH", token }),
};

export default apiClient;
