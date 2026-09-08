import React from "react";
import MetricCard from "../../overview/MetricCard";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatDelta } from "@/lib/analyticsFormat";

export default function RetentionSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-retention-skeleton" rows={3} />;
  const r = data.retention;
  const firstJourney = data.journeys.find((j) => j.id === r.firstOrderJourney);
  const repeatJourney = data.journeys.find((j) => j.id === r.repeatOrderJourney);

  return (
    <div data-testid="journey-retention-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Retention &amp; repeat purchase</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard testId="journey-retention-leads" label="New Leads Collected" value={formatCompactNumber(r.newLeadsCollected.value)} delta={formatDelta(r.newLeadsCollected.deltaPct, r.newLeadsCollected.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-retention-repeat-orders" label="Repeat Orders" value={formatCompactNumber(r.repeatOrders.value)} delta={formatDelta(r.repeatOrders.deltaPct, r.repeatOrders.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-retention-repeat-revenue" label="Repeat Revenue" value={formatCompactCurrency(r.repeatRevenue.value)} delta={formatDelta(r.repeatRevenue.deltaPct, r.repeatRevenue.deltaAbsolute, formatCompactCurrency)} />
      </div>
      <p className="text-[11px] text-text-muted">
        First-order journey: <span className="font-medium text-text-secondary">{firstJourney?.name ?? "--"}</span> · Repeat-order journey: <span className="font-medium text-text-secondary">{repeatJourney?.name ?? "--"}</span>
      </p>
    </div>
  );
}
