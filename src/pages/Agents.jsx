import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import { RefreshCcw } from "lucide-react";
import StoreStatsRow from "@/components/agents/StoreStatsRow";
import MeetTheTeam from "@/components/agents/MeetTheTeam";
import IntelligenceCards from "@/components/agents/IntelligenceCards";
import AskAiBar from "@/components/agents/AskAiBar";
import ScheduledReports from "@/components/agents/ScheduledReports";
import TaskBoard from "@/components/agents/TaskBoard";

export default function AgentsPage() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    retry: 1,
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.warn("AgentsPage fetchMe failed:", e?.message);
    },
  });
  const firstName = me?.user?.name?.split(" ")[0] || "there";

  return (
    <div
      className="space-y-7 animate-fade-in-up max-w-[1400px] mx-auto"
      data-testid="page-agents"
    >
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold tracking-tight text-text-primary"
            data-testid="agents-greeting"
            data-testid-alias="agent-home-greeting"
          >
            Hello, {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's what your AI team has for you today.
          </p>
        </div>
        <button
          type="button"
          data-testid="agents-refresh"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary"
          title="Refresh"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Last refreshed 2 minutes ago
        </button>
      </header>

      <StoreStatsRow />
      <MeetTheTeam />
      <IntelligenceCards />
      <AskAiBar />
      <ScheduledReports />
      <TaskBoard />
    </div>
  );
}
