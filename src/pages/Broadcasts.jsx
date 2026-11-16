import React, { useState } from "react";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import BroadcastDetailDrawer, { BroadcastStatusPill, WhatsAppPill } from "@/components/broadcasts/BroadcastDetailDrawer";
import { BROADCASTS } from "@/components/broadcasts/data";

const num = (n) => Number(n).toLocaleString("en-IN");
const sum = (key) => BROADCASTS.reduce((s, b) => s + b[key], 0);

const KPIS = [
  { label: "Broadcasts sent", value: String(BROADCASTS.length), delta: "+2", testId: "broadcasts-kpi-count" },
  { label: "Messages delivered", value: num(sum("delivered")), delta: "+9%", testId: "broadcasts-kpi-delivered" },
  { label: "Avg read rate", value: `${((sum("read") / sum("delivered")) * 100).toFixed(1)}%`, delta: "+1.8pp", testId: "broadcasts-kpi-read" },
  { label: "Revenue attributed", value: `₹${(sum("revenue") / 1e5).toFixed(1)}L`, delta: "+14%", testId: "broadcasts-kpi-rev" },
];

export default function BroadcastsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = BROADCASTS.find((b) => b.id === selectedId);

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-broadcasts">
      <PreviewHeader
        title="Broadcasts"
        subtitle="One-time WhatsApp broadcasts. Click a broadcast to see its full report."
        testIdPrefix="broadcasts"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="broadcasts-table">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Broadcast</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Sent</th>
              <th className="px-4 py-2 font-medium text-right">Delivered</th>
              <th className="px-4 py-2 font-medium text-right">Orders</th>
              <th className="px-4 py-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {BROADCASTS.map((b) => (
              <tr
                key={b.id}
                data-testid={`broadcasts-row-${b.id}`}
                onClick={() => setSelectedId(b.id)}
                className={`border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer ${
                  selectedId === b.id ? "bg-violet-50/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-text-primary text-[13px]">{b.name}</div>
                  <div className="text-[11px] text-text-muted">#{b.id} · {b.templateName}</div>
                </td>
                <td className="px-4 py-3"><WhatsAppPill /></td>
                <td className="px-4 py-3"><BroadcastStatusPill status={b.status} /></td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-right">{num(b.sent)}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-right">{num(b.delivered)}</td>
                <td className="px-4 py-3 text-[12px] tabular-nums text-right">{num(b.orders)}</td>
                <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{b.startedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BroadcastDetailDrawer
        broadcast={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}
