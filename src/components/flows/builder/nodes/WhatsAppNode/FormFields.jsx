import React from "react";
import { Trash2 } from "lucide-react";
import { SYSTEM_VARIABLES } from "./data/mockTemplates";
import FlowCtaField from "./FlowCtaField";

export const PRIMARY = "#6C3AE8";
export const BORDER = "#E5E7EB";
export const MUTED = "#94A3B8";

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, display: "block" }}>
      {children}
    </label>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? PRIMARY : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
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

function extractVars(body) {
  const seen = new Set();
  return [...(body || "").matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]).filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

function BodyWithVariablesField({ field, draft, onPatch }) {
  const body = draft[field.key] || "";
  const variableMap = draft.variableMap || {};
  const vars = extractVars(body);

  const insertVar = () => {
    const next = vars.length + 1;
    onPatch({ [field.key]: body + `{{$${next}}}` });
  };

  const handleAiEnhance = () => {
    alert("AI Enhance: generates Friendly / Persuasive / Urgent tone variants — coming soon");
  };

  const updateChain = (v, newChain) => onPatch({ variableMap: { ...variableMap, [v]: newChain } });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Label>{field.label}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={insertVar} style={{ fontSize: 10, color: PRIMARY, fontWeight: 600, background: "none", border: `1px solid ${PRIMARY}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
            + Add Variable
          </button>
          <button type="button" onClick={handleAiEnhance} style={{ fontSize: 10, color: PRIMARY, fontWeight: 600, background: "none", border: `1px solid ${PRIMARY}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
            ✨ AI Enhance
          </button>
        </div>
      </div>
      <textarea value={body} onChange={(e) => onPatch({ [field.key]: e.target.value })} placeholder={field.placeholder} rows={field.rows || 4}
        style={{ ...fieldWrapperStyle(), resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />

      {vars.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Variable Mapping</Label>
            <span style={{ fontSize: 10, color: MUTED }}>First non-empty value is used</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vars.map((v) => {
              const rawVal = variableMap[v];
              const chain = Array.isArray(rawVal) ? rawVal : rawVal ? [rawVal] : [""];
              return (
                <div key={v} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: PRIMARY }}>{`{{${v}}}`}</span>
                    <span style={{ fontSize: 10, color: MUTED }}>OR chain</span>
                  </div>
                  {chain.map((entry, idx) => (
                    <div key={idx}>
                      {idx > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", padding: "1px 6px", borderRadius: 10, background: "#F1F5F9", letterSpacing: 1 }}>OR</span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <select
                          value={entry || ""}
                          onChange={(e) => { const c = [...chain]; c[idx] = e.target.value; updateChain(v, c); }}
                          style={{ flex: 1, padding: "7px 8px", fontSize: 12, border: "none", background: "transparent", outline: "none", cursor: "pointer", minWidth: 0 }}
                        >
                          <option value="">Select attribute…</option>
                          {Object.entries(SYSTEM_VARIABLES).map(([group, svars]) => (
                            <optgroup key={group} label={group}>
                              {svars.map((sv) => <option key={sv.key} value={sv.key}>{sv.label} · {sv.example}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {chain.length > 1 && (
                          <button type="button" onClick={() => updateChain(v, chain.filter((_, j) => j !== idx))}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "4px 8px", fontSize: 13, lineHeight: 1 }}>×</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button type="button" onClick={() => updateChain(v, [...chain, ""])}
                      style={{ width: "100%", padding: "6px 10px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: PRIMARY, fontWeight: 600, textAlign: "left" }}>
                      + Add fallback
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FieldRenderer({ field, draft, onPatch }) {
  const value = draft[field.key];
  const onChange = (next) => onPatch({ [field.key]: next });

  if (field.type === "text") return <TextField field={field} value={value} onChange={onChange} />;
  if (field.type === "textarea") return <TextAreaField field={field} value={value} onChange={onChange} />;
  if (field.type === "body-with-variables") return <BodyWithVariablesField field={field} draft={draft} onPatch={onPatch} />;
  if (field.type === "select") return <SelectField field={field} value={value} onChange={onChange} />;
  if (field.type === "header-picker") return <HeaderPickerField field={field} value={value} onChange={onChange} />;
  if (field.type === "buttons-list") return <ButtonsListField field={field} value={value} onChange={onChange} />;
  if (field.type === "flow-cta") return <FlowCtaField field={field} value={value} onChange={onChange} />;
  return null;
}
