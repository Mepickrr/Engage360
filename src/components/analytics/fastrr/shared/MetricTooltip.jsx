import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MetricTooltip({ name, formula, description }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="p-0 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
            data-testid="metric-tooltip-trigger"
          >
            <Info className="w-3 h-3 text-text-muted" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5">
            <div className="font-semibold">{name}</div>
            <div>{formula}</div>
            <div className="text-primary-foreground/80">{description}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
