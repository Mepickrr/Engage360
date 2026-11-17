import React, { useMemo, useState } from "react";
import { Search, RefreshCw, ArrowRight, ChevronRight, Users, Clock } from "lucide-react";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import BroadcastDetailDrawer, { BroadcastStatusPill, WhatsAppPill } from "@/components/broadcasts/BroadcastDetailDrawer";
import { BROADCASTS } from "@/components/broadcasts/data";

const num = (n) => Number(n).toLocaleString("en-IN");
const pct = (a, b) => (b ? (a / b) * 100 : 0);
const short = (n) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
};
const spentOf = (b) => b.templates.reduce((s, t) => s + t.delivered * t.rate, 0);
const sum = (key) => BROADCASTS.reduce((s, b) => s + b[key], 0);

const KPIS = [
  { label: "Broadcasts sent", value: String(BROADCASTS.length), delta: "+2", testId: "broadcasts-kpi-count" },
  { label: "Messages delivered", value: num(sum("delivered")), delta: "+9%", testId: "broadcasts-kpi-delivered" },
  { label: "Avg read rate", value: `${pct(sum("read"), sum("delivered")).toFixed(1)}%`, delta: "+1.8pp", testId: "broadcasts-kpi-read" },
  { label: "Revenue attributed", value: `₹${(sum("revenue") / 1e5).toFixed(1)}L`, delta: "+14%", testId: "broadcasts-kpi-rev" },
];

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "changed", label: "Category changed", test: (b) => b.templates.length > 1 },
  { id: "retry", label: "Retry on", test: (b) => b.retryEnabled },
];

// "15 Nov 2026, 12:01 PM" -> { day: "15 Nov 2026", time: "12:01 PM" }
const splitWhen = (s) => {
  const [day, time] = s.split(", ");
  return { day, time };
};
const dayLabel = (day) => {
  const d = new Date(`${day} 00:00`);
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
};

const FUNNEL = [
  { key: "sent", label: "Sent", color: "#7C6CF0" },
  { key: "delivered", label: "Delivered", color: "#9F94F4", of: "sent" },
  { key: "read", label: "Read", color: "#BDB5F8", of: "delivered" },
  { key: "clicked", label: "Clicked", color: "#D3CDFA", of: "read" },
];

// Nested bars: each stage drawn as a share of Sent, so the drop-off reads left-to-right.
function FunnelStrip({ b }) {
  return (
    <div className="min-w-0">
      <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
        {FUNNEL.map((f) => (
          <div
            key={f.key}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.max(pct(b[f.key], b.sent), b[f.key] ? 1 : 0)}%`, background: f.color }}
          />
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {FUNNEL.map((f) => (
          <div key={f.key} className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
              {f.label}
            </div>
            <div className="text-[13px] font-semibold text-text-primary tabular-nums truncate">{short(b[f.key])}</div>
            <div className="text-[10px] text-text-muted tabular-nums">
              {f.of ? `${pct(b[f.key], b[f.of]).toFixed(1)}%` : " "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BroadcastCard({ b, selected, onOpen }) {
  const changed = b.templates.length > 1;
  const spent = spentOf(b);
  const roi = spent ? b.revenue / spent : 0;
  const { time } = splitWhen(b.startedAt);

  return (
    <button
      type="button"
      data-testid={`broadcasts-row-${b.id}`}
      onClick={onOpen}
      className={`group relative w-full text-left bg-surface border rounded-xl p-4 md:p-5 transition-all hover:shadow-md hover:border-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
        selected ? "border-violet-300 ring-2 ring-violet-100" : "border-border"
      }`}
    >
      {changed && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r bg-amber-400" aria-hidden />}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_auto] md:items-center">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BroadcastStatusPill status={b.status} />
            <WhatsAppPill />
            {changed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800">
                <RefreshCw className="w-3 h-3" />
                Utility <ArrowRight className="w-3 h-3" /> Marketing
              </span>
            )}
          </div>
          <div className="mt-2 font-semibold text-[14px] text-text-primary truncate">{b.name}</div>
          <div className="mt-0.5 text-[12px] text-text-muted truncate">
            #{b.id} · {b.templateName}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {time}
            </span>
            <span className="inline-flex items-center gap-1 truncate">
              <Users className="w-3 h-3 shrink-0" /> {b.segments.join(", ")}
            </span>
          </div>
        </div>

        {/* Delivery */}
        <FunnelStrip b={b} />

        {/* Return */}
        <div className="flex md:flex-col items-end md:items-end justify-between gap-1 md:pl-5 md:border-l border-border">
          <div className="text-left md:text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Revenue</div>
            <div className="text-[18px] font-semibold text-text-primary tabular-nums">₹{short(b.revenue)}</div>
          </div>
          <div className="text-right text-[11px] text-text-muted tabular-nums">
            {num(b.orders)} orders · ₹{short(spent)} spent
          </div>
          <span
            className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
              roi >= 1 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {roi.toFixed(2)}× ROI
          </span>
        </div>
      </div>

      <ChevronRight className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function BroadcastsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const selected = BROADCASTS.find((b) => b.id === selectedId);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter).test;
    const list = BROADCASTS.filter(
      (b) => test(b) && (!q || [b.name, b.id, b.templateName].some((v) => v.toLowerCase().includes(q))),
    );
    const byDay = new Map();
    list.forEach((b) => {
      const { day } = splitWhen(b.startedAt);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(b);
    });
    return [...byDay.entries()];
  }, [query, filter]);

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-broadcasts">
      <PreviewHeader
        title="Broadcasts"
        subtitle="One-time WhatsApp broadcasts. Open a broadcast to see its full report."
        testIdPrefix="broadcasts"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            data-testid="broadcasts-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID or template"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter broadcasts">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              data-testid={`broadcasts-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                filter === f.id
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-surface border-border text-text-secondary hover:border-violet-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6" data-testid="broadcasts-list">
        {groups.map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-text-secondary">
              {dayLabel(day)}
              <span className="text-text-muted font-normal">· {items.length}</span>
            </h2>
            <div className="space-y-3">
              {items.map((b) => (
                <BroadcastCard key={b.id} b={b} selected={selectedId === b.id} onOpen={() => setSelectedId(b.id)} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-text-muted">
            No broadcasts match your search.
          </div>
        )}
      </div>

      <BroadcastDetailDrawer
        broadcast={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}
