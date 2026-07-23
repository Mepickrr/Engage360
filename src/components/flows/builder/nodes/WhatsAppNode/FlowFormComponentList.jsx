import React, { useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";
import { createComponent } from "./data/mockFlowForms";

const MAX_COMPONENTS = 8;

const ADD_CONTENT_MENU = [
  { category: "Text", kinds: [
    { kind: "large_heading", label: "Large heading" },
    { kind: "small_heading", label: "Small heading" },
    { kind: "caption", label: "Caption" },
    { kind: "body", label: "Body" },
  ] },
  { category: "Media", kinds: [
    { kind: "image", label: "Image" },
  ] },
  { category: "Text answer", kinds: [
    { kind: "short_answer", label: "Short answer" },
    { kind: "paragraph", label: "Paragraph" },
    { kind: "date_picker", label: "Date picker" },
  ] },
  { category: "Selection", kinds: [
    { kind: "single_choice", label: "Single choice" },
    { kind: "multi_choice", label: "Multi choice" },
    { kind: "dropdown", label: "Dropdown" },
    { kind: "opt_in", label: "Opt-in" },
  ] },
];

const KIND_LABELS = ADD_CONTENT_MENU.flatMap((g) => g.kinds).reduce((acc, k) => ({ ...acc, [k.kind]: k.label }), {});

function AddContentMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: PRIMARY, background: "none", border: `1.5px dashed ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", width: "100%" }}
      >
        + Add content
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160 }}>
            {ADD_CONTENT_MENU.map((g) => (
              <div key={g.category} onMouseEnter={() => setHoverCategory(g.category)} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
                  {g.category}
                  <ChevronRight size={12} />
                </div>
                {hoverCategory === g.category && (
                  <div style={{ position: "absolute", left: "100%", top: 0, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160 }}>
                    {g.kinds.map((k) => (
                      <div
                        key={k.kind}
                        onClick={() => { onAdd(k.kind); setOpen(false); }}
                        style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer" }}
                      >{k.label}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FlowFormComponentList({ components, onChange, renderSettings }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const addComponent = (kind) => onChange([...components, createComponent(kind)]);
  const removeComponent = (id) => onChange(components.filter((c) => c.id !== id));
  const updateComponent = (id, patch) => onChange(components.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const onDragStart = (idx) => (e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const next = [...components];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {components.map((c, idx) => {
          const expanded = expandedId === c.id;
          return (
            <div
              key={c.id}
              data-testid="flow-form-component-row"
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(idx)}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", cursor: "grab" }}>
                <GripVertical size={13} style={{ color: MUTED, flexShrink: 0 }} />
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}
                >
                  {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{KIND_LABELS[c.kind] || c.kind}</span>
                <button
                  type="button"
                  aria-label="Delete component"
                  onClick={() => removeComponent(c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
                ><Trash2 size={13} /></button>
              </div>
              {expanded && (
                <div data-testid="component-settings-slot" style={{ padding: 10 }}>
                  {renderSettings ? renderSettings(c, (patch) => updateComponent(c.id, patch)) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {components.length < MAX_COMPONENTS ? (
        <AddContentMenu onAdd={addComponent} />
      ) : (
        <div style={{ fontSize: 11, color: MUTED }}>Maximum of 8 components reached for this screen</div>
      )}
    </div>
  );
}
