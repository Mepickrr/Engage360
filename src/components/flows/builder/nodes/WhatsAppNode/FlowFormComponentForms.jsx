import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label, Toggle } from "./FormFields";

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function CharCounter({ value, max }) {
  return <span style={{ fontSize: 10, color: MUTED }}>{(value || "").length}/{max}</span>;
}

function RequiredRow({ required, onChange }) {
  return (
    <div
      onClick={() => onChange(!required)}
      style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, cursor: "pointer" }}
    >
      <span style={{ fontSize: 12, color: "#334155" }}>Required</span>
      <Toggle on={!!required} onChange={onChange} />
    </div>
  );
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
      <RequiredRow required={component.required} onChange={(v) => onChange({ required: v })} />
    </div>
  );
}

function OptionsForm({ component, onChange, min, max }) {
  const options = component.options || [];
  const updateOption = (i, v) => onChange({ options: options.map((o, idx) => (idx === i ? v : o)) });
  const removeOption = (i) => onChange({ options: options.filter((_, idx) => idx !== i) });
  const addOption = () => onChange({ options: [...options, ""] });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <Label htmlFor="flow-form-selection-label">Label</Label>
        <input
          id="flow-form-selection-label"
          aria-label="Label"
          value={component.label}
          maxLength={30}
          onChange={(e) => onChange({ label: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              placeholder={`Option ${i + 1}`}
              value={opt}
              maxLength={30}
              onChange={(e) => updateOption(i, e.target.value)}
              style={{ ...fieldWrapperStyle(), flex: 1 }}
            />
            {options.length > min && (
              <button type="button" aria-label="Remove option" onClick={() => removeOption(i)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < max && (
        <button type="button" onClick={addOption} style={{ fontSize: 12, color: PRIMARY, fontWeight: 500, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          + Add option
        </button>
      )}
      <RequiredRow required={component.required} onChange={(v) => onChange({ required: v })} />
    </div>
  );
}

function OptInEditContentPage({ editContent, onChange, onClose }) {
  const patch = (p) => onChange({ ...editContent, ...p });
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, background: "#F8FAFC" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Edit content</span>
        <button type="button" onClick={onClose} style={{ fontSize: 11, color: PRIMARY, background: "none", border: "none", cursor: "pointer" }}>Done</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <Label>Screen title</Label>
          <input value={editContent.title} onChange={(e) => patch({ title: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Large heading</Label>
          <input value={editContent.largeHeading} maxLength={80} onChange={(e) => patch({ largeHeading: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Small heading</Label>
          <input value={editContent.smallHeading} maxLength={80} onChange={(e) => patch({ smallHeading: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Caption</Label>
          <input value={editContent.caption} maxLength={4096} onChange={(e) => patch({ caption: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Body</Label>
          <textarea value={editContent.body} maxLength={4096} rows={3} onChange={(e) => patch({ body: e.target.value })} style={{ ...fieldWrapperStyle(), resize: "none" }} />
        </div>
        <div>
          <Label>Image</Label>
          <div
            onClick={() => patch({ imageUrl: editContent.imageUrl || "https://placehold.co/400x300?text=Image" })}
            style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: 12, textAlign: "center", cursor: "pointer", background: "#fff", fontSize: 11, color: MUTED }}
          >
            {editContent.imageUrl ? "Image selected — click to replace" : "Click to attach an image"}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptInForm({ component, onChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-consent-label">Consent label</Label>
          <CharCounter value={component.consentLabel} max={300} />
        </div>
        <textarea
          id="flow-form-consent-label"
          aria-label="Consent label"
          value={component.consentLabel}
          maxLength={300}
          rows={3}
          onChange={(e) => onChange({ consentLabel: e.target.value })}
          style={{ ...fieldWrapperStyle(), resize: "none" }}
        />
      </div>
      <div>
        <Label htmlFor="flow-form-read-more">Read More link</Label>
        <input
          id="flow-form-read-more"
          aria-label="Read More link"
          value={component.readMoreUrl}
          onChange={(e) => onChange({ readMoreUrl: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      {editing ? (
        <OptInEditContentPage
          editContent={component.editContent}
          onChange={(editContent) => onChange({ editContent })}
          onClose={() => setEditing(false)}
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} style={{ padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Edit content
        </button>
      )}
      <RequiredRow required={component.required} onChange={(v) => onChange({ required: v })} />
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
    case "single_choice":
      return <OptionsForm component={component} onChange={onChange} min={2} max={10} />;
    case "multi_choice":
    case "dropdown":
      return <OptionsForm component={component} onChange={onChange} min={1} max={10} />;
    case "opt_in":
      return <OptInForm component={component} onChange={onChange} />;
    default:
      return null;
  }
}
