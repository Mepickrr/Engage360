import React from "react";
import { ChevronRight } from "lucide-react";

export default function ChannelRow({ title, subtitle, metadata, onClick, testId }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      data-testid={testId}
      className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary truncate">{title}</div>
        {subtitle && <div className="text-[11px] text-text-muted truncate">{subtitle}</div>}
      </div>
      {metadata && <div className="flex items-center gap-2 flex-shrink-0">{metadata}</div>}
      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
    </div>
  );
}
