import React from "react";
import { Trash2 } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label, Toggle } from "./FormFields";

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function CharCounter({ value, max }) {
  return <span style={{ fontSize: 10, color: MUTED }}>{(value || "").length}/{max}</span>;
}

function TextKindForm({ component, onChange, max }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Label>Text</Label>
        <CharCounter value={component.text} max={max} />
      </div>
      {max > 80 ? (
        <textarea
          value={component.text}
          maxLength={max}
          rows={4}
          onChange={(e) => onChange({ text: e.target.value })}
          style={{ ...fieldWrapperStyle(), resize: "none" }}
        />
      ) : (
        <input
          value={component.text}
          maxLength={max}
          onChange={(e) => onChange({ text: e.target.value })}
          style={fieldWrapperStyle()}
        />
      )}
    </div>
  );
}

function ImageForm({ component, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <Label>Choose JPG or PNG file</Label>
        <div
          onClick={() => onChange({ url: component.url || "https://placehold.co/400x300?text=Image" })}
          style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: 14, textAlign: "center", cursor: "pointer", background: "#F8FAFC", fontSize: 11, color: MUTED }}
        >
          {component.url ? "Image selected — click to replace" : "Drag and drop your file, or choose file on your device"}
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Maximum file size: 300 KB · Acceptable file types: JPEG, PNG</div>
      </div>
      <div>
        <Label htmlFor="flow-form-image-height">Image height</Label>
        <input
          id="flow-form-image-height"
          aria-label="Image height"
          type="number"
          value={component.height}
          onChange={(e) => onChange({ height: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
    </div>
  );
}

const SHORT_ANSWER_INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "password", label: "Password" },
  { value: "number", label: "Number" },
];

function TextAnswerForm({ component, onChange, showInputType }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {showInputType && (
        <div>
          <Label htmlFor="flow-form-input-type">Input type</Label>
          <select
            id="flow-form-input-type"
            aria-label="Input type"
            value={component.inputType}
            onChange={(e) => onChange({ inputType: e.target.value })}
            style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            {SHORT_ANSWER_INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-label">Label</Label>
          <CharCounter value={component.label} max={20} />
        </div>
        <input
          id="flow-form-label"
          aria-label="Label"
          value={component.label}
          maxLength={20}
          onChange={(e) => onChange({ label: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-instructions">Instructions · Optional</Label>
          <CharCounter value={component.instructions} max={80} />
        </div>
        <input
          id="flow-form-instructions"
          aria-label="Instructions"
          value={component.instructions}
          maxLength={80}
          onChange={(e) => onChange({ instructions: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <span onClick={() => onChange({ required: !component.required })} style={{ fontSize: 12, color: "#334155", cursor: "pointer" }}>Required</span>
        <Toggle on={!!component.required} onChange={(v) => onChange({ required: v })} />
      </div>
    </div>
  );
}

export default function ComponentSettingsForm({ component, onChange }) {
  switch (component.kind) {
    case "large_heading":
    case "small_heading":
      return <TextKindForm component={component} onChange={onChange} max={80} />;
    case "caption":
    case "body":
      return <TextKindForm component={component} onChange={onChange} max={4096} />;
    case "image":
      return <ImageForm component={component} onChange={onChange} />;
    case "short_answer":
      return <TextAnswerForm component={component} onChange={onChange} showInputType />;
    case "paragraph":
    case "date_picker":
      return <TextAnswerForm component={component} onChange={onChange} showInputType={false} />;
    default:
      return null;
  }
}
