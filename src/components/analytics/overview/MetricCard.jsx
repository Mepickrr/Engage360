import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MetricCard({ testId, label, value, delta, subBadge, infoText }) {
  const deltaToneClass =
    delta?.tone === "negative"
      ? "text-rose-700 bg-rose-50"
      : "text-emerald-700 bg-emerald-50";

  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
        {infoText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-text-muted" />
              </TooltipTrigger>
              <TooltipContent>{infoText}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {subBadge && (
          <span
            data-testid={`${testId}-badge`}
            className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-tint text-primary"
          >
            {subBadge}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">{value}</div>
      {delta && (
        <div className="mt-1 flex items-center gap-1">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${deltaToneClass}`}
          >
            {delta.text}
          </span>
          <span className="text-[11px] text-text-muted">vs last period</span>
        </div>
      )}
    </div>
  );
}
