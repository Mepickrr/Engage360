import React from "react";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent, formatDelta } from "@/lib/analyticsFormat";

function fmtDeltaBetween(row) {
  const isRevenue = row.metric === "Revenue";
  const fmt = isRevenue ? formatCompactCurrency : formatPercent;
  const sign = row.deltaBetweenSegments >= 0 ? "Known leads by" : "Identified leads by";
  return `${sign} ${fmt(Math.abs(row.deltaBetweenSegments))}`;
}

export default function AudienceSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-audience-skeleton" rows={4} />;

  return (
    <div data-testid="journey-audience-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Audience — Known vs. Identified</h2>
        <PoweredByLabel source="Fastrr identification pipeline" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.audience.map((seg) => (
          <div key={seg.type} className="bg-surface border border-border rounded-lg p-4" data-testid={`journey-audience-${seg.type.toLowerCase()}`}>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">{seg.type}</h3>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div><div className="text-text-muted">Reached</div><div className="font-semibold tabular-nums">{formatCompactNumber(seg.reached.value)}</div></div>
              <div><div className="text-text-muted">Journeys Entered</div><div className="font-semibold tabular-nums">{formatCompactNumber(seg.journeysEntered.value)}</div></div>
              <div><div className="text-text-muted">Revenue</div><div className="font-semibold tabular-nums">{formatCompactCurrency(seg.revenue.value)}</div></div>
              <div><div className="text-text-muted">Orders</div><div className="font-semibold tabular-nums">{formatCompactNumber(seg.orders.value)}</div></div>
              <div><div className="text-text-muted">Engagement Rate</div><div className="font-semibold tabular-nums">{formatPercent(seg.engagementRate)}</div></div>
              <div><div className="text-text-muted">Conversion Rate</div><div className="font-semibold tabular-nums">{formatPercent(seg.conversionRate)}</div></div>
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-[11px] text-text-muted">Revenue {formatDelta(seg.revenue.deltaPct, seg.revenue.deltaAbsolute, formatCompactCurrency).text} vs last period</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-audience-head-to-head">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Known vs. Identified — head to head</h3>
        <table className="w-full text-left text-[12px]">
          <thead className="text-text-muted uppercase text-[10px]">
            <tr><th className="py-1">Metric</th><th className="py-1">Known</th><th className="py-1">Identified</th><th className="py-1">Gap</th></tr>
          </thead>
          <tbody>
            {data.headToHead.map((row) => {
              const fmt = row.metric === "Revenue" ? formatCompactCurrency : formatPercent;
              return (
                <tr key={row.metric} className="border-t border-border" data-testid={`journey-head-to-head-${row.metric.toLowerCase().replace(/\s+/g, "-")}`}>
                  <td className="py-1.5">{row.metric}</td>
                  <td className="py-1.5 tabular-nums">{fmt(row.knownValue)}</td>
                  <td className="py-1.5 tabular-nums">{fmt(row.identifiedValue)}</td>
                  <td className="py-1.5 text-text-muted">{fmtDeltaBetween(row)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
