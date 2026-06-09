import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Pencil } from "lucide-react";

const STATUS_CONFIG = {
  active:   { label: "Active",   bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500" },
  paused:   { label: "Paused",   bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-400"   },
  draft:    { label: "Draft",    bg: "bg-slate-100",   text: "text-slate-600",    dot: "bg-slate-400"   },
  inactive: { label: "Inactive", bg: "bg-slate-100",   text: "text-slate-500",    dot: "bg-slate-300"   },
};

const TIME_OPTIONS = [
  { value: "today",       label: "Today" },
  { value: "yesterday",   label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "this_month",  label: "This Month" },
  { value: "all_time",    label: "All Time" },
  { value: "custom",      label: "Custom range…" },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function AnalyticsTopbar({ flowId, flowName, status, timeRange, onTimeRangeChange, basePath = "/flows" }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedLabel = TIME_OPTIONS.find((o) => o.value === timeRange)?.label ?? "Last 7 days";

  return (
    <header className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-4 gap-3 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => navigate(basePath)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        <span className="text-[14px] font-semibold text-text-primary truncate max-w-[240px]">
          {flowName || "Flow Analytics"}
        </span>

        <StatusBadge status={status || "draft"} />

        <span className="text-[11px] text-text-muted font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
          Analytics Mode
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Time filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] font-medium text-text-primary hover:bg-slate-50 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            {selectedLabel}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onTimeRangeChange(opt.value); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-slate-50 transition-colors ${
                    opt.value === timeRange ? "text-primary font-medium" : "text-text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Edit Flow */}
        <button
          type="button"
          onClick={() => navigate(`${basePath}/builder/${flowId}`)}
          className="inline-flex items-center gap-1.5 px-4 h-8 rounded-md bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Flow
        </button>
      </div>
    </header>
  );
}
