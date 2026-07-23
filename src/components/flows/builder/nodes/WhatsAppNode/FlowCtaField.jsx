import React from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";

const DEFAULT_CTA = { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null };

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

export default function FlowCtaField({ field, value, onChange }) {
  const cta = value || DEFAULT_CTA;
  const patch = (next) => {
    const merged = { ...cta, ...next };
    onChange(merged);
  };
  const linked = !!cta.flowFormId;

  return (
    <div>
      <Label>Call to action</Label>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, position: "relative" }}>
        <button
          type="button"
          onClick={() => patch({ flowFormId: null, flowFormName: null })}
          aria-label="Remove call to action link"
          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: MUTED }}
        >
          <X size={14} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, paddingRight: 20 }}>
          <div>
            <Label>Type of action</Label>
            <select value="complete_flow" onChange={() => {}} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="complete_flow">Complete flow</option>
            </select>
          </div>
          <div>
            <Label>Button icon</Label>
            <select value={cta.buttonIcon} onChange={(e) => patch({ buttonIcon: e.target.value })} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="default">Default</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Button text</Label>
            <span style={{ fontSize: 10, color: MUTED }}>{(cta.buttonText || "").length}/40</span>
          </div>
          <input
            value={cta.buttonText}
            maxLength={40}
            onChange={(e) => patch({ buttonText: e.target.value })}
            style={fieldWrapperStyle()}
          />
        </div>

        {!linked ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              + Create new
            </button>
            <button type="button" style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              Use existing
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{cta.flowFormName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
