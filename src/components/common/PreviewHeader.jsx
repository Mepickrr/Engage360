import React from "react";
import { toast } from "sonner";

/**
 * Shared header used by Phase-3 preview pages. Title + subtitle on the left,
 * optional action(s) on the right. Designed to feel like a real product
 * screen, not a "coming soon" placeholder.
 */
export default function PreviewHeader({
  title,
  subtitle,
  badge,
  actions,
  testIdPrefix = "preview",
}) {
  return (
    <header
      className="flex items-start justify-between gap-4 mb-6"
      data-testid={`${testIdPrefix}-header`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1
            className="text-[28px] font-semibold tracking-tight text-text-primary"
            data-testid={`${testIdPrefix}-title`}
          >
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-tint text-primary uppercase tracking-wide">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// Tiny helper so every preview button's no-op behaves identically.
export const previewToast = (message = "This is a preview — coming in a future phase") =>
  toast(message);

// Reusable KPI tile — used across all 7 preview pages.
export function KpiTile({ label, value, delta, deltaTone = "positive", testId }) {
  const toneClass =
    deltaTone === "positive"
      ? "text-emerald-700 bg-emerald-50"
      : deltaTone === "negative"
        ? "text-rose-700 bg-rose-50"
        : "text-slate-600 bg-slate-100";
  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
          {label}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${toneClass}`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">
        {value}
      </div>
    </div>
  );
}
