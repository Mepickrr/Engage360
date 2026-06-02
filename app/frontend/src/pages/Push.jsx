import React from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import { Bell, Smartphone, Plus } from "lucide-react";

const KPIS = [
  { label: "Total sends (30d)", value: "12.4K", delta: "+9.1%", testId: "push-kpi-sends" },
  { label: "Delivered", value: "96.2%", delta: "+0.4pp", testId: "push-kpi-delivered" },
  { label: "Opened", value: "18.7%", delta: "+2.3pp", testId: "push-kpi-opened" },
  { label: "Click-through", value: "3.9%", delta: "+0.5pp", testId: "push-kpi-ctr" },
];

const TEMPLATES = [
  { id: "p1", title: "Flash sale starts now ⚡", body: "60% off site-wide for the next 4 hours.", tag: "Promotion" },
  { id: "p2", title: "Your order is on the way 📦", body: "Track your delivery and rate the experience.", tag: "Transactional" },
  { id: "p3", title: "We miss you, Aanya", body: "Come back to a hand-picked 15% off your next order.", tag: "Re-engagement" },
  { id: "p4", title: "Restocked — your favourite is back", body: "The cult sunscreen is back in stock. Grab it before it sells out.", tag: "Inventory" },
  { id: "p5", title: "Payday treat 💸", body: "Spoil yourself — extra ₹200 off on orders above ₹999.", tag: "Promotion" },
  { id: "p6", title: "Tap to complete checkout", body: "Your cart is waiting. Free shipping if you order in the next hour.", tag: "Cart recovery" },
];

function PushPreviewCard({ tpl }) {
  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
      data-testid={`push-card-${tpl.id}`}
    >
      <span className="text-[10px] uppercase tracking-wide text-text-muted font-medium">
        {tpl.tag}
      </span>
      <div className="rounded-md bg-slate-900 text-white p-3 flex gap-3 items-start">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">{tpl.title}</div>
          <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{tpl.body}</div>
        </div>
        <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => previewToast()}
          data-testid={`push-card-send-${tpl.id}`}
          className="flex-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => previewToast()}
          data-testid={`push-card-edit-${tpl.id}`}
          className="px-2.5 py-1.5 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default function PushPage() {
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-push">
      <PreviewHeader
        title="Push Notifications"
        subtitle="Mobile + browser push campaigns with rich previews."
        testIdPrefix="push"
        actions={
          <button
            type="button"
            data-testid="push-new-btn"
            onClick={() => previewToast()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New push
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <h2 className="text-base font-semibold text-text-primary mb-3">Templates</h2>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="push-templates-grid"
      >
        {TEMPLATES.map((tpl) => (
          <PushPreviewCard key={tpl.id} tpl={tpl} />
        ))}
      </div>
    </div>
  );
}
