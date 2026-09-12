import React from "react";

// Benchmarks below are directionally real, pending final marketing/legal
// sign-off before this page goes live externally.
const STATS = [
  { value: "20%+", label: "Abandoned cart recovery" },
  { value: "25%+", label: "Contribution to revenue" },
  { value: "20X+", label: "ROAS" },
  { value: "2B+", label: "Conversations delivered" },
];

export default function DarkStatBand() {
  return (
    <div
      className="bg-slate-900 rounded-lg py-16 px-6 mb-10"
      data-testid="fastrr-engage-stats-bar"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-primary mb-8">
        The Numbers Behind Fastrr Journey
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[800px] mx-auto">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-2">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
