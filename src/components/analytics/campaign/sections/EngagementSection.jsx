import React from "react";
import MetricCard from "../../overview/MetricCard";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatPercent, formatSeconds, formatCompactCurrency, formatDelta } from "@/lib/analyticsFormat";

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function nz(v) {
  return v == null ? "--" : formatCompactNumber(v);
}

function ChannelCard({ channel, stats }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={`campaign-engagement-${channel.toLowerCase().replace(/\s+/g, "-")}`}>
      <h3 className="text-[13px] font-semibold text-text-primary mb-2">{channel}</h3>
      {channel === "WhatsApp" && (
        <>
          <StatRow label="Sent" value={nz(stats.sent)} />
          <StatRow label="Delivered" value={nz(stats.delivered)} />
          <StatRow label="Read" value={nz(stats.read)} />
          <StatRow label="Replied" value={nz(stats.replied)} />
          <StatRow label="Interacted" value={nz(stats.interacted)} />
          <StatRow label="Link Clicked" value={nz(stats.linkClicked)} />
          <StatRow label="Abandoned Cart" value={nz(stats.abandonedCart)} />
          <StatRow label="Opted Out" value={nz(stats.optedOut)} />
        </>
      )}
      {channel === "RCS" && (
        <>
          <StatRow label="Sent" value={nz(stats.sent)} />
          <StatRow label="Delivered" value={nz(stats.delivered)} />
          <StatRow label="Read" value={nz(stats.read)} />
          <StatRow label="Rich Card Interactions" value={nz(stats.richCardInteractions)} />
          <StatRow label="Fallback to SMS Rate" value={formatPercent(stats.fallbackToSmsRate)} />
          <StatRow label="Opted Out" value={nz(stats.optedOut)} />
        </>
      )}
      {channel === "SMS" && (
        <>
          <StatRow label="Sent" value={nz(stats.sent)} />
          <StatRow label="Delivered" value={nz(stats.delivered)} />
          <StatRow label="Failed" value={nz(stats.failed)} />
        </>
      )}
      {channel === "Email" && (
        <>
          <StatRow label="Sent" value={nz(stats.sent)} />
          <StatRow label="Delivered" value={nz(stats.delivered)} />
          <StatRow label="Soft Bounced" value={nz(stats.softBounced)} />
          <StatRow label="Hard Bounced" value={nz(stats.hardBounced)} />
          <StatRow label="Unique Opened" value={nz(stats.uniqueOpened)} />
          <StatRow label="Total Opened" value={nz(stats.totalOpened)} />
          <StatRow label="Unique Link Clicked" value={nz(stats.uniqueLinkClicked)} />
          <StatRow label="Unsubscribed" value={nz(stats.unsubscribed)} />
          <StatRow label="Abandoned Cart" value={nz(stats.abandonedCart)} />
        </>
      )}
      {channel === "AI Calling" && (
        <>
          <StatRow label="Calls Attempted" value={nz(stats.callsAttempted)} />
          <StatRow label="Calls Connected" value={nz(stats.callsConnected)} />
          <StatRow label="Avg Duration" value={formatSeconds(stats.avgDurationSec)} />
          <StatRow label="Interested" value={nz(stats.outcomes?.interested)} />
          <StatRow label="Callback Requested" value={nz(stats.outcomes?.callbackRequested)} />
          <StatRow label="Order Placed" value={nz(stats.outcomes?.orderPlaced)} />
          <StatRow label="Not Reachable" value={nz(stats.outcomes?.notReachable)} />
          <StatRow label="Handoff — IVR / Agent" value={`${nz(stats.handoff?.ivr)} / ${nz(stats.handoff?.agent)}`} />
          <StatRow label="Revenue Attributed" value={formatCompactCurrency(stats.revenueAttributed)} />
        </>
      )}
    </div>
  );
}

export default function EngagementSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-engagement-skeleton" rows={5} />;

  const ov = data.engagementOverview;

  return (
    <div data-testid="campaign-engagement-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Engagement</h2>
        <PoweredByLabel source="Channel delivery webhooks" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="campaign-engagement-overview">
        <MetricCard testId="campaign-engagement-reached" label="Customers Reached" value={formatCompactNumber(ov.totalCustomersReached.value)} delta={formatDelta(ov.totalCustomersReached.deltaPct, ov.totalCustomersReached.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-engagement-sent" label="Messages Sent" value={formatCompactNumber(ov.messagesSent.value)} delta={formatDelta(ov.messagesSent.deltaPct, ov.messagesSent.deltaAbsolute, formatCompactNumber)} />
        <MetricCard testId="campaign-engagement-delivered" label="Delivered" value={formatCompactNumber(ov.delivered)} subBadge={formatPercent(ov.deliveryRate)} />
        <MetricCard testId="campaign-engagement-read-rate" label="Read Rate" value={formatPercent(ov.readRate)} />
      </div>

      {/* Fastrr differentiator: campaigns can fall back to a secondary channel
          when the primary delivery fails/times out — highlighted separately
          since no other platform models this. */}
      <div className="bg-primary-tint border border-primary/40 rounded-lg p-4" data-testid="campaign-fallback-performance">
        <span className="text-[11px] uppercase tracking-wide text-primary font-medium">Fallback Channel Performance</span>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          {data.fallbackPerformance.map((f) => (
            <div key={`${f.primaryChannel}-${f.fallbackChannel}`} className="bg-white/60 rounded-md p-3" data-testid={`campaign-fallback-${f.primaryChannel.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="text-[12px] font-semibold text-text-primary">{f.primaryChannel} → {f.fallbackChannel}</div>
              <div className="text-[11px] text-text-muted mt-1">Attempted {formatCompactNumber(f.attempted)} · Fell back {formatCompactNumber(f.fallbackTriggered)} ({formatPercent(f.fallbackTriggerRate)})</div>
              <div className="text-[11px] text-text-muted">Delivered via fallback {formatPercent(f.fallbackDeliveryRate)} · Revenue recovered {formatCompactCurrency(f.fallbackRevenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(data.engagementByChannel).map(([channel, stats]) => (
          <ChannelCard key={channel} channel={channel} stats={stats} />
        ))}
      </div>
    </div>
  );
}
