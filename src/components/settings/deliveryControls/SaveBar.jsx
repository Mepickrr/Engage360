import React from "react";

export default function SaveBar({ title, subtitle, dirty, onDiscard, onSave, discardLabel = "Discard", testIdPrefix }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          disabled={!dirty}
          onClick={onDiscard}
          data-testid={`${testIdPrefix}-discard`}
          className="px-3 py-2 rounded-md border border-border text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-50"
        >
          {discardLabel}
        </button>
        <button
          type="button"
          disabled={!dirty}
          onClick={onSave}
          data-testid={`${testIdPrefix}-save`}
          className="px-3 py-2 rounded-md border border-border text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-50 enabled:bg-primary enabled:text-white enabled:border-primary enabled:hover:bg-primary-hover"
        >
          Save Configurations
        </button>
      </div>
    </div>
  );
}
