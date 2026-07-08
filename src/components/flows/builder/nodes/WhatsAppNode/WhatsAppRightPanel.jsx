import React, { useState } from "react";
import { AlertTriangle, Plus, Trash2, Upload } from "lucide-react";
import TemplatePicker from "./TemplatePicker";
import TemplateEditor from "./TemplateEditor";
import CollectInputForm from "./CollectInputForm";
import ListMessageForm from "./ListMessageForm";
import CarouselForm from "./CarouselForm";
import {
  WABA_NUMBERS, SYSTEM_VARIABLES, isConnectable,
  DELIVERY_OUTPUT_OPTIONS,
} from "./data/mockTemplates";
import { useFlowVariant } from "@/components/flows/FlowVariantContext";

const WA_GREEN       = "#25D366";
const PRIMARY        = "#6C3AE8";
const BORDER         = "#E5E7EB";
const MUTED          = "#94A3B8";
const CAROUSEL_BLUE  = "#3D3CB8";

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

// ── Template Styles ─────────────────────────────────────────────
const TEMPLATE_STYLES = [
  { id: "standard",        label: "Standard",        emoji: "💬", desc: "Text body with image, video or document header and reply buttons" },
  { id: "collect_input",   label: "Collect Input",   emoji: "📝", desc: "Ask a question and collect structured input from users during a conversation" },
  { id: "list",            label: "List",             emoji: "📋", desc: "Scrollable list of up to 10 sections with items" },
  { id: "carousel",        label: "Carousel",         emoji: "🎠", desc: "Horizontal cards with images, text and buttons" },
  { id: "address",         label: "Address",          emoji: "📍", desc: "Share a delivery or pickup address with map preview" },
  { id: "catalog",         label: "Catalog",          emoji: "🛍️", desc: "Showcase products from your WhatsApp catalog" },
  { id: "payment_link",    label: "Payment Link",     emoji: "💳", desc: "Send a UPI or payment link directly in chat" },
  { id: "call_permission", label: "Call Permission",  emoji: "📞", desc: "Request permission to call the customer" },
  { id: "audio",           label: "Audio",            emoji: "🎙️", desc: "Share a voice note or audio clip" },
  { id: "location",        label: "Location",         emoji: "🗺️", desc: "Share a live or static location pin" },
];

const INPUT_TYPE_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};

// ── Template Style Picker ────────────────────────────────────────
function TemplateStylePicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const { allowedTemplateStyleIds } = useFlowVariant();

  // Blueprint styles kept intact — filtered out in V2 via context.
  // To re-enable a style in V2, add its id to allowedTemplateStyleIds in FlowBuilderV2.jsx.
  // Hidden blueprint ids: "address", "catalog", "audio", "location"
  const visibleStyles = allowedTemplateStyleIds
    ? TEMPLATE_STYLES.filter((s) => allowedTemplateStyleIds.includes(s.id))
    : TEMPLATE_STYLES;

  return (
    <div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Choose Template Style</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Select the type of WhatsApp message you want to send</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
        {visibleStyles.map((style) => {
          const isSelected = selected === style.id;
          const isHovered  = hovered  === style.id;
          const highlight  = isSelected || isHovered;
          return (
            <div
              key={style.id}
              onClick={() => {
                setSelected(style.id);
                onSelect(style.id);
              }}
              onMouseEnter={() => setHovered(style.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative",
                background: highlight ? "#F0FDF4" : "#fff",
                border: `${isSelected ? 2 : 1.5}px solid ${highlight ? "#25D366" : "#E5E7EB"}`,
                borderRadius: 10,
                padding: 12,
                cursor: "pointer",
              }}
            >
              {/* Popular pill for Standard */}
              {style.id === "standard" && (
                <div style={{
                  position: "absolute", top: 6, left: 6,
                  fontSize: 8, fontWeight: 700, color: "#065F46",
                  background: "#DCFCE7", borderRadius: 4, padding: "1px 5px",
                }}>Popular</div>
              )}

              {/* Checkmark badge when selected */}
              {isSelected && (
                <div style={{
                  position: "absolute", top: 6, right: 6,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#25D366", color: "#fff",
                  fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✓</div>
              )}

              {/* Emoji circle */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#DCFCE7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, margin: "0 auto",
              }}>{style.emoji}</div>

              {/* Name */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginTop: 8, textAlign: "center" }}>{style.label}</div>

              {/* Desc */}
              <div style={{ fontSize: 10, color: "#64748B", marginTop: 3, lineHeight: 1.4, textAlign: "center" }}>{style.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
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

      {/* Variable mapping — OR chain per variable */}
      {vars.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Variable Mapping</Label>
            <span style={{ fontSize: 10, color: MUTED }}>First non-empty value is used</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vars.map((v) => {
              // Normalise to array — backward-compat with old string format
              const rawVal = (draft.variableMap || {})[v];
              const chain = Array.isArray(rawVal) ? rawVal : rawVal ? [rawVal] : [""];

              const updateChain = (newChain) =>
                patch({ variableMap: { ...(draft.variableMap || {}), [v]: newChain } });

              return (
                <div key={v} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                  {/* Variable token header */}
                  <div style={{ padding: "6px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: PRIMARY }}>{`{{${v}}}`}</span>
                    <span style={{ fontSize: 10, color: MUTED }}>OR chain</span>
                  </div>

                  {/* OR entries */}
                  {chain.map((entry, idx) => (
                    <div key={idx}>
                      {/* OR divider (between items) */}
                      {idx > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", padding: "1px 6px", borderRadius: 10, background: "#F1F5F9", letterSpacing: 1 }}>OR</span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>
                      )}
                      {/* Select row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        <select
                          value={entry || ""}
                          onChange={(e) => { const c = [...chain]; c[idx] = e.target.value; updateChain(c); }}
                          style={{ flex: 1, padding: "7px 8px", fontSize: 12, border: "none", background: "transparent", outline: "none", cursor: "pointer", minWidth: 0 }}
                        >
                          <option value="">Select attribute…</option>
                          {Object.entries(SYSTEM_VARIABLES).map(([group, svars]) => (
                            <optgroup key={group} label={group}>
                              {svars.map((sv) => <option key={sv.key} value={sv.key}>{sv.label} · {sv.example}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {/* Remove this OR entry — only shown when chain has more than 1 item */}
                        {chain.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateChain(chain.filter((_, j) => j !== idx))}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "4px 8px", fontSize: 13, lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                            onMouseLeave={(e) => e.currentTarget.style.color = MUTED}
                          >×</button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add fallback */}
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button
                      type="button"
                      onClick={() => updateChain([...chain, ""])}
                      style={{ width: "100%", padding: "6px 10px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: PRIMARY, fontWeight: 600, textAlign: "left" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >+ Add fallback</button>
                  </div>
                </div>
              );
            })}
          </div>
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
  const [editingCarousel,    setEditingCarousel]    = useState(false);
  const [editingCollectInput, setEditingCollectInput] = useState(false);
  const [editingListMessage, setEditingListMessage] = useState(false);
  const [newDraft,           setNewDraft]           = useState({ name: "", category: "Marketing", language: "en", status: "Draft", header: { type: "none" }, body: "", footer: "", buttons: [], variableMap: {} });

  const templateStyle = data.templateStyle ?? null;
  const isStandard    = templateStyle === "standard";
  const isCarousel    = templateStyle === "carousel";
  const isCollectInput = templateStyle === "collect_input";
  const isListMessage = templateStyle === "list";
  const styleInfo     = TEMPLATE_STYLES.find((s) => s.id === templateStyle);

  const { template, wabaNumberId, fallback = {}, templateType } = data;

  // ── Step 0: pick a style first ──────────────────────────────
  if (!templateStyle) {
    return <TemplateStylePicker onSelect={(s) => patch({ templateStyle: s })} />;
  }

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

  // ── List Message path ────────────────────────────────────────────
  if (isListMessage && (!template || editingListMessage)) {
    return (
      <ListMessageForm
        initial={template?.isListMessage ? template : null}
        onCancel={() => {
          if (template) setEditingListMessage(false);
          else patch({ templateStyle: null });
        }}
        onApply={(listDraft) => {
          patch({ template: { ...listDraft, id: `list_${Date.now()}` } });
          setEditingListMessage(false);
        }}
      />
    );
  }

  // ── Carousel path — show full carousel form ──────────────────
  if (isCarousel && (!template || editingCarousel)) {
    return (
      <CarouselForm
        initial={template?.isCarousel ? template : null}
        onCancel={() => {
          if (template) setEditingCarousel(false);
          else patch({ templateStyle: null });
        }}
        onApply={(carouselDraft) => {
          patch({ template: { isCarousel: true, id: `carousel_${Date.now()}`, ...carouselDraft } });
          setEditingCarousel(false);
        }}
      />
    );
  }

  // ── Collect Input path — show full collect input form ──────────
  if (isCollectInput && (!template || editingCollectInput)) {
    return (
      <CollectInputForm
        initial={template?.isCollectInput ? template : null}
        onCancel={() => {
          if (template) setEditingCollectInput(false);
          else patch({ templateStyle: null });
        }}
        onApply={(ciDraft) => {
          patch({ template: { ...ciDraft, id: `ci_${Date.now()}` } });
          setEditingCollectInput(false);
        }}
      />
    );
  }

  // ── Path 1: Creating new template inline (Standard only) ──
  if (creatingNew && isStandard) {
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

        {/* Style chip */}
        {styleInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F0FDF4", borderRadius: 20, border: "1px solid #BBF7D0", alignSelf: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>{styleInfo.emoji} {styleInfo.label}</span>
            <span style={{ fontSize: 11, color: MUTED }}>·</span>
            <span
              onClick={() => patch({ templateStyle: null, template: null })}
              style={{ fontSize: 11, color: WA_GREEN, cursor: "pointer", fontWeight: 500 }}
            >Change</span>
          </div>
        )}

        {/* Collect Input configured summary */}
        {isCollectInput && template && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Summary header */}
            <div style={{ padding: "10px 12px", background: "#F0FDF4", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>
                  {INPUT_TYPE_EMOJIS[template.inputType] || "📝"}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", textTransform: "capitalize" }}>
                    {template.inputType?.replace("_", " ")} Input
                  </div>
                  <div style={{ fontSize: 10, color: MUTED }}>{template.retryAttempts ?? 3} retries · {template.noResponse?.timeoutValue ?? 1} {template.noResponse?.timeoutUnit ?? "hours"} timeout</div>
                </div>
              </div>
              <button type="button" onClick={() => setEditingCollectInput(true)}
                style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: `1px solid ${PRIMARY}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                Edit
              </button>
            </div>
            {/* Question preview */}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Question</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                {template.questionMessage || <span style={{ color: MUTED, fontStyle: "italic" }}>No question set</span>}
              </div>
              {template.saveToVariable?.variableName && (
                <div style={{ marginTop: 8, fontSize: 10, color: MUTED }}>
                  Saves to <span style={{ fontFamily: "monospace", color: PRIMARY }}>{template.saveToVariable.variableName}</span>
                  {" "}({template.saveToVariable.scope === "global" ? "Global" : "Flow"} Variable)
                </div>
              )}
            </div>
          </div>
        )}

        {/* List Message configured summary */}
        {isListMessage && template && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#F0FDF4", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>List Message</div>
                  <div style={{ fontSize: 10, color: MUTED }}>
                    {template.sections?.reduce((sum, s) => sum + (s.rows?.length ?? 0), 0) ?? 0} rows
                    {template.buttonText ? ` · "${template.buttonText}"` : ""}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingListMessage(true)}
                style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: `1px solid ${PRIMARY}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              >
                Edit
              </button>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Body</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                {template.body
                  ? (template.body.length > 80 ? template.body.slice(0, 80) + "…" : template.body)
                  : <span style={{ color: MUTED, fontStyle: "italic" }}>No body set</span>}
              </div>
            </div>
          </div>
        )}

        {/* Sender Number */}
        <div>
          <Label>Sender Number</Label>
          <select value={wabaNumberId || "waba_1"} onChange={(e) => patch({ wabaNumberId: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
            {WABA_NUMBERS.map((n) => <option key={n.id} value={n.id} disabled={n.status === "inactive"}>{n.nickname} · ····{n.number.slice(-4)}{n.status === "inactive" ? " (Inactive)" : ""}</option>)}
          </select>
        </div>

        {/* Template section — hidden for list (list uses its own summary card above) */}
        {!isListMessage && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Template</Label>
              {isStandard && (
                <button type="button" onClick={() => setCreatingNew(true)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                  + Create New
                </button>
              )}
            </div>

            {isCollectInput ? null : !template ? (
              /* No template selected — show CTAs based on style */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!isStandard && (
                  /* Non-Standard: amber notice instead of Create New */
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
                        <strong>{styleInfo?.label}</strong> templates must be created in WhatsApp Business Manager. Once approved, select them below.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open("https://business.facebook.com/wa/manage/message-templates/", "_blank")}
                      style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >Open WhatsApp Manager →</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  {isStandard && (
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
                  )}
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
              </div>
            ) : isCarousel ? (
              /* Carousel configured — summary with mini card strip */
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{template.category || "Marketing"} · {(template.cards || []).length} cards</span>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{template.language === "hi" ? "Hindi" : "English"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setEditingCarousel(true)} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => patch({ template: null })} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                  </div>
                </div>
                <div style={{ padding: "10px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
                  {(template.cards || []).map((card, i) => (
                    <div key={i} style={{ width: 60, flexShrink: 0, borderRadius: 6, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                      <div style={{ background: CAROUSEL_BLUE, padding: "2px 5px" }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Card {i + 1}</span>
                      </div>
                      <div style={{ height: 32, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {card.mediaUrl ? <span style={{ fontSize: 12 }}>🖼</span> : <span style={{ fontSize: 8, color: MUTED }}>No img</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Standard/non-carousel template selected — inline edit form */
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
                {/* Action bar */}
                <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <button onClick={() => { setEditingFallback(false); setShowEditor(true); }} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                    <button onClick={() => alert("Test send — coming soon")} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Test</button>
                  </div>
                </div>

                {/* Inline editable fields */}
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
        )}

        {/* Template Type — hidden for now
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
        */}

        {/* Fallback template — hidden for collect_input nodes */}
        {template && !isCollectInput && (
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
                  <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fallback.template.name}</span>
                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
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
const BRANCH_OPTIONS = DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const template        = data?.template;
  const outputCfg       = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], noResponseValue: 5, noResponseUnit: "hours", wiredPorts: [] };
  const routingMode     = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];
  const connectableBtns = (template?.buttons ?? []).filter(isConnectable);

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["delivered"]) } });
  };

  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const deliveryPortCount = routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);
  const totalPorts = deliveryPortCount + connectableBtns.length;

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? WA_GREEN : BORDER}`,
    borderRadius: 10, cursor: "pointer", background: active ? "#F0FDF4" : "#fff",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Choose how this node routes users after the message is sent. Each mode creates different output ports on the canvas.
      </p>

      {/* Mode toggle — MECE */}
      <div>
        <Label>Routing Mode</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Option A — Next Step */}
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? WA_GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: WA_GREEN }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Single output port — all users continue to the same next node regardless of delivery status.
              </div>
            </div>
          </div>

          {/* Option B — Delivery Branches */}
          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "branches" ? WA_GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "branches" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: WA_GREEN }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Delivery Branches</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Separate output port per delivery status — route users differently based on whether the message was sent, read, failed, etc.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch checkboxes — only when mode is "branches" */}
      {routingMode === "branches" && (
        <div>
          <Label>Select Branch Statuses</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              return (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#F0FDF4" : "#fff", cursor: "pointer", transition: "background 0.15s",
                }} onClick={() => toggleBranch(opt.id)}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: WA_GREEN, width: 14, height: 14, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  {opt.hasTimeConfig && selected && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input type="number" min={1} value={outputCfg.noResponseValue ?? 5}
                        onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseValue: parseInt(e.target.value) || 1 } })}
                        style={{ width: 44, padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
                      <select value={outputCfg.noResponseUnit ?? "hours"}
                        onChange={(e) => patch({ outputConfig: { ...outputCfg, noResponseUnit: e.target.value } })}
                        style={{ padding: "3px 6px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer" }}>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one status to create output ports.</p>
          )}
        </div>
      )}

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
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, fontWeight: 500, background: btn.type === "QUICK_REPLY" ? "#EFF6FF" : "#F3E8FF", color: btn.type === "QUICK_REPLY" ? "#2563EB" : "#7C3AED" }}>
                  {btn.type === "QUICK_REPLY" ? "Quick Reply" : "URL"}
                </span>
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
  const [editingLabel, setEditingLabel] = useState(false);
  if (!node) return null;

  const data  = node.data || {};
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 13 }}>✓</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingLabel ? (
              <input
                autoFocus
                value={data.label || ""}
                onChange={(e) => patch({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false); }}
                placeholder="Send WhatsApp"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", borderBottom: `1.5px solid ${WA_GREEN}`, outline: "none", background: "transparent", width: "100%", padding: "0 0 1px" }}
              />
            ) : (
              <div
                onClick={() => setEditingLabel(true)}
                title="Click to rename"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {data.label || "Send WhatsApp"}
                <span style={{ fontSize: 9, color: MUTED, marginLeft: 5, fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: MUTED }}>Configure message &amp; delivery</div>
          </div>
        </div>
        <button onClick={() => removeNode(node.id)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
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
        {tab === "output"   && (
          data.templateStyle === "collect_input" ? (
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Output Ports</div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
                Collect Input nodes have 4 fixed output ports: <strong>Success</strong>, <strong>No Response</strong>, <strong>Limit Reached</strong>, and <strong>Send Failed</strong>. Wire each port to the appropriate next step on the canvas.
              </div>
            </div>
          ) : (
            <OutputTab data={data} patch={patch} />
          )
        )}
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
