import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, MoreHorizontal, Eye, Download, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import BroadcastDetailDrawer, { BroadcastStatusPill, WhatsAppPill } from "@/components/broadcasts/BroadcastDetailDrawer";
import { BROADCASTS, CATEGORY_META, estimatedSpendOf } from "@/components/broadcasts/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const num = (n) => Number(n).toLocaleString("en-IN");
const pct = (a, b) => (b ? (a / b) * 100 : 0);
const rupees = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rupeesShort = (n) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
const spentOfTemplate = (t) => t.delivered * t.rate;
const spentOf = (b) => b.templates.reduce((s, t) => s + spentOfTemplate(t), 0);
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

// Count with a muted "% of previous stage" underneath.
function StageCell({ value, of, testId }) {
  return (
    <td className="px-3 py-3 text-right" data-testid={testId}>
      <div className="text-[13px] font-medium text-text-primary tabular-nums">{num(value)}</div>
      {of !== undefined && <div className="text-[11px] text-text-muted tabular-nums">{pct(value, of).toFixed(1)}%</div>}
    </td>
  );
}

// Spent, plus an ⓘ for broadcasts whose template changed category; hovering/focusing it
// shows the Utility vs Marketing split. A muted pre-send estimate sits underneath.
function SpentCell({ b }) {
  const spent = spentOf(b);
  const changed = b.templates.length > 1;
  return (
    <td className="px-3 py-3 text-right" data-testid={`broadcasts-spent-${b.id}`}>
      <div className="inline-flex items-center justify-end gap-1.5 text-[13px] font-medium text-text-primary tabular-nums">
        {rupees(spent)}
        {changed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-testid={`broadcasts-spent-info-${b.id}`}
                aria-label="Spent split by template category"
                onClick={(e) => e.stopPropagation()}
                className="text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-full"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className="w-64 p-0 bg-white text-slate-900 border border-slate-200 shadow-lg"
            >
              <div data-testid={`broadcasts-spent-split-${b.id}`}>
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-medium text-amber-800 bg-amber-50 rounded-t-md">
                  Category changed during send
                </div>
                <div className="px-3 py-2 space-y-2">
                  {b.templates.map((t) => {
                    const c = CATEGORY_META[t.category];
                    const s = spentOfTemplate(t);
                    return (
                      <div key={t.category}>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${c.bg} ${c.fg}`}>{c.label}</span>
                          <span className="tabular-nums">
                            <span className="font-semibold">{rupees(s)}</span>
                            <span className="ml-1.5 text-[11px] text-slate-400" data-testid={`broadcasts-spent-share-${b.id}-${t.category}`}>
                              {pct(s, spent).toFixed(1)}%
                            </span>
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                          {num(t.delivered)} delivered × ₹{t.rate.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold tabular-nums">{rupees(spent)}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="text-[11px] text-text-muted tabular-nums" data-testid={`broadcasts-est-spent-${b.id}`}>
        Est. {rupees(estimatedSpendOf(b))}
      </div>
    </td>
  );
}

function ActionsCell({ b, onView }) {
  return (
    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid={`broadcasts-actions-${b.id}`}
            aria-label={`Actions for ${b.name}`}
            className="p-1.5 rounded-md text-text-muted hover:bg-slate-100 hover:text-text-primary"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4 mr-2" /> View report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.success(`Downloading report for ${b.name}`)}>
            <Download className="w-4 h-4 mr-2" /> Download report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.success(`Duplicated ${b.name}`)}>
            <Copy className="w-4 h-4 mr-2" /> Duplicate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}

const COLUMNS = [
  { label: "Broadcast", align: "left" },
  { label: "Channel", align: "left" },
  { label: "Status", align: "left" },
  { label: "Sent" },
  { label: "Delivered" },
  { label: "Read" },
  { label: "Clicked" },
  { label: "Orders" },
  { label: "Revenue" },
  { label: "Spent" },
  { label: "ROI" },
  { label: "Actions" },
];

export default function BroadcastsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const selected = BROADCASTS.find((b) => b.id === selectedId);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter).test;
    return BROADCASTS.filter(
      (b) => test(b) && (!q || [b.name, b.id, b.templateName].some((v) => v.toLowerCase().includes(q))),
    );
  }, [query, filter]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="max-w-[1400px] mx-auto" data-testid="page-broadcasts">
        <PreviewHeader
          title="Broadcasts"
          subtitle="One-time WhatsApp broadcasts. Click a broadcast to see its full report."
          testIdPrefix="broadcasts"
          actions={
            <button
              type="button"
              data-testid="broadcasts-new-btn"
              onClick={() => navigate("/fastrr/broadcasts/builder/new")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create broadcast
            </button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {KPIS.map((k) => (
            <KpiTile key={k.testId} {...k} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
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

        <div className="bg-surface border border-border rounded-lg overflow-x-auto" data-testid="broadcasts-table">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    className={`px-3 py-2.5 font-medium whitespace-nowrap ${c.align === "left" ? "text-left" : "text-right"} ${
                      c.label === "Broadcast" ? "pl-4" : ""
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const spent = spentOf(b);
                const roi = spent ? b.revenue / spent : 0;
                return (
                  <tr
                    key={b.id}
                    data-testid={`broadcasts-row-${b.id}`}
                    onClick={() => setSelectedId(b.id)}
                    className={`border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer align-top ${
                      selectedId === b.id ? "bg-violet-50/50" : ""
                    }`}
                  >
                    <td className="pl-4 pr-3 py-3 max-w-[260px]">
                      <div className="font-semibold text-text-primary text-[13px] truncate">{b.name}</div>
                      <div className="text-[11px] text-text-muted truncate">
                        #{b.id} · {b.templateName}
                      </div>
                      <div className="text-[11px] text-text-muted">{b.startedAt}</div>
                    </td>
                    <td className="px-3 py-3"><WhatsAppPill /></td>
                    <td className="px-3 py-3"><BroadcastStatusPill status={b.status} /></td>
                    <StageCell value={b.sent} />
                    <StageCell value={b.delivered} of={b.sent} />
                    <StageCell value={b.read} of={b.delivered} />
                    <StageCell value={b.clicked} of={b.read} />
                    <td className="px-3 py-3 text-right text-[13px] font-medium tabular-nums">{num(b.orders)}</td>
                    <td className="px-3 py-3 text-right text-[13px] font-medium tabular-nums">{rupeesShort(b.revenue)}</td>
                    <SpentCell b={b} />
                    <td className="px-3 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[12px] font-semibold tabular-nums ${
                          roi >= 1 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {roi.toFixed(2)}
                      </span>
                    </td>
                    <ActionsCell b={b} onView={() => setSelectedId(b.id)} />
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-sm text-text-muted">
                    No broadcasts match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <BroadcastDetailDrawer
          broadcast={selected}
          open={!!selected}
          onOpenChange={(o) => !o && setSelectedId(null)}
        />
      </div>
    </TooltipProvider>
  );
}
