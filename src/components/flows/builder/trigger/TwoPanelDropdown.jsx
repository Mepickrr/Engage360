import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Search, X } from "lucide-react";

/**
 * Two-panel hover dropdown. Uses a portal + fixed positioning so the popover
 * escapes overflow-hidden ancestors (e.g. modal scrollers, condition blocks).
 *
 * Radix Dialog attaches a native `document.addEventListener('pointerdown', ...)`
 * to detect outside-clicks and calls preventDefault() on it, which breaks the
 * click chain. We block that by attaching a native stopPropagation listener
 * directly to the portal DOM node (bubble phase, before document is reached).
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
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState("");
  const [hoverItem, setHoverItem] = useState(null);
  const [popStyle, setPopStyle]   = useState({});
  const triggerRef = useRef(null);
  const popRef     = useRef(null);

  // Compute fixed position from trigger bounding rect.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function position() {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
      setPopStyle({
        position: "fixed",
        zIndex: 9999,
        width,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [open, width]);

  // Attach native stopPropagation on the portal node so Radix DismissableLayer
  // (which listens for pointerdown/mousedown on document in bubble phase) never
  // sees events that originate inside our popover.
  useEffect(() => {
    const el = popRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("pointerdown", stop);
    el.addEventListener("mousedown",   stop);
    return () => {
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("mousedown",   stop);
    };
  // Re-run after each open cycle so the ref is always fresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click (our own handler — uses mousedown for instant close).
  useEffect(() => {
    function onDoc(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target))     return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const flatItems = useMemo(() => {
    const out = [];
    for (const cat of Object.keys(groups)) {
      for (const it of groups[cat] || []) out.push({ ...it, category: cat });
    }
    return out;
  }, [groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return flatItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q),
    );
  }, [search, flatItems]);

  const activeDesc =
    (hoverItem || flatItems.find((it) => it.name === value))?.description ||
    "Hover an item to see its description.";

  const handleSelect = useCallback(
    (name) => {
      onChange(name);
      setOpen(false);
      setSearch("");
      setHoverItem(null);
    },
    [onChange],
  );

  const popover = open
    ? ReactDOM.createPortal(
        <div
          ref={popRef}
          className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          style={popStyle}
          data-testid={`${testId}-popover`}
        >
          {/* Search bar */}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearch("")}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Two-panel body */}
          <div className="flex" style={{ maxHeight: 320 }}>
            <ul
              className="w-[55%] overflow-y-auto border-r border-border py-1"
              data-testid={`${testId}-list`}
            >
              {filtered != null ? (
                <>
                  {filtered.length === 0 && (
                    <li className="px-3 py-3 text-xs text-text-muted">No matches</li>
                  )}
                  {filtered.map((it) => (
                    <ItemRow
                      key={it.name}
                      it={it}
                      selected={it.name === value}
                      onHover={() => setHoverItem(it)}
                      onSelect={handleSelect}
                      testId={`${testId}-item-${it.name}`}
                    />
                  ))}
                </>
              ) : (
                Object.keys(groups).map((cat) => {
                  const items = groups[cat] || [];
                  if (!items.length) return null;
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
                            onSelect={handleSelect}
                            testId={`${testId}-item-${it.name}`}
                          />
                        ))}
                      </ul>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="w-[45%] p-3 bg-slate-50/60 overflow-y-auto">
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
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="inline-block" ref={triggerRef}>
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
        <span className={value ? "text-text-primary truncate" : "text-text-muted"}>
          {value || placeholder}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="flex-shrink-0">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {popover}
    </div>
  );
}

// Uses onPointerDown for selection so it fires before Radix DismissableLayer
// can call preventDefault() on the event chain and suppress the click.
function ItemRow({ it, selected, onHover, onSelect, testId }) {
  return (
    <li
      onMouseEnter={onHover}
      onPointerDown={(e) => {
        e.preventDefault(); // prevent focus loss
        onSelect(it.name);
      }}
      data-testid={testId}
      className={`px-3 py-1.5 text-sm cursor-pointer select-none ${
        selected
          ? "bg-primary-tint text-primary font-medium"
          : "hover:bg-slate-100 text-text-primary"
      }`}
    >
      {it.name}
    </li>
  );
}
