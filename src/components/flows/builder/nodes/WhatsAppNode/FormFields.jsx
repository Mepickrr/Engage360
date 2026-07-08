import React from "react";
import { Trash2 } from "lucide-react";

export const PRIMARY = "#6C3AE8";
export const BORDER = "#E5E7EB";
export const MUTED = "#94A3B8";

export function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function TextField({ field, value, onChange }) {
  return (
    <div>
      <Label>{field.label}</Label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} style={fieldWrapperStyle()} />
    </div>
  );
}

function TextAreaField({ field, value, onChange }) {
  return (
    <div>
      <Label>{field.label}</Label>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={field.rows || 4}
        style={{ ...fieldWrapperStyle(), resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
    </div>
  );
}

export function SelectField({ field, value, onChange }) {
  return (
    <div>
      <Label>{field.label}</Label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldWrapperStyle(), padding: "7px 28px 7px 10px", background: "#fff", appearance: "none", cursor: "pointer" }}>
        {field.options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const HEADER_TYPES = ["none", "text", "image", "video", "document"];

function HeaderPickerField({ field, value, onChange }) {
  const header = value || { type: "none" };
  return (
    <div>
      <Label>{field.label}</Label>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {HEADER_TYPES.map((t) => (
          <button key={t} type="button" onClick={() => onChange({ type: t })} style={{
            padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${header.type === t ? PRIMARY : BORDER}`,
            background: header.type === t ? "#F5F3FF" : "#fff",
            color: header.type === t ? PRIMARY : "#64748B",
            fontSize: 11, fontWeight: 500, cursor: "pointer",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {header.type === "text" && (
        <input value={header.text || ""} onChange={(e) => onChange({ ...header, text: e.target.value })} placeholder="Header text…"
          style={fieldWrapperStyle()} />
      )}
      {(header.type === "image" || header.type === "video" || header.type === "document") && (
        <div onClick={() => onChange({ ...header, url: header.url || `https://placehold.co/400x200?text=${header.type}` })}
          style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: 14, textAlign: "center", cursor: "pointer", background: "#F8FAFC", fontSize: 11, color: "#64748B" }}>
          Click to attach {header.type}
        </div>
      )}
    </div>
  );
}

function ButtonsListField({ field, value, onChange }) {
  const buttons = value || [];
  const max = field.max || 3;
  const update = (i, patch) => { const b = [...buttons]; b[i] = { ...b[i], ...patch }; onChange(b); };
  const remove = (i) => onChange(buttons.filter((_, j) => j !== i));
  const add = () => onChange([...buttons, { type: "QUICK_REPLY", label: "" }]);
  return (
    <div>
      <Label>{field.label}</Label>
      {buttons.map((btn, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <select value={btn.type} onChange={(e) => update(i, { type: e.target.value })}
            style={{ padding: "6px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer", flexShrink: 0 }}>
            <option value="QUICK_REPLY">Quick Reply</option>
            <option value="URL">Website URL</option>
            <option value="PHONE">Phone Number</option>
          </select>
          <input value={btn.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Button label"
            style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
          <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {buttons.length < max && (
        <button type="button" onClick={add} style={{ width: "100%", padding: 8, border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", fontSize: 11, color: MUTED, cursor: "pointer" }}>
          + Add Button
        </button>
      )}
    </div>
  );
}

export function FieldRenderer({ field, draft, onPatch }) {
  const value = draft[field.key];
  const onChange = (next) => onPatch({ [field.key]: next });

  if (field.type === "text") return <TextField field={field} value={value} onChange={onChange} />;
  if (field.type === "textarea") return <TextAreaField field={field} value={value} onChange={onChange} />;
  if (field.type === "select") return <SelectField field={field} value={value} onChange={onChange} />;
  if (field.type === "header-picker") return <HeaderPickerField field={field} value={value} onChange={onChange} />;
  if (field.type === "buttons-list") return <ButtonsListField field={field} value={value} onChange={onChange} />;
  return null;
}
