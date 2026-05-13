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
    apiClient<{ checkout_url: string }>("/stripe/create-checkout", {
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
export default apiClient;
