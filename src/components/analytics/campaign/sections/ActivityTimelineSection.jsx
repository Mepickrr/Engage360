import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import SectionEmptyState from "../../fastrr/shared/SectionEmptyState";
import { formatCompactNumber, formatCompactCurrency, formatDelta } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };
const LINE_COLORS = ["#6C3AE8", "#22C55E", "#94A3B8", "#F59E0B", "#EF4444"];

export default function ActivityTimelineSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-activity-skeleton" rows={4} />;

  const { revenueMade, hourly, isEmpty } = data.activityTimeline;
  const revDelta = formatDelta(revenueMade.deltaPct, revenueMade.deltaAbsolute, formatCompactCurrency);

  return (
    <div data-testid="campaign-activity-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Campaign activity — trailing 24 hours</h2>
        <PoweredByLabel source="Event tracking SDK" />
      </div>
      <p className="text-[11px] text-text-muted">Not affected by the date range or channel filters above — always the trailing 24 hours across all campaigns.</p>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-activity-revenue-made">
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Revenue Made</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-semibold tabular-nums">{formatCompactCurrency(revenueMade.value)}</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${revDelta.tone === "negative" ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50"}`}>{revDelta.text}</span>
          <span className="text-[11px] text-text-muted">vs yesterday</span>
        </div>
      </div>

      {isEmpty ? (
        <SectionEmptyState testId="campaign-activity-empty" />
      ) : (
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="campaign-activity-chart">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="hour" tick={TICK} stroke="#94A3B8" tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
                <Tooltip formatter={(v) => formatCompactNumber(v)} labelFormatter={(h) => `${h}:00`} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="opened" name="Opened" stroke={LINE_COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicked" name="Clicked" stroke={LINE_COLORS[1]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="productViewed" name="Product Viewed" stroke={LINE_COLORS[2]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="addedToCart" name="Added to Cart" stroke={LINE_COLORS[3]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ordered" name="Ordered" stroke={LINE_COLORS[4]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
