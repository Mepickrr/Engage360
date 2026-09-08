import React from "react";
import GroupedBarChart from "../shared/GroupedBarChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import SectionEmptyState from "../shared/SectionEmptyState";
import MetricTooltip from "../shared/MetricTooltip";
import { formatCompactNumber, formatPercent } from "@/lib/analyticsFormat";

export default function EngagementSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-engagement-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-engagement-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Communication: Engagement</h2>
        <PoweredByLabel source="WhatsApp delivery webhook" />
      </div>

      {data.isEmpty ? (
        <SectionEmptyState testId="fastrr-engagement-empty" />
      ) : (
        <>
          <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-6" data-testid="fastrr-engagement-summary">
            <div><div className="text-[11px] text-text-muted">Sent</div><div className="text-lg font-semibold tabular-nums">{formatCompactNumber(data.funnel.sent)}</div></div>
            <div><div className="text-[11px] text-text-muted">Delivered</div><div className="text-lg font-semibold tabular-nums">{formatCompactNumber(data.funnel.delivered)}</div></div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <span>Read Rate</span>
                <MetricTooltip name="Read Rate" formula="Read ÷ Delivered × 100" description="Share of delivered messages that were opened." />
              </div>
              <div className="text-lg font-semibold tabular-nums">{formatPercent(data.readRate)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <span>Click Rate (CTR)</span>
                <MetricTooltip name="Click Rate (CTR)" formula="Clicked ÷ Delivered × 100" description="Share of delivered messages that were clicked." />
              </div>
              <div className="text-lg font-semibold tabular-nums">{formatPercent(data.clickRate)}</div>
            </div>
          </div>

          {data.byChannel.length > 0 && (
            <GroupedBarChart
              testId="fastrr-engagement-by-channel"
              title="Engagement by channel"
              data={data.byChannel}
              xKey="label"
              series={[
                { key: "sent", label: "Sent", color: "#94A3B8" },
                { key: "delivered", label: "Delivered", color: "#6C3AE8" },
                { key: "read", label: "Read", color: "#22C55E" },
                { key: "clicked", label: "Clicked", color: "#F59E0B" },
              ]}
              valueFormatter={formatCompactNumber}
            />
          )}

          <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-engagement-ai-calling">
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">AI Calling</h3>
            <div className="flex items-center gap-6 text-[12px]">
              <span>Calls Placed: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsPlaced)}</strong></span>
              <span>Connected: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsConnected)}</strong></span>
              <span>Completed: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsCompleted)}</strong></span>
              <span>Action Taken: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.actionTaken)}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
