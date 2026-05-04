import React from "react";
import { useZendeskContext } from "./hooks/useZendeskContext";
import { useTicketAnalysis } from "./hooks/useTicketAnalysis";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { LoadingPanel, ErrorPanel } from "./components/LoadingState";
import { Spinner } from "./components/UI";
import "./styles/global.css";

const AppHeader: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "0.5px solid #F3F4F6", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3F7FFF", flexShrink: 0 }} />
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#2A2E6E", letterSpacing: "0.02em" }}>Ticket Intelligence</div>
      <div style={{ fontSize: 10, color: "#9CA3AF" }}>SupportOps AI Suite</div>
    </div>
  </div>
);

const App: React.FC = () => {
  const { ticket, isLoading: contextLoading } = useZendeskContext();

  const { analysis, state, error, refresh, submitFeedback } = useTicketAnalysis(
    ticket ?? { ticketId: 0, subject: "", description: "", priority: "normal" }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F9FAFB" }}>
      <AppHeader />
      <div style={{ flex: 1, padding: 12, overflowY: "auto" }}>
        {contextLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <Spinner />
          </div>
        )}
        {!contextLoading && state === "loading" && <LoadingPanel />}
        {!contextLoading && state === "error" && error && (
          <ErrorPanel message={error} onRetry={refresh} />
        )}
        {!contextLoading && state === "success" && analysis && (
          <AnalysisPanel analysis={analysis} onReanalyze={refresh} onFeedback={submitFeedback} />
        )}
      </div>
      <div style={{ padding: "6px 14px", borderTop: "0.5px solid #F3F4F6", background: "#fff", fontSize: 10, color: "#D1D5DB", textAlign: "center" }}>
        Powered by SupportOps AI · All data PII-scrubbed
      </div>
    </div>
  );
};

export default App;
