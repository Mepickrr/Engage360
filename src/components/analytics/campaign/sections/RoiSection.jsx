import React from "react";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactCurrency } from "@/lib/analyticsFormat";

function fmtRoi(roi) {
  return roi == null ? "--" : `${roi.toFixed(2)}X`;
}

export default function RoiSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-roi-skeleton" rows={3} />;

  return (
    <div data-testid="campaign-roi-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Return on Investment</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-roi-overall">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Overall ROI</div>
            <div className="text-2xl font-semibold text-text-primary tabular-nums">{fmtRoi(data.roi.roi)}</div>
          </div>
          <div className="text-right text-[11px] text-text-muted leading-5">
            <div>Total Revenue Generated: {formatCompactCurrency(data.roi.totalRevenue)}</div>
            <div>Total Cost: {formatCompactCurrency(data.roi.totalCost)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2" data-testid="campaign-roi-by-channel">
        {data.roi.byChannel.map((c) => (
          <div key={c.channel} className="bg-slate-50 rounded-md p-2 text-center" data-testid={`campaign-roi-channel-${c.channel.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="text-[10px] text-text-muted font-medium">{c.channel}</div>
            <div className="text-[13px] font-semibold tabular-nums">{fmtRoi(c.roi)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
