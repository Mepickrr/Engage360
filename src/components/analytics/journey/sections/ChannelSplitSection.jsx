import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GroupedBarChart from "../../fastrr/shared/GroupedBarChart";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function ChannelSplitSection({ data, isLoading }) {
  const [numberView, setNumberView] = useState("revenue");
  if (isLoading) return <SectionSkeleton testId="journey-channel-split-skeleton" rows={3} />;

  const valueFmt = numberView === "revenue" ? formatCompactCurrency : formatCompactNumber;

  return (
    <div data-testid="journey-channel-split-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Channel-wise split</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GroupedBarChart testId="journey-revenue-by-channel" title="Revenue by channel" data={data.channelSplit.revenueByChannel} xKey="channel" series={[{ key: "revenue", label: "Revenue", color: "#6C3AE8" }]} valueFormatter={formatCompactCurrency} />
        <GroupedBarChart testId="journey-orders-by-channel" title="Orders by channel" data={data.channelSplit.ordersByChannel} xKey="channel" series={[{ key: "orders", label: "Orders", color: "#94A3B8" }]} valueFormatter={formatCompactNumber} />
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-number-split">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-text-primary">Channel-wise split by sending number</h3>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button type="button" data-testid="journey-number-split-revenue" onClick={() => setNumberView("revenue")} className={`px-3 py-1 text-[11px] font-medium ${numberView === "revenue" ? "bg-primary text-white" : "bg-white text-text-primary"}`}>Revenue</button>
            <button type="button" data-testid="journey-number-split-orders" onClick={() => setNumberView("orders")} className={`px-3 py-1 text-[11px] font-medium ${numberView === "orders" ? "bg-primary text-white" : "bg-white text-text-primary"}`}>Orders</button>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.channelSplit.byNumber} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={valueFmt} />
              <YAxis type="category" dataKey="number" tick={TICK} stroke="#94A3B8" width={110} />
              <Tooltip formatter={(v) => valueFmt(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey={numberView} fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
