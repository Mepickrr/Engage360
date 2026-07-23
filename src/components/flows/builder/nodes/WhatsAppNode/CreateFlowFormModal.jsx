import React, { useState } from "react";
import { GripVertical, X, Plus } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";
import { createBlankScreen, FLOW_TYPE_PRESETS } from "./data/mockFlowForms";
import FlowFormComponentList from "./FlowFormComponentList";
import ComponentSettingsForm from "./FlowFormComponentForms";
import FlowFormPreview from "./FlowFormPreview";

const MAX_SCREENS = 8;

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function ScreensPanel({ screens, activeScreenId, onSelect, onAdd, onRemove, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const onDragStart = (idx) => (e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    onReorder(dragIndex, idx);
    setDragIndex(null);
  };

  return (
    <div style={{ flex: "0 0 200px", borderRight: `1px solid ${BORDER}`, padding: 12, overflowY: "auto" }}>
      <Label>Screens</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {screens.map((s, idx) => (
          <div
            key={s.id}
            data-testid="flow-form-screen-row"
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop(idx)}
            onClick={() => onSelect(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, cursor: "grab",
              background: activeScreenId === s.id ? "#EFF6FF" : "#fff", border: `1px solid ${activeScreenId === s.id ? PRIMARY : BORDER}`,
            }}
          >
            <GripVertical size={13} style={{ color: MUTED, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.title || "Untitled"}
            </span>
            {screens.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, flexShrink: 0 }}
              ><X size={12} /></button>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div>
          <input
            autoFocus
            placeholder="Screen name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ ...fieldWrapperStyle(), marginBottom: 6 }}
          />
          <button
            type="button"
            onClick={() => { onAdd(newName || "Screen"); setNewName(""); setAdding(false); }}
            style={{ width: "100%", padding: "6px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >Add</button>
        </div>
      ) : screens.length < MAX_SCREENS ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{ fontSize: 12, color: PRIMARY, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
        >+ Add new</button>
      ) : (
        <div style={{ fontSize: 11, color: MUTED }}>Maximum of 8 screens reached</div>
      )}
    </div>
  );
}

export default function CreateFlowFormModal({ seed, onCancel, onSave }) {
  const [name] = useState(seed.editingForm?.name || FLOW_TYPE_PRESETS[seed.flowType]?.label || "Custom form");
  const [screens, setScreens] = useState(seed.editingForm?.screens || seed.initialScreens || [createBlankScreen("Your form")]);
  const [activeScreenId, setActiveScreenId] = useState((seed.editingForm?.screens || seed.initialScreens || [])[0]?.id);

  const activeScreen = screens.find((s) => s.id === activeScreenId) || screens[0];

  const updateScreen = (id, patch) => setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addScreen = (title) => {
    const s = createBlankScreen(title);
    setScreens((prev) => [...prev, s]);
    setActiveScreenId(s.id);
  };
  const removeScreen = (id) => {
    setScreens((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeScreenId === id) setActiveScreenId(next[0]?.id);
      return next;
    });
  };
  const reorderScreens = (fromIdx, toIdx) => setScreens((prev) => {
    const next = [...prev];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return next;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(96vw, 1100px)", height: "88vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Create flow</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ScreensPanel
            screens={screens}
            activeScreenId={activeScreen?.id}
            onSelect={setActiveScreenId}
            onAdd={addScreen}
            onRemove={removeScreen}
            onReorder={reorderScreens}
          />

          <div style={{ flex: 1, overflowY: "auto", padding: 16, borderRight: `1px solid ${BORDER}` }}>
            <div style={{ marginBottom: 14 }}>
              <Label>Screen title</Label>
              <input
                value={activeScreen?.title || ""}
                onChange={(e) => updateScreen(activeScreen.id, { title: e.target.value })}
                style={fieldWrapperStyle()}
              />
            </div>

            {/* Component list — filled in by Task 7 */}
            <FlowFormComponentList
              components={activeScreen?.components || []}
              onChange={(components) => updateScreen(activeScreen.id, { components })}
              renderSettings={(component, onChangeComponent) => (
                <ComponentSettingsForm component={component} onChange={onChangeComponent} />
              )}
            />

            <div style={{ marginTop: 14 }}>
              <Label>Continue button label</Label>
              <input
                value={activeScreen?.continueLabel || ""}
                onChange={(e) => updateScreen(activeScreen.id, { continueLabel: e.target.value })}
                style={fieldWrapperStyle()}
              />
            </div>
          </div>

          <div style={{ flex: "0 0 300px", background: "#F8FAFC", padding: 16, overflowY: "auto" }}>
            <FlowFormPreview screen={activeScreen} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 11, color: MUTED }}>Once your message template has been created, this flow cannot be edited.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => onSave({ name, screens })} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
