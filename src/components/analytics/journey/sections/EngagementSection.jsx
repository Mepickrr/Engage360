import React from "react";
import MetricCard from "../../overview/MetricCard";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent, formatDelta } from "@/lib/analyticsFormat";

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

const NODE_FIELDS = {
  "Template message": [["sent", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["optedOut", "Opted Out"]],
  "Interactive / button": [["sent", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["buttonClicked", "Button Clicked"]],
  "Catalog / product card": [["sent", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["productCardClicked", "Product Card Clicked"], ["addToCart", "Add to Cart"]],
  "AI recommendation": [["sent", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["productCardsSent", "Product Cards Sent"], ["linksClicked", "Links Clicked"], ["aiRevenue", "AI Revenue", true]],
  "Address message": [["sent", "Sent"], ["delivered", "Delivered"], ["read", "Read"], ["addressConfirmed", "Address Confirmed"]],
};

export default function EngagementSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-engagement-skeleton" rows={5} />;
  const ov = data.engagementOverview;

  return (
    <div data-testid="journey-engagement-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Engagement</h2>
        <PoweredByLabel source="WhatsApp delivery webhook" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="journey-engagement-overview">
        <MetricCard testId="journey-engagement-reached" label="Customers Reached" value={formatCompactNumber(ov.totalCustomersReached.value)} delta={formatDelta(ov.totalCustomersReached.deltaPct, ov.totalCustomersReached.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-engagement-sent" label="Messages Sent" value={formatCompactNumber(ov.messagesSent.value)} delta={formatDelta(ov.messagesSent.deltaPct, ov.messagesSent.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-engagement-delivered" label="Delivered" value={formatCompactNumber(ov.delivered)} subBadge={formatPercent(ov.deliveryRate)} />
        <MetricCard testId="journey-engagement-read-rate" label="Read Rate" value={formatPercent(ov.readRate)} />
        <MetricCard testId="journey-engagement-click-rate" label="Click Rate" value={formatPercent(ov.clickRate)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(data.engagementByNodeType).map(([node, stats]) => (
          <div key={node} className="bg-surface border border-border rounded-lg p-4" data-testid={`journey-node-${node.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">{node}</h3>
            {NODE_FIELDS[node].map(([key, label, isCurrency]) => (
              <StatRow key={key} label={label} value={isCurrency ? formatCompactCurrency(stats[key]) : formatCompactNumber(stats[key])} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
