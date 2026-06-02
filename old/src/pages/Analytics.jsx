import React from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import ChannelChip from "@/components/flows/ChannelChip";

const KPIS = [
  { label: "Total revenue (30d)", value: "₹14.8L", delta: "+12.4%", testId: "ana-kpi-rev" },
  { label: "Messages sent", value: "1.04M", delta: "+8.1%", testId: "ana-kpi-msgs" },
  { label: "Avg conversion", value: "5.2%", delta: "+0.4pp", testId: "ana-kpi-conv" },
  { label: "Active users", value: "18.9K", delta: "+1.1K", testId: "ana-kpi-active" },
];

const REVENUE_TREND = [
  { d: "May 01", rev: 28400 }, { d: "May 03", rev: 32100 }, { d: "May 05", rev: 36800 },
  { d: "May 07", rev: 35200 }, { d: "May 09", rev: 41200 }, { d: "May 11", rev: 44900 },
  { d: "May 13", rev: 47800 }, { d: "May 15", rev: 46200 }, { d: "May 17", rev: 52400 },
  { d: "May 19", rev: 58100 }, { d: "May 21", rev: 61200 }, { d: "May 23", rev: 64800 },
  { d: "May 25", rev: 69200 }, { d: "May 27", rev: 72100 }, { d: "May 29", rev: 78400 },
];

const CHANNEL_PERF = [
  { channel: "WhatsApp", sent: 412000, conv: 7.4 },
  { channel: "Email", sent: 318000, conv: 4.1 },
  { channel: "SMS", sent: 162000, conv: 3.2 },
  { channel: "Push", sent: 148000, conv: 2.8 },
];

const TOP_FLOWS = [
  { id: "f1", name: "Cart Abandonment 48h", channel: "whatsapp", entered: "9,420", conv: "12.4%", rev: "₹3.8L" },
  { id: "f2", name: "Payday Reactivation — Top Buyers", channel: "sms", entered: "2,300", conv: "9.2%", rev: "₹1.8L" },
  { id: "f3", name: "Welcome Drip — Skincare", channel: "email", entered: "8,221", conv: "6.4%", rev: "₹2.1L" },
  { id: "f4", name: "Review Ask — Delivered Orders", channel: "email", entered: "11,432", conv: "3.8%", rev: "₹68K" },
  { id: "f5", name: "Birthday Gift — VIPs", channel: "push", entered: "612", conv: "14.7%", rev: "₹92K" },
];

const TICK = { fontSize: 10 };
const TOOLTIP_STYLE = { fontSize: 11 };

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-analytics">
      <PreviewHeader
        title="Analytics"
        subtitle="Performance across flows, campaigns, and channels."
        testIdPrefix="analytics"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div
          className="lg:col-span-3 bg-surface border border-border rounded-lg p-4"
          data-testid="analytics-revenue-chart"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary">Revenue trend (30 days)</h3>
            <span className="text-[11px] text-text-muted">Cumulative ₹</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="d" tick={TICK} stroke="#94A3B8" />
                <YAxis tick={TICK} stroke="#94A3B8" />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="rev" stroke="#6C3AE8" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="lg:col-span-2 bg-surface border border-border rounded-lg p-4"
          data-testid="analytics-channel-chart"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary">Channel performance</h3>
            <span className="text-[11px] text-text-muted">Sent · Conv %</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHANNEL_PERF} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="channel" tick={TICK} stroke="#94A3B8" />
                <YAxis tick={TICK} stroke="#94A3B8" />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="conv" name="Conv %" fill="#6C3AE8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="analytics-top-flows">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-text-primary">Top performing flows</h3>
          <button
            type="button"
            onClick={() => previewToast()}
            data-testid="analytics-view-all-flows"
            className="text-[12px] text-primary hover:underline"
          >
            View all
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Flow</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Entered</th>
              <th className="px-4 py-2 font-medium">Conversion</th>
              <th className="px-4 py-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {TOP_FLOWS.map((f) => (
              <tr
                key={f.id}
                data-testid={`analytics-flow-row-${f.id}`}
                className="border-t border-border hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-text-primary">{f.name}</td>
                <td className="px-4 py-3"><ChannelChip channel={f.channel} /></td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-text-primary">{f.entered}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums font-semibold text-emerald-700">{f.conv}</td>
                <td className="px-4 py-3 text-[13px] tabular-nums font-semibold text-text-primary">{f.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
