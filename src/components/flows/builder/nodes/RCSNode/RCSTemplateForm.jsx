import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Sparkles, ChevronDown } from "lucide-react";
import { RCS_BUTTON_TYPES, SYSTEM_VARIABLES } from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${active ? INDIGO : BORDER}`,
        background: active ? "#EEF2FF" : "#fff", color: active ? INDIGO : "#64748B",
        fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.13s",
      }}
    >
      {children}
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function VarPickerPopover({ onSelect, onClose }) {
  return (
    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 6, minWidth: 180, maxHeight: 220, overflowY: "auto" }}>
      {SYSTEM_VARIABLES.map((v) => (
        <div
          key={v}
          onClick={() => { onSelect(v); onClose(); }}
          style={{ padding: "6px 10px", fontSize: 12, color: INDIGO, fontFamily: "monospace", cursor: "pointer", borderRadius: 5 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FF")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {`{{${v}}}`}
        </div>
      ))}
    </div>
  );
}

export default function RCSTemplateForm({ draft, patch }) {
  const [showVarPicker, setShowVarPicker] = useState(false);
  const bodyRef = useRef(null);

  const handleLayoutChange = (style) => {
    if (style === "basic") patch({ style: "basic", mediaType: "none", buttons: [] });
    else patch({ style: "single" });
  };

  const insertVar = (varName) => {
    const token = `{{${varName}}}`;
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = (draft.body || "").slice(0, start) + token + (draft.body || "").slice(end);
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
        body: (draft.body || "").trim()
          ? `Greetings, {{customerName}}! ${draft.body} We appreciate your continued trust in {{brandName}}.`
          : "Hello {{customerName}}! We have an exciting update from {{brandName}} just for you.",
      });
    }, 800);
  };

  const addButton = () => {
    if ((draft.buttons || []).length >= 3) return;
    patch({ buttons: [...(draft.buttons || []), { type: "quick_reply", label: "", value: "" }] });
  };

  const removeButton = (i) => patch({ buttons: (draft.buttons || []).filter((_, j) => j !== i) });

  const updateButton = (i, changes) => {
    const btns = [...(draft.buttons || [])];
    btns[i] = { ...btns[i], ...changes };
    patch({ buttons: btns });
  };

  const bodyLimit = draft.style === "basic" ? 160 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div>
        <Label>Template Name</Label>
        <input
          value={draft.name || ""}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. welcome_message_v1"
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div>
        <Label>Template Status</Label>
        <select
          value={draft.status || "Draft"}
          onChange={(e) => patch({ status: e.target.value })}
          style={{ width: "100%", padding: "8px 28px 8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}
        >
          {["Draft", "Approved", "In Review", "Rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <Label>Message Layout</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "single", label: "Single" }, { id: "basic", label: "Basic" }].map((s) => (
            <PillButton key={s.id} active={draft.style === s.id} onClick={() => handleLayoutChange(s.id)}>
              {s.label}
            </PillButton>
          ))}
        </div>
      </div>

      {draft.style === "single" && (
        <div>
          <Label>Media Type</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["none", "image", "video", "document"].map((m) => (
              <PillButton key={m} active={draft.mediaType === m} onClick={() => patch({ mediaType: m })}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Message Body</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowVarPicker((v) => !v)}
                style={{ fontSize: 10, color: INDIGO, fontWeight: 600, background: "none", border: `1px solid ${INDIGO}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
              >
                + Add Variable
                <ChevronDown size={10} />
              </button>
              {showVarPicker && <VarPickerPopover onSelect={insertVar} onClose={() => setShowVarPicker(false)} />}
            </div>

            <button
              type="button"
              onClick={handleAiEnhance}
              style={{ fontSize: 10, color: INDIGO, fontWeight: 600, background: "none", border: `1px solid ${INDIGO}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
            >
              <Sparkles size={10} />
              AI Enhance
            </button>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <textarea
            ref={bodyRef}
            value={draft.body || ""}
            onChange={(e) => {
              const val = bodyLimit ? e.target.value.slice(0, bodyLimit) : e.target.value;
              patch({ body: val });
            }}
            maxLength={bodyLimit || undefined}
            rows={5}
            placeholder="Hi {{customerName}}, your message here…"
            style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ textAlign: "right", fontSize: 10, color: bodyLimit && (draft.body || "").length >= bodyLimit ? "#EF4444" : MUTED, marginTop: 4 }}>
            {(draft.body || "").length}{bodyLimit ? `/${bodyLimit}` : ""}
          </div>
        </div>
      </div>

      {draft.style === "single" && (
        <div>
          <Label>Action Buttons</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {(draft.buttons || []).map((btn, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={btn.type}
                  onChange={(e) => updateButton(i, { type: e.target.value })}
                  style={{ padding: "6px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer", flexShrink: 0 }}
                >
                  {RCS_BUTTON_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input
                  value={btn.label}
                  onChange={(e) => updateButton(i, { label: e.target.value })}
                  placeholder="Button label"
                  style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                />
                {(btn.type === "url" || btn.type === "call") && (
                  <input
                    value={btn.value || ""}
                    onChange={(e) => updateButton(i, { value: e.target.value })}
                    placeholder={btn.type === "url" ? "https://…" : "+91…"}
                    style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeButton(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4, flexShrink: 0 }}
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
              style={{ width: "100%", padding: "8px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", fontSize: 12, color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.color = INDIGO; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
            >
              <Plus size={13} />
              Add Button
            </button>
          )}
        </div>
      )}
    </div>
  );
}
