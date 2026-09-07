import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };
const DEFAULT_COLORS = ["#6C3AE8", "#94A3B8", "#22C55E", "#F59E0B"];

export default function GroupedBarChart({ testId, title, data, series, xKey, valueFormatter }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      {title && <h3 className="text-[13px] font-semibold text-text-primary mb-3">{title}</h3>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey={xKey} tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
