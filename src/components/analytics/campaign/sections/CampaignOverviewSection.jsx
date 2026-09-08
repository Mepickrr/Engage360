import React from "react";
import MetricCard from "../../overview/MetricCard";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatDelta } from "@/lib/analyticsFormat";
import { CAMPAIGN_CHANNELS } from "../data/mockCampaignAnalytics";

export default function CampaignOverviewSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-overview-skeleton" rows={4} />;

  const cards = [
    { key: "totalCampaigns", label: "Total Campaigns", fmt: formatCompactNumber },
    { key: "revenue", label: "Revenue", fmt: formatCompactCurrency },
    { key: "orders", label: "Orders", fmt: formatCompactNumber },
    { key: "totalCost", label: "Total Cost", fmt: formatCompactCurrency },
    { key: "productViews", label: "Product Views", fmt: formatCompactNumber },
    { key: "addToCarts", label: "Add to Carts", fmt: formatCompactNumber },
  ];

  return (
    <div data-testid="campaign-overview-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Overview</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const d = data.overview[c.key];
          return (
            <MetricCard
              key={c.key}
              testId={`campaign-overview-${c.key}`}
              label={c.label}
              value={c.fmt(d.value)}
              delta={formatDelta(d.deltaPct, d.deltaAbsolute, c.fmt)}
            />
          );
        })}
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-overview-cost-by-channel">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Cost by channel</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {CAMPAIGN_CHANNELS.map((ch) => (
            <div key={ch} className="bg-slate-50 rounded-md p-2 text-center">
              <div className="text-[10px] text-text-muted font-medium">{ch}</div>
              <div className="text-[12px] font-semibold tabular-nums">{formatCompactCurrency(data.overview.costByChannel[ch])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
