import React from "react";

export default function SegmentedToggle({ options, value, onChange, testIdPrefix }) {
  return (
    <div className="inline-flex gap-2" role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testIdPrefix}-toggle-${opt.value}`}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              active
                ? "bg-violet-50 border-violet-300 text-violet-700"
                : "bg-surface border-border text-text-secondary hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
