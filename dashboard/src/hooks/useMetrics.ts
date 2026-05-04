import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import type {
  QueueMetrics, SentimentTrendPoint, VolumePoint,
  CategoryPoint, PaginatedResponse, TicketAnalysis,
} from "../types";

type Days = 7 | 30 | 90;

function useAutoRefresh<T>(fetcher: () => Promise<T>, intervalMs = 60_000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, intervalMs);
    return () => clearInterval(id);
  }, [fetch_, intervalMs]);

  return { data, loading, error, refresh: fetch_ };
}

export function useQueueMetrics() {
  return useAutoRefresh<QueueMetrics>(api.getQueueMetrics, 30_000);
}

export function useSentimentTrend(days: Days) {
  const fetcher = useCallback(() => api.getSentimentTrend(days), [days]);
  return useAutoRefresh<SentimentTrendPoint[]>(fetcher);
}

export function useVolume(days: Days) {
  const fetcher = useCallback(() => api.getVolume(days), [days]);
  return useAutoRefresh<VolumePoint[]>(fetcher);
}

export function useCategoryBreakdown(days: Days) {
  const fetcher = useCallback(() => api.getCategoryBreakdown(days), [days]);
  return useAutoRefresh<CategoryPoint[]>(fetcher);
}

export function useTicketList(params: {
  page?: number; per_page?: number; category?: string;
  priority?: string; flagged?: boolean;
}) {
  const [data, setData] = useState<PaginatedResponse<TicketAnalysis> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.listAnalyses(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.page, params.per_page, params.category, params.priority, params.flagged]);

  return { data, loading, error };
}
