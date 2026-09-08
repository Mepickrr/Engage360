import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber, formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };
const LINE_COLORS = ["#6C3AE8", "#94A3B8", "#22C55E", "#F59E0B"];

function pctChip(deltaPct) {
  const tone = deltaPct < 0 ? "negative" : "positive";
  const arrow = deltaPct < 0 ? "↓" : "↑";
  return { text: `${arrow} ${Math.abs(deltaPct)}%`, tone };
}

function TrendChartCard({ testId, title, series, lines, valueFormatter, compare }) {
  const [granularity, setGranularity] = useState("day");
  const data = series[granularity];
  const chip = pctChip(series.deltaPct);

  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          {compare && (
            <span
              data-testid={`${testId}-delta-chip`}
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                chip.tone === "negative" ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50"
              }`}
            >
              {chip.text}
            </span>
          )}
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              data-testid={`${testId}-granularity-day`}
              onClick={() => setGranularity("day")}
              className={`px-2 py-0.5 text-[10px] font-medium ${granularity === "day" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
            >
              Day
            </button>
            <button
              type="button"
              data-testid={`${testId}-granularity-week`}
              onClick={() => setGranularity("week")}
              className={`px-2 py-0.5 text-[10px] font-medium ${granularity === "week" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey="period" tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {lines.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrendsSection({ data, compare, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-trends-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-trends-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Trends / Lifecycle</h2>
        <PoweredByLabel source="Engage360 analytics warehouse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TrendChartCard
          testId="fastrr-trend-identification-rate"
          title="Identification Rate"
          series={data.identificationRate}
          lines={["value"]}
          valueFormatter={(v) => formatPercent(v)}
          compare={compare}
        />
        <TrendChartCard
          testId="fastrr-trend-messaging-funnel"
          title="Sent / Delivered / Read / Clicked"
          series={data.messagingFunnel}
          lines={["sent", "delivered", "read", "clicked"]}
          valueFormatter={formatCompactNumber}
          compare={compare}
        />
        <TrendChartCard
          testId="fastrr-trend-orders-revenue"
          title="Orders & Revenue"
          series={data.ordersRevenue}
          lines={["orders", "revenue"]}
          valueFormatter={formatCompactNumber}
          compare={compare}
        />
        <TrendChartCard
          testId="fastrr-trend-repeat-orders"
          title="Repeat Orders"
          series={data.repeatOrders}
          lines={["value"]}
          valueFormatter={formatCompactNumber}
          compare={compare}
        />
      </div>
    </div>
  );
}
