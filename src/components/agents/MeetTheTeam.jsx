import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/lib/engageApi";
import { AGENT_ORDER, getAgentMeta, hexAlpha } from "@/lib/agentMeta";
import AgentDetailModal from "./AgentDetailModal";
import BuildAgentModal from "./BuildAgentModal";
import { Plus } from "lucide-react";

export default function MeetTheTeam() {
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState([]);

  const { data: apiAgents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.warn("fetchAgents failed:", e?.message);
    },
  });

  const systemAgents = [...(apiAgents ?? [])].sort(
    (a, b) => AGENT_ORDER.indexOf(a.id) - AGENT_ORDER.indexOf(b.id),
  );

  // Merge system + custom agents for the detail modal
  const allAgents = [...systemAgents, ...customAgents];

  const handleCreated = (newAgent) => {
    setCustomAgents((prev) => [...prev, newAgent]);
  };

  const handleAgentSaved = (agentId, updatedAgent) => {
    if (!updatedAgent) {
      // Deleted
      setCustomAgents((prev) => prev.filter((a) => a.id !== agentId));
      return;
    }
    setCustomAgents((prev) => prev.map((a) => (a.id === agentId ? updatedAgent : a)));
  };

  const totalOnline = systemAgents.length + customAgents.length;

  return (
    <section data-testid="meet-the-team">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">
          Meet your team
        </h2>
        <span className="text-xs text-text-muted inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {totalOnline} agents · all online
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* CHANGE 1: "Build Your Agent" card — always position 0 */}
        <button
          type="button"
          data-testid="build-agent-card"
          onClick={() => setBuildOpen(true)}
          className="flex-shrink-0 w-[200px] h-[110px] bg-white border-2 border-dashed border-border/70 rounded-lg p-3 text-left hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
        >
          <div className="flex items-start gap-2.5">
            {/* Dashed circle avatar with + */}
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
              <Plus className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0 mt-0.5">
              <div className="text-sm font-semibold text-text-secondary group-hover:text-text-primary truncate transition-colors">
                Build Your Agent
              </div>
              <div className="text-[11px] text-text-muted truncate mt-0.5">
                Create a custom AI agent
              </div>
            </div>
          </div>
        </button>

        {/* System agents */}
        {systemAgents.map((agent) => {
          const meta = getAgentMeta(agent.id);
          const Icon = meta.icon;
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
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    online
                  </div>
                </div>
                <Icon
                  className="w-4 h-4 opacity-50 flex-shrink-0"
                  style={{ color: agent.color }}
                />
              </div>
              <div
                className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium inline-block"
                style={{ backgroundColor: hexAlpha(agent.color, 0.1), color: agent.color }}
              >
                {agent.domain}
              </div>
            </button>
          );
        })}

        {/* Custom agents added by the user */}
        {customAgents.map((agent) => (
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
                <div className="text-sm font-semibold text-text-primary truncate">{agent.name}</div>
                <div className="text-[11px] text-text-secondary truncate">{agent.title}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  online
                </div>
              </div>
            </div>
            <div
              className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium inline-block"
              style={{ backgroundColor: hexAlpha(agent.color, 0.1), color: agent.color }}
            >
              {agent.domain}
            </div>
          </button>
        ))}
      </div>

      {/* Agent detail popup (system + custom) */}
      <AgentDetailModal
        agentId={activeAgentId}
        agents={allAgents}
        onClose={() => setActiveAgentId(null)}
        onAgentSaved={(updated) => handleAgentSaved(activeAgentId, updated)}
      />

      {/* Build Your Agent modal */}
      <BuildAgentModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onCreated={handleCreated}
      />
    </section>
  );
}
