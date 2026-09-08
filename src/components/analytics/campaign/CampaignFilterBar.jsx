import React from "react";
import { CAMPAIGN_CHANNELS, AUDIENCE_SOURCES, DATE_RANGES } from "./data/mockCampaignAnalytics";

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

export default function CampaignFilterBar({ dateRange, onDateRangeChange, channels, onChannelsChange, audienceSources, onAudienceSourcesChange }) {
  return (
    <div data-testid="campaign-filter-bar" className="sticky top-0 z-10 bg-surface border-b border-border py-2 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            data-testid={`campaign-date-${r.value}`}
            onClick={() => onDateRangeChange(r.value)}
            className={chipClass(dateRange === r.value)}
          >
            {r.label}
          </button>
        ))}
        <span className="w-px h-4 bg-border mx-1" />
        {CAMPAIGN_CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            data-testid={`campaign-channel-${c.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => onChannelsChange(toggle(channels, c))}
            className={chipClass(channels.has(c))}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-text-muted">Audience:</span>
        {AUDIENCE_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            data-testid={`campaign-audience-${s.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => onAudienceSourcesChange(toggle(audienceSources, s))}
            className={chipClass(audienceSources.has(s))}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">This data is only for campaigns that were sent within the selected dates.</p>
    </div>
  );
}
