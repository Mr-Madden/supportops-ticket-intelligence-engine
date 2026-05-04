import React, { useState } from "react";
import type { TicketAnalysis, Priority, FeedbackRequest } from "../types";
import {
  Button, Card, SectionLabel, PriorityBadge, SentimentDisplay,
  EscalationBadge, TagList, ConfidenceBar, Divider, MetricTile,
} from "./UI";

interface AnalysisPanelProps {
  analysis: TicketAnalysis;
  onReanalyze: () => void;
  onFeedback: (data: FeedbackRequest) => Promise<void>;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis, onReanalyze, onFeedback,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState(analysis.category ?? "");
  const [feedbackPriority, setFeedbackPriority] = useState<Priority | "">((analysis.priority as Priority) ?? "");

  const handleFeedbackSubmit = async () => {
    setFeedbackLoading(true);
    try {
      await onFeedback({
        correct_category: feedbackCategory || undefined,
        correct_priority: feedbackPriority || undefined,
      });
      setFeedbackOpen(false);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {analysis.summary && (
        <Card>
          <SectionLabel>AI Summary</SectionLabel>
          <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{analysis.summary}</p>
          {analysis.key_issue && (
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 6, fontStyle: "italic" }}>
              Issue: {analysis.key_issue}
            </p>
          )}
        </Card>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {analysis.sentiment_score && (
          <MetricTile
            label="Sentiment"
            value={`${analysis.sentiment_score}/5`}
            sub={analysis.sentiment_label ?? undefined}
            color={analysis.sentiment_score <= 2 ? "#D85A30" : analysis.sentiment_score >= 4 ? "#1D9E75" : "#374151"}
          />
        )}
        {analysis.priority && (
          <MetricTile
            label="Priority"
            value={analysis.priority.toUpperCase()}
            sub={analysis.priority_confidence ? `${Math.round(analysis.priority_confidence * 100)}% confidence` : undefined}
            color={analysis.priority === "urgent" ? "#C62828" : analysis.priority === "high" ? "#854F0B" : "#374151"}
          />
        )}
      </div>

      {analysis.sentiment_score && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>Sentiment</SectionLabel>
            {analysis.escalation_risk && <EscalationBadge risk={analysis.escalation_risk} />}
          </div>
          <SentimentDisplay score={analysis.sentiment_score} label={analysis.sentiment_label} />
        </Card>
      )}

      {analysis.routing_group && (
        <Card style={{ borderLeft: "3px solid #2A2E6E", borderRadius: "0 10px 10px 0" }}>
          <SectionLabel>Suggested Queue</SectionLabel>
          <div style={{ fontWeight: 500, color: "#2A2E6E", fontSize: 13, marginBottom: 3 }}>
            {analysis.routing_group}
          </div>
          {analysis.routing_reason && (
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>{analysis.routing_reason}</div>
          )}
          {analysis.routing_confidence && <ConfidenceBar confidence={analysis.routing_confidence} />}
          {analysis.routing_fallback && (
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>Fallback: {analysis.routing_fallback}</div>
          )}
        </Card>
      )}

      {analysis.tags && analysis.tags.length > 0 && (
        <Card>
          <SectionLabel>AI Tags</SectionLabel>
          <TagList tags={analysis.tags} />
          {analysis.category && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#6B7280" }}>
              Category: <span style={{ color: "#374151", fontWeight: 500 }}>{analysis.category}</span>
              {analysis.sub_category && ` › ${analysis.sub_category}`}
            </div>
          )}
        </Card>
      )}

      {analysis.flagged_for_review && (
        <Card style={{ background: "#FFEBEE", borderColor: "#FFCDD2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C62828", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#B71C1C" }}>Flagged for review</div>
              <div style={{ fontSize: 11, color: "#C62828", marginTop: 1 }}>
                High escalation risk detected — manager attention recommended
              </div>
            </div>
          </div>
        </Card>
      )}

      <Divider />

      <div style={{ fontSize: 10, color: "#D1D5DB", textAlign: "center" }}>
        Analysed in {analysis.processing_ms ? `${analysis.processing_ms}ms` : "—"} · {new Date(analysis.created_at).toLocaleTimeString()}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="ghost" size="sm" onClick={onReanalyze} style={{ flex: 1 }}>Re-analyse</Button>
        <Button variant="ghost" size="sm" onClick={() => setFeedbackOpen(!feedbackOpen)} style={{ flex: 1 }}>Correct</Button>
      </div>

      {feedbackOpen && (
        <Card style={{ background: "#F9FAFB" }}>
          <SectionLabel>Correct this analysis</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 3 }}>Correct category</label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                style={{ width: "100%", fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "0.5px solid #D1D5DB", background: "#fff", color: "#374151" }}
              >
                <option value="">Keep current</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="feature_request">Feature request</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#6B7280", display: "block", marginBottom: 3 }}>Correct priority</label>
              <select
                value={feedbackPriority}
                onChange={(e) => setFeedbackPriority(e.target.value as Priority | "")}
                style={{ width: "100%", fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "0.5px solid #D1D5DB", background: "#fff", color: "#374151" }}
              >
                <option value="">Keep current</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button variant="primary" size="sm" onClick={handleFeedbackSubmit} loading={feedbackLoading} style={{ flex: 1 }}>Submit</Button>
              <Button variant="ghost" size="sm" onClick={() => setFeedbackOpen(false)} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
