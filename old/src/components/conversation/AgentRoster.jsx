import React from "react";
import { AGENT_ORDER, getAgentMeta } from "@/lib/agentMeta";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgentRoster({ pinnedAgent, onPinChange }) {
  return (
    <TooltipProvider delayDuration={120}>
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface"
        data-testid="agent-roster"
      >
        {pinnedAgent ? (
          <button
            type="button"
            onClick={() => onPinChange(null)}
            data-testid="agent-roster-back-auto"
            className="px-2.5 py-1 text-[11px] rounded-full bg-slate-100 text-text-secondary hover:bg-slate-200"
          >
            ← Back to Auto
          </button>
        ) : (
          <span
            className="px-2.5 py-1 text-[11px] rounded-full bg-primary-tint text-primary font-medium"
            data-testid="agent-roster-auto-pill"
          >
            Auto · All agents
          </span>
        )}
        <div className="h-4 w-px bg-border mx-1" />
        <div className="flex items-center gap-1.5">
          {AGENT_ORDER.map((id) => {
            const meta = getAgentMeta(id);
            const active = pinnedAgent === id;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid={`agent-roster-${id}`}
                    onClick={() => onPinChange(active ? null : id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold transition-all ${
                      active
                        ? "ring-2 ring-offset-2 ring-primary scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.name[0]}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {meta.name} · {meta.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
