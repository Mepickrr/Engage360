import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function ActivityOverTimeSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-activity-skeleton" rows={4} />;

  return (
    <div data-testid="journey-activity-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Journey activity over time</h2>
        <PoweredByLabel source="Event tracking SDK" />
      </div>
      <p className="text-[11px] text-text-muted">Follows the date range filter above — Journeys are always-on, so (unlike Campaigns' fixed trailing-24h view) a fixed window would hide the trend you're looking for.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-activity-message-funnel">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">Message funnel</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityOverTime.messageFunnel} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="date" tick={TICK} stroke="#94A3B8" />
                <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
                <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="messagesSent" name="Sent" stackId="a" fill="#94A3B8" />
                <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#6C3AE8" />
                <Bar dataKey="read" name="Read" stackId="a" fill="#F9A8D4" />
                <Bar dataKey="clicked" name="Clicked" stackId="a" fill="#A5D8FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="journey-activity-commerce-funnel">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">Commerce funnel</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activityOverTime.commerceFunnel} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="date" tick={TICK} stroke="#94A3B8" />
                <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
                <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="productViews" name="Product Views" stackId="b" fill="#DDD6FE" />
                <Bar dataKey="addToCarts" name="Add to Carts" stackId="b" fill="#FBCFE8" />
                <Bar dataKey="ordersPlaced" name="Orders Placed" stackId="b" fill="#6C3AE8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
