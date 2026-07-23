import React, { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";
import { MOCK_FLOW_FORMS, FLOW_TYPE_PRESETS } from "./data/mockFlowForms";
import SelectFlowTypeModal from "./SelectFlowTypeModal";
import CreateFlowFormModal from "./CreateFlowFormModal";
import SelectFlowFormModal from "./SelectFlowFormModal";
import FlowFormPreview from "./FlowFormPreview";

const DEFAULT_CTA = { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null };

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function PreviewOverlay({ form, onClose }) {
  const [screenIdx, setScreenIdx] = useState(0);
  const screen = form.screens[screenIdx];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(90vw, 360px)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{form.name}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={16} /></button>
        </div>
        <FlowFormPreview screen={screen} />
        {form.screens.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <button disabled={screenIdx === 0} onClick={() => setScreenIdx((i) => i - 1)} style={{ fontSize: 12, color: screenIdx === 0 ? MUTED : PRIMARY, background: "none", border: "none", cursor: screenIdx === 0 ? "default" : "pointer" }}>← Previous</button>
            <span style={{ fontSize: 11, color: MUTED }}>Screen {screenIdx + 1} of {form.screens.length}</span>
            <button disabled={screenIdx === form.screens.length - 1} onClick={() => setScreenIdx((i) => i + 1)} style={{ fontSize: 12, color: screenIdx === form.screens.length - 1 ? MUTED : PRIMARY, background: "none", border: "none", cursor: screenIdx === form.screens.length - 1 ? "default" : "pointer" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlowCtaField({ field, value, onChange }) {
  const cta = value || DEFAULT_CTA;
  const patch = (next) => onChange({ ...cta, ...next });
  const linked = !!cta.flowFormId;

  const [customForms, setCustomForms] = useState([]);
  const [step, setStep] = useState(null); // null | "type" | "builder" | "browse"
  const [builderSeed, setBuilderSeed] = useState(null); // { flowType, initialScreens }
  const [previewForm, setPreviewForm] = useState(null);

  const allForms = [...MOCK_FLOW_FORMS, ...customForms];
  const linkedForm = allForms.find((f) => f.id === cta.flowFormId) || null;

  const handleCreateType = (flowType) => {
    setBuilderSeed({ flowType, initialScreens: FLOW_TYPE_PRESETS[flowType].seedScreens });
    setStep("builder");
  };

  const handleSaveForm = ({ name, screens }) => {
    const form = { id: `ff_${Date.now()}`, name, flowType: builderSeed.flowType, updatedAt: "Just now", screens };
    setCustomForms((prev) => [...prev, form]);
    patch({ flowFormId: form.id, flowFormName: form.name });
    setStep(null);
  };

  const handleSelectForm = (form) => {
    patch({ flowFormId: form.id, flowFormName: form.name });
    setStep(null);
  };

  return (
    <div>
      <Label>Call to action</Label>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, position: "relative" }}>
        {linked && (
          <button
            type="button"
            onClick={() => patch({ flowFormId: null, flowFormName: null })}
            aria-label="Remove call to action link"
            style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: MUTED }}
          >
            <X size={14} />
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, paddingRight: linked ? 20 : 0 }}>
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
            <button type="button" onClick={() => setStep("type")} style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              + Create new
            </button>
            <button type="button" onClick={() => setStep("browse")} style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              Use existing
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cta.flowFormName}
            </span>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={() => linkedForm && setPreviewForm(linkedForm)} style={{ fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                Preview
              </button>
              <button type="button" onClick={() => setStep("browse")} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {step === "type" && (
        <SelectFlowTypeModal onCancel={() => setStep(null)} onCreate={handleCreateType} />
      )}
      {step === "builder" && builderSeed && (
        <CreateFlowFormModal seed={builderSeed} onCancel={() => setStep(null)} onSave={handleSaveForm} />
      )}
      {step === "browse" && (
        <SelectFlowFormModal forms={allForms} onCancel={() => setStep(null)} onSelect={handleSelectForm} onPreview={setPreviewForm} />
      )}
      {previewForm && (
        <PreviewOverlay form={previewForm} onClose={() => setPreviewForm(null)} />
      )}
    </div>
  );
}
