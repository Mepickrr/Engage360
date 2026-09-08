import React from "react";
import { JOURNEY_CHANNELS, AUDIENCE_TYPES, ECOMMERCE_STAGES, DATE_RANGES } from "./data/mockJourneyAnalytics";

function chipClass(active) {
  return `px-2.5 py-1 text-[11px] font-medium rounded-full border whitespace-nowrap transition-colors ${
    active ? "border-primary text-primary bg-primary-tint" : "border-border text-text-secondary hover:border-text-muted/60"
  }`;
}

function toggle(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function JourneyFilterBar({ dateRange, onDateRangeChange, channels, onChannelsChange, audiences, onAudiencesChange, stages, onStagesChange }) {
  return (
    <div data-testid="journey-filter-bar" className="sticky top-0 z-10 bg-surface border-b border-border py-2 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {DATE_RANGES.map((r) => (
          <button key={r.value} type="button" data-testid={`journey-date-${r.value}`} onClick={() => onDateRangeChange(r.value)} className={chipClass(dateRange === r.value)}>
            {r.label}
          </button>
        ))}
        <span className="w-px h-4 bg-border mx-1" />
        {JOURNEY_CHANNELS.map((c) => (
          <button key={c} type="button" data-testid={`journey-channel-${c.toLowerCase()}`} onClick={() => onChannelsChange(toggle(channels, c))} className={chipClass(channels.has(c))}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-muted">Audience:</span>
        {AUDIENCE_TYPES.map((a) => (
          <button key={a} type="button" data-testid={`journey-audience-${a.toLowerCase()}`} onClick={() => onAudiencesChange(toggle(audiences, a))} className={chipClass(audiences.has(a))}>
            {a}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-muted">Stage:</span>
        {ECOMMERCE_STAGES.map((s) => (
          <button key={s} type="button" data-testid={`journey-stage-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} onClick={() => onStagesChange(toggle(stages, s))} className={chipClass(stages.has(s))}>
            {s}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">This data reflects journeys active or triggered within the selected dates.</p>
    </div>
  );
}
