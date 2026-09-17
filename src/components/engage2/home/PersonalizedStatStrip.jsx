import React from "react";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/analyticsFormat";

export default function PersonalizedStatStrip() {
  const { visitorsPerDay, abandonmentRate, monthlyRevenueAtRisk } = computeRevenueOpportunity();

  const stats = [
    { value: formatCompactNumber(visitorsPerDay), label: "visitors/day" },
    { value: `${abandonmentRate}%`, label: "abandon before paying" },
    { value: formatCompactCurrency(monthlyRevenueAtRisk), label: "at risk / month" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" data-testid="personalized-stat-strip">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface border border-border rounded-lg p-5 text-center">
          <div className="text-2xl font-bold text-primary">{stat.value}</div>
          <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
