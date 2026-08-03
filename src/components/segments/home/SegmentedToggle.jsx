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
            {opt.badge && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
