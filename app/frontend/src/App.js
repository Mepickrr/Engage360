import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "@/App.css";

import AppShell from "@/components/layout/AppShell";
import CampaignsPage from "@/pages/Campaigns";
import PushPage from "@/pages/Push";
import FlowsPage from "@/pages/Flows";
import CreateFlow from "@/pages/CreateFlow";
import FlowBuilder from "@/pages/FlowBuilder";
import InstagramPage from "@/pages/Instagram";
import SegmentsPage from "@/pages/Segments";
import AudiencePage from "@/pages/Audience";
import AgentsPage from "@/pages/Agents";
import AnalyticsPage from "@/pages/Analytics";
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
            {/* Home is the Agent surface — `/agents` kept as a back-compat alias. */}
            <Route path="/" element={<AgentsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/push" element={<PushPage />} />
            <Route path="/flows" element={<FlowsPage />} />
            <Route path="/flows/create" element={<CreateFlow />} />
            <Route path="/flows/builder/new" element={<FlowBuilder />} />
            <Route path="/flows/builder/:id" element={<FlowBuilder />} />
            <Route path="/instagram" element={<InstagramPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/audience" element={<AudiencePage />} />
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
