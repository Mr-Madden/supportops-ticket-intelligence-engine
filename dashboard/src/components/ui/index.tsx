import React from "react";
import type { Priority, SentimentScore } from "../../types";

export const Card: React.FC<{
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, title, action, style }) => (
  <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: "16px 20px", ...style }}>
    {(title || action) && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        {title && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9CA3AF" }}>{title}</div>}
        {action}
      </div>
    )}
    {children}
  </div>
);

export const MetricCard: React.FC<{
  label: string; value: string | number;
  delta?: string; deltaType?: "up" | "down" | "neutral";
  sub?: string; color?: string;
}> = ({ label, value, delta, deltaType = "neutral", sub, color = "#111827" }) => {
  const deltaColor = deltaType === "up" ? "#D85A30" : deltaType === "down" ? "#1D9E75" : "#6B7280";
  return (
    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: deltaColor, marginTop: 4 }}>{delta}</div>}
      {sub && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{sub}</div>}
    </div>
  );
};

const PRIORITY_CONFIG: Record<Priority, { bg: string; color: string }> = {
  urgent: { bg: "#FFEBEE", color: "#B71C1C" },
  high:   { bg: "#FAEEDA", color: "#854F0B" },
  normal: { bg: "#E8EAF7", color: "#2A2E6E" },
  low:    { bg: "#F3F4F6", color: "#6B7280" },
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", ...cfg }}>
      {priority}
    </span>
  );
};

const SENTIMENT_COLORS: Record<number, string> = {
  1: "#D85A30", 2: "#BA7517", 3: "#9CA3AF", 4: "#1D9E75", 5: "#185FA5",
};
const SENTIMENT_LABELS: Record<number, string> = {
  1: "Frustrated", 2: "Concerned", 3: "Neutral", 4: "Satisfied", 5: "Delighted",
};

export const SentimentIndicator: React.FC<{ score: SentimentScore }> = ({ score }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: SENTIMENT_COLORS[score], flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: SENTIMENT_COLORS[score], fontWeight: 500 }}>{score}/5</span>
    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{SENTIMENT_LABELS[score]}</span>
  </div>
);

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string | number;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns, rows, emptyMessage = "No data",
}: { columns: TableColumn<T>[]; rows: T[]; emptyMessage?: string }): React.ReactElement {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: "left", padding: "0 12px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "0.5px solid #E5E7EB", width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: "32px 12px", color: "#9CA3AF", fontSize: 12 }}>{emptyMessage}</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: "10px 12px", borderBottom: "0.5px solid #F3F4F6", color: "#374151", verticalAlign: "middle" }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const RangeTabs: React.FC<{ value: 7 | 30 | 90; onChange: (v: 7 | 30 | 90) => void }> = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {([7, 30, 90] as const).map((d) => (
      <button key={d} onClick={() => onChange(d)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 9999, border: "0.5px solid", borderColor: value === d ? "#2A2E6E" : "#E5E7EB", background: value === d ? "#2A2E6E" : "transparent", color: value === d ? "#fff" : "#6B7280", cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.15s" }}>
        {d}d
      </button>
    ))}
  </div>
);

export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2A2E6E" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

export const TagChip: React.FC<{ label: string }> = ({ label }) => (
  <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 9999, fontSize: 10, background: "#E8EAF7", color: "#2A2E6E", fontWeight: 500, marginRight: 3, marginBottom: 3 }}>
    {label}
  </span>
);
