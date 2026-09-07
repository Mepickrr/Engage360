import React from "react";

export default function AttributionPair({ testId, lastClick, firstClick, formatter }) {
  return (
    <div className="flex items-center gap-4" data-testid={testId}>
      <div>
        <div className="text-[10px] text-text-muted">Last-Click</div>
        <div className="text-[15px] font-semibold text-text-primary">{formatter(lastClick)}</div>
      </div>
      <div>
        <div className="text-[10px] text-text-muted">First-Click/Open</div>
        <div className="text-[15px] font-semibold text-text-primary">{formatter(firstClick)}</div>
      </div>
    </div>
  );
}
