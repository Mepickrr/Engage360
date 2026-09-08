import React from "react";
import MetricCard from "../../overview/MetricCard";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent, formatDelta } from "@/lib/analyticsFormat";

export default function OverviewSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-overview-skeleton" rows={4} />;
  const ov = data.overview;

  return (
    <div data-testid="journey-overview-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Overview / Health</h2>
        <PoweredByLabel source="Flow builder event stream" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard testId="journey-overview-active" label="Active Journeys" value={formatCompactNumber(ov.activeJourneys.value)} delta={formatDelta(ov.activeJourneys.deltaPct, ov.activeJourneys.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-overview-paused" label="Paused Journeys" value={formatCompactNumber(ov.pausedJourneys.value)} />
        <MetricCard testId="journey-overview-draft" label="Draft Journeys" value={formatCompactNumber(ov.draftJourneys.value)} />
        <MetricCard testId="journey-overview-delivery-rate" label="Delivery Success Rate" value={formatPercent(ov.deliverySuccessRate)} />
        <MetricCard testId="journey-overview-revenue" label="Revenue" value={formatCompactCurrency(ov.revenue.value)} delta={formatDelta(ov.revenue.deltaPct, ov.revenue.deltaAbsolute, formatCompactCurrency)} />
        <MetricCard testId="journey-overview-orders" label="Orders" value={formatCompactNumber(ov.orders.value)} delta={formatDelta(ov.orders.deltaPct, ov.orders.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-overview-cost" label="Total Cost" value={formatCompactCurrency(ov.totalCost.value)} delta={formatDelta(ov.totalCost.deltaPct, ov.totalCost.deltaAbsolute, formatCompactCurrency)} />
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-overview-alerts">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Active alerts</h3>
        {ov.activeAlerts.length === 0 ? (
          <p className="text-[12px] text-text-muted">No active alerts.</p>
        ) : (
          <ul className="space-y-1">
            {ov.activeAlerts.map((a) => (
              <li key={a.journeyId + a.type} className="text-[12px] text-rose-700">{a.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
