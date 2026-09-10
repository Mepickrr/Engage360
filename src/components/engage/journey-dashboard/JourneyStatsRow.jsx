import React from "react";

const CARDS = [
  { key: "active", label: "Active Journeys", hint: "Turn one on below to start recovering revenue" },
  { key: "revenue", label: "Revenue Attribution", hint: "Shows up once a journey is running" },
  { key: "deliverability", label: "Deliverability", hint: "Tracked from your first message send" },
  { key: "users", label: "Users Targeted", hint: "Counts anonymous + known visitors reached" },
  { key: "roi", label: "ROI", hint: "Compares message spend to recovered revenue" },
];

export default function JourneyStatsRow({ activeCount }) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-8" data-testid="journey-stats-row">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-surface border border-border rounded-lg p-5 text-center"
          data-testid={`journey-stat-${card.key}`}
        >
          <div className="text-2xl font-bold text-text-primary">
            {card.key === "active" ? `${activeCount} / 6` : "—"}
          </div>
          <div className="text-xs font-semibold text-text-secondary mt-1">{card.label}</div>
          <div className="text-[11px] text-text-muted mt-1">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}
