import React, { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, Sparkles, ChevronDown } from "lucide-react";
import { RCS_BUTTON_TYPES, SYSTEM_VARIABLES } from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

// ── Render body with variable highlighting (for preview) ──────
function renderBody(text, variableMap = {}) {
  if (!text) return null;
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      return (
        <span
          key={i}
          style={{
            background: "#EEF2FF",
            color: INDIGO,
            padding: "0 3px",
            borderRadius: 3,
            fontFamily: "monospace",
            fontSize: 10,
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

// ── Pill button helper ─────────────────────────────────────────
function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: 20,
        border: `1.5px solid ${active ? INDIGO : BORDER}`,
        background: active ? "#EEF2FF" : "#fff",
        color: active ? INDIGO : "#64748B",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.13s",
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

// ── Variable picker popover ────────────────────────────────────
function VarPickerPopover({ onSelect, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 100,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        padding: 6,
        minWidth: 180,
        maxHeight: 220,
        overflowY: "auto",
      }}
    >
      {SYSTEM_VARIABLES.map((v) => (
        <div
          key={v}
          onClick={() => { onSelect(v); onClose(); }}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            color: INDIGO,
            fontFamily: "monospace",
            cursor: "pointer",
            borderRadius: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FF")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {`{{${v}}}`}
        </div>
      ))}
    </div>
  );
}

// ── Media type icon ────────────────────────────────────────────
function MediaPlaceholder({ mediaType }) {
  if (mediaType === "image") {
    return (
      <div
        style={{
          height: 100,
          background: INDIGO,
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 26, color: "#fff" }}>🖼</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Image</span>
      </div>
    );
  }
  if (mediaType === "video") {
    return (
      <div
        style={{
          height: 100,
          background: "#1a1a2e",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span>
        </div>
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            fontSize: 10,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          0:00
        </span>
      </div>
    );
  }
  if (mediaType === "document") {
    return (
      <div
        style={{
          height: 60,
          background: "#F1F5F9",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>📄</span>
        <span style={{ fontSize: 12, color: "#475569" }}>Document</span>
      </div>
    );
  }
  return null;
}

// ── Template preview ───────────────────────────────────────────
function TemplatePreview({ draft }) {
  const hasMedia = draft.style === "single" && draft.mediaType !== "none";
  const connectableBtns = (draft.buttons || []).filter(
    (b) => b.type === "quick_reply" || b.type === "url"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Preview
      </div>

      {/* RCS app background */}
      <div
        style={{
          background: "#E8EDF8",
          borderRadius: 12,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Message bubble */}
        <div style={{ maxWidth: "90%" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: "14px 14px 14px 4px",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            {hasMedia && <MediaPlaceholder mediaType={draft.mediaType} />}

            <div
              style={{
                padding: "8px 12px",
                fontSize: 12,
                color: "#111",
                lineHeight: 1.6,
              }}
            >
              {draft.body ? renderBody(draft.body) : (
                <span style={{ color: MUTED, fontStyle: "italic" }}>
                  Your message body will appear here…
                </span>
              )}
            </div>

            <div
              style={{
                textAlign: "right",
                padding: "0 10px 8px",
                fontSize: 9,
                color: "#aaa",
              }}
            >
              10:30 ✓✓
            </div>
          </div>

          {/* Action buttons */}
          {connectableBtns.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {connectableBtns.map((btn, i) => (
                <button
                  key={i}
                  type="button"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${INDIGO}`,
                    background: "#fff",
                    color: INDIGO,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "default",
                    textAlign: "center",
                  }}
                >
                  {btn.label || "Button"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {draft.name && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 8,
              background: "#F1F5F9",
              color: "#475569",
            }}
          >
            {draft.name}
          </span>
        )}
        {draft.type && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 8,
              background: "#EEF2FF",
              color: INDIGO,
            }}
          >
            {draft.type}
          </span>
        )}
        {draft.status && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 8,
              background:
                draft.status === "Approved"
                  ? "#ECFDF5"
                  : draft.status === "Rejected"
                  ? "#FEF2F2"
                  : "#FFFBEB",
              color:
                draft.status === "Approved"
                  ? "#065F46"
                  : draft.status === "Rejected"
                  ? "#991B1B"
                  : "#92400E",
            }}
          >
            {draft.status}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────
export default function RCSTemplateModal({ open, onClose, onSave, initialTemplate }) {
  const isEdit = !!(initialTemplate?.id);
  const [draft, setDraft] = useState(
    initialTemplate
      ? { ...initialTemplate }
      : {
          id: null,
          name: "",
          type: "Promotional",
          status: "Draft",
          style: "single",
          mediaType: "none",
          body: "",
          buttons: [],
        }
  );
  const [showVarPicker, setShowVarPicker] = useState(false);
  const bodyRef = useRef(null);

  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

  const handleStyleChange = (style) => {
    if (style === "basic") {
      patch({ style: "basic", mediaType: "none", buttons: [] });
    } else {
      patch({ style: "single" });
    }
  };

  const insertVar = (varName) => {
    const token = `{{${varName}}}`;
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody =
        (draft.body || "").slice(0, start) + token + (draft.body || "").slice(end);
      patch({ body: newBody });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      patch({ body: (draft.body || "") + token });
    }
  };

  const handleAiEnhance = () => {
    const toastId = toast.loading("Enhancing with AI...");
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success("Body enhanced successfully!");
      patch({
        body:
          (draft.body || "").trim()
            ? `Greetings, {{customerName}}! ${draft.body} We appreciate your continued trust in {{brandName}}.`
            : "Hello {{customerName}}! We have an exciting update from {{brandName}} just for you.",
      });
    }, 800);
  };

  const addButton = () => {
    if ((draft.buttons || []).length >= 3) return;
    patch({ buttons: [...(draft.buttons || []), { type: "quick_reply", label: "", value: "" }] });
  };

  const removeButton = (i) => {
    patch({ buttons: (draft.buttons || []).filter((_, j) => j !== i) });
  };

  const updateButton = (i, changes) => {
    const btns = [...(draft.buttons || [])];
    btns[i] = { ...btns[i], ...changes };
    patch({ buttons: btns });
  };

  const handleSave = () => {
    const tpl = {
      ...draft,
      id: draft.id || Date.now().toString(),
    };
    onSave(tpl);
    onClose();
  };

  const bodyLimit = draft.style === "basic" ? 160 : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        style={{
          maxWidth: 900,
          width: "90vw",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          maxHeight: "90vh",
        }}
      >
        {/* ── Left: form ── */}
        <div
          style={{
            flex: "0 0 55%",
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderRight: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            {isEdit ? "Edit Template" : "Create RCS Template"}
          </div>

          {/* Template Name */}
          <div>
            <SectionLabel>Template Name</SectionLabel>
            <input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. welcome_message_v1"
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 13,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Template Type */}
          <div>
            <SectionLabel>Template Type</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {["Promotional", "Transactional"].map((t) => (
                <PillButton
                  key={t}
                  active={draft.type === t}
                  onClick={() => patch({ type: t })}
                >
                  {t}
                </PillButton>
              ))}
            </div>
          </div>

          {/* Template Status */}
          <div>
            <SectionLabel>Template Status</SectionLabel>
            <select
              value={draft.status}
              onChange={(e) => patch({ status: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 28px 8px 10px",
                fontSize: 13,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                outline: "none",
                background: "#fff",
                appearance: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {["Draft", "Approved", "In Review", "Rejected"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Template Style */}
          <div>
            <SectionLabel>Template Style</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "single", label: "Single" }, { id: "basic", label: "Basic" }].map((s) => (
                <PillButton
                  key={s.id}
                  active={draft.style === s.id}
                  onClick={() => handleStyleChange(s.id)}
                >
                  {s.label}
                </PillButton>
              ))}
            </div>
          </div>

          {/* Media Type — only for single */}
          {draft.style === "single" && (
            <div>
              <SectionLabel>Media Type</SectionLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["none", "image", "video", "document"].map((m) => (
                  <PillButton
                    key={m}
                    active={draft.mediaType === m}
                    onClick={() => patch({ mediaType: m })}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </PillButton>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <SectionLabel>Message Body</SectionLabel>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Add Variable */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowVarPicker((v) => !v)}
                    style={{
                      fontSize: 10,
                      color: INDIGO,
                      fontWeight: 600,
                      background: "none",
                      border: `1px solid ${INDIGO}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    + Add Variable
                    <ChevronDown size={10} />
                  </button>
                  {showVarPicker && (
                    <VarPickerPopover
                      onSelect={insertVar}
                      onClose={() => setShowVarPicker(false)}
                    />
                  )}
                </div>

                {/* AI Enhance */}
                <button
                  type="button"
                  onClick={handleAiEnhance}
                  style={{
                    fontSize: 10,
                    color: INDIGO,
                    fontWeight: 600,
                    background: "none",
                    border: `1px solid ${INDIGO}`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Sparkles size={10} />
                  AI Enhance
                </button>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                ref={bodyRef}
                value={draft.body}
                onChange={(e) => {
                  const val = bodyLimit
                    ? e.target.value.slice(0, bodyLimit)
                    : e.target.value;
                  patch({ body: val });
                }}
                maxLength={bodyLimit || undefined}
                rows={5}
                placeholder="Hi {{customerName}}, your message here…"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: 10,
                  color: bodyLimit && draft.body.length >= bodyLimit ? "#EF4444" : MUTED,
                  marginTop: 4,
                }}
              >
                {draft.body.length}{bodyLimit ? `/${bodyLimit}` : ""}
              </div>
            </div>
          </div>

          {/* Action Buttons — only for single */}
          {draft.style === "single" && (
            <div>
              <SectionLabel>Action Buttons</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                {(draft.buttons || []).map((btn, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      value={btn.type}
                      onChange={(e) => updateButton(i, { type: e.target.value })}
                      style={{
                        padding: "6px 8px",
                        fontSize: 11,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                        background: "#fff",
                        outline: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {RCS_BUTTON_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      value={btn.label}
                      onChange={(e) => updateButton(i, { label: e.target.value })}
                      placeholder="Button label"
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        fontSize: 12,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                        outline: "none",
                      }}
                    />
                    {(btn.type === "url" || btn.type === "call") && (
                      <input
                        value={btn.value || ""}
                        onChange={(e) => updateButton(i, { value: e.target.value })}
                        placeholder={btn.type === "url" ? "https://…" : "+91…"}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          fontSize: 12,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 6,
                          outline: "none",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeButton(i)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: MUTED,
                        padding: 4,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              {(draft.buttons || []).length < 3 && (
                <button
                  type="button"
                  onClick={addButton}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1.5px dashed ${BORDER}`,
                    borderRadius: 8,
                    background: "transparent",
                    fontSize: 12,
                    color: MUTED,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = INDIGO;
                    e.currentTarget.style.color = INDIGO;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.color = MUTED;
                  }}
                >
                  <Plus size={13} />
                  Add Button
                </button>
              )}
            </div>
          )}

          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "9px",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                background: "#fff",
                fontSize: 13,
                cursor: "pointer",
                color: "#475569",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 2,
                padding: "9px",
                border: "none",
                borderRadius: 8,
                background: INDIGO,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isEdit ? "Update Template" : "Save Template"}
            </button>
          </div>
        </div>

        {/* ── Right: preview ── */}
        <div
          style={{
            flex: "0 0 45%",
            background: "#F8FAFC",
            padding: 20,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <TemplatePreview draft={draft} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
