import React, { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";
import { FLOW_TYPE_PRESETS } from "./data/mockFlowForms";

const TYPE_ORDER = ["survey", "event", "signup", "custom"];

function RadioOption({ typeKey, label, desc, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", cursor: "pointer",
        background: selected ? "#EFF6FF" : "#fff", borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <input
        type="radio"
        name="flow-type"
        aria-label={label}
        checked={selected}
        onChange={onSelect}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{label}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function SelectFlowTypeModal({ onCancel, onCreate }) {
  const [selected, setSelected] = useState("survey");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 760px)", maxHeight: "88vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select a flow type</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: "0 0 55%", overflowY: "auto", borderRight: `1px solid ${BORDER}` }}>
            {TYPE_ORDER.map((key) => (
              <RadioOption
                key={key}
                typeKey={key}
                label={FLOW_TYPE_PRESETS[key].label}
                desc={FLOW_TYPE_PRESETS[key].desc}
                selected={selected === key}
                onSelect={() => setSelected(key)}
              />
            ))}
          </div>
          <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>
              {`Preview of "${FLOW_TYPE_PRESETS[selected].label}"`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onCreate(selected)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create</button>
        </div>
      </div>
    </div>
  );
}
