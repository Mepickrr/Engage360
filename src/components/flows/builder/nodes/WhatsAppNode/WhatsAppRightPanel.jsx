import React, { useState } from "react";
import { AlertTriangle, Plus, Trash2, Upload } from "lucide-react";
import TemplatePreview from "./TemplatePreview";
import TemplatePicker from "./TemplatePicker";
import TemplateEditor from "./TemplateEditor";
import {
  WABA_NUMBERS, SYSTEM_VARIABLES, isConnectable,
  DELIVERY_OUTPUT_OPTIONS,
} from "./data/mockTemplates";

const WA_GREEN = "#25D366";
const PRIMARY  = "#6C3AE8";
const BORDER   = "#E5E7EB";
const MUTED    = "#94A3B8";

// ── Shared helpers ─────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? WA_GREEN : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}
function SelectField({ value, onChange, options, style = {} }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer", ...style }}>
      {options.map((o) => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}

// ── Inline Template Form (Path 1: Create New + Path 2: Edit existing) ──
const HEADER_TYPES = ["None", "Image", "Video", "Document"];
const BTN_MAX = 20;

function extractVars(body) {
  const seen = new Set();
  return [...body.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]).filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

function InlineTemplateForm({ draft, onChange }) {
  const [showVarPicker, setShowVarPicker] = useState(null); // variable index

  const patch = (p) => onChange({ ...draft, ...p });
  const vars = extractVars(draft.body || "");

  const insertVar = () => {
    const next = vars.length + 1;
    const token = `{{$${next}}}`;
    patch({ body: (draft.body || "") + token });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Template Name */}
      <div>
        <Label>Template Name</Label>
        <input value={draft.name || ""} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. cart_recovery_v1" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
      </div>

      {/* Category + Language row */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>Category</Label>
          <SelectField value={draft.category || "Marketing"} onChange={(v) => patch({ category: v })} options={["Marketing", "Utility", "Conversational"]} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Language</Label>
          <SelectField value={draft.language || "en"} onChange={(v) => patch({ language: v })} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }]} />
        </div>
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <SelectField value={draft.status || "Draft"} onChange={(v) => patch({ status: v })} options={["Draft", "Uploaded", "Approved", "Rejected", "Paused"]} />
      </div>

      {/* Header type */}
      <div>
        <Label>Header</Label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {HEADER_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => patch({ header: { ...draft.header, type: t.toLowerCase() } })} style={{
              padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${(draft.header?.type || "none") === t.toLowerCase() ? PRIMARY : BORDER}`,
              background: (draft.header?.type || "none") === t.toLowerCase() ? "#F5F3FF" : "#fff",
              color: (draft.header?.type || "none") === t.toLowerCase() ? PRIMARY : "#64748B",
              fontSize: 11, fontWeight: 500, cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>
        {draft.header?.type && draft.header.type !== "none" && (
          <div onClick={() => alert(`${draft.header.type} upload — connect your media library`)} style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: "14px", textAlign: "center", cursor: "pointer", background: "#F8FAFC" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = PRIMARY} onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}>
            <Upload size={16} style={{ color: MUTED, marginBottom: 4, display: "block", margin: "0 auto 4px" }} />
            <div style={{ fontSize: 11, color: "#64748B" }}>Upload {draft.header.type}</div>
          </div>
        )}
        {draft.header?.type === "text" && (
          <input value={draft.header?.text || ""} onChange={(e) => patch({ header: { ...draft.header, text: e.target.value } })} placeholder="Header text…" style={{ width: "100%", marginTop: 6, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
        )}
      </div>

      {/* Body */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Message Body</Label>
          <button type="button" onClick={insertVar} style={{ fontSize: 10, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            + Add Variable
          </button>
        </div>
        <textarea value={draft.body || ""} onChange={(e) => patch({ body: e.target.value })} placeholder="Hey {{$1}}, your order is ready…" rows={5}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, color: PRIMARY, fontFamily: "inherit" }} />
      </div>

      {/* Variable mapping */}
      {vars.length > 0 && (
        <div>
          <Label>Variable Mapping</Label>
          <table style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, borderCollapse: "separate", borderSpacing: 0, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                <th style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#374151", textAlign: "left", borderBottom: `1px solid ${BORDER}`, width: "35%" }}>Variable</th>
                <th style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#374151", textAlign: "left", borderBottom: `1px solid ${BORDER}` }}>Maps to</th>
              </tr>
            </thead>
            <tbody>
              {vars.map((v, i) => (
                <tr key={v} style={{ borderBottom: i < vars.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td style={{ padding: "7px 10px", borderRight: `1px solid ${BORDER}` }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#374151" }}>{`{{${v}}}`}</span>
                  </td>
                  <td style={{ padding: 0 }}>
                    <select value={(draft.variableMap || {})[v] || ""} onChange={(e) => patch({ variableMap: { ...(draft.variableMap || {}), [v]: e.target.value } })}
                      style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: "none", background: "transparent", outline: "none", cursor: "pointer" }}>
                      <option value="">Select attribute…</option>
                      {Object.entries(SYSTEM_VARIABLES).map(([group, svars]) => (
                        <optgroup key={group} label={group}>
                          {svars.map((sv) => <option key={sv.key} value={sv.key}>{sv.label} · {sv.example}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Buttons */}
      <div>
        <Label>Buttons</Label>
        {(draft.buttons || []).map((btn, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <select value={btn.type} onChange={(e) => { const b = [...(draft.buttons || [])]; b[i] = { ...b[i], type: e.target.value }; patch({ buttons: b }); }}
              style={{ padding: "6px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer", flexShrink: 0 }}>
              <option value="QUICK_REPLY">Quick Reply</option>
              <option value="URL">Website URL</option>
              <option value="PHONE">Phone Number</option>
            </select>
            <div style={{ flex: 1, position: "relative" }}>
              <input value={btn.label} maxLength={BTN_MAX} onChange={(e) => { const b = [...(draft.buttons || [])]; b[i] = { ...b[i], label: e.target.value.slice(0, BTN_MAX) }; patch({ buttons: b }); }}
                placeholder="Button label" style={{ width: "100%", padding: "6px 40px 6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
              <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: MUTED }}>{btn.label?.length || 0}/{BTN_MAX}</span>
            </div>
            <button type="button" onClick={() => patch({ buttons: (draft.buttons || []).filter((_, j) => j !== i) })}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"} onMouseLeave={(e) => e.currentTarget.style.color = MUTED}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {(draft.buttons || []).length < 3 && (
          <button type="button" onClick={() => patch({ buttons: [...(draft.buttons || []), { type: "QUICK_REPLY", label: "" }] })}
            style={{ width: "100%", padding: "8px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", fontSize: 11, color: MUTED, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
            + Add Button
          </button>
        )}
      </div>

      {/* AI Enhance */}
      <button type="button" onClick={() => alert("AI Enhance: generates Friendly / Persuasive / Urgent tone variants — coming soon")}
        style={{ width: "100%", padding: "9px", border: `1px solid ${PRIMARY}`, borderRadius: 8, background: "#F5F3FF", color: PRIMARY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        ✨ AI Enhance — Generate tone variants
      </button>

      {/* Footer */}
      <div>
        <Label>Footer (optional)</Label>
        <input value={draft.footer || ""} onChange={(e) => patch({ footer: e.target.value })} placeholder="Reply STOP to unsubscribe" maxLength={200}
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
      </div>
    </div>
  );
}

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [showPicker,         setShowPicker]         = useState(false);
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);
  const [showEditor,         setShowEditor]         = useState(false);
  const [editingFallback,    setEditingFallback]    = useState(false);
  const [creatingNew,        setCreatingNew]        = useState(false);
  const [newDraft,           setNewDraft]           = useState({ name: "", category: "Marketing", language: "en", status: "Draft", header: { type: "none" }, body: "", footer: "", buttons: [], variableMap: {} });

  const { template, wabaNumberId, fallback = {}, templateType } = data;

  const handleTemplateSelect = (tpl) => {
    patch({ template: tpl, variableMap: {}, templateType: tpl.category || tpl.type });
    setShowPicker(false);
  };
  const handleFallbackSelect = (tpl) => {
    patch({ fallback: { ...fallback, template: tpl } });
    setShowFallbackPicker(false);
  };
  const handleEditorSave = (updated) => {
    if (editingFallback) patch({ fallback: { ...fallback, template: updated } });
    else patch({ template: updated });
    setShowEditor(false); setEditingFallback(false);
  };
  const handleCreateSave = () => {
    const tpl = { ...newDraft, id: `tpl_new_${Date.now()}`, lastUpdated: new Date().toISOString().slice(0, 10) };
    patch({ template: tpl, variableMap: newDraft.variableMap || {}, templateType: newDraft.category });
    setCreatingNew(false);
  };

  // ── Path 1: Creating new template inline ──
  if (creatingNew) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
          <button type="button" onClick={() => setCreatingNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Create New Template</span>
        </div>
        <InlineTemplateForm draft={newDraft} onChange={setNewDraft} />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={() => setCreatingNew(false)} style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={handleCreateSave} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Save Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPicker         && <TemplatePicker onSelect={handleTemplateSelect} onClose={() => setShowPicker(false)} />}
      {showFallbackPicker && <TemplatePicker onSelect={handleFallbackSelect} onClose={() => setShowFallbackPicker(false)} />}
      {showEditor && (
        <TemplateEditor
          template={editingFallback ? (fallback?.template || {}) : template}
          onSave={handleEditorSave}
          onClose={() => { setShowEditor(false); setEditingFallback(false); }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Sender Number */}
        <div>
          <Label>Sender Number</Label>
          <select value={wabaNumberId || "waba_1"} onChange={(e) => patch({ wabaNumberId: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
            {WABA_NUMBERS.map((n) => <option key={n.id} value={n.id} disabled={n.status === "inactive"}>{n.nickname} · ····{n.number.slice(-4)}{n.status === "inactive" ? " (Inactive)" : ""}</option>)}
          </select>
        </div>

        {/* Template — two paths */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Template</Label>
            <button type="button" onClick={() => setCreatingNew(true)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              + Create New
            </button>
          </div>

          {!template ? (
            /* No template selected — show two CTAs */
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setCreatingNew(true)} style={{
                flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
                background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
                Create New
              </button>
              <button type="button" onClick={() => setShowPicker(true)} style={{
                flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
                background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
                transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = WA_GREEN; e.currentTarget.style.color = WA_GREEN; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>☰</div>
                Select Existing
              </button>
            </div>
          ) : (
            /* Template selected — show structured block (Path 2 editable view) */
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <TemplatePreview template={template} variableMap={data.variableMap || {}} />
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${BORDER}`, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button onClick={() => { setEditingFallback(false); setShowEditor(true); }} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                  <button onClick={() => alert("Test send — coming soon")} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Test</button>
                </div>
              </div>

              {/* Inline editable fields for selected template */}
              <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
                <InlineTemplateForm
                  draft={{
                    name: template.name, category: template.category || template.type,
                    language: template.language, status: template.status,
                    header: template.header, body: template.body, footer: template.footer,
                    buttons: template.buttons, variableMap: data.variableMap || {},
                  }}
                  onChange={(updated) => patch({
                    template: { ...template, ...updated },
                    variableMap: updated.variableMap,
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Template Type */}
        {template && (
          <div>
            <Label>Template Type</Label>
            <select value={templateType || template?.category || "Marketing"} onChange={(e) => patch({ templateType: e.target.value })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option>Marketing</option><option>Utility</option><option>Conversational</option>
            </select>
            {(templateType || template?.category) === "Conversational" && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, padding: "8px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8 }}>
                <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>Conversational messages require an active user session. Configure a fallback for users without one.</span>
              </div>
            )}
          </div>
        )}

        {/* Fallback template */}
        {template && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Fallback Template</Label>
              <Toggle on={!!fallback?.enabled} onChange={(v) => patch({ fallback: { ...fallback, enabled: v } })} />
            </div>
            {fallback?.enabled && (
              !fallback.template ? (
                <button onClick={() => setShowFallbackPicker(true)} style={{ width: "100%", padding: "12px", border: `2px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12, textAlign: "center" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = WA_GREEN; e.currentTarget.style.color = WA_GREEN; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
                  Click to select approved fallback template
                </button>
              ) : (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
                  <TemplatePreview template={fallback.template} variableMap={{}} />
                  <div style={{ padding: "8px 12px", borderTop: `1px solid ${BORDER}`, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{fallback.template.name}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => { setEditingFallback(true); setShowEditor(true); }} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => setShowFallbackPicker(true)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                      <button onClick={() => patch({ fallback: { ...fallback, template: null } })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { markAsMarketing, utm = {}, aiBestTime, smartRetry = {} } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mark as Marketing */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BORDER}` }}>
        <input type="checkbox" id="wa-marketing" checked={markAsMarketing !== false} onChange={(e) => patch({ markAsMarketing: e.target.checked })} style={{ marginTop: 2, accentColor: WA_GREEN }} />
        <div>
          <label htmlFor="wa-marketing" style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer", display: "block", marginBottom: 2 }}>Mark as Marketing message</label>
          <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Only marketing messages are used for revenue attribution</p>
        </div>
      </div>

      {/* UTM Parameters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>UTM Parameters</Label>
          <Toggle on={!!utm.enabled} onChange={(v) => patch({ utm: { ...utm, enabled: v } })} />
        </div>
        {utm.enabled && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            {[["utm_source", "Source", "whatsapp"], ["utm_medium", "Medium", "journey"], ["utm_campaign", "Campaign", data.template?.name || ""]].map(([key, label, placeholder]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>{label}</span>
                <input value={utm[key] || ""} placeholder={placeholder} onChange={(e) => patch({ utm: { ...utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }} />
              </div>
            ))}
            {[["utm_content", "Content", ""], ["utm_term", "Term", ""]].map(([key, label, placeholder]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>{label}</span>
                <input value={utm[key] || ""} placeholder={placeholder} onChange={(e) => patch({ utm: { ...utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Best Sent Time */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BORDER}` }}>
        <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
          <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Sends at each user's optimal engagement window. Usually within 0–4 hours.</p>
        </div>
      </div>

      {/* Smart Retry */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Smart Retry</Label>
          <Toggle on={!!smartRetry.enabled} onChange={(v) => patch({ smartRetry: { ...smartRetry, enabled: v } })} />
        </div>
        {smartRetry.enabled && (
          <div style={{ display: "flex", gap: 8 }}>
            {[["smart", "Smart Retry (Recommended)"], ["manual", "Manual Retry"]].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => patch({ smartRetry: { ...smartRetry, mode } })} style={{
                flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                border: `2px solid ${smartRetry.mode === mode ? WA_GREEN : BORDER}`,
                background: smartRetry.mode === mode ? "#F0FDF4" : "#fff",
                color: smartRetry.mode === mode ? "#065F46" : "#64748B",
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Output Tab ──────────────────────────────────────────────────
function OutputTab({ data, patch }) {
  const template         = data?.template;
  const outputCfg        = data?.outputConfig ?? { deliveryOutputs: ["next_step"], noResponseValue: 5, noResponseUnit: "hours", wiredPorts: [] };
  const selectedIds      = outputCfg.deliveryOutputs ?? ["next_step"];
  const connectableBtns  = (template?.buttons ?? []).filter(isConnectable);

  const toggleOutput = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next.length ? next : ["next_step"] } });
  };

  const totalPorts = selectedIds.length + connectableBtns.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Select which output ports appear on the canvas node. Each selected option creates a connection point you can wire to the next step.
      </p>

      {/* Delivery Outputs */}
      <div>
        <Label>Delivery Outputs</Label>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          {DELIVERY_OUTPUT_OPTIONS.map((opt, i) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <div key={opt.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: i < DELIVERY_OUTPUT_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                background: selected ? "#F0FDF4" : "#fff", cursor: "pointer", transition: "background 0.15s",
              }} onClick={() => toggleOutput(opt.id)}>
                <input type="checkbox" readOnly checked={selected} style={{ accentColor: WA_GREEN, width: 14, height: 14, cursor: "pointer" }} />
                <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                {/* Time config for "No response" */}
                {opt.hasTimeConfig && selected && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    <input type="number" min={1} value={outputCfg.noResponseValue ?? 5}
                      onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseValue: parseInt(e.target.value) || 1 } })}
                      style={{ width: 44, padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
                    <select value={outputCfg.noResponseUnit ?? "hours"}
                      onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseUnit: e.target.value } })}
                      style={{ padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer" }}>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="minutes">Minutes</option>
                    </select>
                  </div>
                )}
                {opt.id === "next_step" && (
                  <span style={{ fontSize: 9, background: "#EEF2FF", color: "#4338CA", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>DEFAULT</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Outputs from buttons */}
      {connectableBtns.length > 0 && (
        <div>
          <Label>Response Outputs (from buttons)</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {connectableBtns.map((btn, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: i < connectableBtns.length - 1 ? `1px solid ${BORDER}` : "none",
                background: "#F0FDF4",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: WA_GREEN, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{btn.label}</span>
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, fontWeight: 500, background: btn.type === "QUICK_REPLY" ? "#EFF6FF" : "#F3E8FF", color: btn.type === "QUICK_REPLY" ? "#2563EB" : "#7C3AED" }}>{btn.type === "QUICK_REPLY" ? "Quick Reply" : "URL"}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 8, lineHeight: 1.5 }}>
            ⚠ Using button ports disables "On Link Click". Once a user goes through a branch they cannot enter subsequent branches.
          </p>
        </div>
      )}

      {!template && (
        <div style={{ textAlign: "center", color: MUTED, padding: "20px 0", fontSize: 12 }}>
          Select a template first to see response output ports
        </div>
      )}

      {/* Port count summary */}
      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{totalPorts}</span>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────
const TABS = [
  { id: "template", label: "Template" },
  { id: "delivery", label: "Delivery" },
  { id: "output",   label: "Output"   },
];

export default function WhatsAppRightPanel({ node, updateNodeData, removeNode }) {
  const [tab, setTab] = useState("template");
  if (!node) return null;

  const data  = node.data || {};
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 13 }}>✓</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Send WhatsApp</div>
            <div style={{ fontSize: 10, color: MUTED }}>Configure message & delivery</div>
          </div>
        </div>
        <button onClick={() => removeNode(node.id)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          Delete
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 500,
            border: "none", borderBottom: `2px solid ${tab === id ? WA_GREEN : "transparent"}`,
            background: tab === id ? "#F0FDF4" : "transparent",
            color: tab === id ? WA_GREEN : MUTED, cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "template" && <TemplateTab data={data} patch={patch} />}
        {tab === "delivery" && <DeliveryTab data={data} patch={patch} />}
        {tab === "output"   && <OutputTab   data={data} patch={patch} />}
      </div>

      {/* Save footer */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={() => alert("Changes saved")} style={{ width: "100%", padding: "9px", background: WA_GREEN, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
