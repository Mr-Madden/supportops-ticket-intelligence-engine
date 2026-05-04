import React, { useState } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { OverviewPage }   from "./pages/OverviewPage";
import { TicketsPage }    from "./pages/TicketsPage";
import { SentimentPage }  from "./pages/SentimentPage";
import { TagsPage }       from "./pages/TagsPage";
import "./styles/global.css";

type Page = "overview" | "tickets" | "sentiment" | "tags";

const PAGES: Record<Page, React.FC> = {
  overview:  OverviewPage,
  tickets:   TicketsPage,
  sentiment: SentimentPage,
  tags:      TagsPage,
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>("overview");
  const PageComponent = PAGES[activePage];

  return (
    <DashboardLayout activePage={activePage} onNavigate={(page) => setActivePage(page as Page)}>
      <PageComponent />
    </DashboardLayout>
  );
};

export default App;
