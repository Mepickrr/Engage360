import React from "react";
import { FASTRR_CHANNELS, FASTRR_DATE_PRESETS } from "./data/mockFastrrIdentification";

// The generator only exports preset values, not display labels — keep the
// label lookup local and build DATE_PRESETS by mapping the imported values
// through it, so the value list itself can never drift from the generator's.
const DATE_PRESET_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  this_month: "This Month",
  last_month: "Last Month",
};
const DATE_PRESETS = FASTRR_DATE_PRESETS.map((value) => ({ value, label: DATE_PRESET_LABELS[value] }));
const CHANNELS = FASTRR_CHANNELS;

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
