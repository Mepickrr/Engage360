import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SendHorizontal, Settings, X } from "lucide-react";
import { getAgentMeta, hexAlpha } from "@/lib/agentMeta";
import { useConversationStore } from "@/store/uiStore";
import { User } from "lucide-react";

export default function AgentDetailModal({ agentId, agents, onClose, onEdit }) {
  const open = !!agentId;
  const safeAgents = Array.isArray(agents) ? agents : [];
  const agent = safeAgents.find((a) => a.id === agentId);
  // System agents have rich meta; custom agents fall back to a generic shape.
  const meta = agent
    ? (getAgentMeta(agent.id) || {
        icon: User,
        askPlaceholder: `Ask ${agent.name}…`,
      })
    : null;
  const openWith = useConversationStore((s) => s.openWith);
  const [text, setText] = useState("");

  // Reset input each time we open/close.
  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  if (!agent || !meta) return null;

  const submit = () => {
    onClose();
    openWith({
      seedMessage: text.trim() || null,
      pinnedAgent: agent.id,
      source: "meet_team",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg"
        data-testid={`agent-modal-${agent.id}`}
      >
        <DialogTitle className="sr-only">
          {agent.name} — {agent.title}
        </DialogTitle>
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(agent.id)}
              data-testid="agent-modal-edit"
              aria-label="Edit agent"
              className="p-1 rounded-md hover:bg-slate-100 text-text-muted hover:text-primary"
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-text-muted"
            data-testid="agent-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-4 pt-1">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
            style={{ backgroundColor: agent.color }}
          >
            {agent.avatar_initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-text-primary">
              {agent.name}
            </h3>
            <p className="text-sm text-text-secondary">{agent.title}</p>
            <div
              className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: hexAlpha(agent.color, 0.12),
                color: agent.color,
              }}
            >
              {agent.domain}
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mt-4 leading-relaxed">
          {agent.bio}
        </p>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
            Try asking
          </div>
          <div className="flex flex-wrap gap-2">
            {(agent.suggested_prompts || []).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText(p)}
                data-testid={`agent-modal-prompt-${agent.id}`}
                className="px-3 py-1 text-[12px] rounded-full border transition-colors hover:opacity-90"
                style={{
                  borderColor: hexAlpha(agent.color, 0.4),
                  color: agent.color,
                  backgroundColor: hexAlpha(agent.color, 0.06),
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-5 flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-surface focus-within:border-primary/60"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={meta.askPlaceholder}
            data-testid={`agent-modal-input-${agent.id}`}
            className="flex-1 outline-none text-sm bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            data-testid={`agent-modal-send-${agent.id}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white"
            style={{ backgroundColor: agent.color }}
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
