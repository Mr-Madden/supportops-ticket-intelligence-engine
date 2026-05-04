import React, { useState } from "react";
import { useSentimentTrend, useCategoryBreakdown } from "../hooks/useMetrics";
import { Card, RangeTabs, Spinner } from "../components/ui";
import { SentimentChart } from "../components/charts/SentimentChart";

type Days = 7 | 30 | 90;

export const SentimentPage: React.FC = () => {
  const [days, setDays] = useState<Days>(30);
  const { data: trend, loading } = useSentimentTrend(days);
  const { data: categories }     = useCategoryBreakdown(days);

  const avgSentiment = trend && trend.length > 0
    ? trend.reduce((sum, d) => sum + (d.avg_sentiment ?? 0), 0) / trend.length : null;

  const lowestDay  = trend?.filter((d) => d.avg_sentiment !== null).sort((a, b) => (a.avg_sentiment ?? 5) - (b.avg_sentiment ?? 5))[0];
  const highestDay = trend?.filter((d) => d.avg_sentiment !== null).sort((a, b) => (b.avg_sentiment ?? 0) - (a.avg_sentiment ?? 0))[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <RangeTabs value={days} onChange={setDays} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Period avg</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: avgSentiment ? avgSentiment < 3 ? "#D85A30" : avgSentiment > 4 ? "#1D9E75" : "#111827" : "#9CA3AF" }}>
            {avgSentiment ? avgSentiment.toFixed(2) : "—"}
            <span style={{ fontSize: 16, color: "#9CA3AF", fontWeight: 400 }}>/5</span>
          </div>
        </div>
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Lowest day</div>
          {lowestDay ? (<><div style={{ fontSize: 24, fontWeight: 500, color: "#D85A30" }}>{lowestDay.avg_sentiment?.toFixed(1)}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(lowestDay.date).toLocaleDateString("en", { month: "short", day: "numeric" })} · {lowestDay.ticket_count} tickets</div></>) : <div style={{ fontSize: 24, color: "#9CA3AF" }}>—</div>}
        </div>
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Best day</div>
          {highestDay ? (<><div style={{ fontSize: 24, fontWeight: 500, color: "#1D9E75" }}>{highestDay.avg_sentiment?.toFixed(1)}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(highestDay.date).toLocaleDateString("en", { month: "short", day: "numeric" })} · {highestDay.ticket_count} tickets</div></>) : <div style={{ fontSize: 24, color: "#9CA3AF" }}>—</div>}
        </div>
      </div>

      <Card title="Sentiment over time">
        {loading ? <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>
          : trend && trend.length > 0 ? <SentimentChart data={trend} height={220} />
          : <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 12 }}>No data for this period</div>}
      </Card>

      {categories && categories.length > 0 && (
        <Card title="Sentiment by category">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Category", "Avg sentiment", "Ticket count"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0 12px 8px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "0.5px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const v = cat.avg_sentiment ?? 3;
                const color = v < 3 ? "#D85A30" : v > 4 ? "#1D9E75" : "#374151";
                return (
                  <tr key={cat.category}>
                    <td style={{ padding: "9px 12px", borderBottom: "0.5px solid #F3F4F6", textTransform: "capitalize" }}>{cat.category}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "0.5px solid #F3F4F6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round((v / 5) * 100)}%`, background: color, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontWeight: 500, color }}>{cat.avg_sentiment?.toFixed(1) ?? "—"}/5</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: "0.5px solid #F3F4F6", color: "#6B7280" }}>{cat.count.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
