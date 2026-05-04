import React from "react";
import { Spinner, Button } from "./UI";

export const LoadingPanel: React.FC<{ message?: string }> = ({
  message = "Analysing ticket...",
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
    <Spinner size={24} />
    <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 1.6 }}>
      {message}
      <br />
      <span style={{ fontSize: 11, color: "#D1D5DB" }}>Running AI pipeline...</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", maxWidth: 200 }}>
      {["Scrubbing PII", "Tagging", "Sentiment", "Priority", "Routing"].map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, animation: `fadeIn 0.3s ease ${i * 0.3}s both` }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3F7FFF", animation: "pulse 1.5s infinite", animationDelay: `${i * 0.2}s` }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{step}</span>
        </div>
      ))}
    </div>
    <style>{`
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    `}</style>
  </div>
);

export const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({
  message, onRetry,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", gap: 10, textAlign: "center" }}>
    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
      ⚠
    </div>
    <div style={{ fontWeight: 500, color: "#374151", fontSize: 13 }}>Analysis failed</div>
    <div style={{ fontSize: 12, color: "#6B7280", maxWidth: 220 }}>{message}</div>
    <Button variant="primary" size="sm" onClick={onRetry}>Try again</Button>
  </div>
);
