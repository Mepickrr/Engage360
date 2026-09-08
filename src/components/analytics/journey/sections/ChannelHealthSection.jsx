import React from "react";
import MetricCard from "../../overview/MetricCard";
import GroupedBarChart from "../../fastrr/shared/GroupedBarChart";
import MetricTooltip from "../../fastrr/shared/MetricTooltip";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatPercent, formatDelta } from "@/lib/analyticsFormat";

export default function ChannelHealthSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-channel-health-skeleton" rows={4} />;
  const ov = data.channelHealthOverview;
  const detail = data.channelHealthDetail;

  return (
    <div data-testid="journey-channel-health-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Channel health &amp; quality</h2>
        <PoweredByLabel source="WhatsApp Business Platform" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="journey-channel-health-overview">
        <MetricCard testId="journey-health-total-optout" label="Total Opt-Outs" value={formatCompactNumber(ov.totalOptOuts.value)} delta={formatDelta(ov.totalOptOuts.deltaPct, ov.totalOptOuts.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-health-wa-optout" label="WhatsApp Opt-Outs" value={formatCompactNumber(ov.waOptOuts.value)} delta={formatDelta(ov.waOptOuts.deltaPct, ov.waOptOuts.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="journey-health-templates-rejected" label="Templates Rejected" value={formatCompactNumber(ov.templatesRejected.value)} />
        <MetricCard testId="journey-health-templates-paused" label="Templates Paused" value={formatCompactNumber(ov.templatesPaused.value)} />
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-health-sender-status">
        <div className="text-[11px] text-text-muted">WhatsApp Quality Tier</div>
        <div className="text-[13px] font-semibold">{detail.waQualityTier} <span className="text-text-muted font-normal">· {detail.waMessagingLimit}</span></div>
      </div>
      <GroupedBarChart testId="journey-health-unsub-by-channel" title="Opt-outs by channel" data={detail.unsubscribesByChannel} xKey="channel" series={[{ key: "unsubscribed", label: "Opt-Outs", color: "#EF4444" }]} valueFormatter={formatCompactNumber} />
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-health-underperforming">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Underperforming journeys</h3>
        <ul className="space-y-1">
          {detail.underperformingJourneys.map((u) => (
            <li key={u.journey} className="text-[12px] flex items-center justify-between">
              <span>{u.journey}</span>
              <span className="text-rose-700">{u.issue}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-semibold text-text-primary">Delivery rate benchmarking</h3>
          <MetricTooltip name="Delivery Rate" formula="Delivered ÷ Sent × 100" description="This journey's WhatsApp delivery rate vs. its own baseline, the Fastrr platform average, and an industry benchmark." />
        </div>
        <GroupedBarChart
          testId="journey-health-benchmarks"
          data={data.deliveryRateBenchmarks}
          xKey="channel"
          series={[
            { key: "current", label: "This Store", color: "#6C3AE8" },
            { key: "storeAvg", label: "Store Avg (90d)", color: "#94A3B8" },
            { key: "fastrrPlatformAvg", label: "Fastrr Platform Avg", color: "#22C55E" },
            { key: "industryAvg", label: "Industry Avg", color: "#F59E0B" },
          ]}
          valueFormatter={(v) => formatPercent(v)}
        />
      </div>
    </div>
  );
}
