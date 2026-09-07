import React from "react";

export default function SectionEmptyState({ testId }) {
  return (
    <div data-testid={testId} className="flex items-center justify-center py-12 text-center text-text-muted bg-surface border border-border rounded-lg">
      <p className="text-sm">No data for this range/channel yet — try widening the date range or switching channels.</p>
    </div>
  );
}
