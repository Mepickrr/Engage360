# Collect Input Node — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `collect_input` as a new WhatsApp template style that lets sellers gather structured input from users during the 24-hour service window, with 12 input types, type-driven validation, collapsible config sections, and 4 fixed output ports (Success / No Response / Limit Reached / Send Failed).

**Architecture:** The Collect Input node is a new template style inside the existing WhatsApp node — same canvas card, same right panel shell, different content form and output ports. `CollectInputForm` follows the same pattern as `CarouselForm`: a local draft, Apply/Cancel, stored as `template: { isCollectInput: true, ...draft }` on the node. The canvas node (`index.jsx`) detects `templateStyle === "collect_input"` and renders a dedicated preview and fixed port set.

**Tech Stack:** React (JSX), inline styles (no CSS files), Zustand (`useFlowBuilderStore`), React Flow handles for output ports. Test runner: `craco test` (Create React App + Jest + React Testing Library).

## Global Constraints

- All styling uses inline `style` props — no CSS modules, no Tailwind classes, no new CSS files
- Color constants already defined in each file: `WA_GREEN = "#25D366"`, `PRIMARY = "#6C3AE8"`, `BORDER = "#E5E7EB"`, `MUTED = "#94A3B8"`
- New components defined at module scope (never inside render functions) — React requirement for stable identity
- `collect_input` must appear in both `TEMPLATE_STYLES` (WhatsAppRightPanel.jsx) and `V2_ALLOWED_TEMPLATE_STYLES` (FlowBuilderV2.jsx)
- Output port IDs for collect_input: `ci_success`, `ci_no_response`, `ci_limit_reached`, `ci_send_failed`
- Variable insertion uses the same `SYSTEM_VARIABLES` from `./data/mockTemplates` as Standard templates
- Confirmation quick reply uses WhatsApp's native button format — stored as `confirmation.confirmLabel` / `confirmation.editLabel`

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx` | Add `collect_input` to `TEMPLATE_STYLES`, add `CollectInputForm` component, wire into `TemplateTab` |
| Modify | `src/components/flows/builder/nodes/WhatsAppNode/index.jsx` | Add `CollectInputNodePreview` component, add CI output ports branch |
| Modify | `src/pages/FlowBuilderV2.jsx` | Add `collect_input` to `V2_ALLOWED_TEMPLATE_STYLES` |
| Create | `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx` | Unit tests for CollectInputForm |
| Create | `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputNode.test.jsx` | Unit tests for canvas node with collect_input style |

---

## Task 1: Register `collect_input` template style

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx:51-61`
- Modify: `src/pages/FlowBuilderV2.jsx:27-29`

**Interfaces:**
- Produces: `TEMPLATE_STYLES` array includes `{ id: "collect_input", label: "Collect Input", emoji: "📝", desc: "Collect structured input from users during a WhatsApp conversation" }`
- Produces: `V2_ALLOWED_TEMPLATE_STYLES` includes `"collect_input"`

- [ ] **Step 1: Add `collect_input` to `TEMPLATE_STYLES`**

Open `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx`. Replace the `TEMPLATE_STYLES` array (lines 51–61):

```javascript
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
```

- [ ] **Step 2: Add `collect_input` to V2 allow-list**

Open `src/pages/FlowBuilderV2.jsx`. Replace lines 27–29:

```javascript
const V2_ALLOWED_TEMPLATE_STYLES = [
  "standard", "list", "carousel", "payment_link", "call_permission", "collect_input",
];
```

- [ ] **Step 3: Run the app and verify**

```bash
npm start
```

Open the flow builder, add a WhatsApp node, open the right panel. Confirm "Collect Input 📝" card appears in the template style picker grid — in both FlowBuilder (all styles visible) and FlowBuilderV2 (only allowed styles visible). No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx src/pages/FlowBuilderV2.jsx
git commit -m "feat: register collect_input as WhatsApp template style in picker and V2 allow-list"
```

---

## Task 2: Build `CollectInputForm` component

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx` (add after `CarouselForm` at line 544)
- Create: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx`

**Interfaces:**
- Consumes: `CollectInputForm({ initial, onApply, onCancel })` — `initial` is `null` or an existing `{ isCollectInput: true, inputType, questionMessage, ... }` object
- Produces: `onApply(draft)` called with the full draft object; `onCancel()` called on back/cancel

The `draft` object shape:
```javascript
{
  isCollectInput: true,
  inputType: "email",
  questionMessage: "",
  // Confirmation (text-based types only)
  confirmation: { enabled: true, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" },
  // Error & Retries
  errorMessage: "That doesn't look like a valid email. Please try again.",
  retryAttempts: 3,
  // No Response
  noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false },
  // Save to Variable
  saveToVariable: { scope: "flow", variableName: "collected_email" },
  // Quick Reply type only
  quickReplyButtons: [{ label: "", mappedValue: "" }, { label: "", mappedValue: "" }],
  // List type only
  listSections: [{ sectionLabel: "", options: [{ label: "", mappedValue: "" }] }],
  // Number type only
  numberRange: { min: "", max: "" },
  // Date type only
  dateRange: { min: "", max: "" },
  // Phone type only
  countryCodeHint: "",
  // Media types only
  maxFileSizeMb: "",
  maxDurationSec: "",
  allowedFileTypes: [],
}
```

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CollectInputForm from "../CollectInputForm";

describe("CollectInputForm", () => {
  const noop = () => {};

  it("renders input type selector and question message field", () => {
    render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Input Type")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what.*email/i)).toBeInTheDocument();
  });

  it("shows confirmation section for text-based types and hides it for media types", () => {
    const { rerender } = render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    // Default is email — confirmation section should exist
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
    // Change to Image — confirmation should not exist
    const select = screen.getByRole("combobox", { name: /input type/i });
    fireEvent.change(select, { target: { value: "image" } });
    expect(screen.queryByText("Confirmation")).not.toBeInTheDocument();
  });

  it("shows quick reply button editor when type is quick_reply", () => {
    render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} />);
    const select = screen.getByRole("combobox", { name: /input type/i });
    fireEvent.change(select, { target: { value: "quick_reply" } });
    expect(screen.getByText("Button Options")).toBeInTheDocument();
  });

  it("calls onApply with draft when Apply is clicked", () => {
    const onApply = jest.fn();
    render(<CollectInputForm initial={null} onApply={onApply} onCancel={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ isCollectInput: true, inputType: "email" }));
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CollectInputForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="CollectInputForm" --watchAll=false
```

Expected: FAIL — `CollectInputForm` module not found.

- [ ] **Step 3: Create `CollectInputForm.jsx` — constants and helpers**

Create `src/components/flows/builder/nodes/WhatsAppNode/CollectInputForm.jsx`:

```jsx
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
```

- [ ] **Step 4: Add shared UI sub-components to `CollectInputForm.jsx`**

Append to `CollectInputForm.jsx`:

```jsx
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
```

- [ ] **Step 5: Add type-specific config sub-components to `CollectInputForm.jsx`**

Append to `CollectInputForm.jsx`:

```jsx
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
```

- [ ] **Step 6: Add the main `CollectInputForm` export to `CollectInputForm.jsx`**

Append to `CollectInputForm.jsx`:

```jsx
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
```

- [ ] **Step 7: Update the test file import path**

The test imports `CollectInputForm` from `"../CollectInputForm"`. Verify the path matches the file created in Step 6.

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="CollectInputForm" --watchAll=false
```

Expected: All 5 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/CollectInputForm.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx
git commit -m "feat: add CollectInputForm component with 12 input types and collapsible sections"
```

---

## Task 3: Wire `CollectInputForm` into `TemplateTab` routing

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx` (lines 546–621, `TemplateTab` component)

**Interfaces:**
- Consumes: `CollectInputForm` from `"./CollectInputForm"` (add import at top of file)
- Produces: When `templateStyle === "collect_input"` and no template → `CollectInputForm` is shown; when configured → styled summary card with Edit button

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabCollectInput.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowVariantContext } from "@/components/flows/FlowVariantContext";

// Minimal mock of WhatsAppRightPanel's TemplateTab — test via the full panel
jest.mock("@/store/flowBuilderStore", () => ({
  useFlowBuilderStore: () => ({ updateNodeData: jest.fn() }),
}));

// We test TemplateTab behavior via WhatsAppRightPanel since TemplateTab is not exported
import WhatsAppRightPanel from "../WhatsAppRightPanel";

function renderPanel(nodeData) {
  const patch = jest.fn();
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
      <WhatsAppRightPanel nodeId="node_1" data={nodeData} />
    </FlowVariantContext.Provider>
  );
  return { patch };
}

describe("TemplateTab collect_input routing", () => {
  it("shows CollectInputForm when templateStyle is collect_input and no template", () => {
    renderPanel({ templateStyle: "collect_input", template: null });
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByText("Input Type")).toBeInTheDocument();
  });

  it("shows configured summary when template is set", () => {
    renderPanel({
      templateStyle: "collect_input",
      template: { isCollectInput: true, inputType: "email", questionMessage: "What is your email?", retryAttempts: 3 },
    });
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="TemplateTabCollectInput" --watchAll=false
```

Expected: FAIL — `collect_input` routing not implemented.

- [ ] **Step 3: Add import to `WhatsAppRightPanel.jsx`**

At the top of `WhatsAppRightPanel.jsx`, add after the existing imports:

```javascript
import CollectInputForm from "./CollectInputForm";
```

- [ ] **Step 4: Add `isCollectInput` state and routing to `TemplateTab`**

In `TemplateTab` (around line 547), add state after existing state declarations:

```javascript
const [editingCollectInput, setEditingCollectInput] = useState(false);
```

Add `isCollectInput` derived value after `isCarousel` (around line 558):

```javascript
const isCollectInput = templateStyle === "collect_input";
```

- [ ] **Step 5: Add `collect_input` routing block to `TemplateTab`**

In `TemplateTab`, after the Carousel routing block (after line 602), add:

```javascript
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
```

- [ ] **Step 6: Add configured state summary card for `collect_input`**

In `TemplateTab`, inside the main `return (` block, after the style chip section (around line 648), add a conditional block that renders when `isCollectInput && template`:

```javascript
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
```

Also add the `INPUT_TYPE_EMOJIS` constant at the top of `WhatsAppRightPanel.jsx` (after the `TEMPLATE_STYLES` array):

```javascript
const INPUT_TYPE_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="TemplateTabCollectInput" --watchAll=false
```

Expected: All 2 tests pass.

- [ ] **Step 8: Run app and test end-to-end flow manually**

```bash
npm start
```

Full manual flow:
1. Open Flow Builder, add a WhatsApp node
2. Click node → right panel opens → Template Style picker shows "Collect Input 📝"
3. Select Collect Input → `CollectInputForm` opens
4. Change type to "Quick Reply" → button editor appears
5. Fill question message, click Apply → configured summary card shows
6. Click Edit → form re-opens with existing data
7. Click Change (style chip) → resets to style picker

- [ ] **Step 9: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabCollectInput.test.jsx
git commit -m "feat: wire CollectInputForm into TemplateTab — routing, apply, configured summary card"
```

---

## Task 4: Add `CollectInputNodePreview` and 4 fixed output ports to canvas node

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/index.jsx`
- Create: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputNode.test.jsx`

**Interfaces:**
- Consumes: `data.templateStyle === "collect_input"` and `data.template` (the CI draft object from Task 3)
- Produces: Canvas card renders CI-specific message bubble preview; 4 fixed output ports with IDs `ci_success`, `ci_no_response`, `ci_limit_reached`, `ci_send_failed`

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputNode.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";

// React Flow requires these to be mocked in tests
jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));

jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);
jest.mock("./data/mockTemplates", () => ({
  DELIVERY_OUTPUT_OPTIONS: [],
  isConnectable: () => false,
  WABA_NUMBERS: [],
}));

const ciTemplate = {
  isCollectInput: true,
  inputType: "email",
  questionMessage: "What is your email address?",
  retryAttempts: 3,
  noResponse: { timeoutValue: 1, timeoutUnit: "hours" },
  saveToVariable: { scope: "flow", variableName: "collected_email" },
};

describe("WhatsAppNode — collect_input style", () => {
  it("renders input type chip and question preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/what is your email/i)).toBeInTheDocument();
  });

  it("renders all 4 fixed output port handles", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    expect(screen.getByTestId("handle-ci_success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_no_response")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_limit_reached")).toBeInTheDocument();
    expect(screen.getByTestId("handle-ci_send_failed")).toBeInTheDocument();
  });

  it("shows all 4 output port labels", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "collect_input", template: ciTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText(/no response/i)).toBeInTheDocument();
    expect(screen.getByText("Limit Reached")).toBeInTheDocument();
    expect(screen.getByText("Send Failed")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="CollectInputNode" --watchAll=false
```

Expected: FAIL — collect_input rendering not implemented in index.jsx.

- [ ] **Step 3: Add `CollectInputNodePreview` component to `index.jsx`**

In `src/components/flows/builder/nodes/WhatsAppNode/index.jsx`, add before the `WhatsAppNode` export (after `CarouselNodePreview`):

```jsx
const CI_INPUT_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};

function CollectInputNodePreview({ template }) {
  const emoji = CI_INPUT_EMOJIS[template?.inputType] || "📝";
  const typeLabel = (template?.inputType || "input").replace("_", " ");
  const question = template?.questionMessage || "";

  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
      {/* Input type badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0", marginBottom: 5 }}>
        <span style={{ fontSize: 11 }}>{emoji}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#065F46", textTransform: "capitalize" }}>{typeLabel}</span>
      </div>
      {/* Question bubble */}
      <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", padding: "6px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 11, color: "#111", lineHeight: 1.5 }}>
          {question ? (question.length > 80 ? question.slice(0, 80) + "…" : question) : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>No question set</span>}
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#aaa", marginTop: 2 }}>16:48 ✓✓</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add CI output ports rendering to `WhatsAppNode`**

In `WhatsAppNode` (the main export), add after the `isCarousel` derived value (around line 181):

```javascript
const isCollectInput = data?.templateStyle === "collect_input";
```

In the rendered JSX, find the existing message bubble / carousel branch (the `{isCarousel ? <CarouselNodePreview /> : <div style...>...</div>}` block). Wrap it with an outer `isCollectInput` check — do NOT delete the inner carousel/standard JSX:

```jsx
{/* ── Message bubble / carousel preview / collect input preview ── */}
{isCollectInput ? (
  <CollectInputNodePreview template={template} />
) : isCarousel ? (
  <CarouselNodePreview template={template} />
) : (
  /* keep the existing standard bubble <div> block exactly as-is here */
  <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
    {/* ← paste the existing standard bubble JSX here verbatim, no changes */}
  </div>
)}
```

The only change to the existing JSX is adding the outer `isCollectInput` ternary wrapper. The carousel and standard bubble inner JSX does not change.

- [ ] **Step 5: Add CI fixed output ports**

After the button ports section in `WhatsAppNode`, add a conditional block for CI ports. This replaces the delivery output ports when style is `collect_input`:

```jsx
{/* ── Collect Input fixed output ports ── */}
{isCollectInput ? (
  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
    {[
      { id: "ci_success",       label: "Success",       color: "#22C55E" },
      { id: "ci_no_response",   label: `No Response after ${template?.noResponse?.timeoutValue ?? 1} ${template?.noResponse?.timeoutUnit ?? "hours"}` },
      { id: "ci_limit_reached", label: "Limit Reached" },
      { id: "ci_send_failed",   label: "Send Failed",   color: "#EF4444" },
    ].map((port) => (
      <PortRow key={port.id} portId={port.id} label={port.label} wired={wiredPorts.includes(port.id)} />
    ))}
  </div>
) : (
  /* ── Standard delivery output ports ── */
  activeDeliveryPorts.length > 0 && (
    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
      {activeDeliveryPorts.map((opt) => (
        <PortRow key={opt.id} portId={opt.id} label={deliveryLabel(opt)} wired={wiredPorts.includes(opt.id)} />
      ))}
    </div>
  )
)}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="CollectInputNode" --watchAll=false
```

Expected: All 3 tests pass.

- [ ] **Step 7: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass, no regressions.

- [ ] **Step 8: Run app and verify canvas node visually**

```bash
npm start
```

1. Open flow builder, add a WhatsApp node
2. Select "Collect Input" style → fill question, click Apply
3. Close right panel — canvas node should show:
   - Input type badge (e.g. "📧 email")
   - Truncated question in a chat bubble
   - 4 output port dots: Success, No Response after X hours, Limit Reached, Send Failed
4. Drag an edge from each port to confirm React Flow wires correctly
5. Change input type to Quick Reply in the form → canvas node updates the badge

---

## Follow-on: Live WhatsApp Preview (not in this plan)

The spec (section 4.1) calls for a live preview panel that updates as the seller types. No existing template style implements this yet — `TemplatePreview.jsx` is a static thumbnail used only in the template picker modal. The live preview is a follow-on enhancement for all template styles, not a blocker for collect_input v1.

---

- [ ] **Step 9: Final commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/index.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputNode.test.jsx
git commit -m "feat: add CollectInputNodePreview and 4 fixed output ports to WhatsApp canvas node"
```
