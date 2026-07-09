import React from "react";

export default function CenterConfigPanel({ step }) {
  return (
    <div className="flex-1 border-r border-border bg-white p-4" data-testid="center-config-panel">
      {!step && <p className="text-sm text-text-muted">Select a step to configure it.</p>}
    </div>
  );
}
