import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "@/App.css";

import AppShell from "@/components/layout/AppShell";
import CampaignsPage from "@/pages/Campaigns";
import PushPage from "@/pages/Push";
import FlowsPage from "@/pages/Flows";
import FlowBuilder from "@/pages/FlowBuilder";
import FlowCreatePage from "@/pages/FlowCreate";
import FlowsV2Page from "@/pages/FlowsV2";
import FlowBuilderV2 from "@/pages/FlowBuilderV2";
import FlowCreateV2Page from "@/pages/FlowCreateV2";
import FlowAnalyticsV2 from "@/pages/FlowAnalyticsV2";
import InstagramPage from "@/pages/Instagram";
import SegmentsPage from "@/pages/Segments";
import AudiencePage from "@/pages/Audience";
import AgentsPage from "@/pages/Agents";
import HomeV2Page from "@/pages/HomeV2";
import HomeV3Page from "@/pages/HomeV3";
import HomeV4Page from "@/pages/HomeV4";
import HomeV5Page from "@/pages/HomeV5";
import HomeV6Page from "@/pages/HomeV6";
import AnalyticsPage from "@/pages/Analytics";
import FlowAnalytics from "@/pages/FlowAnalytics";
import TemplatesPage from "@/pages/Templates";
import SettingsPage from "@/pages/Settings";
import NotFoundPage from "@/pages/NotFound";
import ConversationPanel from "@/components/conversation/ConversationPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            {/* Home V6 is the default home page. /agents kept as the AI Agents surface. */}
            <Route path="/" element={<HomeV6Page />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/home-v6" element={<HomeV6Page />} />
            <Route path="/home-v2" element={<HomeV2Page />} />
            <Route path="/home-v3" element={<HomeV3Page />} />
            <Route path="/home-v4" element={<HomeV4Page />} />
            <Route path="/home-v5" element={<HomeV5Page />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/push" element={<PushPage />} />
            <Route path="/flows" element={<FlowsPage />} />
            <Route path="/flows/create" element={<FlowCreatePage />} />
            <Route path="/flows/builder/new" element={<FlowBuilder />} />
            <Route path="/flows/builder/:id" element={<FlowBuilder />} />
            <Route path="/flows/builder/:id/analytics" element={<FlowAnalytics />} />
            <Route path="/flows-v2" element={<FlowsV2Page />} />
            <Route path="/flows-v2/create" element={<FlowCreateV2Page />} />
            <Route path="/flows-v2/builder/new" element={<FlowBuilderV2 />} />
            <Route path="/flows-v2/builder/:id" element={<FlowBuilderV2 />} />
            <Route path="/flows-v2/builder/:id/analytics" element={<FlowAnalyticsV2 />} />
            <Route path="/instagram" element={<InstagramPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/audience" element={<AudiencePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <ConversationPanel />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
