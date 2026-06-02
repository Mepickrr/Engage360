import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/lib/engageApi";
import { AGENT_ORDER, getAgentMeta, hexAlpha } from "@/lib/agentMeta";
import AgentDetailModal from "./AgentDetailModal";
import BuildAgentCard from "./BuildAgentCard";
import BuildAgentModal from "./BuildAgentModal";
import EditAgentPanel from "./EditAgentPanel";
import { User } from "lucide-react";

export default function MeetTheTeam() {
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.warn("fetchAgents failed:", e?.message);
    },
  });

  // Visible agents only (treat undefined visibility as shown). Preserve the
  // server's sort (system order first, then custom by created_at).
  const visible = (agents ?? []).filter(
    (a) => (a.visibility || "shown") === "shown",
  );

  const onlineCount = visible.length;
  const editAgent = (agents ?? []).find((a) => a.id === editAgentId);

  return (
    <section data-testid="meet-the-team">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">
          Meet your team
        </h2>
        <span className="text-xs text-text-muted inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {onlineCount} agents · all online
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        <BuildAgentCard onClick={() => setBuildOpen(true)} />
        {visible.map((agent) => {
          // System agents have rich meta entries; custom agents fall back to
          // a neutral default with the User icon.
          const meta = AGENT_ORDER.includes(agent.id)
            ? getAgentMeta(agent.id)
            : { icon: User, askPlaceholder: `Ask ${agent.name}…` };
          const Icon = meta.icon;
          const isPaused = agent.status === "paused";
          return (
            <button
              type="button"
              key={agent.id}
              data-testid={`team-card-${agent.id}`}
              onClick={() => setActiveAgentId(agent.id)}
              className="flex-shrink-0 w-[200px] h-[110px] bg-surface border border-border rounded-lg p-3 text-left hover:border-text-muted/40 hover:shadow-sm transition-all"
              style={{ borderTopColor: agent.color, borderTopWidth: 3 }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.avatar_initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {agent.name}
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">
                    {agent.title}
                  </div>
                  <div
                    className={`mt-1.5 inline-flex items-center gap-1 text-[10px] ${isPaused ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500"}`}
                    />
                    {isPaused ? "paused" : "online"}
                  </div>
                </div>
                <Icon
                  className="w-4 h-4 opacity-50 flex-shrink-0"
                  style={{ color: agent.color }}
                />
              </div>
              <div
                className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium inline-block"
                style={{
                  backgroundColor: hexAlpha(agent.color, 0.1),
                  color: agent.color,
                }}
              >
                {agent.specialty_tag || agent.domain}
              </div>
            </button>
          );
        })}
      </div>

      <AgentDetailModal
        agentId={activeAgentId}
        agents={agents ?? []}
        onClose={() => setActiveAgentId(null)}
        onEdit={(id) => {
          setActiveAgentId(null);
          setEditAgentId(id);
        }}
      />

      <BuildAgentModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
      />

      <EditAgentPanel
        agent={editAgent}
        open={!!editAgentId}
        onClose={() => setEditAgentId(null)}
      />
    </section>
  );
}
