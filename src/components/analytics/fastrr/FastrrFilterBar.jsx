import React from "react";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];
const CHANNELS = ["All", "WhatsApp", "Email", "SMS", "RCS", "AI Calling"];

function chipClass(active) {
  return `px-2.5 py-1 text-[11px] font-medium rounded-full border whitespace-nowrap transition-colors ${
    active ? "border-primary text-primary bg-primary-tint" : "border-border text-text-secondary hover:border-text-muted/60"
  }`;
}

export default function FastrrFilterBar({ datePreset, onDatePresetChange, compare, onCompareChange, channel, onChannelChange }) {
  return (
    <div data-testid="fastrr-filter-bar" className="sticky top-0 z-10 bg-surface border-b border-border py-2 flex items-center gap-2 flex-wrap">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          data-testid={`fastrr-date-${p.value}`}
          onClick={() => onDatePresetChange(p.value)}
          className={chipClass(datePreset === p.value)}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        data-testid="fastrr-compare-toggle"
        aria-pressed={compare}
        onClick={() => onCompareChange(!compare)}
        className={chipClass(compare)}
      >
        Compare to previous period
      </button>
      <span className="w-px h-4 bg-border mx-1" />
      {CHANNELS.map((c) => (
        <button
          key={c}
          type="button"
          data-testid={`fastrr-channel-${c.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => onChannelChange(c)}
          className={chipClass(channel === c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
