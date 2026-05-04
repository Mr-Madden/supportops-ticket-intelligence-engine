/**
 * useTicketAnalysis — fetches or triggers analysis for the current ticket.
 */

import { useState, useCallback, useEffect } from "react";
import api from "../api/client";
import type { TicketAnalysis, FeedbackRequest, LoadingState } from "../types";

interface UseTicketAnalysisReturn {
  analysis: TicketAnalysis | null;
  state: LoadingState;
  error: string | null;
  refresh: () => Promise<void>;
  submitFeedback: (data: FeedbackRequest) => Promise<void>;
}

interface TicketContext {
  ticketId: number;
  subject: string;
  description: string;
  priority?: string;
}

export function useTicketAnalysis(ticket: TicketContext): UseTicketAnalysisReturn {
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchOrAnalyze = useCallback(async () => {
    setState("loading");
    setError(null);

    try:
      try {
        const existing = await api.getTicketAnalysis(ticket.ticketId);
        setAnalysis(existing);
        setState("success");
        return;
      } catch {
        // No existing analysis — run one now
      }

      const result = await api.analyzeTicket({
        ticket_id:     ticket.ticketId,
        subject:       ticket.subject,
        body:          ticket.description,
        customer_tier: ticket.priority ?? "normal",
      });

      setAnalysis(result);
      setState("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      setState("error");
    }
  }, [ticket.ticketId, ticket.subject, ticket.description, ticket.priority]);

  useEffect(() => {
    fetchOrAnalyze();
  }, [fetchOrAnalyze]);

  const submitFeedback = useCallback(
    async (data: FeedbackRequest) => {
      await api.submitFeedback(ticket.ticketId, data);
      await fetchOrAnalyze();
    },
    [ticket.ticketId, fetchOrAnalyze]
  );

  return { analysis, state, error, refresh: fetchOrAnalyze, submitFeedback };
}
