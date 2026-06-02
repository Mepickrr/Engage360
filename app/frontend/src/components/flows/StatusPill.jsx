import React from "react";
import { STATUS_META } from "@/lib/flowMeta";

export default function StatusPill({ status, testId }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      data-testid={testId || `status-pill-${status}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.bg} ${meta.fg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
