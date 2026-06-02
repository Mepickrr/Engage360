import React, { useMemo, useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

/**
 * Two-panel hover dropdown. Items grouped by category, hover description on
 * the right, search flattens groups.
 *
 * Props:
 *   value, onChange — selected item name (string)
 *   groups — { [category]: Array<{ name, description }> }
 *   placeholder — visible trigger placeholder
 *   testId — base test id
 *   buttonClassName — optional extra classes for the trigger
 *   width — popover width in px (default 520)
 */
export default function TwoPanelDropdown({
  value,
  onChange,
  groups = {},
  placeholder = "Select…",
  testId = "two-panel",
  buttonClassName = "",
  width = 520,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoverItem, setHoverItem] = useState(null);
  const popRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Flatten groups when searching.
  const flatItems = useMemo(() => {
    const out = [];
    for (const cat of Object.keys(groups)) {
      for (const it of groups[cat] || []) {
        out.push({ ...it, category: cat });
      }
    }
    return out;
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null; // null → grouped view
    return flatItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q),
    );
  }, [search, flatItems]);

  const activeDesc = (hoverItem || flatItems.find((it) => it.name === value))
    ?.description || "Hover an item to see its description.";

  return (
    <div className="relative inline-block" ref={popRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        data-testid={`${testId}-trigger`}
        className={`h-9 px-3 text-sm rounded-md border border-border text-left inline-flex items-center justify-between gap-2 ${
          disabled
            ? "bg-slate-50 text-text-muted cursor-not-allowed"
            : "bg-surface hover:border-primary/60"
        } ${buttonClassName}`}
      >
        <span className={value ? "text-text-primary" : "text-text-muted"}>
          {value || placeholder}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          style={{ width }}
          data-testid={`${testId}-popover`}
        >
          <div className="border-b border-border p-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm px-1 py-0.5 focus:outline-none bg-transparent"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex" style={{ maxHeight: 320 }}>
            <ul
              className="w-[55%] overflow-y-auto border-r border-border py-1"
              data-testid={`${testId}-list`}
            >
              {filtered != null ? (
                <>
                  {filtered.length === 0 && (
                    <li className="px-3 py-3 text-xs text-text-muted">
                      No matches
                    </li>
                  )}
                  {filtered.map((it) => (
                    <ItemRow
                      key={it.name}
                      it={it}
                      selected={it.name === value}
                      onHover={() => setHoverItem(it)}
                      onClick={() => {
                        onChange(it.name);
                        setOpen(false);
                        setSearch("");
                      }}
                      testId={`${testId}-item-${it.name}`}
                    />
                  ))}
                </>
              ) : (
                Object.keys(groups).map((cat) => {
                  const items = groups[cat] || [];
                  if (items.length === 0) return null;
                  return (
                    <li key={cat}>
                      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-text-muted font-semibold sticky top-0 bg-surface">
                        {cat}
                      </div>
                      <ul>
                        {items.map((it) => (
                          <ItemRow
                            key={it.name}
                            it={it}
                            selected={it.name === value}
                            onHover={() => setHoverItem(it)}
                            onClick={() => {
                              onChange(it.name);
                              setOpen(false);
                              setSearch("");
                            }}
                            testId={`${testId}-item-${it.name}`}
                          />
                        ))}
                      </ul>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="w-[45%] p-3 bg-slate-50/60">
              <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-1">
                {hoverItem?.category ||
                  flatItems.find((it) => it.name === value)?.category ||
                  ""}
              </div>
              <div className="text-sm font-semibold text-text-primary mb-1">
                {hoverItem?.name ||
                  flatItems.find((it) => it.name === value)?.name ||
                  ""}
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {activeDesc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ it, selected, onHover, onClick, testId }) {
  return (
    <li
      onMouseEnter={onHover}
      onClick={onClick}
      data-testid={testId}
      className={`px-3 py-1.5 text-sm cursor-pointer ${
        selected
          ? "bg-primary-tint text-primary font-medium"
          : "hover:bg-slate-100 text-text-primary"
      }`}
    >
      {it.name}
    </li>
  );
}
