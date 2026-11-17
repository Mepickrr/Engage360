import React from "react";
import { ShieldAlert, PauseCircle, Bell, CheckCircle2, Info } from "lucide-react";

// Meta per-delivered-message rates (₹), same values the Broadcasts report uses.
export const META_RATES = { Utility: 0.15, Marketing: 0.85 };

/**
 * "Pause on category change" guard for WhatsApp broadcasts.
 *
 * Stored on the step's channel_config as `pauseOnCategoryChange: { enabled }`.
 * When enabled and Meta re-categorises the selected template from Utility to
 * Marketing mid-send, the broadcast pauses the remaining sends instead of
 * continuing at the Marketing rate.
 *
 * States:
 *  - no template yet      → checkbox usable, says it only acts on Utility templates
 *  - Utility template     → checkbox usable; when on, shows what happens + spend at risk
 *  - non-Utility template → checkbox disabled (nothing to protect against)
 */
export default function PauseOnCategoryChangeCheck({ template, enabled, onChange, audienceCount = 0, fallbackOnCategoryChange }) {
  const category = template?.type;
  const applicable = !template || category === "Utility";
  const checked = applicable && !!enabled;
  const extraPerMsg = META_RATES.Marketing - META_RATES.Utility;
  const atRisk = audienceCount * extraPerMsg;

  return (
    <div
      data-testid="pause-on-category-change"
      className={`rounded-lg border p-3.5 transition-colors ${
        checked ? "border-violet-300 bg-violet-50/50" : "border-border bg-surface"
      } ${applicable ? "" : "opacity-70"}`}
    >
      <label className={`flex items-start gap-3 ${applicable ? "cursor-pointer" : "cursor-not-allowed"}`}>
        <input
          type="checkbox"
          data-testid="pause-on-category-change-toggle"
          checked={checked}
          disabled={!applicable}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-primary"
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
            <ShieldAlert className="w-4 h-4 text-violet-600" />
            Pause if Meta changes the template category
          </span>
          <span className="block mt-1.5 text-[11px] text-text-muted leading-relaxed">
            Meta can re-categorise a Utility template as Marketing while a broadcast is sending. Turn this on to
            stop the remaining messages instead of paying the Marketing rate for them.
          </span>
        </span>
      </label>

      {!applicable && (
        <p data-testid="pause-on-category-change-na" className="mt-2 ml-7 flex items-center gap-1.5 text-[11px] text-text-muted">
          <Info className="w-3.5 h-3.5" />
          Only applies to Utility templates. <strong className="text-text-secondary">{template.name}</strong> is already{" "}
          {category}.
        </p>
      )}

      {checked && template && (
        <div data-testid="pause-on-category-change-details" className="mt-3 ml-7 space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">If the category changes</div>
          <ul className="space-y-1.5 text-[12px] text-text-secondary">
            <li className="flex gap-2">
              <PauseCircle className="w-4 h-4 shrink-0 text-violet-600" />
              The broadcast pauses straight away. No more messages are sent at the Marketing rate.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              Messages already sent are not affected and still count in the report.
            </li>
            <li className="flex gap-2">
              <Bell className="w-4 h-4 shrink-0 text-amber-600" />
              You get an email and in-app alert. You can resume at the Marketing rate or switch the template from the Broadcasts page.
            </li>
          </ul>
          {audienceCount > 0 && (
            <div
              data-testid="pause-on-category-change-risk"
              className="flex items-center justify-between rounded-md bg-white border border-violet-200 px-3 py-2 text-[12px]"
            >
              <span className="text-text-secondary">Extra spend this protects against (worst case)</span>
              <strong className="tabular-nums text-text-primary">
                up to ₹{atRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </strong>
            </div>
          )}
          {fallbackOnCategoryChange && (
            <p data-testid="pause-on-category-change-conflict" className="flex gap-1.5 text-[11px] text-amber-800 bg-amber-50 rounded-md px-2.5 py-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              The category-change fallback template is also on. Pausing takes priority: the broadcast stops and the
              fallback template is not sent.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
