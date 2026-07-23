import React from "react";
import { X, MoreVertical } from "lucide-react";
import { BORDER, MUTED } from "./FormFields";

function ComponentPreview({ component }) {
  switch (component.kind) {
    case "large_heading":
      return <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{component.text || "Large heading"}</div>;
    case "small_heading":
      return <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{component.text || "Small heading"}</div>;
    case "caption":
      return <div style={{ fontSize: 11, color: MUTED }}>{component.text || "Caption"}</div>;
    case "body":
      return <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{component.text || "Body text"}</div>;
    case "image":
      return (
        <div style={{ height: 90, background: "#E2E8F0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: MUTED }}>
          {component.url ? "🖼 Image" : "No image selected"}
        </div>
      );
    case "short_answer":
    case "paragraph":
    case "date_picker":
      return (
        <div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: MUTED }}>
            {component.label || "Label"}
          </div>
          {component.instructions && <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{component.instructions}</div>}
        </div>
      );
    case "single_choice":
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{component.label || "Label"}</div>
          {(component.options || []).map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${BORDER}` }} />
              <span style={{ fontSize: 12, color: "#334155" }}>{opt || `Option ${i + 1}`}</span>
            </div>
          ))}
        </div>
      );
    case "multi_choice":
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{component.label || "Label"}</div>
          {(component.options || []).map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${BORDER}` }} />
              <span style={{ fontSize: 12, color: "#334155" }}>{opt || `Option ${i + 1}`}</span>
            </div>
          ))}
        </div>
      );
    case "dropdown":
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{component.label || "Label"}</div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{(component.options || [])[0] || "Select an option"}</span>
            <span style={{ color: MUTED, fontSize: 10 }}>▾</span>
          </div>
        </div>
      );
    case "opt_in":
      return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${BORDER}`, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#334155" }}>{component.consentLabel || "Consent label"}</span>
        </div>
      );
    default:
      return null;
  }
}

export default function FlowFormPreview({ screen }) {
  const components = screen?.components || [];
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div style={{ height: 16, background: "#CBD5E1" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <X size={16} color={MUTED} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{screen?.title || "Your form"}</span>
        <MoreVertical size={16} color={MUTED} />
      </div>
      <div style={{ padding: 14, minHeight: 180, display: "flex", flexDirection: "column", gap: 12 }}>
        {components.length === 0 ? (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
            Select 'Add content' to start building your form. To add new screens, select 'Add new' in the 'Screens' panel.
          </div>
        ) : (
          components.map((c) => <ComponentPreview key={c.id} component={c} />)
        )}
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ background: "#25D366", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 24, fontSize: 13, fontWeight: 600 }}>
          {screen?.continueLabel || "Continue"}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: MUTED, marginTop: 6 }}>
          Managed by the business. Learn more
        </div>
      </div>
    </div>
  );
}
