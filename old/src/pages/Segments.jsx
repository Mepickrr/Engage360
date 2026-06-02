import React from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import { Plus, Users } from "lucide-react";

const KPIS = [
  { label: "Total segments", value: "24", delta: "+3", testId: "seg-kpi-total" },
  { label: "Active", value: "18", testId: "seg-kpi-active" },
  { label: "High-value users", value: "3,200", delta: "+186", testId: "seg-kpi-hv" },
  { label: "Stale (need refresh)", value: "3", deltaTone: "negative", delta: "+1", testId: "seg-kpi-stale" },
];

const ROWS = [
  { id: "s1", name: "Cart Abandoners 48h", def: "event:cart_abandoned in last 2d", users: "1,840", refreshed: "5 min ago", owner: "meera" },
  { id: "s2", name: "VIP Customers (LTV > ₹10K)", def: "user.ltv >= 10000", users: "612", refreshed: "1 h ago", owner: "meera" },
  { id: "s3", name: "Skincare Browsers", def: "category=skincare AND views >= 3", users: "4,302", refreshed: "12 min ago" },
  { id: "s4", name: "Reactivation Window — 45d", def: "last_active 30–60d ago", users: "9,118", refreshed: "30 min ago", owner: "meera" },
  { id: "s5", name: "First-time Buyers", def: "orders = 1 in 30d", users: "1,427", refreshed: "1 h ago" },
  { id: "s6", name: "High-intent unconverted", def: "viewed_product >= 3 AND orders = 0", users: "1,840", refreshed: "Stale · 3d ago" },
  { id: "s7", name: "Top Buyers — Payday window", def: "orders >= 5 in 90d", users: "2,300", refreshed: "10 min ago", owner: "meera" },
  { id: "s8", name: "WhatsApp engaged 7d", def: "whatsapp.opened in last 7d", users: "12,890", refreshed: "8 min ago" },
  { id: "s9", name: "App installed — no purchase", def: "app_install AND orders = 0", users: "3,012", refreshed: "Stale · 5d ago" },
  { id: "s10", name: "Birthday this week", def: "user.birthday WITHIN 7d", users: "417", refreshed: "1 h ago" },
];

const OWNER_COLOR = "#8B5CF6"; // Meera

export default function SegmentsPage() {
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-segments">
      <PreviewHeader
        title="Segments"
        subtitle="Build and manage audience segments powering targeting and triggers."
        testIdPrefix="segments"
        actions={
          <button
            type="button"
            data-testid="segments-new-btn"
            onClick={() => previewToast()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New segment
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="segments-table">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Segment</th>
              <th className="px-4 py-2 font-medium">Definition</th>
              <th className="px-4 py-2 font-medium">Users</th>
              <th className="px-4 py-2 font-medium">Refreshed</th>
              <th className="px-4 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr
                key={r.id}
                data-testid={`segments-row-${r.id}`}
                onClick={() => previewToast()}
                className="border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-semibold text-text-primary flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-violet-500" />
                  {r.name}
                </td>
                <td className="px-4 py-3 text-[12px] text-text-secondary font-mono">{r.def}</td>
                <td className="px-4 py-3 text-[13px] tabular-nums text-text-primary font-semibold">{r.users}</td>
                <td className={`px-4 py-3 text-[12px] ${r.refreshed.startsWith("Stale") ? "text-rose-600" : "text-text-muted"}`}>
                  {r.refreshed}
                </td>
                <td className="px-4 py-3">
                  {r.owner === "meera" && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: `${OWNER_COLOR}1A`, color: OWNER_COLOR }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: OWNER_COLOR }} />
                      Owned by Meera
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
