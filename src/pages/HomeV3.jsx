/**
 * HomeV3 — dark terminal / ops-room aesthetic.
 * Same live data as AgentsPage; completely separate visual layer.
 * Route: /home-v3
 */

import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import { fetchAgents, fetchIntelligenceCards, fetchStoreStats } from "@/lib/engageApi";
import { AGENT_ORDER, getAgentMeta } from "@/lib/agentMeta";
import { useConversationStore } from "@/store/uiStore";
import AgentDetailModal from "@/components/agents/AgentDetailModal";
import BuildAgentModal from "@/components/agents/BuildAgentModal";

// ── CSS (injected once) ────────────────────────────────────────
const V3_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  .v3-root { font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; }

  @keyframes v3-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes v3-scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes v3-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes v3-pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
    50%       { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
  }
  @keyframes v3-border-glow {
    0%, 100% { border-color: rgba(108,58,232,0.3); }
    50%       { border-color: rgba(108,58,232,0.7); }
  }

  .v3-cursor::after {
    content: '_';
    animation: v3-blink 1.1s step-end infinite;
    color: #6C3AE8;
    margin-left: 2px;
  }

  .v3-stat-card { animation: v3-fadein 0.4s ease both; }
  .v3-agent-row { animation: v3-fadein 0.4s ease both; }
  .v3-signal-card { animation: v3-fadein 0.5s ease both; }

  .v3-btn {
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: #e2e8f0;
  }
  .v3-btn:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.35);
    color: #fff;
  }
  .v3-btn-primary {
    border-color: rgba(108,58,232,0.6);
    color: #a78bfa;
  }
  .v3-btn-primary:hover {
    background: rgba(108,58,232,0.15);
    border-color: #6C3AE8;
    color: #fff;
  }

  .v3-signal-card:hover { background: #131622 !important; }
  .v3-agent-row:hover { background: rgba(255,255,255,0.04) !important; cursor: pointer; }
`;

function injectV3Css() {
  if (typeof document !== "undefined" && !document.getElementById("v3-css")) {
    const el = document.createElement("style");
    el.id = "v3-css";
    el.textContent = V3_CSS;
    document.head.appendChild(el);
  }
}

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg:         "#080b12",
  cardBg:     "#0d1017",
  cardBg2:    "#111520",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  green:      "#10B981",
  red:        "#EF4444",
  teal:       "#14B8A6",
  purple:     "#6C3AE8",
  purpleLight:"#a78bfa",
  amber:      "#F59E0B",
  textPri:    "#f1f5f9",
  textSec:    "#94A3B8",
  textMuted:  "#4B5563",
  mono:       "'JetBrains Mono', 'Fira Code', monospace",
};

// Agent short codes for the sidebar
const AGENT_CODES = {
  aryan: "RMK", zara: "CRE", meera: "AUD",
  rishi: "ANA", dev: "AUT", priya: "SUP",
};

// Urgency config
const URGENCY = {
  critical:    { label: "CRITICAL",    color: T.red,    border: T.red    },
  opportunity: { label: "OPPORTUNITY", color: T.teal,   border: T.teal   },
  insight:     { label: "INSIGHT",     color: T.textSec, border: T.borderMid },
};

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, delta, live, delay }) {
  const up = delta && !delta.startsWith("-");
  return (
    <div
      className="v3-stat-card"
      style={{
        flex: 1, background: T.cardBg, border: `1px solid ${T.border}`,
        borderRadius: 6, padding: "18px 20px",
        animationDelay: delay,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: T.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.textPri, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: live ? T.green : up ? T.green : T.red, display: "flex", alignItems: "center", gap: 4 }}>
        {live ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "v3-pulse-dot 2s infinite" }} />
            0 changes
          </>
        ) : (
          <>
            {up ? "+" : ""}{delta} <span style={{ marginLeft: 2 }}>{up ? "↑" : "↓"}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Agent list row ─────────────────────────────────────────────
function AgentRow({ agent, onClick, delay }) {
  const code = AGENT_CODES[agent.id] || agent.id.slice(0, 3).toUpperCase();
  return (
    <div
      className="v3-agent-row"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        borderRadius: 4, transition: "background 0.12s",
        animationDelay: delay,
      }}
    >
      {/* Online dot */}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", flexShrink: 0, animation: "v3-pulse-dot 3s infinite" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textPri, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{agent.title}</div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
        padding: "3px 6px", borderRadius: 3,
        background: "rgba(108,58,232,0.12)", color: T.purpleLight,
        border: `1px solid rgba(108,58,232,0.25)`,
      }}>
        {code}
      </span>
    </div>
  );
}

// ── Signal card ────────────────────────────────────────────────
function SignalCard({ card, onCta, delay }) {
  const meta    = getAgentMeta(card.agent_id);
  const urgency = URGENCY[card.urgency] || URGENCY.insight;

  // Compress stats into a monospace metadata line
  const metaLine = (card.stats || []).map((s) => `${s.label.toUpperCase().replace(/ /g, "_")}: ${s.value}`).join(" · ");

  return (
    <div
      className="v3-signal-card"
      style={{
        background: T.cardBg, border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${urgency.border}`,
        borderRadius: "0 6px 6px 0", padding: "18px 20px",
        transition: "background 0.15s",
        animationDelay: delay,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {meta.name}
        </span>
        <span style={{ color: T.textMuted, fontSize: 10 }}>·</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: urgency.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {urgency.label}
        </span>
      </div>

      {/* Headline */}
      <p style={{ fontSize: 13, color: T.textPri, lineHeight: 1.6, margin: "0 0 14px", fontWeight: 400 }}>
        {card.headline}
      </p>

      {/* Metadata in monospace */}
      {metaLine && (
        <div style={{ fontSize: 10, color: urgency.color, letterSpacing: "0.04em", marginBottom: 14, opacity: 0.85 }}>
          {metaLine}
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: "flex", gap: 8 }}>
        {card.cta_secondary && (
          <button className="v3-btn" onClick={() => onCta(card, "secondary")} type="button">
            {card.cta_secondary}
          </button>
        )}
        {card.cta_primary && (
          <button className="v3-btn v3-btn-primary" onClick={() => onCta(card, "primary")} type="button">
            {card.cta_primary}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Build-agent row at bottom of list ─────────────────────────
function BuildAgentRow({ onClick }) {
  return (
    <div
      className="v3-agent-row"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 4, opacity: 0.45 }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 2, border: `1.5px dashed ${T.textMuted}`, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, letterSpacing: "0.06em" }}>+ BUILD AGENT</div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Create custom AI</div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function HomeV3Page() {
  injectV3Css();

  const openWith = useConversationStore((s) => s.openWith);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState([]);
  const [now, setNow] = useState(new Date());

  // Tick every minute for "last sync" display
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 5 * 60_000, retry: 1 });
  const { data: apiAgents = [] } = useQuery({ queryKey: ["agents"], queryFn: fetchAgents, staleTime: 5 * 60_000 });
  const { data: cards = [] } = useQuery({ queryKey: ["intel-cards"], queryFn: fetchIntelligenceCards, staleTime: 60_000 });
  const { data: statsRaw } = useQuery({ queryKey: ["store-stats"], queryFn: fetchStoreStats, staleTime: 60_000 });

  const firstName = me?.user?.name?.split(" ")[0]?.toUpperCase() || "THERE";
  const systemAgents = [...(apiAgents ?? [])].sort((a, b) => AGENT_ORDER.indexOf(a.id) - AGENT_ORDER.indexOf(b.id));
  const allAgents = [...systemAgents, ...customAgents];

  // Extract display values from stat metric objects { value, delta_pct, currency, period }
  const raw = statsRaw?.metrics || statsRaw || {};

  function fmtRevenue(v) {
    if (v == null) return "₹8.43L";
    const n = Number(v);
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  }
  function fmtNum(v, fallback) {
    if (v == null) return fallback;
    return Number(v).toLocaleString("en-IN");
  }
  function fmtDelta(metric) {
    const pct = metric?.delta_pct;
    if (pct == null) return null;
    return `${pct >= 0 ? "+" : ""}${Number(pct).toFixed(1)}%`;
  }

  const revenue   = fmtRevenue(raw?.revenue?.value);
  const revDelta  = fmtDelta(raw?.revenue);
  const orders    = fmtNum(raw?.total_orders?.value, "1,247");
  const ordDelta  = fmtDelta(raw?.total_orders);
  const users     = fmtNum(raw?.unique_users?.value, "8,923");
  const usrDelta  = fmtDelta(raw?.unique_users);
  const flowCount = String(raw?.active_flows?.value ?? "7");
  const flowLive  = (raw?.active_flows?.delta_pct ?? 0) === 0;

  const handleCtaClick = (card, which) => {
    const msg = which === "primary"
      ? `I want to act on this: ${card.headline}\n\nWalk me through the recommended next steps.`
      : `Tell me more about: ${card.headline}`;
    openWith({ seedMessage: msg, pinnedAgent: card.agent_id, source: "home_v3" });
  };

  return (
    <div
      className="v3-root"
      data-testid="page-home-v3"
      style={{
        minHeight: "100vh", background: T.bg, color: T.textPri,
        padding: "32px 32px 48px",
        maxWidth: 1280, margin: "0 auto",
        position: "relative",
        fontFamily: T.mono,
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
            // SESSION ACTIVE
          </div>
          <h1
            className="v3-cursor"
            style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.01em", color: T.textPri, lineHeight: 1, margin: 0 }}
          >
            HELLO, {firstName}
          </h1>
        </div>

        {/* Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 4,
          border: `1px solid rgba(108,58,232,0.4)`,
          background: "rgba(108,58,232,0.07)",
          animation: "v3-border-glow 4s ease-in-out infinite",
          fontSize: 10, letterSpacing: "0.1em", color: T.purpleLight,
          textTransform: "uppercase",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.purpleLight, display: "inline-block", animation: "v3-pulse-dot 2.5s infinite" }} />
          {allAgents.length + customAgents.length || 6} agents online
          <span style={{ color: T.textMuted, margin: "0 4px" }}>·</span>
          <span style={{ color: T.textMuted }}>last sync 2m ago</span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <StatCard label="Revenue"      value={revenue}   delta={revDelta || "+12.4%"} delay="0s"    />
        <StatCard label="Orders"       value={orders}    delta={ordDelta || "+8.1%"}  delay="0.07s" />
        <StatCard label="Unique Users" value={users}     delta={usrDelta || "+5.7%"}  delay="0.14s" />
        <StatCard label="Active Flows" value={flowCount} live={flowLive}              delay="0.21s" />
      </div>

      {/* ── Body: left (team list) + right (signals) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

        {/* LEFT — AI Team list */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", color: T.textMuted, textTransform: "uppercase" }}>
              // AI TEAM
            </span>
          </div>

          <div style={{ padding: "6px 4px" }}>
            {systemAgents.map((agent, i) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                onClick={() => setActiveAgentId(agent.id)}
                delay={`${0.05 * i}s`}
              />
            ))}
            {customAgents.map((agent, i) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                onClick={() => setActiveAgentId(agent.id)}
                delay={`${0.05 * (systemAgents.length + i)}s`}
              />
            ))}
            <div style={{ height: 1, background: T.border, margin: "6px 12px" }} />
            <BuildAgentRow onClick={() => setBuildOpen(true)} />
          </div>
        </div>

        {/* RIGHT — Signals */}
        <div>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", color: T.textMuted, textTransform: "uppercase" }}>
              // {cards.length || 4} SIGNALS NEED ATTENTION
            </span>
            <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.08em" }}>
              {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Signal cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cards.length > 0 ? cards.map((card, i) => (
              <SignalCard
                key={card.id}
                card={card}
                onCta={handleCtaClick}
                delay={`${0.08 * i}s`}
              />
            )) : (
              /* Skeleton / fallback when API is loading */
              [
                { id: "s1", agent_id: "rishi", urgency: "critical",
                  headline: "Checkout recovery WhatsApp flow delivery dropped 38% in 24h. 412 messages failed delivery.",
                  stats: [{ label: "Flow", value: "Checkout Recovery v2" }, { label: "Failed", value: "412" }],
                  cta_primary: "Update flow", cta_secondary: "More" },
                { id: "s2", agent_id: "meera", urgency: "opportunity",
                  headline: "1,840 high-intent browsers haven't converted in 14 days. Viewed 3+ products, never added to cart.",
                  stats: [{ label: "Reach", value: "1,840" }, { label: "Est Rev", value: "₹2.1L" }],
                  cta_primary: "Build segment", cta_secondary: "More" },
                { id: "s3", agent_id: "aryan", urgency: "opportunity",
                  headline: "Payday window in 3 days. 2,300 top buyers haven't seen a campaign in 21 days. Est. ₹1.8L.",
                  stats: [{ label: "Audience", value: "2,300" }, { label: "Window", value: "1st–5th" }],
                  cta_primary: "Build this", cta_secondary: "Tell me more" },
                { id: "s4", agent_id: "dev", urgency: "insight",
                  headline: "All 7 active flows healthy. 1 draft flow ready to publish: 'Post-delivery review'.",
                  stats: [{ label: "Active", value: "7" }, { label: "Drafts", value: "1" }],
                  cta_primary: "Review drafts", cta_secondary: "View flows" },
              ].map((card, i) => (
                <SignalCard key={card.id} card={card} onCta={handleCtaClick} delay={`${0.08 * i}s`} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Agent detail + build modals */}
      <AgentDetailModal
        agentId={activeAgentId}
        agents={allAgents}
        onClose={() => setActiveAgentId(null)}
        onAgentSaved={(updated) => {
          if (!updated) { setCustomAgents((p) => p.filter((a) => a.id !== activeAgentId)); return; }
          setCustomAgents((p) => p.map((a) => (a.id === activeAgentId ? updated : a)));
        }}
      />
      <BuildAgentModal
        open={buildOpen}
        onClose={() => setBuildOpen(false)}
        onCreated={(a) => setCustomAgents((p) => [...p, a])}
      />
    </div>
  );
}
