/**
 * SupportOps UI Components — Sidebar App
 */

import React from "react";
import type { Priority, SentimentScore, EscalationRisk } from "../types";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  loading = false,
  children,
  disabled,
  style,
  ...rest
}) => {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: "inherit",
    fontWeight: 500,
    borderRadius: 8,
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "background 0.15s, opacity 0.15s",
    opacity: disabled || loading ? 0.6 : 1,
    fontSize: size === "sm" ? 11 : 12,
    padding: size === "sm" ? "4px 10px" : "7px 14px",
    whiteSpace: "nowrap",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "#2A2E6E", color: "#fff" },
    secondary: { background: "#F3F4F6", color: "#374151", border: "0.5px solid #D1D5DB" },
    ghost:     { background: "transparent", color: "#6B7280" },
    danger:    { background: "#FCEBEB", color: "#D85A30" },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {loading ? <Spinner size={12} /> : null}
      {children}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number | string;
}> = ({ children, style, padding = "12px 14px" }) => (
  <div
    style={{
      background: "#fff",
      border: "0.5px solid #E5E7EB",
      borderRadius: 10,
      padding,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "#9CA3AF",
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Priority Badge
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<Priority, React.CSSProperties> = {
  urgent: { background: "#FFEBEE", color: "#C62828" },
  high:   { background: "#FAEEDA", color: "#854F0B" },
  normal: { background: "#E8EAF7", color: "#2A2E6E" },
  low:    { background: "#F3F4F6", color: "#6B7280" },
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      ...PRIORITY_STYLES[priority],
    }}
  >
    {priority}
  </span>
);

// ---------------------------------------------------------------------------
// Sentiment Display
// ---------------------------------------------------------------------------

const SENTIMENT_COLORS: Record<number, string> = {
  1: "#D85A30", 2: "#BA7517", 3: "#888780", 4: "#1D9E75", 5: "#185FA5",
};

const SENTIMENT_LABELS: Record<number, string> = {
  1: "Frustrated", 2: "Concerned", 3: "Neutral", 4: "Satisfied", 5: "Delighted",
};

export const SentimentDisplay: React.FC<{
  score: SentimentScore;
  label?: string | null;
}> = ({ score, label }) => {
  const color = SENTIMENT_COLORS[score];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i <= score ? color : "#E5E7EB",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>
        {score}/5 — {label ?? SENTIMENT_LABELS[score]}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Escalation Badge
// ---------------------------------------------------------------------------

const RISK_STYLES: Record<EscalationRisk, React.CSSProperties> = {
  low:    { background: "#E1F5EE", color: "#085041" },
  medium: { background: "#FAEEDA", color: "#633806" },
  high:   { background: "#FCEBEB", color: "#791F1F" },
};

export const EscalationBadge: React.FC<{ risk: EscalationRisk }> = ({ risk }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 8px",
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.05em",
      ...RISK_STYLES[risk],
    }}
  >
    {risk === "high" && (
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#D85A30", display: "inline-block" }} />
    )}
    Escalation risk: {risk.toUpperCase()}
  </span>
);

// ---------------------------------------------------------------------------
// Score Bar
// ---------------------------------------------------------------------------

export const ScoreBar: React.FC<{ label: string; value: number; max?: number }> = ({
  label, value, max = 100,
}) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 75 ? "#1D9E75" : pct >= 50 ? "#BA7517" : "#D85A30";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#6B7280", width: 80, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color, minWidth: 26, textAlign: "right" }}>{value}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tag List
// ---------------------------------------------------------------------------

export const TagList: React.FC<{ tags: string[] }> = ({ tags }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
    {tags.map((tag) => (
      <span
        key={tag}
        style={{
          fontSize: 10,
          padding: "2px 8px",
          borderRadius: 9999,
          background: "#E8EAF7",
          color: "#2A2E6E",
          fontWeight: 500,
        }}
      >
        {tag}
      </span>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Confidence Bar
// ---------------------------------------------------------------------------

export const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 50, height: 3, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#3F7FFF", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: "#6B7280" }}>{pct}% confident</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export const Spinner: React.FC<{ size?: number; color?: string }> = ({
  size = 16, color = "#2A2E6E",
}) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
    style={{ animation: "spin 0.8s linear infinite" }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div style={{ textAlign: "center", padding: "24px 16px" }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
    <div style={{ fontWeight: 500, color: "#374151", marginBottom: 4 }}>{title}</div>
    {description && <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>{description}</div>}
    {action}
  </div>
);

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export const Divider: React.FC = () => (
  <div style={{ height: 0.5, background: "#F3F4F6", margin: "10px 0" }} />
);

// ---------------------------------------------------------------------------
// MetricTile
// ---------------------------------------------------------------------------

export const MetricTile: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}> = ({ label, value, sub, color = "#111827" }) => (
  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", flex: 1 }}>
    <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
  </div>
);
