import React from "react";
import { Plus } from "lucide-react";

export default function BuildAgentCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="team-card-build"
      className="flex-shrink-0 w-[200px] h-[110px] rounded-lg p-3 text-left transition-all opacity-90 hover:opacity-100 hover:border-primary"
      style={{
        backgroundColor: "#FAFAFC",
        border: "2px dashed var(--color-border)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: "2px dashed var(--color-text-muted)" }}
        >
          <Plus className="w-5 h-5 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">
            Build Your Agent
          </div>
          <div className="text-[11px] text-text-secondary truncate">
            Create a custom AI agent
          </div>
        </div>
      </div>
    </button>
  );
}
