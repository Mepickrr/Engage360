import React from "react";
import { CHANNEL_META } from "@/lib/flowMeta";

function formatDate(iso) {
  if (!iso) return "DATE";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase();
}

function badgeFor(step) {
  if (step.is_primary) return "PRIMARY";
  const tc = step.trigger_condition;
  if (tc.mode === "date") return `ON ${formatDate(tc.fire_at)}`;
  if (tc.condition_type === "behavior" && tc.behavior) {
    return `ON ${tc.behavior.toUpperCase().replace(/_/g, " ")}`;
  }
  const unit = (tc.delay?.unit ?? "hours")[0];
  return `+${tc.delay?.value ?? 0}${unit} DELAY`;
}

export default function StepCard({ step, selected, onSelect }) {
  const meta = CHANNEL_META[step.channel] || { label: step.channel, color: "#64748B" };
  const Icon = meta.Icon;
  const hasContent = Boolean(step.channel_config?.template);

  return (
    <button
      type="button"
      data-testid={`step-card-${step.id}`}
      onClick={() => onSelect(step.id)}
      className={`w-full text-left rounded-lg border p-3 mb-3 transition-colors ${
        selected ? "border-primary ring-1 ring-primary" : "border-border hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
          {Icon && <Icon className="w-3 h-3" />}
          {meta.label}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          {badgeFor(step)}
        </span>
      </div>
      <div className="text-[13px] font-medium text-text-primary">
        {step.name || `${meta.label} Broadcast`}
      </div>
      <div className="text-[11px] mt-1" style={{ color: hasContent ? "#64748B" : "#B45309" }}>
        {hasContent ? step.channel_config.template.name : "NO TEMPLATE SELECTED"}
      </div>
    </button>
  );
}
