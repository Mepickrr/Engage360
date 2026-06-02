import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFlows, updateFlow } from "@/lib/flowsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Calendar,
  Download,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Eye,
  Copy,
  Tag,
  Archive,
  Trash2,
  PlayCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtINR = (v) => {
  if (v == null || v === 0) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(v)}`;
};
const fmtNum = (v) =>
  v == null ? "—" : new Intl.NumberFormat("en-IN").format(v);
const fmtDateTime = (iso) => {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
};
const pct = (num, den) => {
  if (!den || !num) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, testId }) {
  return (
    <div
      className="bg-surface border border-border rounded-lg px-4 py-3.5 flex-1 min-w-0"
      data-testid={testId}
    >
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-text-primary tabular-nums">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px]">{trend}</div>
    </div>
  );
}

function TrendUp({ value }) {
  return (
    <>
      <ArrowUp className="w-3 h-3 text-emerald-600" />
      <span className="text-emerald-600 font-medium">{value}</span>
    </>
  );
}
function TrendDown({ value }) {
  return (
    <>
      <ArrowDown className="w-3 h-3 text-rose-600" />
      <span className="text-rose-600 font-medium">{value}</span>
    </>
  );
}
function LivePulse() {
  return (
    <>
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-emerald-600 font-medium">live</span>
    </>
  );
}

function GrowthCard({ badgeTone, badgeLabel, title, line1, line2Tinted, cta, testId }) {
  const tones = {
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
  };
  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3"
      data-testid={testId}
    >
      <span
        className={`inline-flex items-center self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${tones[badgeTone]}`}
      >
        {badgeLabel}
      </span>
      <div className="text-sm font-semibold text-text-primary leading-snug">
        {title}
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">
        {line1}
        {line1 ? " · " : null}
        <span className="text-primary font-medium">{line2Tinted}</span>
      </div>
      <button
        type="button"
        onClick={() => toast("Coming soon")}
        className="mt-auto w-full py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        data-testid={`${testId}-cta`}
      >
        {cta}
      </button>
    </div>
  );
}

function HealthIcon({ health }) {
  if (health === "warning") {
    return (
      <AlertTriangle
        className="w-4 h-4 text-amber-500 shrink-0"
        aria-label="Needs attention"
      />
    );
  }
  return (
    <CheckCircle2
      className="w-4 h-4 text-emerald-500 shrink-0"
      aria-label="Healthy"
    />
  );
}

function StatusToggle({ flow, onToggle }) {
  const [open, setOpen] = useState(false);
  const isActive = flow.status === "active";
  const willActivate = !isActive;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          data-testid={`flows-status-toggle-${flow.id}`}
          aria-label={isActive ? "Pause flow" : "Activate flow"}
          className="inline-flex cursor-pointer"
        >
          <Switch
            checked={isActive}
            // Visual only — actual flip happens in confirm. Switch is in a
            // <span role="button"> so the popover-trigger click is what
            // opens the confirmation; we intercept the toggle here.
            onCheckedChange={() => setOpen(true)}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="text-sm font-semibold text-text-primary">
          {willActivate ? "Activate this flow?" : "Pause this flow?"}
        </div>
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
          {willActivate
            ? "Users matching this flow's trigger will begin entering immediately."
            : "Users currently in this flow will continue, but no new users will enter."}
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:bg-slate-100"
            data-testid={`flows-status-cancel-${flow.id}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onToggle(flow, willActivate);
              setOpen(false);
            }}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary-hover"
            data-testid={`flows-status-confirm-${flow.id}`}
          >
            {willActivate ? "Activate" : "Pause"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function FlowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [percentageView, setPercentageView] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["flows"],
    queryFn: fetchFlows,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    return flows.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (audienceFilter !== "all" && f.audience_type !== audienceFilter) {
        return false;
      }
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [flows, search, statusFilter, audienceFilter]);

  // Optimistic status toggle
  const statusMut = useMutation({
    mutationFn: ({ id, status }) => updateFlow(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["flows"] });
      const prev = queryClient.getQueryData(["flows"]);
      queryClient.setQueryData(["flows"], (old = []) =>
        old.map((f) => (f.id === id ? { ...f, status } : f)),
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["flows"], ctx.prev);
      toast.error("Couldn't update status. Try again.");
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "active" ? "Flow activated" : "Flow paused",
      );
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
  });

  const handleStatusToggle = (flow, willActivate) => {
    statusMut.mutate({
      id: flow.id,
      status: willActivate ? "active" : "paused",
    });
  };

  const comingSoon = () => toast("Coming soon");

  // Status options for the dropdown — "Inactive" / "Archived" don't yet exist
  // in the backend status enum, so we treat them as visual filters mapped to
  // "paused" / "draft". Keeping labels exactly as the PRD spec.
  return (
    <div
      className="space-y-6 max-w-[1400px] mx-auto"
      data-testid="page-flows"
    >
      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Flows
          </h1>
          <p className="text-[13px] text-text-secondary mt-1 max-w-2xl">
            Automated workflows that guide customers through personalised
            interactions across their entire buyer lifecycle.
          </p>
        </div>
        <button
          type="button"
          data-testid="flows-create-cta"
          onClick={() => navigate("/flows/create")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow transition-all"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
          }}
        >
          <Plus className="w-4 h-4" />
          Create Flows
        </button>
      </header>

      {/* ── 2. AI Insights banner ────────────────────────────────────── */}
      {bannerOpen && (
        <div
          className="relative bg-surface border border-border rounded-lg pl-4 pr-4 py-3 flex items-center gap-4 overflow-hidden"
          data-testid="flows-ai-banner"
        >
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide">
              <span className="text-text-primary uppercase">AI Insights</span>
              <span className="text-text-muted">·</span>
              <button
                type="button"
                onClick={comingSoon}
                className="text-primary hover:text-primary-hover"
                data-testid="flows-ai-banner-view-all"
              >
                View All Insights (7) →
              </button>
            </div>
            <div className="text-[15px] font-medium text-text-primary mt-0.5">
              Cart Recovery flows dropped 18% this week.
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              Revenue at risk:{" "}
              <span className="font-medium">₹84,200</span> · Last triggered: 2h
              ago
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast("Opening AI panel...")}
            className="px-3 py-1.5 rounded-md border border-primary text-text-primary text-sm font-medium hover:bg-primary-tint transition-colors"
            data-testid="flows-ai-banner-fix"
          >
            Fix Now
          </button>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Dismiss"
            data-testid="flows-ai-banner-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 3. Stats strip ───────────────────────────────────────────── */}
      <div>
        <div
          className="flex flex-wrap gap-3"
          data-testid="flows-stats-strip"
        >
          <StatCard
            label="Active Flows"
            value="71"
            trend={<TrendUp value="12.0%" />}
            testId="flows-stat-active"
          />
          <StatCard
            label="Revenue Attributed"
            value="₹48.1L"
            trend={<TrendUp value="8.0%" />}
            testId="flows-stat-revenue"
          />
          <StatCard
            label="Deliverability"
            value="78%"
            trend={<TrendDown value="3.0%" />}
            testId="flows-stat-deliverability"
          />
          <StatCard
            label="Users in Flows"
            value="1,284"
            trend={<LivePulse />}
            testId="flows-stat-users"
          />
          <StatCard
            label="AI Sessions"
            value="21.15K"
            trend={<TrendUp value="5.0%" />}
            testId="flows-stat-ai-sessions"
          />
          <StatCard
            label="Conv. Rate"
            value="3.2%"
            trend={<TrendDown value="0.4%" />}
            testId="flows-stat-conv"
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-5 text-xs">
          <button
            type="button"
            onClick={comingSoon}
            className="text-primary font-medium hover:text-primary-hover"
            data-testid="flows-view-analytics"
          >
            View Full Analytics →
          </button>
          <button
            type="button"
            onClick={comingSoon}
            className="text-primary font-medium hover:text-primary-hover"
            data-testid="flows-browse-opportunities"
          >
            Browse All Opportunities →
          </button>
        </div>
      </div>

      {/* ── 4. Growth Engine ─────────────────────────────────────────── */}
      <section data-testid="flows-growth-engine">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary-tint">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </span>
          <h2 className="text-[16px] font-semibold text-text-primary">
            Growth Engine
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GrowthCard
            badgeTone="green"
            badgeLabel="Start"
            title="Cart Recovery Flow — WhatsApp + Email"
            line1="312 installs"
            line2Tinted="+18% recovery rate"
            cta="Explore"
            testId="flows-growth-1"
          />
          <GrowthCard
            badgeTone="orange"
            badgeLabel="Improve"
            title="Add SMS fallback to Welcome Flows"
            line1="+12% recovery estimated"
            line2Tinted="Higher conversion rates"
            cta="Apply"
            testId="flows-growth-2"
          />
          <GrowthCard
            badgeTone="blue"
            badgeLabel="Scale"
            title="AI Calling for COD Confirmation"
            line1="-23% RTO expected"
            line2Tinted="Reduced logistics costs"
            cta="Explore"
            testId="flows-growth-3"
          />
        </div>
      </section>

      {/* ── 5. Filter / Controls bar ─────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-2.5"
        data-testid="flows-filter-bar"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            data-testid="flows-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by flows name"
            className="pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface w-[240px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-[140px] h-9 text-sm bg-surface"
            data-testid="flows-status-filter"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger
            className="w-[170px] h-9 text-sm bg-surface"
            data-testid="flows-audience-filter"
          >
            <SelectValue placeholder="Audience Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audiences</SelectItem>
            <SelectItem value="identified">E360 Identified</SelectItem>
            <SelectItem value="known">Known Users</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={comingSoon}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary hover:bg-slate-50"
          data-testid="flows-date-filter"
        >
          <Calendar className="w-4 h-4 text-text-secondary" />
          Last 30 Days
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            className="text-text-muted"
          >
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Percentage View</span>
            <Switch
              checked={percentageView}
              onCheckedChange={setPercentageView}
              data-testid="flows-percentage-toggle"
            />
          </label>
          <button
            type="button"
            onClick={() => toast("CSV export coming soon")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary hover:bg-slate-50"
            data-testid="flows-export-csv"
          >
            <Download className="w-4 h-4 text-text-secondary" />
            Export as CSV
          </button>
        </div>
      </div>

      {/* ── 6. Table ─────────────────────────────────────────────────── */}
      <div
        className="bg-surface border border-border rounded-lg overflow-hidden"
        data-testid="flows-table"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Flows Name</th>
                <th className="px-4 py-2.5 font-semibold whitespace-nowrap">
                  Created At
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">Sent</th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Delivered
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">Opened</th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Clicked
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">Orders</th>
                <th className="px-4 py-2.5 font-semibold text-right">
                  Revenue
                </th>
                <th className="px-4 py-2.5 font-semibold text-right">Spent</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center text-text-muted"
                  >
                    Loading flows…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center"
                    data-testid="flows-empty-state"
                  >
                    <div className="text-sm font-medium text-text-primary">
                      No flows match your filters
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const created = fmtDateTime(f.created_at);
                  const audienceLabel =
                    f.audience_type === "identified"
                      ? "Identified User"
                      : "Known User";
                  const sentRaw = f.sent ?? 0;
                  return (
                    <tr
                      key={f.id}
                      data-testid={`flows-table-row-${f.id}`}
                      className="border-t border-border hover:bg-app-bg/60 transition-colors"
                    >
                      {/* Flows Name */}
                      <td className="px-4 py-3 min-w-[240px]">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            <HealthIcon health={f.health} />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/flows/builder/${f.id}`}
                              data-testid={`flows-row-name-${f.id}`}
                              className="font-semibold text-text-primary hover:text-primary block leading-tight"
                            >
                              {f.name}
                            </Link>
                            <div className="text-[11px] text-text-muted mt-0.5">
                              {audienceLabel}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Created At */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[13px] text-text-primary">
                          {created.date}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {created.time}
                        </div>
                      </td>
                      {/* Sent */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {percentageView
                          ? sentRaw
                            ? "100%"
                            : "—"
                          : fmtNum(f.sent)}
                      </td>
                      {/* Delivered */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {percentageView
                          ? pct(f.delivered, sentRaw)
                          : fmtNum(f.delivered)}
                      </td>
                      {/* Opened */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {percentageView
                          ? pct(f.opened, sentRaw)
                          : fmtNum(f.opened)}
                      </td>
                      {/* Clicked */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {percentageView
                          ? pct(f.clicked, sentRaw)
                          : fmtNum(f.clicked)}
                      </td>
                      {/* Orders */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {f.orders ? fmtNum(f.orders) : "—"}
                      </td>
                      {/* Revenue */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {fmtINR(f.revenue_inr)}
                      </td>
                      {/* Spent */}
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {fmtINR(f.spent_inr)}
                      </td>
                      {/* Status toggle */}
                      <td className="px-4 py-3">
                        <StatusToggle
                          flow={f}
                          onToggle={handleStatusToggle}
                        />
                      </td>
                      {/* Actions kebab */}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              data-testid={`flows-row-actions-${f.id}`}
                              className="p-1 text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-md transition-colors"
                              aria-label="Row actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/flows/builder/${f.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setDeleteTarget(f);
                              }}
                              className="flex items-center gap-2 text-rose-600 focus:text-rose-700"
                              data-testid={`flows-row-delete-${f.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              Test
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={comingSoon}
                              className="flex items-center gap-2"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              View All Chat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer (static visual) */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-slate-50/60 text-[12px] text-text-secondary"
          data-testid="flows-pagination"
        >
          <div>
            Showing 1–{filtered.length} of {flows.length}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <span>Rows</span>
              <select
                defaultValue="10"
                onChange={comingSoon}
                className="border border-border rounded px-1.5 py-0.5 bg-surface focus:outline-none"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={comingSoon}
                className="px-2 py-1 rounded hover:bg-slate-200 text-text-secondary"
              >
                ‹
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded bg-primary text-white font-medium"
              >
                1
              </button>
              <button
                type="button"
                onClick={comingSoon}
                className="px-2 py-1 rounded hover:bg-slate-200 text-text-secondary"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-testid="flows-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this flow?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed. Users currently in this flow will be exited. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="flows-delete-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast("Coming soon");
                setDeleteTarget(null);
              }}
              className="bg-rose-600 hover:bg-rose-700"
              data-testid="flows-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
