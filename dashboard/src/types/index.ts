/**
 * Shared TypeScript types — Project #1 AI Ticket Intelligence Engine
 * Used by both the Zendesk sidebar app and the admin dashboard.
 */

export type SentimentScore = 1 | 2 | 3 | 4 | 5;
export type SentimentLabel = "frustrated" | "concerned" | "neutral" | "satisfied" | "delighted";
export type Priority = "low" | "normal" | "high" | "urgent";
export type EscalationRisk = "low" | "medium" | "high";
export type Category = "billing" | "technical" | "account" | "feature_request" | "general";

export interface TicketAnalysis {
  id: string;
  zendesk_ticket_id: number;
  created_at: string;

  tags: string[] | null;
  category: Category | null;
  sub_category: string | null;

  sentiment_score: SentimentScore | null;
  sentiment_label: SentimentLabel | null;
  escalation_risk: EscalationRisk | null;

  priority: Priority | null;
  priority_confidence: number | null;
  priority_reason: string | null;

  summary: string | null;
  key_issue: string | null;
  customer_ask: string | null;

  routing_group: string | null;
  routing_reason: string | null;
  routing_confidence: number | null;
  routing_fallback: string | null;

  processing_ms: number | null;
  flagged_for_review: boolean;
}

export interface QueueMetrics {
  open_tickets: number;
  pending_tickets: number;
  new_tickets: number;
  urgent_count: number;
  avg_sentiment: number | null;
  avg_processing_ms: number | null;
  total_analysed_today: number;
}

export interface SentimentTrendPoint {
  date: string;
  avg_sentiment: number | null;
  ticket_count: number;
}

export interface VolumePoint {
  date: string;
  total: number;
  escalations: number;
}

export interface CategoryPoint {
  category: string;
  count: number;
  avg_sentiment: number | null;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  per_page: number;
  pages: number;
  items: T[];
}

export interface APIError {
  error: string;
  detail: string | object;
}

export interface Tag {
  id: string;
  tag_name: string;
  category: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface AnalyzeRequest {
  ticket_id: number;
  subject: string;
  body: string;
  customer_tier?: string;
  ticket_count?: number;
}

export interface FeedbackRequest {
  correct_category?: string;
  correct_priority?: string;
  correct_routing_group?: string;
  feedback_note?: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";
