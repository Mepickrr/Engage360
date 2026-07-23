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
    default:
      return null;
  }
}
