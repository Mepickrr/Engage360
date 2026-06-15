import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Search, X } from "lucide-react";

/**
 * Two-panel hover dropdown built on Radix Popover so it plays nicely with
 * Radix Dialog — focus trapping, outside-click detection and scroll-lock are
 * all handled by the shared Radix layer stack, meaning the search input is
 * fully focusable and typeable even when the dropdown is inside a Dialog.
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
  const searchRef                 = useRef(null);

  // Focus the search input after the popover opens (autoFocus is unreliable
  // in portals; a small delay lets Radix's focus-scope settle first).
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    } else {
      setSearch("");
      setHoverItem(null);
    }
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

  const activeItem = hoverItem || flatItems.find((it) => it.name === value) || null;

  const handleSelect = useCallback(
    (name) => {
      onChange(name);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
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
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          style={{ width, zIndex: 9999 }}
          className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          data-testid={`${testId}-popover`}
          // Prevent Popover from stealing focus from our manually-focused search input
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Don't close when clicking the trigger button (Popover handles toggle via open state)
          onInteractOutside={(e) => {
            const trigger = document.querySelector(`[data-testid="${testId}-trigger"]`);
            if (trigger?.contains(e.target)) e.preventDefault();
          }}
        >
          {/* Search bar */}
          <div className="border-b border-border p-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted ml-1" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 text-sm px-1 py-0.5 focus:outline-none bg-transparent"
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
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
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
                            onHover={() => setHoverItem({ ...it, category: cat })}
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
                {activeItem?.category || ""}
              </div>
              <div className="text-sm font-semibold text-text-primary mb-1">
                {activeItem?.name || ""}
              </div>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {activeItem?.description || "Hover an item to see its description."}
              </p>
              {activeItem && (activeItem.source || (activeItem.device_tag && activeItem.device_tag.length > 0)) && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {activeItem.source &&
                    activeItem.source.split(", ").filter(Boolean).map((s) => (
                      <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  {activeItem.device_tag &&
                    activeItem.device_tag.map((d) => (
                      <span key={d} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        {d}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function ItemRow({ it, selected, onHover, onSelect, testId }) {
  return (
    <li
      onMouseEnter={onHover}
      onPointerEnter={onHover}
      onPointerDown={(e) => {
        e.preventDefault();
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
