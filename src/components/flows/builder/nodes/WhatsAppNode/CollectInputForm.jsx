import React, { useState } from "react";
import { SYSTEM_VARIABLES } from "./data/mockTemplates";

const WA_GREEN = "#25D366";
const PRIMARY  = "#6C3AE8";
const BORDER   = "#E5E7EB";
const MUTED    = "#94A3B8";

// Input type groups for the grouped <select>
const INPUT_TYPE_GROUPS = [
  {
    label: "Text-based",
    types: [
      { value: "text",        label: "Text",        emoji: "💬" },
      { value: "number",      label: "Number",      emoji: "🔢" },
      { value: "phone",       label: "Phone",       emoji: "📞" },
      { value: "email",       label: "Email",       emoji: "📧" },
      { value: "date",        label: "Date",        emoji: "📅" },
    ],
  },
  {
    label: "Choice",
    types: [
      { value: "quick_reply", label: "Quick Reply", emoji: "🔘" },
      { value: "list",        label: "List",        emoji: "📋" },
    ],
  },
  {
    label: "Media",
    types: [
      { value: "image",       label: "Image",       emoji: "🖼" },
      { value: "video",       label: "Video",       emoji: "🎥" },
      { value: "audio",       label: "Audio",       emoji: "🎙" },
      { value: "document",    label: "Document",    emoji: "📄" },
    ],
  },
  {
    label: "Location",
    types: [
      { value: "location",    label: "Location",    emoji: "📍" },
    ],
  },
];

// Types that support confirmation (text-based only)
const CONFIRMATION_TYPES = new Set(["text", "number", "phone", "email", "date"]);

// Default error message per input type
const DEFAULT_ERROR_MSG = {
  text:        "Please send a text message.",
  number:      "That doesn't look like a valid number. Please try again.",
  phone:       "That doesn't look like a valid phone number. Please try again.",
  email:       "That doesn't look like a valid email. Please try again.",
  date:        "That doesn't look like a valid date. Please try again.",
  quick_reply: "Please tap one of the options below.",
  list:        "Please select one of the options from the list.",
  image:       "Please send an image (JPG, PNG, or WebP).",
  video:       "Please send a video (MP4).",
  audio:       "Please send a voice note or audio file.",
  document:    "Please send a document (PDF, DOCX, XLS, etc.).",
  location:    "Please share a location pin (not a text address).",
};

// Auto-suggested variable name per input type
const DEFAULT_VAR_NAME = {
  text:        "collected_text",
  number:      "collected_number",
  phone:       "collected_phone",
  email:       "collected_email",
  date:        "collected_date",
  quick_reply: "collected_choice",
  list:        "collected_choice",
  image:       "collected_image_url",
  video:       "collected_video_url",
  audio:       "collected_audio_url",
  document:    "collected_document_url",
  location:    "collected_location",
};

function defaultDraft(inputType = "email") {
  const supportsConfirmation = CONFIRMATION_TYPES.has(inputType);
  return {
    isCollectInput: true,
    inputType,
    questionMessage: "",
    confirmation: {
      enabled: supportsConfirmation,
      message: "You entered {{collected_value}} — is this correct?",
      confirmLabel: "Confirm",
      editLabel: "Edit",
    },
    errorMessage: DEFAULT_ERROR_MSG[inputType],
    retryAttempts: 3,
    noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false },
    saveToVariable: { scope: "flow", variableName: DEFAULT_VAR_NAME[inputType] },
    quickReplyButtons: [{ label: "", mappedValue: "" }, { label: "", mappedValue: "" }],
    listSections: [{ sectionLabel: "", options: [{ label: "", mappedValue: "" }] }],
    numberRange: { min: "", max: "" },
    dateRange: { min: "", max: "" },
    countryCodeHint: "",
    maxFileSizeMb: "",
    maxDurationSec: "",
    allowedFileTypes: [],
  };
}

function CILabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? WA_GREEN : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", cursor: "pointer", background: open ? "#F8FAFC" : "#fff", userSelect: "none" }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{title}</span>
        <span style={{ fontSize: 14, color: MUTED, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: "12px 12px 14px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function QuickReplyEditor({ buttons, onChange }) {
  const add = () => onChange([...buttons, { label: "", mappedValue: "" }]);
  const remove = (i) => onChange(buttons.filter((_, j) => j !== i));
  const update = (i, field, val) => { const b = [...buttons]; b[i] = { ...b[i], [field]: val }; onChange(b); };

  return (
    <div>
      <CILabel>Button Options</CILabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {buttons.map((btn, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={btn.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder={`Option ${i + 1} label`}
              maxLength={20}
              style={{ flex: 2, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
            />
            <input
              value={btn.mappedValue}
              onChange={(e) => update(i, "mappedValue", e.target.value)}
              placeholder="Saved value (optional)"
              style={{ flex: 2, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
            />
            {buttons.length > 2 && (
              <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 16, padding: "0 4px" }}>×</button>
            )}
          </div>
        ))}
        {buttons.length < 3 && (
          <button type="button" onClick={add} style={{ width: "100%", padding: "7px", border: `1.5px dashed ${BORDER}`, borderRadius: 6, background: "transparent", fontSize: 11, color: MUTED, cursor: "pointer" }}>
            + Add Option
          </button>
        )}
      </div>
      <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>2–3 buttons. "Saved value" is stored in the variable (defaults to label if blank).</div>
    </div>
  );
}

function ListEditor({ sections, onChange }) {
  const addSection = () => onChange([...sections, { sectionLabel: "", options: [{ label: "", mappedValue: "" }] }]);
  const removeSection = (si) => onChange(sections.filter((_, j) => j !== si));
  const updateSectionLabel = (si, val) => { const s = [...sections]; s[si] = { ...s[si], sectionLabel: val }; onChange(s); };
  const addOption = (si) => { const s = [...sections]; s[si] = { ...s[si], options: [...s[si].options, { label: "", mappedValue: "" }] }; onChange(s); };
  const removeOption = (si, oi) => { const s = [...sections]; s[si] = { ...s[si], options: s[si].options.filter((_, j) => j !== oi) }; onChange(s); };
  const updateOption = (si, oi, field, val) => { const s = [...sections]; const opts = [...s[si].options]; opts[oi] = { ...opts[oi], [field]: val }; s[si] = { ...s[si], options: opts }; onChange(s); };
  const totalOptions = sections.reduce((sum, s) => sum + s.options.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <CILabel>List Options (max 10 total)</CILabel>
      {sections.map((section, si) => (
        <div key={si} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
            <input
              value={section.sectionLabel}
              onChange={(e) => updateSectionLabel(si, e.target.value)}
              placeholder="Section label (optional)"
              style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 4, outline: "none" }}
            />
            {sections.length > 1 && (
              <button type="button" onClick={() => removeSection(si)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14 }}>×</button>
            )}
          </div>
          <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
            {section.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <input value={opt.label} onChange={(e) => updateOption(si, oi, "label", e.target.value)} placeholder={`Option ${oi + 1}`}
                  style={{ flex: 2, padding: "5px 7px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 4, outline: "none" }} />
                <input value={opt.mappedValue} onChange={(e) => updateOption(si, oi, "mappedValue", e.target.value)} placeholder="Saved value"
                  style={{ flex: 2, padding: "5px 7px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 4, outline: "none" }} />
                {section.options.length > 1 && (
                  <button type="button" onClick={() => removeOption(si, oi)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14 }}>×</button>
                )}
              </div>
            ))}
            {totalOptions < 10 && (
              <button type="button" onClick={() => addOption(si)} style={{ width: "100%", padding: "5px", border: `1.5px dashed ${BORDER}`, borderRadius: 4, background: "transparent", fontSize: 10, color: MUTED, cursor: "pointer" }}>
                + Add Option
              </button>
            )}
          </div>
        </div>
      ))}
      {totalOptions < 10 && (
        <button type="button" onClick={addSection} style={{ width: "100%", padding: "7px", border: `1.5px dashed ${BORDER}`, borderRadius: 6, background: "transparent", fontSize: 11, color: MUTED, cursor: "pointer" }}>
          + Add Section
        </button>
      )}
    </div>
  );
}

export default function CollectInputForm({ initial, onApply, onCancel }) {
  const [draft, setDraft] = useState(initial?.isCollectInput ? initial : defaultDraft("email"));

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const patchNested = (key, p) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...p } }));

  const supportsConfirmation = CONFIRMATION_TYPES.has(draft.inputType);
  const isChoice = draft.inputType === "quick_reply" || draft.inputType === "list";

  const handleTypeChange = (newType) => {
    // When changing type, reset type-specific fields and update defaults
    const supportsConf = CONFIRMATION_TYPES.has(newType);
    setDraft((d) => ({
      ...d,
      inputType: newType,
      errorMessage: DEFAULT_ERROR_MSG[newType],
      confirmation: { ...d.confirmation, enabled: supportsConf },
      saveToVariable: { ...d.saveToVariable, variableName: DEFAULT_VAR_NAME[newType] },
    }));
  };

  const insertVariable = () => {
    patch({ questionMessage: (draft.questionMessage || "") + " {{" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Collect Input</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>📝 Ask a question and collect structured input during the conversation</div>
      </div>

      {/* Input Type */}
      <div>
        <CILabel htmlFor="ci-input-type">Input Type</CILabel>
        <select
          id="ci-input-type"
          aria-label="Input type"
          value={draft.inputType}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
        >
          {INPUT_TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.types.map((t) => (
                <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Question Message */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <CILabel>Question Message *</CILabel>
          <button type="button" onClick={insertVariable} style={{ fontSize: 10, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            + Add Variable
          </button>
        </div>
        <textarea
          value={draft.questionMessage}
          onChange={(e) => patch({ questionMessage: e.target.value.slice(0, 1000) })}
          placeholder={
            draft.inputType === "email"       ? "What's your email address?" :
            draft.inputType === "phone"       ? "What's your phone number?" :
            draft.inputType === "quick_reply" ? "Which option do you prefer?" :
            draft.inputType === "location"    ? "Please share your delivery address." :
            draft.inputType === "image"       ? "Please share a photo of your product." :
            "Enter your question…"
          }
          rows={3}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit" }}
        />
        <div style={{ textAlign: "right", fontSize: 10, color: MUTED, marginTop: 3 }}>{(draft.questionMessage || "").length}/1000</div>
      </div>

      {/* Choice-type editors — shown inline (not collapsible) */}
      {draft.inputType === "quick_reply" && (
        <QuickReplyEditor
          buttons={draft.quickReplyButtons}
          onChange={(buttons) => patch({ quickReplyButtons: buttons })}
        />
      )}
      {draft.inputType === "list" && (
        <ListEditor
          sections={draft.listSections}
          onChange={(sections) => patch({ listSections: sections })}
        />
      )}

      {/* Type-specific config (number range, date range, phone hint, media limits) */}
      {draft.inputType === "number" && (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <CILabel>Min (optional)</CILabel>
            <input type="number" value={draft.numberRange.min} onChange={(e) => patchNested("numberRange", { min: e.target.value })}
              placeholder="e.g. 0" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <CILabel>Max (optional)</CILabel>
            <input type="number" value={draft.numberRange.max} onChange={(e) => patchNested("numberRange", { max: e.target.value })}
              placeholder="e.g. 100" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          </div>
        </div>
      )}
      {draft.inputType === "date" && (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <CILabel>Min Date (optional)</CILabel>
            <input type="date" value={draft.dateRange.min} onChange={(e) => patchNested("dateRange", { min: e.target.value })}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <CILabel>Max Date (optional)</CILabel>
            <input type="date" value={draft.dateRange.max} onChange={(e) => patchNested("dateRange", { max: e.target.value })}
              style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          </div>
        </div>
      )}
      {draft.inputType === "phone" && (
        <div>
          <CILabel>Country Code Hint (optional)</CILabel>
          <input value={draft.countryCodeHint} onChange={(e) => patch({ countryCodeHint: e.target.value })} placeholder="e.g. +91"
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
        </div>
      )}
      {(draft.inputType === "image" || draft.inputType === "video" || draft.inputType === "audio" || draft.inputType === "document") && (
        <div style={{ display: "flex", gap: 8 }}>
          {(draft.inputType === "image" || draft.inputType === "video" || draft.inputType === "document") && (
            <div style={{ flex: 1 }}>
              <CILabel>Max File Size (MB)</CILabel>
              <input type="number" value={draft.maxFileSizeMb} onChange={(e) => patch({ maxFileSizeMb: e.target.value })} placeholder="e.g. 16"
                style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
            </div>
          )}
          {(draft.inputType === "video" || draft.inputType === "audio") && (
            <div style={{ flex: 1 }}>
              <CILabel>Max Duration (sec)</CILabel>
              <input type="number" value={draft.maxDurationSec} onChange={(e) => patch({ maxDurationSec: e.target.value })} placeholder="e.g. 60"
                style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
            </div>
          )}
        </div>
      )}
      {draft.inputType === "document" && (
        <div>
          <CILabel>Allowed File Types (optional)</CILabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["PDF", "DOCX", "XLS", "CSV"].map((ext) => {
              const active = draft.allowedFileTypes.includes(ext);
              return (
                <button
                  key={ext} type="button"
                  onClick={() => patch({ allowedFileTypes: active ? draft.allowedFileTypes.filter((t) => t !== ext) : [...draft.allowedFileTypes, ext] })}
                  style={{ padding: "4px 10px", borderRadius: 16, border: `1.5px solid ${active ? PRIMARY : BORDER}`, background: active ? "#F5F3FF" : "#fff", color: active ? PRIMARY : "#64748B", fontSize: 11, fontWeight: 500, cursor: "pointer" }}
                >{ext}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Collapsible Sections ── */}

      {/* Confirmation — text-based types only */}
      {supportsConfirmation && (
        <CollapsibleSection title="Confirmation" defaultOpen={false}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#374151" }}>Enable confirmation step</span>
            <Toggle on={draft.confirmation.enabled} onChange={(v) => patchNested("confirmation", { enabled: v })} />
          </div>
          {draft.confirmation.enabled && (
            <>
              <div>
                <CILabel>Confirmation Message</CILabel>
                <textarea
                  value={draft.confirmation.message}
                  onChange={(e) => patchNested("confirmation", { message: e.target.value })}
                  rows={2}
                  style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", fontFamily: "inherit" }}
                />
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Use {"{{collected_value}}"} to show the user's input in the message.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <CILabel>Confirm Button Label</CILabel>
                  <input value={draft.confirmation.confirmLabel} onChange={(e) => patchNested("confirmation", { confirmLabel: e.target.value })} maxLength={20}
                    style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <CILabel>Edit Button Label</CILabel>
                  <input value={draft.confirmation.editLabel} onChange={(e) => patchNested("confirmation", { editLabel: e.target.value })} maxLength={20}
                    style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
                </div>
              </div>
            </>
          )}
        </CollapsibleSection>
      )}

      {/* Error & Retries */}
      <CollapsibleSection title="Error & Retries" defaultOpen={false}>
        <div>
          <CILabel>Error Message</CILabel>
          <textarea
            value={draft.errorMessage}
            onChange={(e) => patch({ errorMessage: e.target.value })}
            rows={2}
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <CILabel>Retry Attempts</CILabel>
          <select value={draft.retryAttempts} onChange={(e) => patch({ retryAttempts: Number(e.target.value) })}
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", cursor: "pointer" }}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 10, color: MUTED }}>After {draft.retryAttempts} failed {draft.retryAttempts === 1 ? "attempt" : "attempts"}, the Limit Reached branch fires.</div>
      </CollapsibleSection>

      {/* No Response */}
      <CollapsibleSection title="No Response" defaultOpen={false}>
        <div>
          <CILabel>Timeout</CILabel>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number" min={1} value={draft.noResponse.timeoutValue}
              onChange={(e) => patchNested("noResponse", { timeoutValue: e.target.value })}
              style={{ flex: 2, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
            />
            <select value={draft.noResponse.timeoutUnit} onChange={(e) => patchNested("noResponse", { timeoutUnit: e.target.value })}
              style={{ flex: 3, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", cursor: "pointer" }}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>Re-send question once</div>
            <div style={{ fontSize: 10, color: MUTED }}>Sends the question again before triggering No Response</div>
          </div>
          <Toggle on={draft.noResponse.retryOnce} onChange={(v) => patchNested("noResponse", { retryOnce: v })} />
        </div>
      </CollapsibleSection>

      {/* Save to Variable */}
      <CollapsibleSection title="Save to Variable" defaultOpen={false}>
        <div>
          <CILabel>Scope</CILabel>
          <div style={{ display: "flex", gap: 8 }}>
            {["flow", "global"].map((scope) => (
              <button key={scope} type="button"
                onClick={() => patchNested("saveToVariable", { scope })}
                style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1.5px solid ${draft.saveToVariable.scope === scope ? PRIMARY : BORDER}`, background: draft.saveToVariable.scope === scope ? "#F5F3FF" : "#fff", color: draft.saveToVariable.scope === scope ? PRIMARY : "#64748B", fontSize: 12, fontWeight: 500, cursor: "pointer", textTransform: "capitalize" }}>
                {scope === "flow" ? "Flow Variable" : "Global Variable"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <CILabel>Variable Name</CILabel>
          <input value={draft.saveToVariable.variableName} onChange={(e) => patchNested("saveToVariable", { variableName: e.target.value })}
            placeholder="e.g. collected_email"
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
            {draft.saveToVariable.scope === "flow" ? "Available within this flow only." : "Available across all flows."}
          </div>
        </div>
      </CollapsibleSection>

      {/* Apply / Cancel */}
      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={() => onApply(draft)}
          style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Apply
        </button>
      </div>
    </div>
  );
}
