import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./MetricCard";
import ComparisonLineChart from "./ComparisonLineChart";
import { formatCompactNumber, formatDelta } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function CustomersAcquiredSection({ testId, data, trend }) {
  const overallDelta = formatDelta(data.overall.deltaPct, data.overall.deltaAbs, formatCompactNumber);
  const fastrrDelta = formatDelta(data.fastrr.deltaPct, data.fastrr.deltaAbs, formatCompactNumber);

  return (
    <div data-testid={testId} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          testId="metric-customers-overall"
          label="Overall Customers Acquired"
          value={formatCompactNumber(data.overall.value)}
          delta={overallDelta}
        />
        <MetricCard
          testId="metric-customers-fastrr"
          label="Fastrr Customers Acquired"
          value={formatCompactNumber(data.fastrr.value)}
          delta={fastrrDelta}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="customers-by-source">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">Acquired by source</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bySource} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
                <YAxis type="category" dataKey="source" tick={TICK} stroke="#94A3B8" width={90} />
                <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ComparisonLineChart
          testId="trend-customers"
          title="Overall vs Fastrr Customers Acquired"
          data={trend}
          seriesLabels={{ overall: "Overall Customers Acquired", fastrr: "Fastrr Customers Acquired" }}
          valueFormatter={formatCompactNumber}
        />
      </div>
    </div>
  );
}
