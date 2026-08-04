import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };

export default function ComparisonLineChart({ testId, data, seriesLabels, valueFormatter }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey="date" tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} labelStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="overall" name={seriesLabels.overall} stroke="#94A3B8" strokeDasharray="4 3" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="fastrr" name={seriesLabels.fastrr} stroke="#6C3AE8" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
