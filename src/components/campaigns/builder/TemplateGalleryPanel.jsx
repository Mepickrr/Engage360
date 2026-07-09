import React from "react";
import { WHATSAPP_CATALOG_TEMPLATES } from "./templateCatalog";

const QUALITY_DOT = { high: "#15803D", medium: "#D97706", low: "#DC2626", unknown: "#64748B" };

export default function TemplateGalleryPanel({ onSelect, onEdit }) {
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
