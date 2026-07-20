import React from "react";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";

// Read-only, plain-English rendering of a saved segment's `audience`
// (include/exclude blockSets), built on triggerHelpers.js's existing
// block summary helpers rather than a new formatter.
export default function SegmentSummaryView({ audience }) {
  const includeText = renderBlockSetSummary(audience?.include);
  const excludeText = audience?.exclude_enabled ? renderBlockSetSummary(audience.exclude) : "";

  return (
    <div className="space-y-4" data-testid="segment-summary-view">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1.5">
          Included users
        </div>
        <div className="bg-surface border border-border rounded-lg p-3 text-sm text-text-primary" data-testid="segment-summary-include">
          {includeText || "All users"}
        </div>
      </div>

      {audience?.exclude_enabled && excludeText && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-1.5">
            Excluded users
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 text-sm text-text-primary" data-testid="segment-summary-exclude">
            {excludeText}
          </div>
        </div>
      )}
    </div>
  );
}
