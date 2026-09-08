import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import FunnelChart from "../shared/FunnelChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function IdentificationFunnelSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-funnel-skeleton" rows={5} />;

  return (
    <div data-testid="fastrr-funnel-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Identification → Checkout → Order funnel</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      {/* Funnel denominator logic + its TODO live in shared/funnelMath.js */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <FunnelChart testId="fastrr-funnel-chart" stages={data.stages} />
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-funnel-dropoff">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Where identified-but-unconverted sessions leave</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dropoffByPage} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
              <YAxis type="category" dataKey="page" tick={TICK} stroke="#94A3B8" width={80} />
              <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
