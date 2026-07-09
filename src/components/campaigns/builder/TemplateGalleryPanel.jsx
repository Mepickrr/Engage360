import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WHATSAPP_CATALOG_TEMPLATES } from "./templateCatalog";

const QUALITY_DOT = { high: "#15803D", medium: "#D97706", low: "#DC2626", unknown: "#64748B" };

const RECOMMENDATIONS = [
  {
    title: "Personalised greetings boost attention and trust",
    body: "Templates with the recipient's name in the first sentence typically perform better.",
  },
  {
    title: "Shorter messages convert better",
    body: "Templates under 300 characters see a noticeably higher click-through rate.",
  },
];

function Bar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-14 text-text-muted shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden">
        <div className="h-full rounded" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="w-10 text-right text-text-secondary shrink-0">{value.toLocaleString("en-IN")}</span>
    </div>
  );
}

function AnalyticsModal({ template, onClose }) {
  const [range, setRange] = useState("7");
  const [recoIndex, setRecoIndex] = useState(0);
  const a = template.analytics;
  const failed = Math.max(0, a.sent - a.delivered.count);
  const maxVal = a.sent;
  const reco = RECOMMENDATIONS[recoIndex];

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="template-analytics-modal" className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name} — Analytics</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-semibold text-text-primary">Delivery Analytics</h4>
            <select
              data-testid="analytics-day-filter"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="text-[12px] border border-border rounded-md px-2 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Bar label="Sent" value={a.sent} max={maxVal} color="#6C3AE8" />
            <Bar label="Delivered" value={a.delivered.count} max={maxVal} color="#15803D" />
            <Bar label="Read" value={a.read.count} max={maxVal} color="#0EA5E9" />
            <Bar label="Failed" value={failed} max={maxVal} color="#DC2626" />
          </div>
        </div>

        <div className="mb-4 border-t border-border pt-4">
          <h4 className="text-[13px] font-semibold text-text-primary mb-2">Quality of Template</h4>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: QUALITY_DOT[template.quality.tier] || QUALITY_DOT.unknown }} />
            {template.quality.label}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-[13px] font-semibold text-text-primary mb-1">Meta Template Benchmark</h4>
          <div className="grid grid-cols-2 gap-4 mb-3 text-center">
            <div>
              <div className="text-[11px] text-text-muted mb-1">This template</div>
              <div className="text-[22px] font-bold text-amber-600">{a.read.pct}%</div>
              <div className="text-[10px] text-text-muted">read rate</div>
            </div>
            <div>
              <div className="text-[11px] text-text-muted mb-1">Similar templates</div>
              <div className="text-[22px] font-bold text-text-primary">{Math.min(99, a.read.pct + 10)}%</div>
              <div className="text-[10px] text-text-muted">read rate</div>
            </div>
          </div>
          <div className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <button type="button" data-testid="reco-prev" disabled={recoIndex === 0} onClick={() => setRecoIndex((i) => i - 1)} className="text-text-muted disabled:opacity-30">‹</button>
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-text-primary mb-1">{reco.title}</div>
              <div className="text-[11px] text-text-secondary">{reco.body}</div>
            </div>
            <button type="button" data-testid="reco-next" disabled={recoIndex === RECOMMENDATIONS.length - 1} onClick={() => setRecoIndex((i) => i + 1)} className="text-text-muted disabled:opacity-30">›</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplateGalleryPanel({ onSelect, onEdit }) {
  const [analyticsTemplate, setAnalyticsTemplate] = useState(null);

  return (
    <div data-testid="template-gallery-panel">
      <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>
      <div className="grid grid-cols-1 gap-3">
        {WHATSAPP_CATALOG_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            data-testid={`gallery-card-${tpl.id}`}
            className="group relative border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-semibold text-text-primary truncate">{tpl.name}</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: QUALITY_DOT[tpl.quality.tier] || QUALITY_DOT.unknown }}
                title={tpl.quality.label}
              />
            </div>
            <div className="text-[11px] text-text-muted mb-2">{tpl.category}</div>
            <div className="text-[11px] text-text-secondary line-clamp-2 mb-2">{tpl.preview.body}</div>
            <div className="text-[10px] text-text-muted">
              {tpl.analytics.read.pct}% read · {tpl.analytics.sent.toLocaleString("en-IN")} sent
            </div>
            <div className="hidden group-hover:flex absolute inset-0 bg-white/95 items-center justify-center gap-2 rounded-lg">
              <button
                type="button"
                data-testid={`gallery-confirm-${tpl.id}`}
                onClick={() => onSelect(tpl)}
                className="px-3 py-1.5 rounded-md bg-primary text-white text-[12px] font-medium"
              >
                Confirm
              </button>
              <button
                type="button"
                data-testid={`gallery-edit-${tpl.id}`}
                onClick={() => onEdit(tpl)}
                className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                data-testid={`gallery-analytics-${tpl.id}`}
                onClick={() => setAnalyticsTemplate(tpl)}
                className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium"
              >
                View Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      {analyticsTemplate && (
        <AnalyticsModal template={analyticsTemplate} onClose={() => setAnalyticsTemplate(null)} />
      )}
    </div>
  );
}
