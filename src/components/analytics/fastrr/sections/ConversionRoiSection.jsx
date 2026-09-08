import React from "react";
import GroupedBarChart from "../shared/GroupedBarChart";
import AttributionPair from "../shared/AttributionPair";
import SortableTable from "../shared/SortableTable";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import SectionEmptyState from "../shared/SectionEmptyState";
import MetricTooltip from "../shared/MetricTooltip";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const JOURNEY_COLUMNS = [
  { key: "name", label: "Journey Name" },
  { key: "channels", label: "Channel(s)", formatter: (v) => v.join(", ") },
  { key: "triggerEvent", label: "Trigger Event" },
  { key: "sent", label: "Sent", formatter: formatCompactNumber },
  { key: "delivered", label: "Delivered", formatter: formatCompactNumber },
  { key: "orders", label: "Orders", formatter: formatCompactNumber },
  { key: "revenue", label: "Revenue", formatter: formatCompactCurrency },
  { key: "roi", label: "ROI", formatter: (v) => `${v.toFixed(2)}X` },
  { key: "aov", label: "AOV", formatter: formatCompactCurrency },
  { key: "uniqueCustomers", label: "Unique Customers", formatter: formatCompactNumber },
];

export default function ConversionRoiSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-conversion-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-conversion-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Communication: Conversion &amp; ROI</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>

      {data.isEmpty ? (
        <SectionEmptyState testId="fastrr-conversion-empty" />
      ) : (
        <>
          <div>
            {/* Orders (hundreds) and Revenue (hundreds of thousands+) sit on incompatible
                linear scales — plotted together the Orders series/bars are effectively
                invisible next to Revenue. Split into two single-series charts instead of
                adding a dual-axis mode to GroupedBarChart (shared by 3 other sections),
                consistent with pulling AOV/ROI out below for the same "incompatible units"
                reason. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GroupedBarChart
                testId="fastrr-conversion-orders-by-channel"
                title="Orders by channel"
                data={data.byChannel}
                xKey="label"
                series={[{ key: "orders", label: "Orders", color: "#94A3B8" }]}
                valueFormatter={formatCompactNumber}
              />
              <GroupedBarChart
                testId="fastrr-conversion-revenue-by-channel"
                title="Revenue by channel"
                data={data.byChannel}
                xKey="label"
                series={[{ key: "revenue", label: "Revenue", color: "#6C3AE8" }]}
                valueFormatter={formatCompactNumber}
              />
            </div>
            {/* AOV and ROI are shown per-channel below, not in either chart above — mixing
                order counts/revenue with an X-multiplier and a rupee average in one
                grouped bar would compare incompatible units. */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3" data-testid="fastrr-conversion-channel-stats">
              {data.byChannel.map((c) => (
                <div key={c.label} className="bg-slate-50 rounded-md p-2 text-center">
                  <div className="text-[10px] text-text-muted font-medium">{c.label}</div>
                  <div className="text-[12px] font-semibold tabular-nums">{c.roi.toFixed(2)}X</div>
                  <div className="text-[10px] text-text-muted">AOV {formatCompactCurrency(c.aov)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <p className="text-[11px] text-text-muted" data-testid="fastrr-conversion-roi-formula">
                ROI = (Revenue − Cost) / Cost × 100. {data.roiFormulaNote}
              </p>
              <MetricTooltip name="ROI" formula="(Revenue − Cost) / Cost × 100" description="Return on investment for this channel's spend." />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4">
            <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Attributed Revenue</span>
            <div className="mt-2">
              <AttributionPair testId="fastrr-conversion-attribution" lastClick={data.attribution.lastClick} firstClick={data.attribution.firstClick} formatter={formatCompactCurrency} />
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">Top Journeys / Campaigns</h3>
            <SortableTable
              testId="fastrr-top-journeys-table"
              columns={JOURNEY_COLUMNS}
              rows={data.topJourneys}
              defaultSort={{ field: "revenue", dir: "desc" }}
              secondarySortField="sent"
              rowKey="id"
              maxRows={10}
            />
          </div>

          <GroupedBarChart
            testId="fastrr-trigger-split"
            title="Revenue by trigger event"
            data={data.triggerSplit}
            xKey="trigger"
            series={[{ key: "revenue", label: "Revenue", color: "#6C3AE8" }]}
            valueFormatter={formatCompactNumber}
          />
        </>
      )}
    </div>
  );
}
