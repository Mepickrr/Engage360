import React from "react";

// Clickable AND/OR pill — same component used between attribute rows AND
// between trigger groups.
export default function CombinatorPill({ value = "AND", onChange, testId }) {
  const next = value === "AND" ? "OR" : "AND";
  const isAnd = value === "AND";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(next)}
        data-testid={testId}
        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded tracking-wide transition-colors cursor-pointer ${
          isAnd
            ? "bg-primary-tint text-primary hover:bg-primary/20"
            : "bg-sky-100 text-sky-700 hover:bg-sky-200"
        }`}
      >
        {value}
      </button>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
