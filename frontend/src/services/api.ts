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

async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
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

export default apiClient;
