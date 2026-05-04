import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "overview",  label: "Queue overview" },
  { id: "tickets",   label: "Ticket analyses" },
  { id: "sentiment", label: "Sentiment" },
  { id: "tags",      label: "Tag taxonomy" },
];

export const DashboardLayout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => (
  <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <aside style={{ width: 220, background: "#2A2E6E", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3F7FFF" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", letterSpacing: "0.02em" }}>SupportOps AI</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Ticket Intelligence</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 6, border: "none",
                background: active ? "rgba(63,127,255,0.2)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: 12, fontWeight: active ? 500 : 400,
                cursor: "pointer", textAlign: "left", marginBottom: 2,
                transition: "all 0.15s", fontFamily: "DM Sans, sans-serif",
              }}
            >
              {active && <div style={{ width: 3, height: 14, borderRadius: 2, background: "#3F7FFF", flexShrink: 0 }} />}
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 18px", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>v1.0.0 · SupportOps AI Suite</div>
      </div>
    </aside>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ height: 56, background: "#fff", borderBottom: "0.5px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 24px", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#111827" }}>
          {NAV_ITEMS.find((n) => n.id === activePage)?.label ?? "Dashboard"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#1D9E75", background: "#E1F5EE", padding: "3px 10px", borderRadius: 9999 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", animation: "pulse 1.5s infinite" }} />
          Live
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      </header>
      <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</main>
    </div>
  </div>
);
