import React, { useState } from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import ChannelChip from "@/components/flows/ChannelChip";
import StatusPill from "@/components/flows/StatusPill";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const KPIS = [
  { label: "Campaigns sent", value: "47", delta: "+12%", testId: "campaigns-kpi-sent" },
  { label: "Avg open rate", value: "28.4%", delta: "+3.1pp", testId: "campaigns-kpi-open" },
  { label: "Avg CTR", value: "4.2%", delta: "+0.6pp", testId: "campaigns-kpi-ctr" },
  { label: "Revenue attributed", value: "₹1.2L", delta: "+18%", testId: "campaigns-kpi-rev" },
];

const ROWS = [
  { id: "c1", name: "Diwali Pre-Sale Blast", channel: "whatsapp", audience: "All India · 32K", status: "active", sent: "32,104", open: "31.2%", when: "Today, 10:42" },
  { id: "c2", name: "Welcome Drip — Skincare", channel: "email", audience: "New signups (skincare)", status: "active", sent: "8,221", open: "42.8%", when: "Yesterday, 18:15" },
  { id: "c3", name: "Cart Abandoners 48h", channel: "whatsapp", audience: "Abandoners 48h", status: "active", sent: "4,890", open: "26.4%", when: "Yesterday, 11:00" },
  { id: "c4", name: "Payday Promo — Top Buyers", channel: "sms", audience: "Top buyers · 2,300", status: "draft", sent: "—", open: "—", when: "Drafted 2d ago" },
  { id: "c5", name: "Review Ask — Delivered Orders", channel: "email", audience: "Delivered ≥ 7d", status: "active", sent: "11,432", open: "39.5%", when: "Mon, 09:00" },
  { id: "c6", name: "Birthday Gift — VIPs", channel: "push", audience: "VIP cohort", status: "paused", sent: "612", open: "—", when: "Paused Sat" },
  { id: "c7", name: "Re-engagement 45d", channel: "whatsapp", audience: "Inactive 45d", status: "active", sent: "9,776", open: "18.7%", when: "Sun, 17:30" },
  { id: "c8", name: "Festive Offer — Browsers", channel: "email", audience: "Product browsers", status: "draft", sent: "—", open: "—", when: "Drafted 5d ago" },
];

const TABS = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sent", label: "Sent" },
  { id: "draft", label: "Draft" },
];

export default function CampaignsPage() {
  const [tab, setTab] = useState("all");
  const filtered =
    tab === "all"
      ? ROWS
      : tab === "scheduled"
        ? ROWS.filter((r) => r.status === "paused")
        : tab === "sent"
          ? ROWS.filter((r) => r.status === "active")
          : ROWS.filter((r) => r.status === "draft");

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-campaigns">
      <PreviewHeader
        title="Campaigns"
        subtitle="One-time blasts across email, WhatsApp, SMS, and push."
        testIdPrefix="campaigns"
        actions={
          <button
            type="button"
            data-testid="campaigns-new-btn"
            onClick={() => previewToast()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New campaign
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="campaigns-tabs">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} data-testid={`campaigns-tab-${t.id}`}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="campaigns-table">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Campaign</th>
                  <th className="px-4 py-2 font-medium">Channel</th>
                  <th className="px-4 py-2 font-medium">Audience</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Sent</th>
                  <th className="px-4 py-2 font-medium">Open rate</th>
                  <th className="px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    data-testid={`campaigns-row-${r.id}`}
                    onClick={() => previewToast()}
                    className="border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold text-text-primary">{r.name}</td>
                    <td className="px-4 py-3"><ChannelChip channel={r.channel} /></td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">{r.audience}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 text-[12px] tabular-nums text-text-primary">{r.sent}</td>
                    <td className="px-4 py-3 text-[12px] tabular-nums text-text-primary">{r.open}</td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{r.when}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                      Nothing here yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
