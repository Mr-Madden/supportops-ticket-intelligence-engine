import React, { useState } from "react";
import { useQueueMetrics, useSentimentTrend, useVolume, useCategoryBreakdown } from "../hooks/useMetrics";
import { Card, MetricCard, RangeTabs, Spinner } from "../components/ui";
import { SentimentChart } from "../components/charts/SentimentChart";
import { VolumeChart } from "../components/charts/VolumeChart";

type Days = 7 | 30 | 90;

const CategoryBar: React.FC<{ category: string; count: number; max: number; sentiment: number | null }> = ({
  category, count, max, sentiment,
}) => {
  const pct = Math.round((count / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 80, fontSize: 11, color: "#6B7280", textTransform: "capitalize" }}>{category}</div>
      <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#3F7FFF", borderRadius: 3 }} />
      </div>
      <div style={{ width: 36, fontSize: 11, color: "#374151", fontWeight: 500, textAlign: "right" }}>{count.toLocaleString()}</div>
      {sentiment !== null && (
        <div style={{ width: 26, fontSize: 10, color: sentiment >= 4 ? "#1D9E75" : sentiment <= 2 ? "#D85A30" : "#9CA3AF" }}>
          {sentiment.toFixed(1)}
        </div>
      )}
    </div>
  );
};

export const OverviewPage: React.FC = () => {
  const [days, setDays] = useState<Days>(30);
  const { data: metrics, loading: metricsLoading } = useQueueMetrics();
  const { data: sentiment } = useSentimentTrend(days);
  const { data: volume }   = useVolume(days);
  const { data: categories } = useCategoryBreakdown(days);
  const maxCategoryCount = categories ? Math.max(...categories.map((c) => c.count)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {metricsLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px", minHeight: 80 }} />)
          : metrics ? (
            <>
              <MetricCard label="Open tickets" value={metrics.open_tickets.toLocaleString()} sub={`${metrics.new_tickets} new · ${metrics.pending_tickets} pending`} />
              <MetricCard label="Urgent" value={metrics.urgent_count} color={metrics.urgent_count > 5 ? "#C62828" : "#111827"} sub="Requires immediate attention" />
              <MetricCard label="Avg sentiment" value={metrics.avg_sentiment ? `${metrics.avg_sentiment}/5` : "—"} color={metrics.avg_sentiment ? metrics.avg_sentiment < 3 ? "#D85A30" : metrics.avg_sentiment > 4 ? "#1D9E75" : "#111827" : "#111827"} />
              <MetricCard label="Analysed today" value={metrics.total_analysed_today.toLocaleString()} sub={metrics.avg_processing_ms ? `Avg ${Math.round(metrics.avg_processing_ms)}ms/ticket` : undefined} />
            </>
          ) : null}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <RangeTabs value={days} onChange={setDays} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Sentiment trend">
          {sentiment && sentiment.length > 0
            ? <SentimentChart data={sentiment} height={180} />
            : <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>}
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#9CA3AF" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3F7FFF", display: "inline-block" }} />
              Avg sentiment / 5
            </span>
          </div>
        </Card>

        <Card title="Daily volume">
          {volume && volume.length > 0
            ? <VolumeChart data={volume} height={180} />
            : <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>}
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#9CA3AF" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#3F7FFF", display: "inline-block" }} />Tickets</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#D85A30", display: "inline-block" }} />Escalations</span>
          </div>
        </Card>
      </div>

      <Card title="Category breakdown">
        {categories && categories.length > 0
          ? categories.map((cat) => <CategoryBar key={cat.category} category={cat.category} count={cat.count} max={maxCategoryCount} sentiment={cat.avg_sentiment} />)
          : <div style={{ textAlign: "center", padding: 24, color: "#9CA3AF", fontSize: 12 }}>No category data yet</div>}
      </Card>
    </div>
  );
};
