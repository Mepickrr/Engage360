import React from "react";
import MetricCard from "../../overview/MetricCard";
import AttributionPair from "../shared/AttributionPair";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import MetricTooltip from "../shared/MetricTooltip";
import { formatCompactNumber, formatCompactCurrency, formatPercent, formatDelta } from "@/lib/analyticsFormat";

export default function HeroBandSection({ data, compare, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-hero-skeleton" rows={4} />;

  const aheadOfBoth = data.benchmark.yourStore > data.benchmark.allFastrrStores && data.benchmark.yourStore > data.benchmark.categoryAvg;
  const pointsAhead = (data.benchmark.yourStore - data.benchmark.allFastrrStores).toFixed(1);

  return (
    <div data-testid="fastrr-hero-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Identification snapshot</h2>
        <PoweredByLabel source="Fastrr SDK" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard
          testId="fastrr-hero-total-sessions"
          label="Total Sessions"
          value={formatCompactNumber(data.totalSessions.value)}
          delta={compare ? formatDelta(data.totalSessions.deltaPct, data.totalSessions.deltaAbs, formatCompactNumber) : null}
        />
        <MetricCard
          testId="fastrr-hero-identified-sessions"
          label="Identified Sessions"
          value={formatCompactNumber(data.identifiedSessions.value)}
          delta={compare ? formatDelta(data.identifiedSessions.deltaPct, data.identifiedSessions.deltaAbs, formatCompactNumber) : null}
        />
        <MetricCard
          testId="fastrr-hero-identification-rate"
          label="Identification Rate"
          value={formatPercent(data.identificationRate.value)}
          delta={compare ? formatDelta(data.identificationRate.deltaPct, data.identificationRate.deltaAbs, (v) => formatPercent(v)) : null}
          labelExtra={
            <MetricTooltip
              name="Identification Rate"
              formula="Identified Sessions ÷ Total Sessions × 100"
              description="Share of total sessions that were successfully identified."
            />
          }
        />
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-hero-gmv">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">GMV Impacted</span>
          <div className="mt-2">
            <AttributionPair testId="fastrr-hero-gmv-pair" lastClick={data.gmv.lastClick} firstClick={data.gmv.firstClick} formatter={formatCompactCurrency} />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-primary/30 rounded-lg p-4" data-testid="fastrr-hero-benchmark">
        {aheadOfBoth && (
          <p className="text-[13px] font-medium text-primary mb-2" data-testid="fastrr-hero-benchmark-callout">
            You're identifying {pointsAhead} pts more traffic than the average Fastrr store.
          </p>
        )}
        <div className="flex items-center gap-6 text-[13px]">
          <span>Your Store: <strong className="tabular-nums">{formatPercent(data.benchmark.yourStore)}</strong></span>
          <span className="text-text-muted">|</span>
          <span>All Fastrr Stores: <strong className="tabular-nums">{formatPercent(data.benchmark.allFastrrStores)}</strong></span>
          <span className="text-text-muted">|</span>
          <span>Category Avg: <strong className="tabular-nums">{formatPercent(data.benchmark.categoryAvg)}</strong></span>
        </div>
      </div>

      <p className="text-[11px] text-text-muted">
        Updated every {data.freshness.intervalMinutes} min · Last refreshed {new Date(data.freshness.lastRefreshed).toLocaleString("en-IN")}
      </p>
    </div>
  );
}
