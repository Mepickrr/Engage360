import React from "react";
import { computeFunnelStagePercents } from "./funnelMath";

export default function FunnelChart({ testId, stages }) {
  const computed = computeFunnelStagePercents(stages);
  return (
    <div data-testid={testId} className="space-y-2">
      {computed.map((s) => (
        <div key={s.key} data-testid={`${testId}-stage-${s.key}`}>
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="font-medium text-text-primary">{s.label}</span>
            <span className="text-text-muted tabular-nums">
              {s.count.toLocaleString("en-IN")} · {s.pctOfTotal.toFixed(1)}% of total · {s.pctOfPrevious.toFixed(1)}% of prev
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(s.pctOfTotal, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
