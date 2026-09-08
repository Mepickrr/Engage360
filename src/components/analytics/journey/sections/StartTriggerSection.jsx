import React from "react";
import MetricCard from "../../overview/MetricCard";
import SortableTable from "../../fastrr/shared/SortableTable";
import MetricTooltip from "../../fastrr/shared/MetricTooltip";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatPercent, formatDelta } from "@/lib/analyticsFormat";

function fmtMs(ms) {
  if (ms == null) return "--";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function topSuppression(entries) {
  if (!entries || entries.length === 0) return "--";
  const top = [...entries].sort((a, b) => b.count - a.count)[0];
  return `${top.reason.replace(/_/g, " ")} (${formatCompactNumber(top.count)})`;
}

const COLUMNS = [
  { key: "triggerType", label: "Trigger Type", formatter: (v) => v.replace(/_/g, " ") },
  { key: "journeysUsingThisTrigger", label: "Journeys", formatter: (v) => (v.length ? v.join(", ") : "--") },
  { key: "totalFires", label: "Total Fires", formatter: formatCompactNumber },
  { key: "matchedEntries", label: "Matched Entries", formatter: formatCompactNumber },
  { key: "topSuppression", label: "Top Suppression Reason" },
  { key: "avgLatencyMs", label: "Avg Latency", formatter: fmtMs },
  { key: "entryToConversionRate", label: "Entry → Conversion", formatter: (v) => (v == null ? "--" : formatPercent(v)) },
];

export default function StartTriggerSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-start-trigger-skeleton" rows={5} />;
  const st = data.startTrigger;
  const rows = st.byType.map((t) => ({ ...t, id: t.triggerType, topSuppression: topSuppression(t.suppressedEntries) }));

  return (
    <div data-testid="journey-start-trigger-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Start Trigger Performance</h2>
        <PoweredByLabel source="Flow builder trigger evaluator" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard testId="journey-trigger-total" label="Total Trigger Fires" value={formatCompactNumber(st.totalTriggerFires.value)} delta={formatDelta(st.totalTriggerFires.deltaPct, st.totalTriggerFires.deltaAbsolute, formatCompactNumber)} />
        <MetricCard
          testId="journey-trigger-entry-rate"
          label="Entry Rate"
          value={formatPercent(st.entryRate.value)}
          delta={formatDelta(st.entryRate.deltaPct, st.entryRate.deltaAbsolute, (v) => formatPercent(v))}
          infoText="Matched Entries ÷ Total Trigger Fires × 100"
        />
        <MetricCard testId="journey-trigger-latency" label="Avg Latency" value={fmtMs(st.avgLatencyMs.value)} />
        <MetricCard testId="journey-trigger-suppressed-rate" label="Suppressed Rate" value={formatPercent(st.suppressedRate.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <h3 className="text-[13px] font-semibold text-text-primary">Per-trigger-type breakdown</h3>
        <MetricTooltip name="Suppressed Entries" formula="Fires blocked before entry, by reason" description="Duplicate active journey, frequency cap, quiet hours, opt-out, template not approved, API failure, or invalid contact." />
      </div>
      <SortableTable testId="journey-trigger-table" columns={COLUMNS} rows={rows} defaultSort={{ field: "totalFires", dir: "desc" }} rowKey="id" maxRows={10} />
    </div>
  );
}
