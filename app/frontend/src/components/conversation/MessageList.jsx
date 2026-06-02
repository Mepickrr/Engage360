import React, { useEffect, useRef } from "react";
import { getAgentMeta, timeAgo, hexAlpha } from "@/lib/agentMeta";
import { Loader2, Workflow, Users, Sparkles } from "lucide-react";

const ARTEFACT_ICONS = {
  flow_brief: Workflow,
  segment_preview: Users,
  creative_preview: Sparkles,
};

const ARTEFACT_LABELS = {
  flow_brief: "Flow brief ready — click to enter Build Mode",
  segment_preview: "Segment preview ready — click to open",
  creative_preview: "Creative variants ready — click to view",
};

function ArtefactInlineCta({ message, onEnter }) {
  const pending = message.pending_artefact_type;
  const ready = message.artefact?.type;
  const type = ready || pending;
  if (!type) return null;
  const Icon = ARTEFACT_ICONS[type] || Workflow;
  const label = ready
    ? ARTEFACT_LABELS[ready]
    : `Generating ${pending.replace("_", " ")}...`;
  return (
    <button
      type="button"
      onClick={onEnter}
      disabled={!ready}
      data-testid={`message-artefact-cta-${message.id}`}
      className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
        ready
          ? "bg-primary text-white hover:bg-primary-hover"
          : "bg-slate-100 text-text-muted cursor-wait"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function AgentMessage({ message, onEnterBuild }) {
  const meta = getAgentMeta(message.agent_id);
  const collab = message.collaboration?.agents || [];
  const collabNames =
    collab.length > 1
      ? collab.map((id) => getAgentMeta(id).name).join(", ")
      : null;

  return (
    <div
      data-testid={`message-agent-${message.id}`}
      className="flex gap-3 animate-fade-in-up"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
        style={{ backgroundColor: meta.color }}
      >
        {meta.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-text-primary">
            {meta.name}
          </span>
          <span className="text-[11px] text-text-muted">{meta.domain}</span>
          <span className="text-[10px] text-text-muted ml-auto flex-shrink-0">
            {timeAgo(message.created_at)}
          </span>
        </div>
        {collabNames && (
          <div
            className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: hexAlpha(meta.color, 0.1),
              color: meta.color,
            }}
          >
            {collabNames} worked on this
          </div>
        )}
        <div className="mt-1.5 text-[14px] text-text-primary whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        <ArtefactInlineCta
          message={message}
          onEnter={() => onEnterBuild(message.id)}
        />
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div
      data-testid={`message-user-${message.id}`}
      className="flex justify-end animate-fade-in-up"
    >
      <div className="max-w-[80%] bg-primary-tint text-text-primary rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}

function SystemMessage({ message }) {
  return (
    <div
      data-testid={`message-system-${message.id}`}
      className="text-center text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 mx-auto max-w-md"
    >
      {message.content}
    </div>
  );
}

function ThinkingIndicator({ pinnedAgent }) {
  const meta = getAgentMeta(pinnedAgent || "aryan");
  return (
    <div className="flex gap-3 animate-fade-in-up" data-testid="thinking-indicator">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
        style={{ backgroundColor: meta.color }}
      >
        {meta.name[0]}
      </div>
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {meta.name} is thinking...
      </div>
    </div>
  );
}

export default function MessageList({
  messages,
  isPending,
  pinnedAgent,
  onEnterBuild,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  return (
    <div
      ref={scrollRef}
      data-testid="message-list"
      className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
    >
      {messages.length === 0 && !isPending && (
        <div className="text-center text-sm text-text-muted py-12">
          Send a message to start the conversation. Your AI team is listening.
        </div>
      )}
      {messages.map((m) => {
        if (m.role === "user") return <UserMessage key={m.id} message={m} />;
        if (m.role === "system") return <SystemMessage key={m.id} message={m} />;
        return (
          <AgentMessage
            key={m.id}
            message={m}
            onEnterBuild={onEnterBuild}
          />
        );
      })}
      {isPending && <ThinkingIndicator pinnedAgent={pinnedAgent} />}
    </div>
  );
}
