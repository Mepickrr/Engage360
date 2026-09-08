import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GroupedBarChart from "../shared/GroupedBarChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SourceBreakdownSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-source-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-source-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Segmentation / Source breakdown</h2>
        <PoweredByLabel source="Fastrr SDK" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-source-breakdown">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Identification source</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sources} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <YAxis type="category" dataKey="source" tick={TICK} stroke="#94A3B8" width={80} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="pct" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <GroupedBarChart
        testId="fastrr-device-split"
        title="Device / platform split"
        data={data.deviceSplit}
        xKey="device"
        series={[{ key: "pct", label: "% of sessions", color: "#6C3AE8" }]}
        valueFormatter={(v) => formatPercent(v)}
      />
    </div>
  );
}
