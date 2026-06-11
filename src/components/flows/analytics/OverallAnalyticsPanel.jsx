import React, { useState } from "react";
import {
  MoreHorizontal, Download, MessageSquare, Users,
  Activity, GitFork,
} from "lucide-react";

function fmt(n) {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(2)}M`;
  if (n >= 1_000)     return n.toLocaleString("en-IN");
  return String(n);
}

function fmtINR(n) {
  if (!n) return "₹0";
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function MetricCard({ label, value, sub, highlight }) {
  return (
    <div className={`flex flex-col justify-center gap-1 px-5 py-4 border-r border-border last:border-r-0 min-w-[130px] flex-1 ${highlight ? "bg-violet-50/50" : ""}`}>
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold whitespace-nowrap">{label}</span>
      <span className={`text-[20px] font-bold tabular-nums leading-none ${highlight ? "text-primary" : "text-text-primary"}`}>{value}</span>
      {sub && <span className="text-[10px] text-text-muted leading-snug">{sub}</span>}
    </div>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg z-50 py-1"
          onMouseLeave={() => setOpen(false)}
        >
          {[
            { icon: Download,     label: "Download Report" },
            { icon: MessageSquare,label: "User Response Report" },
            { icon: Users,        label: "View All Conversations" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-primary hover:bg-slate-50"
            >
              <Icon className="w-3.5 h-3.5 text-text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OverallAnalyticsPanel({ overall = {}, viewMode, onViewModeChange }) {
  const {
    triggered        = 0,
    unique_customers = 0,
    messages_sent    = 0,
    messages_delivered = 0,
    messages_opened  = 0,
    revenue_inr      = 0,
  } = overall;

  const deliveredPct = messages_sent ? ((messages_delivered / messages_sent) * 100).toFixed(1) : "0.0";
  const openedPct    = messages_delivered ? ((messages_opened / messages_delivered) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-surface border-b border-border flex-shrink-0">
      {/* Metric cards row */}
      <div className="flex items-stretch divide-x divide-border overflow-x-auto min-h-[80px]">
        <MetricCard label="Triggered"           value={fmt(triggered)}          sub="users entered"           />
        <MetricCard label="Unique Customers"    value={fmt(unique_customers)}   sub="deduplicated"            />
        <MetricCard label="Messages Sent"       value={fmt(messages_sent)}      sub="across all channels"     />
        <MetricCard label="Messages Delivered"  value={fmt(messages_delivered)} sub={`${deliveredPct}% delivery rate`} />
        <MetricCard label="Messages Opened"     value={fmt(messages_opened)}    sub={`${openedPct}% open rate`} highlight />
        <MetricCard label="Order Revenue"       value={fmtINR(revenue_inr)}     sub="attributed"              highlight />
      </div>

      {/* View toggle + more */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {[
            { id: "activity", icon: Activity,  label: "Activity View" },
            { id: "funnel",   icon: GitFork,   label: "Funnel View"   },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewModeChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                viewMode === id
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <MoreMenu />
      </div>
    </div>
  );
}
