// src/components/settings/channels/Badge.jsx
import React from "react";

const TONES = {
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  violet:  "bg-violet-50 text-violet-700 border-violet-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  rose:    "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Badge({ tone = "slate", children, testId }) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
