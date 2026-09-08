import React from "react";
import MetricCard from "../../overview/MetricCard";
import GroupedBarChart from "../../fastrr/shared/GroupedBarChart";
import MetricTooltip from "../../fastrr/shared/MetricTooltip";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatPercent, formatDelta } from "@/lib/analyticsFormat";

export default function ChannelHealthSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-channel-health-skeleton" rows={5} />;

  const ov = data.channelHealthOverview;
  const detail = data.channelHealthDetail;

  return (
    <div data-testid="campaign-channel-health-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Channel health &amp; quality</h2>
        <PoweredByLabel source="WhatsApp Business Platform / DLT registry" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="campaign-channel-health-overview">
        <MetricCard testId="campaign-health-total-unsub" label="Total Unsubscribed" value={formatCompactNumber(ov.totalUnsubscribed.value)} delta={formatDelta(ov.totalUnsubscribed.deltaPct, ov.totalUnsubscribed.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-health-wa-unsub" label="WhatsApp Unsubscribed" value={formatCompactNumber(ov.whatsappUnsubscribed.value)} delta={formatDelta(ov.whatsappUnsubscribed.deltaPct, ov.whatsappUnsubscribed.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-health-email-unsub" label="Email Unsubscribed" value={formatCompactNumber(ov.emailUnsubscribed.value)} delta={formatDelta(ov.emailUnsubscribed.deltaPct, ov.emailUnsubscribed.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-health-spam" label="Marked as Spam" value={formatCompactNumber(ov.emailMarkedAsSpam.value)} delta={formatDelta(ov.emailMarkedAsSpam.deltaPct, ov.emailMarkedAsSpam.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-health-bounced" label="Email Bounced (count)" value={formatCompactNumber(ov.emailBouncedCount.value)} delta={formatDelta(ov.emailBouncedCount.deltaPct, ov.emailBouncedCount.deltaAbsolute, formatCompactNumber)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-health-email-bounce">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Email Bounce Rate</span>
            <MetricTooltip name="Email Bounce Rate" formula="Bounced ÷ Delivered × 100" description="Share of delivered emails that bounced." />
          </div>
          <div className="mt-1 flex items-center gap-4">
            <div><div className="text-[10px] text-text-muted">Current</div><div className="text-lg font-semibold tabular-nums">{formatPercent(detail.emailBounceRate)}</div></div>
            <div><div className="text-[10px] text-text-muted">Benchmark</div><div className="text-lg font-semibold text-text-muted tabular-nums">{formatPercent(detail.emailBounceBenchmark)}</div></div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-health-sender-status">
          <div className="text-[11px] text-text-muted">WhatsApp Quality Tier</div>
          <div className="text-[13px] font-semibold">{detail.waQualityTier} <span className="text-text-muted font-normal">· {detail.waMessagingLimit}</span></div>
          <div className="text-[11px] text-text-muted mt-2">SMS Sender</div>
          <div className="text-[13px] font-semibold">{detail.smsSenderHealth.senderId} <span className="text-text-muted font-normal">· DLT {detail.smsSenderHealth.dltStatus}</span></div>
        </div>
      </div>

      <GroupedBarChart
        testId="campaign-health-unsub-by-channel"
        title="Unsubscribes by channel"
        data={detail.unsubscribesByChannel}
        xKey="channel"
        series={[{ key: "unsubscribed", label: "Unsubscribed", color: "#EF4444" }]}
        valueFormatter={formatCompactNumber}
      />

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-health-underperforming">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Underperforming campaigns</h3>
        <ul className="space-y-1">
          {detail.underperformingCampaigns.map((u) => (
            <li key={u.campaign} className="text-[12px] flex items-center justify-between">
              <span>{u.campaign} <span className="text-text-muted">({u.channel})</span></span>
              <span className="text-rose-700">{u.issue}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-semibold text-text-primary">Delivery rate benchmarking</h3>
          <MetricTooltip name="Delivery / Connect Rate" formula="Delivered (or Connected) ÷ Sent (or Attempted) × 100" description="This store's rate vs. its own baseline, the Fastrr platform average, and an industry benchmark." />
        </div>
        <GroupedBarChart
          testId="campaign-health-benchmarks"
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
