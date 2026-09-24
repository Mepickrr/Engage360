import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Cosmetic only — this app has always been single-store (see
// MOCK_STORE_ACTIVITY), so switching the selection here doesn't change any
// funnel/hero data. Matches the prototype's own store-selector chrome
// (Myshop1 / Myshop2 / All shops).
const STORES = [
  { name: "Mystore1", sub: "mystore1.in" },
  { name: "Mystore2", sub: "mystore2.in" },
  { name: "All stores", sub: "Combined view · 2 stores" },
];

export default function StoreSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(STORES[0].name);

  const current = STORES.find((s) => s.name === selected);

  return (
    <div className="relative inline-block" data-testid="store-selector">
      <button
        type="button"
        data-testid="store-selector-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-md border border-border bg-surface text-sm font-semibold text-text-primary hover:border-primary/50 transition-colors"
      >
        <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
          {current.name.charAt(0).toUpperCase()}
        </span>
        {current.name}
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
          {STORES.map((s) => (
            <button
              key={s.name}
              type="button"
              data-testid={`store-selector-option-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => {
                setSelected(s.name);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-app-bg text-left"
            >
              <span>
                <span className="block text-sm font-medium text-text-primary">{s.name}</span>
                <span className="block text-xs text-text-secondary">{s.sub}</span>
              </span>
              {selected === s.name && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
