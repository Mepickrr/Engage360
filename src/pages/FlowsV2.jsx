import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFlows, pauseFlow, resumeFlow, deleteFlow } from "@/lib/flowsApi";
import { SEED_FLOWS } from "@/data/seedFlows";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, GitBranch, MoreVertical, X, Sparkles,
  MessageCircle, Mail, MessageSquare, Bell, Phone,
  ChevronDown, Download, Pencil, BarChart2, Bot, Signal,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { useConversationStore } from "@/store/uiStore";

// ── brand tokens ──────────────────────────────────────────────────────────────
const PRIMARY   = "#6C3AE8";
const ARYAN_CLR = "#10B981";
const RISHI_CLR = "#3B82F6";
const AMBER     = "#F59E0B";
const RED_CLR   = "#EF4444";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatINR(v) {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(v)}`;
}
function fmtNum(n) {
  return n != null ? new Intl.NumberFormat("en-IN").format(n) : "—";
}

// ── static sample data ────────────────────────────────────────────────────────
const SAMPLE_FLOWS = [
  { id: "s1", name: "Cart Recovery",      lifecycle: "Conversion",    health: "critical", status: "active",   channels: ["whatsapp", "email"],              audienceType: "all",       lastUpdate: "2 hrs ago",  sent: 12430, delivered: 8102, opened: 3241, clicked: 891,  orders: 204, revenue: 84200,  spent: 12400 },
  { id: "s2", name: "Welcome Series",     lifecycle: "Acquisition",   health: "warning",  status: "active",   channels: ["whatsapp", "sms"],                audienceType: "engage360", lastUpdate: "1 day ago",  sent: 6820,  delivered: 6102, opened: 1840, clicked: 430,  orders: 12,  revenue: 4100,   spent: 5200  },
  { id: "s3", name: "Checkout Recovery",  lifecycle: "Conversion",    health: "healthy",  status: "active",   channels: ["whatsapp", "email", "push"],       audienceType: "known",     lastUpdate: "3 hrs ago",  sent: 9310,  delivered: 8840, opened: 4200, clicked: 1100, orders: 310, revenue: 184000, spent: 8900  },
  { id: "s4", name: "Re-engagement",      lifecycle: "Re-engagement", health: "healthy",  status: "draft",    channels: ["email", "sms", "push"],            audienceType: "all",       lastUpdate: "5 days ago", sent: 3200,  delivered: 2900, opened: 980,  clicked: 210,  orders: 44,  revenue: 18400,  spent: 3100  },
  { id: "s5", name: "AI COD Confirmation", lifecycle: "Conversion",   health: "healthy",  status: "active",   channels: ["aicalling", "sms"],               audienceType: "known",     lastUpdate: "30 min ago", sent: 2140,  delivered: 2080, opened: 1920, clicked: 840,  orders: 198, revenue: 62000,  spent: 4800  },
  { id: "s6", name: "Post-Purchase Review", lifecycle: "Retention",   health: "healthy",  status: "completed",channels: ["whatsapp", "aichatbot"],           audienceType: "engage360", lastUpdate: "2 days ago", sent: 5400,  delivered: 5100, opened: 2800, clicked: 920,  orders: 0,   revenue: 0,      spent: 2200  },
];

const LIFECYCLE_COLORS = {
  Acquisition:    { bg: "#EFF6FF", fg: "#3B82F6" },
  Engagement:     { bg: "#F0FDF4", fg: "#22C55E" },
  Conversion:     { bg: "#F5F3FF", fg: "#8B5CF6" },
  Retention:      { bg: "#FFFBEB", fg: "#F59E0B" },
  "Re-engagement":{ bg: "#FFF1F2", fg: "#F43F5E" },
};

const HEALTH_META = {
  critical: { color: RED_CLR,   title: "Critical — delivery failure >30%" },
  warning:  { color: AMBER,     title: "Needs attention" },
  healthy:  { color: "#22C55E", title: "Healthy" },
};

const CHANNEL_META = {
  whatsapp:  { Icon: MessageCircle, color: "#25D366", label: "WhatsApp" },
  email:     { Icon: Mail,          color: "#3B82F6", label: "Email"    },
  sms:       { Icon: MessageSquare, color: "#64748B", label: "SMS"      },
  push:      { Icon: Bell,          color: "#F59E0B", label: "Push"     },
  aicalling: { Icon: PhoneCall,     color: "#8B5CF6", label: "AI Call"  },
  aichatbot: { Icon: Bot,           color: "#6C3AE8", label: "AI Chatbot"},
  rcs:       { Icon: Signal,        color: "#0EA5E9", label: "RCS"      },
};

const STATUS_META = {
  active:    { label: "Live",        bg: "#ECFDF5", fg: "#065F46", dot: "#22C55E" },
  draft:     { label: "Draft",       bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  completed: { label: "Completed",   bg: "#EFF6FF", fg: "#1D4ED8", dot: "#3B82F6" },
  paused:    { label: "In Progress", bg: "#FFFBEB", fg: "#92400E", dot: "#F59E0B" },
  inactive:  { label: "Inactive",    bg: "#F1F5F9", fg: "#6B7280", dot: "#D1D5DB" },
};

const AUDIENCE_META = {
  all:       { label: "All Users",              bg: "#F1F5F9", fg: "#475569" },
  engage360: { label: "Engage360 Identified",   bg: "#EFF6FF", fg: "#3B82F6" },
  known:     { label: "Known Users",            bg: "#F0FDF4", fg: "#16A34A" },
};

const TIER_STYLES = {
  START:   { bg: "#EFF6FF", fg: "#3B82F6",  label: "START" },
  IMPROVE: { bg: "#FFFBEB", fg: "#F59E0B",  label: "IMPROVE" },
  SCALE:   { bg: "#F5F3FF", fg: "#8B5CF6",  label: "SCALE" },
};

const GROWTH_CARDS = [
  {
    tier: "START",
    title: "Cart Recovery — WhatsApp + Email",
    body: "312 similar sellers use this. 2,400 users dropped off in the last 7 days with no recovery flow active.",
    channels: ["whatsapp", "email"],
    cta: "Build with Aryan",
    seed: "Build a Cart Recovery flow — WhatsApp primary, Email fallback. 2,400 users dropped in last 7 days. No active recovery flow. Give me the full brief.",
  },
  {
    tier: "IMPROVE",
    title: "Add SMS fallback to Welcome Series",
    body: "Estimated +12% recovery rate based on your current WhatsApp delivery patterns.",
    channels: ["sms"],
    cta: "Improve with Aryan",
    seed: "My Welcome Series has no SMS fallback. WhatsApp delivery is patchy on Tuesdays. How do I add SMS as a fallback channel?",
  },
  {
    tier: "SCALE",
    title: "AI Calling for COD Confirmation",
    body: "−23% RTO expected based on your category data. 847 COD orders placed this month.",
    channels: ["phone"],
    cta: "Scale with Aryan",
    seed: "I want to add AI Calling for COD Confirmation. 847 COD orders this month. Walk me through setup and expected impact.",
  },
];

// ── small shared components ───────────────────────────────────────────────────
function AgentChip({ color, initial, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initial}
      </span>
      <span className="text-[12px] font-semibold" style={{ color }}>
        {label}
      </span>
    </span>
  );
}

function HealthDot({ health }) {
  const { color, title } = HEALTH_META[health] || HEALTH_META.healthy;
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0 inline-block mt-1"
      style={{ backgroundColor: color }}
      title={title}
    />
  );
}

function LifecycleChip({ stage }) {
  if (!stage) return null;
  const style = LIFECYCLE_COLORS[stage] || { bg: "#F1F5F9", fg: "#64748B" };
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium mt-0.5"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {stage}
    </span>
  );
}

function StatusToggle({ active, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${active ? "bg-primary" : "bg-slate-200"}`}
      title={active ? "Active — click to pause" : "Inactive — click to activate"}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── AI Flow Assist (compact inline block) ────────────────────────────────────
const ASSIST_CHIPS = [
  "Re-Engage Inactive Users — Multi-Channel",
  "Abandoned Cart Reminder — Multi-Channel",
  "Feedback Collection Post-Purchase",
  "Upsell to Recent Buyers — Multi-Channel",
  "Browse Abandonment — Multi-Channel",
  "Post-Delivery Review Request",
  "Win-Back Lapsed VIPs",
];

function AIFlowAssist() {
  const [prompt, setPrompt] = useState("");
  const openWith = useConversationStore((s) => s.openWith);

  const handleSubmit = () => {
    const text = prompt.trim();
    if (!text) return;
    openWith({
      seedMessage: `${text}\n\nBuild me a complete flow for this. Design the full sequence — trigger, channels, timing — and show me the flow preview.`,
      pinnedAgent: "dev",
      source: "flows_ai_assist",
    });
    setPrompt("");
  };

  return (
    <div
      className="rounded-xl border border-border"
      style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 40%, #FAF5FF 100%)" }}
      data-testid="flows-ai-assist"
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
          <span className="text-[13px] font-semibold text-text-primary">AI Flow Assist</span>
          <span className="text-[12px] text-text-secondary">— describe a flow and build it instantly</span>
        </div>
      </div>

      {/* Input + chips */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            rows={2}
            placeholder="e.g. Send a post-purchase review request 3 days after delivery via WhatsApp…"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 resize-none"
          />
          {prompt.trim() && (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg text-white text-[12px] font-medium hover:opacity-90 flex-shrink-0 h-full self-stretch flex items-center"
              style={{ backgroundColor: PRIMARY }}
            >
              Build →
            </button>
          )}
        </div>

        {/* Quick-start chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2.5 pb-0.5">
          {ASSIST_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setPrompt(chip)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full border border-border bg-white text-[11px] text-text-secondary hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CHANGE 2: Performance Context Strip ───────────────────────────────────────
function PerformanceContextStrip() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-amber-200 px-4 py-2.5"
      style={{ borderLeft: `4px solid ${AMBER}`, backgroundColor: "#FFFBEB" }}
      data-testid="perf-context-strip"
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: RISHI_CLR }}
      >
        R
      </span>
      <p className="text-[12px] text-text-secondary flex-1 leading-relaxed">
        <span className="font-semibold text-text-primary">Rishi</span>
        {" · "}
        2 flows need your attention —{" "}
        <span className="font-medium text-text-primary">Cart Abandonment</span> WhatsApp delivery at 61%,{" "}
        <span className="font-medium text-text-primary">Welcome Series</span> has had no conversions in 7 days.
      </p>
      <button
        type="button"
        className="flex-shrink-0 px-3 py-1 rounded-md border border-amber-400 text-amber-700 text-[11px] font-medium hover:bg-amber-50"
        onClick={() => toast.info("Scrolling to flows needing attention…")}
      >
        Review
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded hover:bg-amber-100 text-amber-500"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── CHANGE 3: 6 Stat Cards ────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaUp, live }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium mb-1">
        {label}
      </div>
      <div className="text-xl font-semibold text-text-primary tabular-nums">
        {value}
      </div>
      {live ? (
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          live
        </div>
      ) : delta != null ? (
        <div className={`mt-1 text-[11px] font-medium ${deltaUp ? "text-emerald-600" : "text-rose-500"}`}>
          {deltaUp ? "↑" : "↓"} {delta}%
        </div>
      ) : null}
    </div>
  );
}

function StatsRow() {
  const [dateRange, setDateRange] = useState("last30");
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-[11px] border border-border rounded-md pl-2 pr-6 py-1 bg-surface appearance-none cursor-pointer text-text-secondary focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>
        <button type="button" className="text-[12px] text-primary hover:underline font-medium"
          onClick={() => toast.info("Opening full analytics…")}>
          View Full Analytics →
        </button>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard label="Active Flows"       value="71"       delta={12.0} deltaUp={true}  />
        <StatCard label="Revenue Attributed" value="₹48.1L"   delta={8.0}  deltaUp={true}  />
        <StatCard label="Deliverability"     value="78%"      delta={3.0}  deltaUp={false} />
        <StatCard label="Users in Flows"     value="1,284"    live={true}                  />
        <StatCard label="AI Sessions"        value="21.15K"   delta={5.0}  deltaUp={true}  />
        <StatCard label="Conv. Rate"         value="3.2%"     delta={0.4}  deltaUp={false} />
      </div>
    </div>
  );
}

// ── CHANGE 4: AI Analytics Zone ───────────────────────────────────────────────
function AIAnalyticsZone() {
  const [dismissed, setDismissed] = useState(false);
  const openWith = useConversationStore((s) => s.openWith);
  if (dismissed) return null;
  return (
    <div
      className="relative bg-surface border border-border rounded-lg px-5 py-4"
      style={{ borderLeft: `4px solid ${RED_CLR}` }}
      data-testid="ai-analytics-zone"
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded hover:bg-slate-100 text-text-muted"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between gap-6 pr-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: RISHI_CLR }}
            >
              R
            </span>
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wide">
              Rishi · Flow Intelligence
            </span>
          </div>
          <p className="text-[14px] font-medium text-text-primary leading-snug">
            Cart Recovery — WhatsApp delivery failed on{" "}
            <span className="text-rose-600 font-semibold">44% of sends</span>{" "}
            in the last 24 hours.{" "}
            <span className="text-rose-600 font-semibold">₹84,200 revenue at risk.</span>{" "}
            Last successful trigger: 2 hours ago.
          </p>
          <p className="mt-1.5 text-[11px] text-text-muted italic">
            This signal has been escalated to Agent Home. Rishi is monitoring cross-module impact.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md text-white text-[12px] font-medium hover:opacity-90"
            style={{ backgroundColor: RED_CLR }}
            onClick={() =>
              openWith({
                seedMessage: "Cart Recovery flow — WhatsApp delivery failed 44% in last 24h. ₹84,200 at risk. Diagnose and tell me how to fix it.",
                pinnedAgent: "rishi",
                source: "flows_alert",
              })
            }
          >
            Fix now
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium hover:bg-slate-50"
            onClick={() => toast.info("Opening analytics…")}
          >
            View analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CHANGE 5: Growth Engine ───────────────────────────────────────────────────
function GrowthEngine() {
  const openWith = useConversationStore((s) => s.openWith);
  return (
    <div data-testid="growth-engine">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AgentChip color={ARYAN_CLR} initial="A" label="Aryan · Growth Agent" />
          <span className="text-[11px] text-text-muted">
            · Recommended for your store · Based on segment analysis
          </span>
        </div>
        <button
          type="button"
          className="text-[12px] text-primary hover:underline font-medium"
          onClick={() =>
            openWith({
              seedMessage: "Show me all current flow opportunities for my store.",
              pinnedAgent: "aryan",
              source: "growth_engine",
            })
          }
        >
          See all opportunities →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GROWTH_CARDS.map((card) => {
          const tier = TIER_STYLES[card.tier];
          return (
            <div
              key={card.tier}
              className="relative bg-surface border border-border rounded-lg p-4 flex flex-col hover:shadow-sm transition-shadow"
            >
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 w-fit"
                style={{ backgroundColor: tier.bg, color: tier.fg }}
              >
                {tier.label}
              </span>
              <h3 className="text-[13px] font-semibold text-text-primary mb-1.5">
                {card.title}
              </h3>
              <p className="text-[12px] text-text-secondary flex-1 mb-3 leading-relaxed">
                {card.body}
              </p>
              <div className="flex items-center gap-1.5 mb-3">
                {card.channels.map((ch) => {
                  const Icon = CHANNEL_ICONS[ch];
                  return Icon ? (
                    <span key={ch} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center" title={ch}>
                      <Icon className="w-3 h-3 text-text-secondary" />
                    </span>
                  ) : null;
                })}
              </div>
              <button
                type="button"
                className="w-full px-3 py-2 rounded-md text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: PRIMARY }}
                onClick={() => openWith({ seedMessage: card.seed, pinnedAgent: "aryan", source: "growth_engine" })}
              >
                {card.cta} →
              </button>
              {/* Aryan attribution */}
              <span
                className="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold opacity-50"
                style={{ backgroundColor: ARYAN_CLR }}
                title="Recommended by Aryan"
              >
                A
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CHANGE 6: Flows Table ─────────────────────────────────────────────────────
function FlowsTable({ sampleFlows, apiFlows, deleteMut }) {
  const navigate = useNavigate();
  const [pctView, setPctView]       = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [stageFilter, setStage]     = useState("all");
  const [statuses, setStatuses]     = useState({});

  const SEED_DATES = ["Jun 9, 2026", "Jun 8, 2026", "Jun 7, 2026", "Jun 6, 2026", "Jun 5, 2026", "Jun 4, 2026"];
  const seedRows = useMemo(() =>
    SEED_FLOWS.map((sf, i) => ({
      id: sf.id, name: sf.name,
      lifecycle: sf.lifecycle_stage || null,
      health: sf.health || "healthy",
      status: sf.status || "draft",
      channels: sf.channels || [],
      audienceType: sf.audienceType || "all",
      lastUpdate: sf.lastUpdate || SEED_DATES[i % SEED_DATES.length],
      sent: 0, delivered: 0, opened: 0, clicked: 0, orders: 0, revenue: 0, spent: 0,
      isSeed: true,
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const rows = useMemo(() => {
    const mapFlow = (f) => ({
      id: f.id, name: f.name,
      lifecycle: f.lifecycle_stage || null,
      health: f.health || "healthy",
      status: ["active", "paused", "draft", "completed"].includes(f.status) ? f.status : "draft",
      channels: f.channels || [],
      audienceType: f.audienceType || "all",
      lastUpdate: f.lastUpdate || "—",
      sent:      f.performance?.entered || 0,
      delivered: Math.round((f.performance?.entered || 0) * 0.82),
      opened:    Math.round((f.performance?.entered || 0) * 0.35),
      clicked:   Math.round((f.performance?.entered || 0) * 0.10),
      orders:    0,
      revenue:   f.performance?.revenue_inr || 0,
      spent:     f.spent || 0,
      isLocal:   f.id?.startsWith("local-"),
    });

    const apiRows = (apiFlows && apiFlows.length > 0) ? apiFlows.map(mapFlow) : sampleFlows;
    const apiIds = new Set(apiRows.map((r) => r.id));
    const source = [...seedRows.filter((r) => !apiIds.has(r.id)), ...apiRows];

    return source.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (stageFilter  !== "all" && f.lifecycle !== stageFilter) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [apiFlows, sampleFlows, seedRows, statusFilter, stageFilter, search]);

  const getStatus = (f) => statuses[f.id] !== undefined ? statuses[f.id] : f.status;
  const isLive = (f) => getStatus(f) === "active";

  const fmt = (n, total) => {
    if (n == null) return "—";
    if (pctView && total) return `${((n / total) * 100).toFixed(1)}%`;
    return fmtNum(n);
  };

  return (
    <div data-testid="flows-table-section">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flows..."
            className="pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-surface w-[180px] focus:outline-none focus:border-primary/60" />
        </div>

        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-[120px] h-8 text-[12px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Live</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStage}>
          <SelectTrigger className="w-[130px] h-8 text-[12px]"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Acquisition">Acquisition</SelectItem>
            <SelectItem value="Engagement">Engagement</SelectItem>
            <SelectItem value="Conversion">Conversion</SelectItem>
            <SelectItem value="Retention">Retention</SelectItem>
            <SelectItem value="Re-engagement">Re-engagement</SelectItem>
          </SelectContent>
        </Select>

        <button type="button"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50"
          onClick={() => toast.info("Exporting flows as CSV…")}>
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: pctView ? PRIMARY : "#94A3B8" }}>% View</span>
          <button type="button" onClick={() => setPctView((v) => !v)}
            title={pctView ? "Switch to absolute numbers" : "Switch to % of sent"}
            style={{
              position: "relative", width: 40, height: 22, borderRadius: 11, flexShrink: 0,
              background: pctView ? PRIMARY : "#E2E8F0", cursor: "pointer", border: "none",
              display: "flex", alignItems: "center", padding: 2, transition: "background 0.2s",
            }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s",
              transform: pctView ? "translateX(18px)" : "translateX(0)",
              flexShrink: 0,
            }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <GitBranch className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <div className="text-sm font-medium text-text-primary">No flows match your filters</div>
          </div>
        ) : (
          <table className="w-full text-left" style={{ minWidth: 1200 }}>
            <thead className="bg-slate-50 border-b border-border">
              <tr className="text-[11px] uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2.5 font-medium" style={{ minWidth: 220 }}>Journey Name</th>
                <th className="px-3 py-2.5 font-medium" style={{ minWidth: 130 }}>Channels</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 70 }}>Sent</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 80 }}>Delivered{pctView ? " %" : ""}</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 70 }}>Opened{pctView ? " %" : ""}</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 70 }}>Clicked{pctView ? " %" : ""}</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 70 }}>Orders</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 90 }}>Revenue</th>
                <th className="px-3 py-2.5 font-medium text-right" style={{ minWidth: 70 }}>Spent</th>
                <th className="px-3 py-2.5 font-medium" style={{ minWidth: 130 }}>Status</th>
                <th className="px-3 py-2.5 font-medium text-center" style={{ minWidth: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const currentStatus = getStatus(f);
                const live = isLive(f);
                const sm = STATUS_META[currentStatus] || STATUS_META.draft;
                const audience = AUDIENCE_META[f.audienceType] || AUDIENCE_META.all;

                return (
                  <tr key={f.id} className="border-t border-border hover:bg-slate-50/50 transition-colors">

                    {/* Journey Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <HealthDot health={f.health} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button type="button"
                              onClick={() => navigate(`/flows-v2/builder/${f.id}`)}
                              className="font-semibold text-[13px] text-text-primary hover:text-primary text-left truncate max-w-[160px]">
                              {f.name}
                            </button>
                            {f.isSeed && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-600">Demo</span>}
                            {f.isLocal && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Local</span>}
                          </div>
                          {/* Audience type + last update */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ background: audience.bg, color: audience.fg }}>
                              {audience.label}
                            </span>
                            <span className="text-[10px] text-text-muted">{f.lastUpdate}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Channels */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(f.channels || []).map((ch) => {
                          const meta = CHANNEL_META[ch];
                          if (!meta) return null;
                          const { Icon, color, label } = meta;
                          return (
                            <span key={ch} title={label}
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: `${color}18` }}>
                              <Icon className="w-3 h-3" style={{ color }} />
                            </span>
                          );
                        })}
                        {(!f.channels || f.channels.length === 0) && (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </div>
                    </td>

                    {/* Metrics */}
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{fmtNum(f.sent)}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{fmt(f.delivered, f.sent)}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{fmt(f.opened, f.sent)}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{fmt(f.clicked, f.sent)}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{fmtNum(f.orders)}</td>
                    <td className="px-3 py-3 text-right text-[12px] font-medium text-text-primary tabular-nums">{formatINR(f.revenue)}</td>
                    <td className="px-3 py-3 text-right text-[12px] text-text-secondary tabular-nums">{formatINR(f.spent)}</td>

                    {/* Status — toggle + label */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => {
                            const next = currentStatus === "active" ? "draft" : "active";
                            setStatuses((p) => ({ ...p, [f.id]: next }));
                            toast.success(next === "active" ? `${f.name} is now Live` : `${f.name} paused`);
                          }}
                          title={live ? "Live — click to pause" : "Click to activate"}
                          style={{
                            position: "relative", width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                            background: live ? PRIMARY : "#E2E8F0", cursor: "pointer", border: "none",
                            display: "flex", alignItems: "center", padding: 2, transition: "background 0.2s",
                          }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s",
                            transform: live ? "translateX(18px)" : "translateX(0)",
                            flexShrink: 0,
                          }} />
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
                          <span className="text-[11px] font-medium" style={{ color: sm.fg }}>{sm.label}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions — Edit | Analytics | More */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button type="button" title="Edit"
                          onClick={() => navigate(`/flows-v2/builder/${f.id}`)}
                          className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary hover:text-primary transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" title="Analytics"
                          onClick={() => navigate(`/flows-v2/builder/${f.id}/analytics`)}
                          className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary hover:text-primary transition-colors">
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" title="More" className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => navigate(`/flows-v2/builder/${f.id}`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => navigate(`/flows-v2/builder/${f.id}/analytics`)}>View Analytics</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.info("Duplicating…")}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.info("Rename…")}>Rename</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.info("Archived.")}>Archive</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600" onSelect={() => deleteMut?.mutate(f.id)}>Delete</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => toast.info("Opening test mode…")}>Test</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.info("Opening chat history…")}>View All Chat</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted px-1">
        <span>Showing {rows.length} of {(apiFlows?.length || 0) + sampleFlows.length} flows</span>
        <div className="flex items-center gap-1">
          {[10, 25, 50].map((n) => (
            <button key={n} type="button" className="px-2 py-0.5 rounded border border-border hover:bg-slate-50">{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page export ──────────────────────────────────────────────────────────
export default function FlowsV2Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: apiFlows = [] } = useQuery({
    queryKey: ["flows"],
    queryFn: fetchFlows,
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: deleteFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow deleted");
    },
  });

  return (
    <div
      className="space-y-5 animate-fade-in-up max-w-[1400px] mx-auto"
      data-testid="page-flows-v2"
    >
      {/* CHANGE 1 — Header with two CTAs */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Flows
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Automated workflows that guide customers through personalised interactions across their entire buyer lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            data-testid="flows-create-btn"
            onClick={() => navigate("/flows-v2/create")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-surface text-text-primary text-sm font-medium hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            Create Flow
          </button>
        </div>
      </header>

      <StatsRow />
      <FlowsTable sampleFlows={SAMPLE_FLOWS} apiFlows={apiFlows} deleteMut={deleteMut} />
    </div>
  );
}
