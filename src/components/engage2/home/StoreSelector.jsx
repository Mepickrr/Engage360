import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Cosmetic only — this app has always been single-store (see
// MOCK_STORE_ACTIVITY), so there is exactly one real option here. Matches
// the prototype's store-selector chrome without a functional second store.
const STORE_NAME = "Mystore1";

export default function StoreSelector() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block" data-testid="store-selector">
      <button
        type="button"
        data-testid="store-selector-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-md border border-border bg-surface text-sm font-semibold text-text-primary hover:border-primary/50 transition-colors"
      >
        <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
          {STORE_NAME.charAt(0).toUpperCase()}
        </span>
        {STORE_NAME}
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>
      {open && (
        <div
          className="absolute top-11 left-0 w-56 bg-surface border border-border rounded-lg shadow-lg p-1.5 z-10"
          data-testid="store-selector-menu"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted px-2.5 py-1.5">
            Select store
          </div>
          <button
            type="button"
            data-testid="store-selector-option"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-app-bg text-left"
          >
            <span>
              <span className="block text-sm font-medium text-text-primary">{STORE_NAME}</span>
              <span className="block text-xs text-text-secondary">mystore1.in</span>
            </span>
            <Check className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      )}
    </div>
  );
}
