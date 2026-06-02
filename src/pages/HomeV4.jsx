import React, { useRef, useState, useLayoutEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import { fetchAgents } from "@/lib/engageApi";
import { getAgentMeta, hexAlpha } from "@/lib/agentMeta";
import { RefreshCcw, Cpu, Plus } from "lucide-react";
import StoreStatsRow from "@/components/agents/StoreStatsRow";
import IntelligenceCards from "@/components/agents/IntelligenceCards";
import AskAiBar from "@/components/agents/AskAiBar";
import AgentDetailModal from "@/components/agents/AgentDetailModal";
import BuildAgentModal from "@/components/agents/BuildAgentModal";

// ─── CSS ──────────────────────────────────────────────────────
const FLOW_CSS = `
@keyframes v4-packet {
  0%   { stroke-dashoffset: var(--pl); opacity: 0; }
  6%   { opacity: 1; }
  88%  { opacity: 1; }
  100% { stroke-dashoffset: calc(-1 * var(--pl)); opacity: 0; }
}
@keyframes v4-orch-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(108,58,232,0.35); }
  50%       { box-shadow: 0 0 0 10px rgba(108,58,232,0); }
}
@keyframes v4-agent-ping {
  0%   { transform: scale(0.9); opacity: 0.6; }
  60%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes v4-shimmer {
  0%, 100% { opacity: 0.15; }
  50%       { opacity: 0.40; }
}
`;

function injectCss(id, css) {
  if (typeof document !== "undefined" && !document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

// Pillar config — defines display order and label for each agent
const PILLAR_CONFIG = [
  { id: "meera", pillar: "Discover"  },
  { id: "aryan", pillar: "Revenue"   },
  { id: "zara",  pillar: "Creatives" },
  { id: "dev",   pillar: "Build"     },
  { id: "rishi", pillar: "Insight"   },
  { id: "priya", pillar: "Support"   },
];

const DELAYS = [0, 0.55, 1.05, 0.28, 0.82, 1.35];

// ─── OrchestratorTeamViewV4 ───────────────────────────────────
function OrchestratorTeamViewV4({ agents, onAgentClick, onBuildClick }) {
  injectCss("v4-flow-css", FLOW_CSS);

  const containerRef = useRef(null);
  const orchRef      = useRef(null);
  const pillarRefs   = useRef([]);
  const [paths, setPaths]   = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  // Sort agents by PILLAR_CONFIG order
  const orderedAgents = PILLAR_CONFIG
    .map((p) => ({ ...p, agent: agents.find((a) => a.id === p.id) }))
    .filter((p) => p.agent);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const orch = orchRef.current;
    if (!container || !orch) return;

    const cRect = container.getBoundingClientRect();
    const oRect = orch.getBoundingClientRect();

    const newPaths = pillarRefs.current.map((el) => {
      if (!el) return null;
      const pRect = el.getBoundingClientRect();

      // Orchestrator bottom-center → pillar top-center (container-relative)
      const x1 = oRect.left + oRect.width  / 2 - cRect.left;
      const y1 = oRect.bottom                   - cRect.top;
      const x2 = pRect.left + pRect.width  / 2 - cRect.left;
      const y2 = pRect.top                       - cRect.top;

      const cp1y = y1 + (y2 - y1) * 0.5;
      const cp2y = y2 - (y2 - y1) * 0.5;

      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${cp1y.toFixed(1)}, ${x2.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }).filter(Boolean);

    setSvgSize({ w: cRect.width, h: cRect.height });
    setPaths(newPaths);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [agents, measure]);

  return (
    <section data-testid="orchestrator-team-v4" style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
      >
        {/* ── Orchestrator ── */}
        <div
          ref={orchRef}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 28px", borderRadius: 14,
            background: "linear-gradient(135deg, #3b1fa8 0%, #6C3AE8 60%, #7c3af5 100%)",
            color: "#fff", width: "min(520px, 90%)",
            boxShadow: "0 8px 32px rgba(108,58,232,0.35)",
            animation: "v4-orch-pulse 3s ease-in-out infinite",
            zIndex: 2, position: "relative",
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Cpu size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>Orchestrator</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 1 }}>Routes &amp; coordinates all agents</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80", animation: "v4-orch-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, opacity: 0.85 }}>live</span>
          </div>
        </div>

        {/* ── SVG spacer (orch → pillars) ── */}
        <div style={{ height: 64, width: "100%", position: "relative", zIndex: 1 }}>
          {paths.length > 0 && (
            <svg
              style={{
                position: "absolute",
                left: 0,
                top: -(orchRef.current?.offsetHeight ?? 0),
                width: svgSize.w,
                height: svgSize.h,
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              <defs>
                <filter id="v4-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {paths.map((d, i) => {
                const color = orderedAgents[i]?.agent?.color || "#6C3AE8";
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke={color} strokeWidth={1}
                      strokeDasharray="4 6"
                      style={{ animation: `v4-shimmer ${1.8 + i * 0.25}s ease-in-out infinite`, animationDelay: `${DELAYS[i] ?? 0}s` }}
                    />
                    <path d={d} fill="none" stroke={color} strokeWidth={2.5}
                      strokeLinecap="round" filter="url(#v4-glow)"
                      style={{ "--pl": "280", strokeDasharray: "7 280", strokeDashoffset: 280,
                        animation: `v4-packet ${1.5 + i * 0.18}s cubic-bezier(0.4,0,0.6,1) infinite`,
                        animationDelay: `${DELAYS[i] ?? 0}s` }}
                    />
                    <path d={d} fill="none" stroke={color} strokeWidth={1.5}
                      strokeLinecap="round" filter="url(#v4-glow)"
                      style={{ "--pl": "280", strokeDasharray: "4 280", strokeDashoffset: 280,
                        animation: `v4-packet ${1.5 + i * 0.18}s cubic-bezier(0.4,0,0.6,1) infinite`,
                        animationDelay: `${(DELAYS[i] ?? 0) + 0.7}s` }}
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* ── Pillar + Agent columns ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", zIndex: 2, position: "relative" }}>
          {orderedAgents.map(({ pillar, agent }, i) => {
            const meta = getAgentMeta(agent.id);
            const Icon = meta.icon;
            return (
              <div
                key={agent.id}
                style={{ width: 152, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
              >
                {/* Pillar chip */}
                <div
                  ref={(el) => { pillarRefs.current[i] = el; }}
                  style={{
                    padding: "4px 14px",
                    borderRadius: 20,
                    background: hexAlpha(agent.color, 0.09),
                    border: `1px solid ${hexAlpha(agent.color, 0.28)}`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: agent.color,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pillar}
                </div>

                {/* Connector line pillar → agent */}
                <div style={{
                  width: 2,
                  height: 14,
                  background: `linear-gradient(to bottom, ${hexAlpha(agent.color, 0.5)}, ${hexAlpha(agent.color, 0.15)})`,
                }} />

                {/* Agent card */}
                <button
                  type="button"
                  data-testid={`v4-team-card-${agent.id}`}
                  onClick={() => onAgentClick(agent.id)}
                  style={{
                    width: 152, padding: "14px 12px 12px",
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderTop: `3px solid ${agent.color}`,
                    borderRadius: 12,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    cursor: "pointer", textAlign: "center",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    animation: `v4-agent-ping 0.5s ease-out both`,
                    animationDelay: `${0.1 + i * 0.07}s`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 20px ${hexAlpha(agent.color, 0.25)}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: hexAlpha(agent.color, 0.12),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: agent.color,
                  }}>
                    {agent.avatar_initials}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: "#64748B", lineHeight: 1.3 }}>{agent.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                    {agent.domain?.split("&").slice(0, 2).map((d, di) => (
                      <span key={di} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: hexAlpha(agent.color, 0.1), color: agent.color, fontWeight: 500 }}>
                        {d.trim()}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#10B981" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                    online
                  </div>
                </button>
              </div>
            );
          })}

          {/* Build Agent card — spacer keeps it vertically aligned with agent cards */}
          <div style={{ width: 152, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {/* Pillar-height spacer so agent card row stays flush */}
            <div style={{ height: 27 }} />
            {/* Same 14px connector space */}
            <div style={{ height: 14 }} />
            <button
              type="button"
              data-testid="v4-build-agent-card"
              onClick={onBuildClick}
              style={{
                width: 152, padding: "14px 12px 12px",
                background: "#fff",
                border: "2px dashed #E5E7EB",
                borderRadius: 12,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: "pointer", textAlign: "center",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6C3AE8"; e.currentTarget.style.background = "rgba(108,58,232,0.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#fff"; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                border: "2px dashed #CBD5E1",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#94A3B8",
              }}>
                <Plus size={18} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Build Agent</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Create custom AI</div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MeetTheTeamV4 ────────────────────────────────────────────
function MeetTheTeamV4() {
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState([]);

  const { data: apiAgents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 5 * 60_000,
    onError: (e) => { console.warn("fetchAgents failed:", e?.message); },
  });

  const systemAgents = [...(apiAgents ?? [])].sort(
    (a, b) => PILLAR_CONFIG.findIndex((p) => p.id === a.id) - PILLAR_CONFIG.findIndex((p) => p.id === b.id),
  );
  const allAgents = [...systemAgents, ...customAgents];

  const handleCreated = (newAgent) => setCustomAgents((prev) => [...prev, newAgent]);
  const handleAgentSaved = (id, updated) => {
    if (!updated) { setCustomAgents((prev) => prev.filter((a) => a.id !== id)); return; }
    setCustomAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  return (
    <section data-testid="meet-the-team-v4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-text-primary">Your AI team</h2>
        <span className="text-xs text-text-muted inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {allAgents.length} agents · all online
        </span>
      </div>

      <OrchestratorTeamViewV4
        agents={systemAgents}
        onAgentClick={(id) => setActiveAgentId(id)}
        onBuildClick={() => setBuildOpen(true)}
      />

      <AgentDetailModal
        agentId={activeAgentId}
        agents={allAgents}
        onClose={() => setActiveAgentId(null)}
        onAgentSaved={(updated) => handleAgentSaved(activeAgentId, updated)}
      />
      <BuildAgentModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onCreated={handleCreated}
      />
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function HomeV4Page() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    retry: 1,
    onError: (e) => { console.warn("HomeV4 fetchMe failed:", e?.message); },
  });
  const firstName = me?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 animate-fade-in-up max-w-[1400px] mx-auto" data-testid="page-home-v4">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted font-medium mb-1">Good morning</p>
          <h1 className="text-[32px] font-bold tracking-tight text-text-primary leading-tight">
            Hello, {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Here's what your AI team has for you today.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mt-1"
          title="Refresh"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refreshed 2m ago
        </button>
      </header>

      {/* Compact stat cards */}
      <StoreStatsRow compact />

      <MeetTheTeamV4 />

      <IntelligenceCards />

      {/* Ask AI — extra vertical breathing room */}
      <div className="py-4">
        <AskAiBar />
      </div>
    </div>
  );
}
