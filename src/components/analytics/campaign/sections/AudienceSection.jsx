import React from "react";
import AttributionPair from "../../fastrr/shared/AttributionPair";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent } from "@/lib/analyticsFormat";

export default function AudienceSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-audience-skeleton" rows={3} />;

  return (
    <div data-testid="campaign-audience-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Audience &amp; identification</h2>
        <PoweredByLabel source="Fastrr identification pipeline" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.audience.map((seg) => (
          <div key={seg.source} className="bg-surface border border-border rounded-lg p-4" data-testid={`campaign-audience-${seg.source.toLowerCase().replace(/\s+/g, "-")}`}>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">{seg.source}</h3>
            <div className="text-[11px] text-text-muted">Reached</div>
            <div className="text-lg font-semibold tabular-nums">{formatCompactNumber(seg.reached)}</div>
            <div className="mt-2 text-[11px] text-text-muted">Engagement Rate</div>
            <div className="text-lg font-semibold tabular-nums">{formatPercent(seg.engagementRate)}</div>
            <div className="mt-3 pt-2 border-t border-border text-[11px] text-text-muted space-y-0.5">
              <div>Orders: {formatCompactNumber(seg.orders)}</div>
              <div>Revenue: {formatCompactCurrency(seg.revenue)}</div>
            </div>
            <div className="mt-2">
              <AttributionPair
                testId={`campaign-audience-${seg.source.toLowerCase().replace(/\s+/g, "-")}-attribution`}
                lastClick={seg.lastClickRevenue}
                firstClick={seg.firstClickOpenRevenue}
                formatter={formatCompactCurrency}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" disabled data-testid="campaign-view-full-identification" className="text-[12px] text-text-muted cursor-not-allowed">
        View full Identification Analytics →
      </button>
    </div>
  );
}
