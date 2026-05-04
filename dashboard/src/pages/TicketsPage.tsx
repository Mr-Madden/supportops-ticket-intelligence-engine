import React, { useState } from "react";
import { useTicketList } from "../hooks/useMetrics";
import { Card, PriorityBadge, SentimentIndicator, DataTable, TagChip, Spinner } from "../components/ui";
import type { TicketAnalysis, Priority, TableColumn } from "../types";

const selectStyle: React.CSSProperties = {
  fontSize: 12, padding: "5px 10px", borderRadius: 6,
  border: "0.5px solid #E5E7EB", background: "#fff", color: "#374151",
  fontFamily: "DM Sans, sans-serif",
};

export const TicketsPage: React.FC = () => {
  const [page, setPage]           = useState(1);
  const [category, setCategory]   = useState("");
  const [priority, setPriority]   = useState("");
  const [flaggedOnly, setFlagged] = useState(false);

  const { data, loading } = useTicketList({
    page, per_page: 25,
    category: category || undefined,
    priority: priority || undefined,
    flagged:  flaggedOnly || undefined,
  });

  const columns: TableColumn<TicketAnalysis>[] = [
    { key: "ticket_id", header: "Ticket", width: 80,
      render: (row) => <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#6B7280" }}>#{row.zendesk_ticket_id}</span> },
    { key: "summary", header: "Summary",
      render: (row) => (
        <div>
          <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.4, marginBottom: 4 }}>{row.summary ?? row.key_issue ?? "—"}</div>
          {row.tags && row.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {row.tags.slice(0, 4).map((t) => <TagChip key={t} label={t} />)}
              {row.tags.length > 4 && <span style={{ fontSize: 10, color: "#9CA3AF" }}>+{row.tags.length - 4}</span>}
            </div>
          )}
        </div>
      )},
    { key: "category", header: "Category", width: 110,
      render: (row) => <span style={{ fontSize: 11, color: "#374151", textTransform: "capitalize" }}>{row.category ?? "—"}</span> },
    { key: "sentiment", header: "Sentiment", width: 160,
      render: (row) => row.sentiment_score ? <SentimentIndicator score={row.sentiment_score} /> : <span style={{ color: "#9CA3AF" }}>—</span> },
    { key: "priority", header: "Priority", width: 90,
      render: (row) => row.priority ? <PriorityBadge priority={row.priority as Priority} /> : <span style={{ color: "#9CA3AF" }}>—</span> },
    { key: "routing", header: "Suggested queue", width: 160,
      render: (row) => <span style={{ fontSize: 11, color: "#374151" }}>{row.routing_group ?? "—"}</span> },
    { key: "flag", header: "", width: 32,
      render: (row) => row.flagged_for_review ? <div title="Flagged" style={{ width: 7, height: 7, borderRadius: "50%", background: "#D85A30" }} /> : null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <select style={selectStyle} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="account">Account</option>
            <option value="feature_request">Feature request</option>
            <option value="general">General</option>
          </select>
          <select style={selectStyle} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
            <input type="checkbox" checked={flaggedOnly} onChange={(e) => { setFlagged(e.target.checked); setPage(1); }} />
            Flagged only
          </label>
          {data && <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF" }}>{data.total.toLocaleString()} analyses</span>}
        </div>

        {loading
          ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
          : <DataTable columns={columns} rows={data?.items ?? []} emptyMessage="No analyses found" />}

        {data && data.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...selectStyle, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ fontSize: 12, color: "#6B7280" }}>Page {page} of {data.pages}</span>
            <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} style={{ ...selectStyle, cursor: page === data.pages ? "not-allowed" : "pointer", opacity: page === data.pages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </Card>
    </div>
  );
};
