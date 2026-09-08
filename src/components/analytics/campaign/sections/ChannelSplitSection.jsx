import React from "react";
import GroupedBarChart from "../../fastrr/shared/GroupedBarChart";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

export default function ChannelSplitSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-channel-split-skeleton" rows={3} />;

  return (
    <div data-testid="campaign-channel-split-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Channel-wise split</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GroupedBarChart
          testId="campaign-revenue-by-channel"
          title="Revenue by channel"
          data={data.channelSplit.revenueByChannel}
          xKey="channel"
          series={[{ key: "revenue", label: "Revenue", color: "#6C3AE8" }]}
          valueFormatter={formatCompactCurrency}
        />
        <GroupedBarChart
          testId="campaign-orders-by-channel"
          title="Orders by channel"
          data={data.channelSplit.ordersByChannel}
          xKey="channel"
          series={[{ key: "orders", label: "Orders", color: "#94A3B8" }]}
          valueFormatter={formatCompactNumber}
        />
      </div>
    </div>
  );
}
