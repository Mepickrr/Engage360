import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Search, ChevronDown, ChevronRight, X, Plus } from "lucide-react";
import { VARIABLE_GROUPS } from "./data/mockData";

const BLUE   = "#3B82F6";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// Flattened list for searching
const ALL_VARS = VARIABLE_GROUPS.flatMap((g) =>
  g.variables.map((v) => ({ ...v, groupLabel: g.label, groupId: g.id }))
);

function resolveLabel(key) {
  return ALL_VARS.find((v) => v.key === key)?.label ?? key;
}

// ── Variable pill shown in the field when a variable is selected ──
function VariablePill({ varKey, onClear }) {
  const label = resolveLabel(varKey);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px 4px 10px", borderRadius: 20,
      background: "#EFF6FF", border: `1px solid #BFDBFE`,
      maxWidth: "100%",
    }}>
      <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, fontFamily: "monospace" }}>
        {`{{${label}}}`}
      </span>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 0, display: "flex", color: "#93C5FD",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Main VariablePicker used for each field row ───────────────────
export default function VariablePicker({ value, onChange, fieldLabel, fieldType }) {
  const [open, setOpen]                   = useState(false);
  const [search, setSearch]               = useState("");
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [expandedGroups, setExpandedGroups]   = useState(new Set(["customer", "product"]));
  const [popStyle, setPopStyle]           = useState({});

  const triggerRef = useRef(null);
  const popRef     = useRef(null);

  // Fixed positioning from trigger rect
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function position() {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 340 && rect.top > spaceBelow;
      setPopStyle({
        position: "fixed",
        zIndex: 9999,
        width: 300,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 308)),
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        maxHeight: 340,
        display: "flex",
        flexDirection: "column",
      });
    }
    position();
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [open]);

  // Native stop-propagation to prevent Radix dialog from eating clicks
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
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target))     return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const q = search.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    return VARIABLE_GROUPS.map((g) => ({
      ...g,
      variables: g.variables.filter((v) => {
        const matchesSearch = !q || v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q);
        const matchesRec    = !onlyRecommended || v.recommended;
        return matchesSearch && matchesRec;
      }),
    })).filter((g) => g.variables.length > 0);
  }, [q, onlyRecommended]);

  function toggleGroup(id) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectVar(key) {
    onChange(key);
    setOpen(false);
    setSearch("");
  }

  const popover = open ? ReactDOM.createPortal(
    <div
      ref={popRef}
      style={{
        ...popStyle,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        overflow: "hidden",
      }}
    >
      {/* Search + toggle row */}
      <div style={{ flexShrink: 0, padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", border: `1px solid ${BORDER}`,
          borderRadius: 8, marginBottom: 8,
        }}>
          <Search size={12} color={MUTED} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            autoFocus
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 13, background: "transparent",
            }}
          />
          {search && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <X size={12} color={MUTED} />
            </button>
          )}
        </div>
        {/* Only recommended toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#374151" }}>Only Recommended</span>
          <div
            onClick={() => setOnlyRecommended((p) => !p)}
            style={{
              width: 36, height: 20, borderRadius: 10, cursor: "pointer",
              background: onlyRecommended ? BLUE : "#E5E7EB",
              position: "relative", transition: "background 0.15s",
            }}
          >
            <div style={{
              position: "absolute",
              top: 3, left: onlyRecommended ? 19 : 3,
              width: 14, height: 14, borderRadius: "50%",
              background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left 0.15s",
            }} />
          </div>
        </div>
      </div>

      {/* Group list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredGroups.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: MUTED }}>
            No variables match
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isOpen = expandedGroups.has(group.id) || !!q;
            return (
              <div key={group.id} style={{ borderBottom: `1px solid #F1F5F9` }}>
                {/* Group header */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", cursor: "pointer",
                    background: "#FAFAFA",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {group.label}
                  </span>
                  {isOpen
                    ? <ChevronDown size={14} color={MUTED} />
                    : <ChevronRight size={14} color={MUTED} />
                  }
                </div>
                {/* Variables */}
                {isOpen && (
                  <div>
                    {group.variables.map((v) => (
                      <div
                        key={v.key}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectVar(v.key)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 14px 8px 20px", cursor: "pointer",
                          background: v.key === value ? "#EFF6FF" : "transparent",
                          borderLeft: v.key === value ? `3px solid ${BLUE}` : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => { if (v.key !== value) e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={(e) => { if (v.key !== value) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#1E293B" }}>{v.label}</div>
                          <div style={{ fontSize: 10, color: MUTED, fontFamily: "monospace" }}>{`{{${v.key}}}`}</div>
                        </div>
                        <span style={{
                          fontSize: 10, padding: "1px 5px", borderRadius: 4,
                          background: "#F1F5F9", color: "#64748B",
                        }}>
                          {v.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={triggerRef}>
      {/* Field trigger area */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          minHeight: 44, padding: "8px 12px",
          border: `1.5px solid ${open ? BLUE : BORDER}`,
          borderRadius: 8, cursor: "pointer",
          background: "#fff",
          display: "flex", alignItems: "center",
          boxShadow: open ? `0 0 0 3px ${BLUE}22` : "none",
          transition: "border-color 0.12s, box-shadow 0.12s",
        }}
      >
        {value ? (
          <VariablePill varKey={value} onClear={() => onChange(null)} />
        ) : (
          <span style={{ fontSize: 13, color: "#CBD5E1" }}>Enter your text here</span>
        )}
      </div>
      {/* Type hint + add variable row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 4,
      }}>
        <span style={{ fontSize: 11, color: MUTED }}>{fieldType}</span>
        {!value && open && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", fontSize: 11, fontWeight: 600,
              color: "#fff", background: "#1E293B",
              border: "none", borderRadius: 6, cursor: "pointer",
            }}
          >
            <Plus size={11} />
            Add variable
          </button>
        )}
      </div>
      {popover}
    </div>
  );
}
