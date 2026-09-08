import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ComparisonLineChart from "../../overview/ComparisonLineChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SegmentComparisonSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-segments-skeleton" rows={5} />;

  return (
    <div data-testid="fastrr-segments-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Known vs Fastrr-Identified vs Anonymous</h2>
        <PoweredByLabel source="Shiprocket customer profile" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.segments.map((seg) => (
          <div key={seg.key} className="bg-surface border border-border rounded-lg p-4" data-testid={`fastrr-segment-${seg.key}`}>
            <h3 className="text-[13px] font-semibold text-text-primary mb-3">{seg.label}</h3>
            <div>
              <div className="text-[11px] text-text-muted">Repeat Rate</div>
              <div className="text-lg font-semibold tabular-nums" data-testid={`fastrr-segment-${seg.key}-repeat-rate`}>{formatPercent(seg.repeatRate)}</div>
            </div>
            <div className="mt-2">
              <div className="text-[11px] text-text-muted">Engagement Rate</div>
              <div className="text-lg font-semibold tabular-nums" data-testid={`fastrr-segment-${seg.key}-engagement-rate`}>{formatPercent(seg.engagementRate)}</div>
            </div>
            <div className="mt-3 pt-2 border-t border-border text-[11px] text-text-muted space-y-0.5">
              <div>Orders: {formatCompactNumber(seg.orders)}</div>
              <div>Revenue: {formatCompactCurrency(seg.revenue)}</div>
              <div>AOV: {formatCompactCurrency(seg.aov)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-segments-growth-trend">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Anonymous → Identified conversion trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.growthTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis dataKey="period" tick={TICK} stroke="#94A3B8" />
              <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="conversionRate" stroke="#6C3AE8" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-top-identified-users">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Top Identified Users</h3>
        <table className="w-full text-left text-[12px]">
          <thead className="text-text-muted uppercase text-[10px]">
            <tr><th className="py-1">Name</th><th className="py-1">Identified On</th><th className="py-1">LTV</th><th className="py-1"></th></tr>
          </thead>
          <tbody>
            {data.topIdentifiedUsers.map((u) => (
              <tr key={u.id} className="border-t border-border" data-testid={`fastrr-top-identified-user-${u.id}`}>
                <td className="py-1.5">{u.name}</td>
                <td className="py-1.5 text-text-muted">{u.identifiedOn}</td>
                <td className="py-1.5 tabular-nums">{formatCompactCurrency(u.ltv)}</td>
                <td className="py-1.5 text-right">
                  <button type="button" disabled data-testid={`fastrr-top-identified-user-${u.id}-view-in-audience`} className="text-text-muted cursor-not-allowed">
                    View in Audience
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ComparisonLineChart
        testId="fastrr-repeat-cohort"
        title="Repeat-purchase cohort: Fastrr-Identified vs Known"
        data={data.repeatCohort.map((p) => ({ date: p.week, overall: p.known, fastrr: p.fastrrIdentified }))}
        seriesLabels={{ overall: "Known", fastrr: "Fastrr-Identified" }}
        valueFormatter={(v) => formatPercent(v)}
      />
    </div>
  );
}
