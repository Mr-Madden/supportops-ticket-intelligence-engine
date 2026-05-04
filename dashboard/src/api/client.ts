/**
 * Typed API client — wraps all backend endpoints.
 */

import type {
  AnalyzeRequest,
  FeedbackRequest,
  PaginatedResponse,
  QueueMetrics,
  SentimentTrendPoint,
  Tag,
  TicketAnalysis,
  VolumePoint,
  CategoryPoint,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  analyzeTicket: (data: AnalyzeRequest): Promise<TicketAnalysis> =>
    request("/api/v1/analyze", { method: "POST", body: JSON.stringify(data) }),

  getTicketAnalysis: (ticketId: number): Promise<TicketAnalysis> =>
    request(`/api/v1/tickets/${ticketId}`),

  listAnalyses: (params?: {
    page?: number;
    per_page?: number;
    category?: string;
    priority?: string;
    flagged?: boolean;
  }): Promise<PaginatedResponse<TicketAnalysis>> => {
    const qs = new URLSearchParams();
    if (params?.page)     qs.set("page",     String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.category) qs.set("category", params.category);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.flagged !== undefined) qs.set("flagged", String(params.flagged));
    return request(`/api/v1/tickets?${qs}`);
  },

  submitFeedback: (ticketId: number, data: FeedbackRequest): Promise<void> =>
    request(`/api/v1/tickets/${ticketId}/feedback`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getQueueMetrics: (): Promise<QueueMetrics> =>
    request("/api/v1/metrics/queue"),

  getSentimentTrend: (days: 7 | 30 | 90 = 30): Promise<SentimentTrendPoint[]> =>
    request(`/api/v1/metrics/sentiment?days=${days}`),

  getVolume: (days: 7 | 30 | 90 = 30): Promise<VolumePoint[]> =>
    request(`/api/v1/metrics/volume?days=${days}`),

  getCategoryBreakdown: (days: 7 | 30 | 90 = 30): Promise<CategoryPoint[]> =>
    request(`/api/v1/metrics/categories?days=${days}`),

  listTags: (activeOnly = true): Promise<Tag[]> =>
    request(`/api/v1/tags?active_only=${activeOnly}`),

  createTag: (data: { tag_name: string; category?: string; description?: string }): Promise<Tag> =>
    request("/api/v1/tags", { method: "POST", body: JSON.stringify(data) }),

  deleteTag: (tagId: string): Promise<void> =>
    request(`/api/v1/tags/${tagId}`, { method: "DELETE" }),
};

export default api;
