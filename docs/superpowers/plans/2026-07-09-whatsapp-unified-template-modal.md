# WhatsApp Unified Template Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the WhatsApp node's inconsistent template-selection UI (two-button CTA + separate grid modal + inline forms + toggle-preview edit modal) with one `UnifiedTemplateModal` per template style that opens the instant a style is picked, offering a browse grid (with 2-3 seeded dummy templates per style) and a create/edit view with a left skeleton form and an always-visible right-side WhatsApp preview.

**Architecture:** A config registry (`templateStyleConfigs.js`) maps every WhatsApp template style to its field set, default draft, preview kind, and seeded dummy templates. A generic field renderer (`FormFields.jsx`) and preview renderer (`WhatsAppBubblePreview.jsx`) cover the "standard-shaped" styles (name/category/body/footer/buttons). Carousel, List, and Collect Input keep their existing bespoke editors (extracted/kept as standalone files) but gain a live-draft `onChange` callback so the same preview pane can mirror them. `UnifiedTemplateModal.jsx` is the shell that switches between the browse grid and the two-pane edit view, driven by the registry. `WhatsAppRightPanel.jsx` is simplified to open this one modal per style instead of branching on `isStandard`/`isCarousel`/`isCollectInput`/`isListMessage`.

**Tech Stack:** React (CRA/craco), plain inline-style components (no CSS framework in this dir), Jest + `@testing-library/react` for tests (`craco test`), `lucide-react` icons.

## Global Constraints

- Scope is the WhatsApp node only (`src/components/flows/builder/nodes/WhatsAppNode/`). The RCS node (`RCSTemplateModal.jsx`) is not modified — it is the visual reference for the edit view's left-form/right-preview layout only.
- Every pickable WhatsApp template style gets full browse-existing + create-new capability in the unified modal, including styles that previously showed the "create it in WhatsApp Business Manager" amber notice (Authentication, Session, Location, Audio, the 4 Order styles, the 4 Catalog styles, Call Permission). The real Meta-approval constraint is not modeled.
- Each style ships 2 seeded dummy templates in its config (the design spec calls for "2-3" — this plan uses 2 per style consistently; Standard keeps its existing 6 from `mockTemplates.js`).
- `Flow Builder V2` requires no separate code path — `WhatsAppRightPanel.jsx` is shared, gated only by `useFlowVariant().allowedTemplateStyleIds` filtering which style cards `TemplateStylePicker` shows. No task in this plan touches `FlowBuilderV2.jsx`.
- Test runner: `CI=true npx craco test --watchAll=false <path>` (non-interactive; the repo's `npm test` script runs `craco test` in watch mode, which will hang in an agentic shell — always pass `--watchAll=false`).
- Design spec: `docs/superpowers/specs/2026-07-09-whatsapp-unified-template-modal-design.md`.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `WhatsAppNode/CarouselForm.jsx` | **New** (extracted) | Carousel card editor, moved out of `WhatsAppRightPanel.jsx` so `UnifiedTemplateModal` can render it. |
| `WhatsAppNode/FormFields.jsx` | **New** | Shared field primitives (`Label`, `TextField`, `TextAreaField`, `SelectField`, `HeaderPickerField`, `ButtonsListField`) + `FieldRenderer` dispatcher. |
| `WhatsAppNode/WhatsAppBubblePreview.jsx` | **New** | Generic WhatsApp-bubble preview, switched on `previewKind`. |
| `WhatsAppNode/data/templateStyleConfigs.js` | **New** | Registry: field sets, default drafts, seeded dummy templates, preview kind — one entry per resolved style id. |
| `WhatsAppNode/UnifiedTemplateModal.jsx` | **New** | Modal shell: browse grid ↔ two-pane edit view. |
| `WhatsAppNode/CollectInputForm.jsx` | Modified | Add optional `onChange(draft)` live-draft callback. |
| `WhatsAppNode/ListMessageForm.jsx` | Modified | Add optional `onChange(draft)` live-draft callback. |
| `WhatsAppNode/WhatsAppRightPanel.jsx` | Modified | Remove `CarouselForm`/`InlineTemplateForm`/old CTA branches; open `UnifiedTemplateModal`; one generic "selected template" summary card. |
| `WhatsAppNode/TemplatePicker.jsx` | **Deleted** | Superseded by `UnifiedTemplateModal`'s browse view. |
| `WhatsAppNode/TemplateEditor.jsx` | **Deleted** | Superseded by `UnifiedTemplateModal`'s edit view. |
| `WhatsAppNode/__tests__/TemplateTabCollectInput.test.jsx` | Modified | Update to drive the modal instead of asserting inline rendering. |
| `WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx` | Modified | Same. |

---

### Task 1: Extract `CarouselForm` into its own file

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/CarouselForm.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx:26-36,550-734,827-841`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CarouselForm.test.jsx`

**Interfaces:**
- Produces: `export default function CarouselForm({ initial, onApply, onCancel })` — identical signature to today's inline version. `initial` is either `null` or a template with `isCarousel: true` and a `cards` array (`{ mediaUrl, cardBody, buttons }[]`).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/CarouselForm.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CarouselForm from "../CarouselForm";

const noop = () => {};

describe("CarouselForm", () => {
  it("renders with two default cards", () => {
    render(<CarouselForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Cards (2)")).toBeInTheDocument();
  });

  it("adds a card when the + tile is clicked", () => {
    render(<CarouselForm initial={null} onApply={noop} onCancel={noop} />);
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("Cards (3)")).toBeInTheDocument();
  });

  it("calls onApply with the draft, tagged isCarousel, when Apply Template is clicked", () => {
    const onApply = jest.fn();
    render(<CarouselForm initial={null} onApply={onApply} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/main message body/i), { target: { value: "New arrivals!" } });
    fireEvent.click(screen.getByRole("button", { name: /apply template/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ body: "New arrivals!", cards: expect.any(Array) }));
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<CarouselForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --watchAll=false CarouselForm.test.jsx`
Expected: FAIL — `Cannot find module '../CarouselForm'`

- [ ] **Step 3: Create `CarouselForm.jsx` with the extracted implementation**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/CarouselForm.jsx
import React, { useState } from "react";
import { Upload } from "lucide-react";

const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";
const CAROUSEL_BLUE = "#3D3CB8";
const MAX_CAROUSEL_BODY = 1024;
const MAX_CARD_BODY = 160;
const MAX_CAROUSEL_CARDS = 10;

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
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

export function defaultCarouselCard() {
  return { mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] };
}
export function defaultCarouselDraft() {
  return { name: "", category: "Marketing", language: "en", body: "", cards: [defaultCarouselCard(), defaultCarouselCard()] };
}

function CarouselCardThumb({ card, index, isSelected, onSelect, onDelete, canDelete }) {
  return (
    <div onClick={onSelect} style={{
      width: 72, flexShrink: 0, borderRadius: 8,
      border: `2px solid ${isSelected ? CAROUSEL_BLUE : BORDER}`,
      background: isSelected ? "#EEF2FF" : "#F8FAFC",
      cursor: "pointer", overflow: "hidden", transition: "border-color 0.15s",
    }}>
      <div style={{ background: CAROUSEL_BLUE, padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Card {index + 1}</span>
        {canDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
        )}
      </div>
      <div style={{ height: 44, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {card.mediaUrl ? <span style={{ fontSize: 16 }}>🖼</span> : <span style={{ fontSize: 14, color: CAROUSEL_BLUE, opacity: 0.35 }}>+</span>}
      </div>
      {(!card.mediaUrl || !card.cardBody) && (
        <div style={{ padding: "3px 4px", textAlign: "center" }}>
          <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>Incomplete</span>
        </div>
      )}
    </div>
  );
}

function CarouselCardEditor({ card, onChange }) {
  const patch = (p) => onChange({ ...card, ...p });
  const patchBtn = (i, p) => {
    const btns = [...(card.buttons || [])];
    btns[i] = { ...btns[i], ...p };
    patch({ buttons: btns });
  };
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ width: 116, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 10px" }}>
        <div style={{ width: "100%", height: 76, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px dashed ${BORDER}` }}
          onClick={() => alert("Media upload — connect your media library")}>
          {card.mediaUrl ? <span style={{ fontSize: 28 }}>🖼</span> : (
            <div style={{ textAlign: "center" }}>
              <Upload size={15} style={{ color: CAROUSEL_BLUE, opacity: 0.5 }} />
              <div style={{ fontSize: 9, color: CAROUSEL_BLUE, marginTop: 3, opacity: 0.6 }}>Upload image</div>
            </div>
          )}
        </div>
        <input value={card.mediaUrl || ""} onChange={(e) => patch({ mediaUrl: e.target.value })}
          placeholder="or paste URL" style={{ width: "100%", padding: "4px 6px", fontSize: 10, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
      </div>
      <div style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>Card Body</span>
            <span style={{ fontSize: 10, color: MUTED }}>{(card.cardBody || "").length}/{MAX_CARD_BODY}</span>
          </div>
          <textarea value={card.cardBody || ""} onChange={(e) => patch({ cardBody: e.target.value.slice(0, MAX_CARD_BODY) })}
            placeholder="Card message…" rows={3}
            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
        </div>
        <div>
          <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>Buttons</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 5 }}>
            {(card.buttons || []).map((btn, i) => (
              <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <select value={btn.type} onChange={(e) => patchBtn(i, { type: e.target.value })}
                  style={{ padding: "4px 6px", fontSize: 10, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer", flexShrink: 0 }}>
                  <option value="QUICK_REPLY">Reply</option>
                  <option value="URL">URL</option>
                </select>
                <input value={btn.label} onChange={(e) => patchBtn(i, { label: e.target.value.slice(0, 25) })}
                  placeholder="Button text" style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", minWidth: 0 }} />
                {(card.buttons || []).length > 1 && (
                  <button type="button" onClick={() => patch({ buttons: (card.buttons || []).filter((_, j) => j !== i) })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "2px 4px", fontSize: 13 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"} onMouseLeave={(e) => e.currentTarget.style.color = MUTED}>×</button>
                )}
              </div>
            ))}
            {(card.buttons || []).length < 2 && (
              <button type="button" onClick={() => patch({ buttons: [...(card.buttons || []), { type: "QUICK_REPLY", label: "" }] })}
                style={{ fontSize: 10, color: CAROUSEL_BLUE, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "2px 0", fontWeight: 600 }}>
                + Add Another Button
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarouselForm({ initial, onApply, onCancel, onChange }) {
  const [draft, setDraft] = useState(initial?.isCarousel ? initial : defaultCarouselDraft());
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const patchDraft = (p) => setDraft((d) => {
    const next = { ...d, ...p };
    if (onChange) onChange(next);
    return next;
  });
  const patchCard = (i, updated) => {
    const cards = [...draft.cards];
    cards[i] = updated;
    patchDraft({ cards });
  };
  const addCard = () => {
    if (draft.cards.length >= MAX_CAROUSEL_CARDS) return;
    const cards = [...draft.cards, defaultCarouselCard()];
    patchDraft({ cards });
    setActiveCardIdx(cards.length - 1);
  };
  const deleteCard = (i) => {
    if (draft.cards.length <= 1) return;
    const cards = draft.cards.filter((_, j) => j !== i);
    patchDraft({ cards });
    setActiveCardIdx(Math.min(activeCardIdx, cards.length - 1));
  };

  const activeCard = draft.cards[activeCardIdx] || defaultCarouselCard();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Template Content</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>🎠 Carousel · up to {MAX_CAROUSEL_CARDS} cards</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>Category</Label>
          <SelectField value={draft.category || "Marketing"} onChange={(v) => patchDraft({ category: v })} options={["Marketing", "Utility"]} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Language</Label>
          <SelectField value={draft.language || "en"} onChange={(v) => patchDraft({ language: v })} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }]} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Template Body</Label>
          <span style={{ fontSize: 10, color: MUTED }}>{(draft.body || "").length}/{MAX_CAROUSEL_BODY}</span>
        </div>
        <textarea value={draft.body || ""} onChange={(e) => patchDraft({ body: e.target.value.slice(0, MAX_CAROUSEL_BODY) })}
          placeholder="Main message body shared across all cards…" rows={4}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
      </div>

      <div>
        <Label>Cards ({draft.cards.length})</Label>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {draft.cards.map((card, i) => (
            <CarouselCardThumb key={i} card={card} index={i} isSelected={activeCardIdx === i}
              onSelect={() => setActiveCardIdx(i)} onDelete={() => deleteCard(i)} canDelete={draft.cards.length > 1} />
          ))}
          {draft.cards.length < MAX_CAROUSEL_CARDS && (
            <div onClick={addCard} style={{
              width: 72, flexShrink: 0, borderRadius: 8, border: `2px dashed ${BORDER}`,
              background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 82, transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = CAROUSEL_BLUE}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}>
              <span style={{ fontSize: 20, color: MUTED }}>+</span>
            </div>
          )}
        </div>
      </div>

      <CarouselCardEditor card={activeCard} onChange={(updated) => patchCard(activeCardIdx, updated)} />

      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={() => onApply(draft)}
          style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: CAROUSEL_BLUE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Apply Template
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --watchAll=false CarouselForm.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Remove the inline definitions from `WhatsAppRightPanel.jsx` and import the new file**

Delete lines 31-36 (`defaultCarouselCard`/`defaultCarouselDraft`), delete lines 550-734 (`CarouselCardThumb`, `CarouselCardEditor`, `CarouselForm`), and delete the now-unused top-level consts `CAROUSEL_BLUE`, `MAX_CAROUSEL_BODY`, `MAX_CARD_BODY`, `MAX_CAROUSEL_CARDS` from lines 26-29 **only if** nothing else in the file still references them — the "Carousel configured" summary block (around line 1043) also uses `CAROUSEL_BLUE`, so leave that one constant in place for now (Task 7 removes it when that summary block is deleted). Add the import:

```jsx
import CarouselForm from "./CarouselForm";
```

Leave every call site (`<CarouselForm initial={...} onCancel={...} onApply={...} />` around line 829) unchanged — the extracted component has the same props.

- [ ] **Step 6: Run the full WhatsAppNode test suite to confirm no regression**

Run: `CI=true npx craco test --watchAll=false src/components/flows/builder/nodes/WhatsAppNode`
Expected: PASS — all existing suites plus the new `CarouselForm.test.jsx` green.

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/CarouselForm.jsx src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/CarouselForm.test.jsx
git commit -m "refactor: extract CarouselForm into its own file"
```

---

### Task 2: Add a live-draft `onChange` callback to the bespoke editors

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/CarouselForm.jsx` (already accepts `onChange` from Task 1 — verify/keep)
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/ListMessageForm.jsx:70,83`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/CollectInputForm.jsx:236,240-241`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx` (extend existing file)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx` (extend existing file)

**Interfaces:**
- Produces: `ListMessageForm({ initial, onApply, onCancel, onChange })` and `CollectInputForm({ initial, onApply, onCancel, defaultInputType, onChange })` — `onChange` is optional, defaults to a no-op, and is called with the full current draft object on every edit (same shape `onApply` would eventually receive). `UnifiedTemplateModal` (Task 6) uses this to mirror the live draft into `WhatsAppBubblePreview`.

- [ ] **Step 1: Write the failing tests**

Append to `ListMessageForm.test.jsx`:
```jsx
it("calls onChange with the live draft on every edit", () => {
  const onChange = jest.fn();
  render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} onChange={onChange} />);
  fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ isListMessage: true, body: "Pick a plan" }));
});
```

Append to `CollectInputForm.test.jsx`:
```jsx
it("calls onChange with the live draft on every edit", () => {
  const onChange = jest.fn();
  render(<CollectInputForm initial={null} onApply={noop} onCancel={noop} onChange={onChange} />);
  const textarea = screen.getByPlaceholderText(/what.*email/i);
  fireEvent.change(textarea, { target: { value: "you@example.com" } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ isCollectInput: true, questionMessage: "you@example.com" }));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --watchAll=false ListMessageForm.test.jsx CollectInputForm.test.jsx`
Expected: FAIL — `onChange` never called (both new assertions).

- [ ] **Step 3: Wire `onChange` into `ListMessageForm.jsx`**

Change the function signature and `patch` helper (line 70 and 83):
```jsx
export default function ListMessageForm({ initial, onApply, onCancel, onChange = () => {} }) {
  const [draft, setDraft] = useState(() => {
    if (initial?.isListMessage) {
      const allRows = (initial.sections ?? []).flatMap((s) => s.rows ?? []);
      const maxIdx = allRows.reduce((m, r) => {
        const n = parseInt(r.id?.replace("row_", "") ?? "0", 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      return { ...initial, _nextRowIdx: maxIdx + 1 };
    }
    return defaultDraft();
  });

  const patch = (p) => setDraft((d) => {
    const next = { ...d, ...p };
    onChange(next);
    return next;
  });
```
(Leave every other line — including `setDraft` calls inside `addSection`/`addRow` that don't go through `patch` — as-is; those two are structural additions, not preview-relevant text edits, and adding `onChange` there is unnecessary for the preview pane which only needs to reflect body/header/footer/buttonText/section-row text.)

- [ ] **Step 4: Wire `onChange` into `CollectInputForm.jsx`**

Change the function signature and both patch helpers (lines 236, 240-241):
```jsx
export default function CollectInputForm({ initial, onApply, onCancel, defaultInputType, onChange = () => {} }) {
  const [draft, setDraft] = useState(initial?.isCollectInput ? initial : defaultDraft(defaultInputType || "email"));
  const [questionError, setQuestionError] = useState(false);

  const patch = (p) => setDraft((d) => {
    const next = { ...d, ...p };
    onChange(next);
    return next;
  });
  const patchNested = (key, p) => setDraft((d) => {
    const next = { ...d, [key]: { ...d[key], ...p } };
    onChange(next);
    return next;
  });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `CI=true npx craco test --watchAll=false ListMessageForm.test.jsx CollectInputForm.test.jsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/ListMessageForm.jsx src/components/flows/builder/nodes/WhatsAppNode/CollectInputForm.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/CollectInputForm.test.jsx
git commit -m "feat: add live-draft onChange callback to ListMessageForm and CollectInputForm"
```

---

### Task 3: Shared form-field primitives — `FormFields.jsx`

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FormFields.test.jsx`

**Interfaces:**
- Produces:
  - `export function FieldRenderer({ field, draft, onPatch })` — `field` is one of the shapes defined in Task 4's `templateStyleConfigs.js` (`{ key, label, type, placeholder?, rows?, options?, max? }` where `type` is `"text" | "textarea" | "select" | "header-picker" | "buttons-list"`). `onPatch(partialDraft)` merges into the current draft (same contract as every `patch()` helper already in this codebase).
  - `export const PRIMARY = "#6C3AE8"`, `export const BORDER = "#E5E7EB"`, `export const MUTED = "#94A3B8"` — re-exported so `UnifiedTemplateModal.jsx` and `WhatsAppBubblePreview.jsx` share the same palette without redefining it.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/FormFields.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldRenderer } from "../FormFields";

function Harness({ field, initialDraft }) {
  const [draft, setDraft] = React.useState(initialDraft);
  return <FieldRenderer field={field} draft={draft} onPatch={(p) => setDraft((d) => ({ ...d, ...p }))} />;
}

describe("FieldRenderer", () => {
  it("renders a text field and patches on change", () => {
    render(<Harness field={{ key: "name", label: "Template Name", type: "text", placeholder: "e.g. foo" }} initialDraft={{ name: "" }} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. foo"), { target: { value: "cart_recovery_v1" } });
    expect(screen.getByPlaceholderText("e.g. foo")).toHaveValue("cart_recovery_v1");
  });

  it("renders a textarea field", () => {
    render(<Harness field={{ key: "body", label: "Message Body", type: "textarea", rows: 5 }} initialDraft={{ body: "hello" }} />);
    expect(screen.getByDisplayValue("hello").tagName).toBe("TEXTAREA");
  });

  it("renders a select field with string options", () => {
    render(<Harness field={{ key: "category", label: "Category", type: "select", options: ["Marketing", "Utility"] }} initialDraft={{ category: "Marketing" }} />);
    expect(screen.getByRole("combobox")).toHaveValue("Marketing");
  });

  it("renders a header-picker field with type chips", () => {
    render(<Harness field={{ key: "header", label: "Header", type: "header-picker" }} initialDraft={{ header: { type: "none" } }} />);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("renders a buttons-list field and adds a button", () => {
    render(<Harness field={{ key: "buttons", label: "Buttons", type: "buttons-list", max: 3 }} initialDraft={{ buttons: [] }} />);
    fireEvent.click(screen.getByText("+ Add Button"));
    expect(screen.getByPlaceholderText("Button label")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --watchAll=false FormFields.test.jsx`
Expected: FAIL — `Cannot find module '../FormFields'`

- [ ] **Step 3: Implement `FormFields.jsx`**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --watchAll=false FormFields.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/FormFields.test.jsx
git commit -m "feat: add shared FieldRenderer form primitives for WhatsApp templates"
```

---

### Task 4: Generic preview — `WhatsAppBubblePreview.jsx`

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/WhatsAppBubblePreview.test.jsx`

**Interfaces:**
- Consumes: `PRIMARY`, `BORDER`, `MUTED` from `./FormFields` (Task 3).
- Produces: `export default function WhatsAppBubblePreview({ draft, previewKind })` where `previewKind` is one of `"standard" | "carousel" | "list" | "catalog" | "location" | "audio" | "collectInput"`. `draft` shape depends on `previewKind` — documented per-branch below and consumed as-is by Task 5's registry and Task 6's modal.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/WhatsAppBubblePreview.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppBubblePreview from "../WhatsAppBubblePreview";

describe("WhatsAppBubblePreview", () => {
  it("renders body text and buttons for previewKind=standard", () => {
    render(<WhatsAppBubblePreview previewKind="standard" draft={{ body: "Hello {{customer.name}}", footer: "Reply STOP", buttons: [{ label: "Shop Now" }] }} />);
    expect(screen.getByText("{{customer.name}}")).toBeInTheDocument();
    expect(screen.getByText("Reply STOP")).toBeInTheDocument();
    expect(screen.getByText("Shop Now")).toBeInTheDocument();
  });

  it("renders a fixed copy-code button for authentication drafts with codeButtonLabel and no buttons", () => {
    render(<WhatsAppBubblePreview previewKind="standard" draft={{ body: "Your code is {{otp}}", codeButtonLabel: "Copy Code" }} />);
    expect(screen.getByText("Copy Code")).toBeInTheDocument();
  });

  it("renders one card strip entry per card for previewKind=carousel", () => {
    render(<WhatsAppBubblePreview previewKind="carousel" draft={{ body: "New arrivals", cards: [{ cardBody: "Card A" }, { cardBody: "Card B" }] }} />);
    expect(screen.getByText("Card A")).toBeInTheDocument();
    expect(screen.getByText("Card B")).toBeInTheDocument();
  });

  it("renders a View Options list button for previewKind=list", () => {
    render(<WhatsAppBubblePreview previewKind="list" draft={{ body: "Pick a plan", buttonText: "Choose an option" }} />);
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("renders product chips for previewKind=catalog", () => {
    render(<WhatsAppBubblePreview previewKind="catalog" draft={{ body: "Bestsellers", productNames: "Rosemary Water, Hair Oil" }} />);
    expect(screen.getByText("Rosemary Water")).toBeInTheDocument();
    expect(screen.getByText("Hair Oil")).toBeInTheDocument();
  });

  it("renders the address caption for previewKind=location", () => {
    render(<WhatsAppBubblePreview previewKind="location" draft={{ body: "See you soon", addressLabel: "123 Rosemary Lane" }} />);
    expect(screen.getByText("123 Rosemary Lane")).toBeInTheDocument();
  });

  it("renders the audio label for previewKind=audio", () => {
    render(<WhatsAppBubblePreview previewKind="audio" draft={{ body: "Listen to this", audioLabel: "Founder note · 0:32" }} />);
    expect(screen.getByText("Founder note · 0:32")).toBeInTheDocument();
  });

  it("renders the question and input-type chip for previewKind=collectInput", () => {
    render(<WhatsAppBubblePreview previewKind="collectInput" draft={{ questionMessage: "What's your email?", inputType: "email" }} />);
    expect(screen.getByText("What's your email?")).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --watchAll=false WhatsAppBubblePreview.test.jsx`
Expected: FAIL — `Cannot find module '../WhatsAppBubblePreview'`

- [ ] **Step 3: Implement `WhatsAppBubblePreview.jsx`**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview.jsx
import React from "react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";

const INPUT_TYPE_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};

function renderBody(text) {
  if (!text) return <span style={{ color: MUTED, fontStyle: "italic" }}>Your message body will appear here…</span>;
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      return <span key={i} style={{ background: "#EEF2FF", color: PRIMARY, padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 }}>{part}</span>;
    }
    return part;
  });
}

function Bubble({ children }) {
  return (
    <div style={{ background: "#E5DDD5", borderRadius: 10, padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: "10px 10px 10px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function ButtonRow({ label }) {
  return (
    <div style={{ padding: "9px 12px", borderTop: "1px solid #f0f0f0", fontSize: 13, color: "#0a8fc4", textAlign: "center", fontWeight: 500 }}>
      {label}
    </div>
  );
}

function StandardPreview({ draft }) {
  const header = draft.header || {};
  const buttons = draft.buttons && draft.buttons.length > 0
    ? draft.buttons
    : draft.codeButtonLabel ? [{ label: draft.codeButtonLabel }] : [];
  return (
    <Bubble>
      {(header.type === "image" || header.type === "video") && (
        <div style={{ height: 90, background: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#94A3B8", fontSize: 11 }}>{header.type === "video" ? "▶ Video" : "🖼 Image"}</span>
        </div>
      )}
      {header.type === "text" && header.text && (
        <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>{header.text}</div>
      )}
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.footer && <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{draft.footer}</div>}
      {buttons.map((btn, i) => <ButtonRow key={i} label={btn.label || `Button ${i + 1}`} />)}
    </Bubble>
  );
}

function CarouselPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 12px 12px" }}>
        {(draft.cards || []).map((card, i) => (
          <div key={i} style={{ width: 110, flexShrink: 0, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ height: 60, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>🖼</div>
            <div style={{ padding: "6px 8px", fontSize: 10, color: "#111" }}>{card.cardBody || `Card ${i + 1}`}</div>
          </div>
        ))}
      </div>
    </Bubble>
  );
}

function ListPreview({ draft }) {
  return (
    <Bubble>
      {draft.header && <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>{draft.header}</div>}
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.footer && <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{draft.footer}</div>}
      <ButtonRow label={`📋 ${draft.buttonText || "View options"}`} />
    </Bubble>
  );
}

function CatalogPreview({ draft }) {
  const products = (draft.productNames || "").split(",").map((p) => p.trim()).filter(Boolean);
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 12px 12px" }}>
        {products.map((p, i) => (
          <span key={i} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 8, background: "#F1F5F9", color: "#475569" }}>{p}</span>
        ))}
      </div>
    </Bubble>
  );
}

function LocationPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ height: 90, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📍</div>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.addressLabel && <div style={{ padding: "0 12px 10px", fontSize: 11, color: "#64748B" }}>{draft.addressLabel}</div>}
    </Bubble>
  );
}

function AudioPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 10px" }}>
        <span style={{ fontSize: 16 }}>▶</span>
        <span style={{ fontSize: 11, color: "#64748B" }}>{draft.audioLabel || "Audio clip"}</span>
      </div>
    </Bubble>
  );
}

function CollectInputPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>
        {draft.questionMessage || <span style={{ color: MUTED, fontStyle: "italic" }}>Question will appear here…</span>}
      </div>
      <div style={{ padding: "0 12px 10px" }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "#EEF2FF", color: PRIMARY }}>
          {INPUT_TYPE_EMOJIS[draft.inputType] || "📝"} {draft.inputType || "text"}
        </span>
      </div>
    </Bubble>
  );
}

export default function WhatsAppBubblePreview({ draft, previewKind }) {
  const d = draft || {};
  if (previewKind === "carousel") return <CarouselPreview draft={d} />;
  if (previewKind === "list") return <ListPreview draft={d} />;
  if (previewKind === "catalog") return <CatalogPreview draft={d} />;
  if (previewKind === "location") return <LocationPreview draft={d} />;
  if (previewKind === "audio") return <AudioPreview draft={d} />;
  if (previewKind === "collectInput") return <CollectInputPreview draft={d} />;
  return <StandardPreview draft={d} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --watchAll=false WhatsAppBubblePreview.test.jsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/WhatsAppBubblePreview.test.jsx
git commit -m "feat: add generic WhatsAppBubblePreview for the unified template modal"
```

---

### Task 5: Style config registry — `templateStyleConfigs.js`

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/templateStyleConfigs.test.js`

**Interfaces:**
- Consumes: `MOCK_TEMPLATES` from `./mockTemplates`.
- Produces: `export const TEMPLATE_STYLE_CONFIGS` — a plain object keyed by every **resolved** style id (i.e. `mapsTo` targets, not the 9 `ask_*`/2 `list_*` shortcut ids). Each value: `{ previewKind, fields: Array|null, defaultDraft: object, mockTemplates: object[] }`. Also `export const COLLECT_INPUT_PRESETS` — a map from `presetInputType` to `{ inputType, questionMessage }`, used by `UnifiedTemplateModal` (Task 6) to seed a blank Collect Input draft when opened via one of the `ask_*` shortcut cards.

- [ ] **Step 1: Write the failing test**

```js
// src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/templateStyleConfigs.test.js
import { TEMPLATE_STYLE_CONFIGS, COLLECT_INPUT_PRESETS } from "../templateStyleConfigs";

const RESOLVED_STYLE_IDS = [
  "standard", "session", "authentication", "carousel", "location", "audio",
  "order_payment", "order_confirmation", "complete_checkout", "payment_link",
  "address", "collect_input", "call_permission",
  "catalog_single", "catalog_multiple", "catalog_view", "catalog_list_bestsellers", "catalog",
  "list",
];

describe("TEMPLATE_STYLE_CONFIGS", () => {
  it("has an entry for every resolved style id", () => {
    RESOLVED_STYLE_IDS.forEach((id) => {
      expect(TEMPLATE_STYLE_CONFIGS[id]).toBeDefined();
    });
  });

  it("every entry has a previewKind, a defaultDraft, and at least 2 mock templates", () => {
    Object.entries(TEMPLATE_STYLE_CONFIGS).forEach(([id, config]) => {
      expect(typeof config.previewKind).toBe("string");
      expect(typeof config.defaultDraft).toBe("object");
      expect(config.mockTemplates.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("standard-family entries expose a fields array; carousel/list/collect_input use their bespoke editor (fields: null)", () => {
    expect(Array.isArray(TEMPLATE_STYLE_CONFIGS.standard.fields)).toBe(true);
    expect(TEMPLATE_STYLE_CONFIGS.carousel.fields).toBeNull();
    expect(TEMPLATE_STYLE_CONFIGS.list.fields).toBeNull();
    expect(TEMPLATE_STYLE_CONFIGS.collect_input.fields).toBeNull();
  });

  it("standard reuses the 6 existing MOCK_TEMPLATES", () => {
    expect(TEMPLATE_STYLE_CONFIGS.standard.mockTemplates.length).toBe(6);
  });

  it("carousel mock templates are tagged isCarousel and have a cards array", () => {
    TEMPLATE_STYLE_CONFIGS.carousel.mockTemplates.forEach((t) => {
      expect(t.isCarousel).toBe(true);
      expect(Array.isArray(t.cards)).toBe(true);
    });
  });

  it("list mock templates are tagged isListMessage and have a sections array", () => {
    TEMPLATE_STYLE_CONFIGS.list.mockTemplates.forEach((t) => {
      expect(t.isListMessage).toBe(true);
      expect(Array.isArray(t.sections)).toBe(true);
    });
  });

  it("collect_input mock templates are tagged isCollectInput and have a questionMessage", () => {
    TEMPLATE_STYLE_CONFIGS.collect_input.mockTemplates.forEach((t) => {
      expect(t.isCollectInput).toBe(true);
      expect(typeof t.questionMessage).toBe("string");
    });
  });

  it("exposes a question preset for every ask_* input type shortcut", () => {
    ["text", "phone", "email", "number", "location", "image", "video", "document"].forEach((type) => {
      expect(COLLECT_INPUT_PRESETS[type]).toBeDefined();
      expect(typeof COLLECT_INPUT_PRESETS[type].questionMessage).toBe("string");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --watchAll=false templateStyleConfigs.test.js`
Expected: FAIL — `Cannot find module '../templateStyleConfigs'`

- [ ] **Step 3: Implement `templateStyleConfigs.js`**

```js
// src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js
import { MOCK_TEMPLATES } from "./mockTemplates";

const LANGUAGE_OPTIONS = [{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }];
const STATUS_OPTIONS = ["Draft", "Uploaded", "Approved", "Rejected", "Paused"];

export const STANDARD_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. cart_recovery_v1" },
  { key: "category", label: "Category", type: "select", options: ["Marketing", "Utility", "Conversational"] },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "header", label: "Header", type: "header-picker" },
  { key: "body", label: "Message Body", type: "textarea", rows: 5 },
  { key: "footer", label: "Footer (optional)", type: "text", placeholder: "Reply STOP to unsubscribe" },
  { key: "buttons", label: "Buttons", type: "buttons-list", max: 3 },
];

export const SESSION_FIELDS = STANDARD_FIELDS.filter((f) => f.key !== "category");

export const AUTH_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. otp_verification_v1" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "textarea", rows: 4 },
  { key: "codeButtonLabel", label: "Copy Code Button Label", type: "text", placeholder: "Copy Code" },
];

export const CATALOG_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. catalog_bestsellers_v1" },
  { key: "category", label: "Category", type: "select", options: ["Marketing", "Utility"] },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "textarea", rows: 3 },
  { key: "productNames", label: "Products (comma-separated)", type: "text", placeholder: "Rosemary Water, Hair Oil, Grey Hair Serum" },
];

export const LOCATION_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. store_location_v1" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "textarea", rows: 3 },
  { key: "addressLabel", label: "Address Caption", type: "text", placeholder: "123 Rosemary Lane, Bengaluru" },
];

export const AUDIO_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. founder_welcome_note" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Caption", type: "textarea", rows: 3 },
  { key: "audioLabel", label: "Audio Clip Label", type: "text", placeholder: "Founder's welcome note · 0:32" },
];

const STANDARD_DEFAULT_DRAFT = { name: "", category: "Marketing", language: "en", status: "Draft", header: { type: "none" }, body: "", footer: "", buttons: [] };

export const COLLECT_INPUT_PRESETS = {
  text: { inputType: "text", questionMessage: "Tell us what you're looking for today" },
  phone: { inputType: "phone", questionMessage: "What's your phone number?" },
  email: { inputType: "email", questionMessage: "What's your email address?" },
  number: { inputType: "number", questionMessage: "How would you rate your experience (1-5)?" },
  location: { inputType: "location", questionMessage: "Please share your delivery address." },
  image: { inputType: "image", questionMessage: "Please share a photo of your product." },
  video: { inputType: "video", questionMessage: "Please share a short video." },
  document: { inputType: "document", questionMessage: "Please share a document for reference." },
};

export const TEMPLATE_STYLE_CONFIGS = {
  standard: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: STANDARD_DEFAULT_DRAFT,
    mockTemplates: MOCK_TEMPLATES,
  },

  session: {
    previewKind: "standard",
    fields: SESSION_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Conversational" },
    mockTemplates: [
      { id: "session_1", name: "session_welcome_back", category: "Conversational", language: "en", status: "Active", header: { type: "none" }, body: "Welcome back! How can we help today?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Track Order" }, { type: "QUICK_REPLY", label: "Talk to Support" }] },
      { id: "session_2", name: "session_cart_reminder", category: "Conversational", language: "en", status: "Active", header: { type: "none" }, body: "Your cart is still here — need a hand checking out?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "View Cart" }] },
    ],
  },

  authentication: {
    previewKind: "standard",
    fields: AUTH_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "Your verification code is {{otp}}. Valid for 5 minutes. Don't share this code.", codeButtonLabel: "Copy Code" },
    mockTemplates: [
      { id: "auth_1", name: "otp_verification_v1", language: "en", status: "Approved", body: "Your verification code is {{otp}}. Valid for 5 minutes. Don't share this code.", codeButtonLabel: "Copy Code" },
      { id: "auth_2", name: "otp_resend_v1", language: "en", status: "Draft", body: "Didn't get it? Your new code is {{otp}}. Valid for 5 minutes.", codeButtonLabel: "Copy Code" },
    ],
  },

  carousel: {
    previewKind: "carousel",
    fields: null,
    defaultDraft: { name: "", category: "Marketing", language: "en", body: "", cards: [{ mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] }, { mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] }] },
    mockTemplates: [
      {
        id: "carousel_1", isCarousel: true, name: "new_arrivals_v1", category: "Marketing", language: "en", body: "Check out what's new this week 👀",
        cards: [
          { mediaUrl: "https://placehold.co/300x200/25D366/white?text=Rosemary+Water", cardBody: "Rosemary Water — ₹399", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/1a4a2e/white?text=Hair+Oil", cardBody: "Keshpallav Hair Oil — ₹499", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/2d4a22/white?text=Scalp+Serum", cardBody: "Scalptone Serum — ₹549", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
        ],
      },
      {
        id: "carousel_2", isCarousel: true, name: "bestsellers_this_week", category: "Marketing", language: "en", body: "Our bestsellers this week 🔥",
        cards: [
          { mediaUrl: "https://placehold.co/300x200/25D366/white?text=Bestseller+1", cardBody: "Grey Hair Serum — ₹449", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/1a4a2e/white?text=Bestseller+2", cardBody: "Hair Fall Kit — ₹899", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
        ],
      },
    ],
  },

  location: {
    previewKind: "location",
    fields: LOCATION_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "", addressLabel: "" },
    mockTemplates: [
      { id: "location_1", name: "store_location_v1", language: "en", status: "Active", body: "Our store is here — see you soon!", addressLabel: "123 Rosemary Lane, Bengaluru" },
      { id: "location_2", name: "pickup_point_confirmed", language: "en", status: "Active", body: "Pickup point confirmed for order #7842", addressLabel: "Avimee Pickup Point, MG Road" },
    ],
  },

  audio: {
    previewKind: "audio",
    fields: AUDIO_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "", audioLabel: "" },
    mockTemplates: [
      { id: "audio_1", name: "founder_welcome_note", language: "en", status: "Active", body: "Here's a quick voice note from our founder 🎙", audioLabel: "Founder's welcome note · 0:32" },
      { id: "audio_2", name: "rosemary_howto_audio", language: "en", status: "Draft", body: "Listen to how to use your Rosemary Water", audioLabel: "How-to guide · 0:48" },
    ],
  },

  order_payment: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "order_payment_1", name: "order_payment_pending", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Your order of Rosemary Water (₹399) is ready — complete payment to confirm.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "https://avimee.com/pay?ref={{order.id}}" }] },
      { id: "order_payment_2", name: "order_payment_multi_item", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "2 items in your order — pay ₹1,299 to ship today.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "https://avimee.com/pay" }] },
    ],
  },

  order_confirmation: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "order_confirmation_1", name: "order_confirmed_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Payment received! Order #7842 confirmed and being packed.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Track Order" }] },
      { id: "order_confirmation_2", name: "order_payment_failed_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Payment failed for order #7842 — retry now.", footer: "", buttons: [{ type: "URL", label: "Retry Payment", url: "https://avimee.com/pay?ref=7842" }] },
    ],
  },

  complete_checkout: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "complete_checkout_1", name: "checkout_confirm_address", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Let's finish your order — confirm your delivery address to continue.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Confirm Address" }, { type: "QUICK_REPLY", label: "Edit Address" }] },
      { id: "complete_checkout_2", name: "checkout_cod_confirm", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Confirm Cash on Delivery for your order — pay ₹1,299 on arrival.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Confirm COD" }] },
    ],
  },

  payment_link: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "payment_link_1", name: "payment_link_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Complete your ₹599 payment here.", footer: "", buttons: [{ type: "URL", label: "Pay via UPI", url: "upi://pay?ref=7842" }] },
      { id: "payment_link_2", name: "payment_link_reminder", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Reminder: your payment link expires in 2 hours.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "upi://pay?ref=7842" }] },
    ],
  },

  address: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "address_1", name: "confirm_delivery_address", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Please confirm your delivery address for order #7842.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Address is Correct" }, { type: "QUICK_REPLY", label: "Edit Address" }] },
      { id: "address_2", name: "add_landmark_hint", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Add a landmark to help our rider find you.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Add Landmark" }] },
    ],
  },

  collect_input: {
    previewKind: "collectInput",
    fields: null,
    defaultDraft: { isCollectInput: true, inputType: "text", questionMessage: "", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_text" } },
    mockTemplates: [
      { id: "collect_input_1", isCollectInput: true, inputType: "text", questionMessage: "Tell us what you're looking for today", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_text" }, confirmation: { enabled: false, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" }, errorMessage: "Please send a text message." },
      { id: "collect_input_2", isCollectInput: true, inputType: "email", questionMessage: "What's your email address?", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_email" }, confirmation: { enabled: true, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" }, errorMessage: "That doesn't look like a valid email. Please try again." },
    ],
  },

  call_permission: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "call_permission_1", name: "call_permission_order", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Can we give you a quick call about your order?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Allow" }, { type: "QUICK_REPLY", label: "Deny" }] },
      { id: "call_permission_2", name: "call_permission_support", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Our support team would like to call you back.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Allow" }, { type: "QUICK_REPLY", label: "Not Now" }] },
    ],
  },

  catalog_single: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "" },
    mockTemplates: [
      { id: "catalog_single_1", name: "featured_rosemary_water", category: "Marketing", language: "en", status: "Active", body: "Our most-loved product, one tap away.", productNames: "Rosemary Water" },
      { id: "catalog_single_2", name: "featured_hair_oil", category: "Marketing", language: "en", status: "Draft", body: "The oil everyone's talking about.", productNames: "Keshpallav Hair Oil" },
    ],
  },

  catalog_multiple: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "" },
    mockTemplates: [
      { id: "catalog_multiple_1", name: "top_3_products", category: "Marketing", language: "en", status: "Active", body: "Our top 3 picks for you.", productNames: "Rosemary Water, Keshpallav Hair Oil, Grey Hair Serum" },
      { id: "catalog_multiple_2", name: "combo_deal_set", category: "Marketing", language: "en", status: "Draft", body: "Bundle & save on our Combo Deal.", productNames: "Rosemary Water, Keshpallav Hair Oil" },
    ],
  },

  catalog_view: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "" },
    mockTemplates: [
      { id: "catalog_view_1", name: "browse_full_catalog", category: "Marketing", language: "en", status: "Active", body: "Browse our full catalog.", productNames: "Rosemary Water, Keshpallav Hair Oil, Grey Hair Serum, Scalptone Serum" },
      { id: "catalog_view_2", name: "new_collection_drop", category: "Marketing", language: "en", status: "Draft", body: "New collection just dropped.", productNames: "Scalptone Serum, Grey Hair Serum" },
    ],
  },

  catalog_list_bestsellers: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "" },
    mockTemplates: [
      { id: "catalog_list_bestsellers_1", name: "top_5_bestsellers", category: "Marketing", language: "en", status: "Active", body: "Our Top 5 Bestsellers.", productNames: "Rosemary Water, Hair Oil, Grey Hair Serum, Scalptone Serum, Hair Fall Kit" },
      { id: "catalog_list_bestsellers_2", name: "trending_this_month", category: "Marketing", language: "en", status: "Draft", body: "Trending This Month.", productNames: "Rosemary Water, Hair Fall Kit" },
    ],
  },

  catalog: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "" },
    mockTemplates: [
      { id: "catalog_1", name: "bestsellers_showcase", category: "Marketing", language: "en", status: "Active", body: "🔥 Bestsellers you'll love.", productNames: "Rosemary Water, Keshpallav Hair Oil" },
      { id: "catalog_2", name: "seasonal_sale_showcase", category: "Marketing", language: "en", status: "Draft", body: "Seasonal sale — up to 30% off bestsellers.", productNames: "Grey Hair Serum, Scalptone Serum" },
    ],
  },

  list: {
    previewKind: "list",
    fields: null,
    defaultDraft: { isListMessage: true, header: "", body: "", footer: "", buttonText: "", sections: [{ title: "", rows: [{ id: "row_1", title: "", description: "" }] }] },
    mockTemplates: [
      {
        id: "list_1", isListMessage: true, header: "", body: "Choose a delivery slot", footer: "", buttonText: "Pick a Slot",
        sections: [
          { title: "Morning", rows: [{ id: "row_1", title: "8am - 11am", description: "" }] },
          { title: "Afternoon", rows: [{ id: "row_2", title: "12pm - 3pm", description: "" }] },
          { title: "Evening", rows: [{ id: "row_3", title: "5pm - 8pm", description: "" }] },
        ],
      },
      {
        id: "list_2", isListMessage: true, header: "", body: "Pick a support topic", footer: "", buttonText: "View Topics",
        sections: [
          { title: "", rows: [
            { id: "row_1", title: "Orders", description: "" },
            { id: "row_2", title: "Returns", description: "" },
            { id: "row_3", title: "Other", description: "" },
          ] },
        ],
      },
    ],
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --watchAll=false templateStyleConfigs.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/templateStyleConfigs.test.js
git commit -m "feat: add per-style template config registry with seeded dummy templates"
```

---

### Task 6: Modal shell — `UnifiedTemplateModal.jsx`

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx`

**Interfaces:**
- Consumes: `TEMPLATE_STYLE_CONFIGS`, `COLLECT_INPUT_PRESETS` (Task 5); `FieldRenderer`, `PRIMARY`, `BORDER`, `MUTED` (Task 3); `WhatsAppBubblePreview` (Task 4); `CarouselForm` (Task 1), `ListMessageForm`, `CollectInputForm` (Task 2).
- Produces: `export default function UnifiedTemplateModal({ open, styleId, styleLabel, presetInputType, initialTemplate, customTemplates = [], onSave, onClose })`.
  - `styleId` is the **resolved** id (post-`mapsTo`), e.g. `"collect_input"` even when opened from the "Ask for Email" shortcut card.
  - `initialTemplate`: when set, the modal opens directly in edit mode pre-filled with it (used for the "Edit" action on an already-selected template). When absent, the modal opens in browse mode.
  - `customTemplates`: templates the seller already created earlier in this session for this style (merged into the browse grid alongside the config's seeded `mockTemplates`).
  - `onSave(template)`: called with the final draft when Save/Apply is clicked in edit mode.
  - `onClose()`: called on Cancel or the × button.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UnifiedTemplateModal from "../UnifiedTemplateModal";

const noop = () => {};

describe("UnifiedTemplateModal", () => {
  it("opens in browse mode showing the style's seeded templates and a Create new button", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    expect(screen.getByText(/select a template/i)).toBeInTheDocument();
    expect(screen.getByText("TRUST_NOTE_J")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
  });

  it("switches to the edit view with a live preview when a template card is clicked", () => {
    render(<UnifiedTemplateModal open styleId="standard" styleLabel="Template" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByText("TRUST_NOTE_J"));
    expect(screen.getByDisplayValue("TRUST_NOTE_J")).toBeInTheDocument();
    expect(screen.getByText(/avimee scalptone serum/i)).toBeInTheDocument();
  });

  it("switches to a blank edit view when Create new is clicked", () => {
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByPlaceholderText("e.g. store_location_v1")).toHaveValue("");
  });

  it("opens directly in edit mode when initialTemplate is provided", () => {
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" initialTemplate={{ name: "store_location_v1", language: "en", status: "Active", body: "Our store is here", addressLabel: "123 Rosemary Lane" }} onSave={noop} onClose={noop} />);
    expect(screen.getByDisplayValue("store_location_v1")).toBeInTheDocument();
  });

  it("calls onSave with the edited draft when Save is clicked", () => {
    const onSave = jest.fn();
    render(<UnifiedTemplateModal open styleId="location" styleLabel="Location send" onSave={onSave} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    fireEvent.change(screen.getByPlaceholderText("e.g. store_location_v1"), { target: { value: "my_store" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "my_store" }));
  });

  it("renders the bespoke CollectInputForm (not the generic field form) for styleId=collect_input, seeded from presetInputType", () => {
    render(<UnifiedTemplateModal open styleId="collect_input" styleLabel="Email" presetInputType="email" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what.*email/i)).toBeInTheDocument();
  });

  it("renders the bespoke CarouselForm for styleId=carousel and its own preview updates live", () => {
    render(<UnifiedTemplateModal open styleId="carousel" styleLabel="Carousel" onSave={noop} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    fireEvent.change(screen.getByPlaceholderText(/main message body/i), { target: { value: "Live preview check" } });
    expect(screen.getByText("Live preview check")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --watchAll=false UnifiedTemplateModal.test.jsx`
Expected: FAIL — `Cannot find module '../UnifiedTemplateModal'`

- [ ] **Step 3: Implement `UnifiedTemplateModal.jsx`**

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx
import React, { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { PRIMARY, BORDER, MUTED, FieldRenderer } from "./FormFields";
import WhatsAppBubblePreview from "./WhatsAppBubblePreview";
import CarouselForm from "./CarouselForm";
import ListMessageForm from "./ListMessageForm";
import CollectInputForm from "./CollectInputForm";
import { TEMPLATE_STYLE_CONFIGS, COLLECT_INPUT_PRESETS } from "./data/templateStyleConfigs";

const WA_GREEN = "#25D366";

function templateSummaryText(t) {
  if (t.isCarousel) return t.body || "";
  if (t.isListMessage) return t.body || "";
  if (t.isCollectInput) return t.questionMessage || "";
  return t.body || "";
}

function TemplateCard({ template, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, cursor: "pointer", background: "#fff", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = WA_GREEN)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{template.name}</div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {templateSummaryText(template)}
      </p>
    </div>
  );
}

function BrowseView({ styleLabel, templates, onSelect, onCreateNew, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = templates.filter((t) => (t.name || "").toLowerCase().includes(search.toLowerCase()) || templateSummaryText(t).toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select a {styleLabel} template</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} style={{ color: "#64748B" }} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="button" onClick={onCreateNew} style={{ padding: "8px 16px", background: PRIMARY, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Create new
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No templates found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map((t) => <TemplateCard key={t.id} template={t} onSelect={() => onSelect(t)} />)}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: MUTED }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</span>
        <button onClick={onClose} style={{ padding: "7px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>Cancel</button>
      </div>
    </div>
  );
}

function GenericEditForm({ fields, draft, onPatch }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {fields.map((field) => <FieldRenderer key={field.key} field={field} draft={draft} onPatch={onPatch} />)}
    </div>
  );
}

export default function UnifiedTemplateModal({ open, styleId, styleLabel, presetInputType, initialTemplate, customTemplates = [], onSave, onClose }) {
  const config = TEMPLATE_STYLE_CONFIGS[styleId];
  const [mode, setMode] = useState(initialTemplate ? "edit" : "browse");
  const [draft, setDraft] = useState(() => initialTemplate || config.defaultDraft);

  const allTemplates = useMemo(() => [...config.mockTemplates, ...customTemplates], [config, customTemplates]);

  if (!open || !config) return null;

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const openBlankDraft = () => {
    let blank = config.defaultDraft;
    if (styleId === "collect_input" && presetInputType && COLLECT_INPUT_PRESETS[presetInputType]) {
      blank = { ...blank, ...COLLECT_INPUT_PRESETS[presetInputType] };
    }
    setDraft(blank);
    setMode("edit");
  };

  const openExisting = (tpl) => {
    setDraft(tpl);
    setMode("edit");
  };

  const handleSave = (finalDraft) => onSave(finalDraft || draft);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 900px)", maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex" }}>
        {mode === "browse" ? (
          <div style={{ width: "100%" }}>
            <BrowseView styleLabel={styleLabel} templates={allTemplates} onSelect={openExisting} onCreateNew={openBlankDraft} onClose={onClose} />
          </div>
        ) : config.fields ? (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{initialTemplate ? "Edit Template" : `Create ${styleLabel} Template`}</div>
              <GenericEditForm fields={config.fields} draft={draft} onPatch={patch} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 9, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => handleSave()} style={{ flex: 2, padding: 9, border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
              </div>
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <WhatsAppBubblePreview draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, borderRight: `1px solid ${BORDER}` }}>
              {styleId === "carousel" && <CarouselForm initial={draft.isCarousel ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "list" && <ListMessageForm initial={draft.isListMessage ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "collect_input" && <CollectInputForm initial={draft.isCollectInput ? draft : null} defaultInputType={draft.inputType} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <WhatsAppBubblePreview draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --watchAll=false UnifiedTemplateModal.test.jsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx src/components/flows/builder/nodes/WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx
git commit -m "feat: add UnifiedTemplateModal (browse grid + two-pane edit view)"
```

---

### Task 7: Wire the modal into `WhatsAppRightPanel.jsx` and retire the old paths

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx` (the `TemplateTab` function and its call to `TemplateStylePicker`, roughly lines 736-1150 in the current file — exact line numbers will have shifted after Task 1's deletions, search for `function TemplateTab`)
- Delete: `src/components/flows/builder/nodes/WhatsAppNode/TemplatePicker.jsx`
- Delete: `src/components/flows/builder/nodes/WhatsAppNode/TemplateEditor.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabCollectInput.test.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx`

**Interfaces:**
- Consumes: `UnifiedTemplateModal` (Task 6), `resolveStyleInfo` (already exported from this same file, unchanged).

- [ ] **Step 1: Update the two existing tests that assumed inline (non-modal) rendering**

These tests currently render `WhatsAppRightPanel` with `templateStyle` already set and `template: null`, and assert the bespoke form is visible immediately. Under the new flow, a "no template yet" state shows a generic empty-state action instead, and the bespoke form only appears after opening the modal. Replace their bodies:

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabCollectInput.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowVariantContext } from "../../../../FlowVariantContext";
import WhatsAppRightPanel from "../WhatsAppRightPanel";

function renderPanel(nodeData) {
  const updateNodeData = jest.fn();
  const removeNode = jest.fn();
  const node = { id: "node_1", data: nodeData };
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
      <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
    </FlowVariantContext.Provider>
  );
  return { updateNodeData, removeNode };
}

describe("TemplateTab collect_input routing", () => {
  it("opens the unified modal with CollectInputForm when Create New is clicked", () => {
    renderPanel({ templateStyle: "collect_input", template: null });
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByText("Collect Input")).toBeInTheDocument();
    expect(screen.getByText("Input Type")).toBeInTheDocument();
  });

  it("shows configured summary when template is set", () => {
    renderPanel({
      templateStyle: "collect_input",
      template: { isCollectInput: true, inputType: "email", questionMessage: "What is your email?", retryAttempts: 3 },
    });
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });
});
```

```jsx
// src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FlowVariantContext } from "../../../../FlowVariantContext";
import WhatsAppRightPanel from "../WhatsAppRightPanel";

function renderPanel(nodeData) {
  const updateNodeData = jest.fn();
  const removeNode = jest.fn();
  const node = { id: "node_1", data: nodeData };
  render(
    <FlowVariantContext.Provider value={{ allowedTemplateStyleIds: null }}>
      <WhatsAppRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
    </FlowVariantContext.Provider>
  );
  return { updateNodeData, removeNode };
}

describe("TemplateTab list routing", () => {
  it("opens the unified modal with ListMessageForm when Create New is clicked", () => {
    renderPanel({ templateStyle: "list", template: null });
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });

  it("does NOT show the FBM amber warning for list style", () => {
    renderPanel({ templateStyle: "list", template: null });
    expect(screen.queryByText(/business manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/whatsapp manager/i)).not.toBeInTheDocument();
  });

  it("shows configured summary card when template is set", () => {
    renderPanel({
      templateStyle: "list",
      template: {
        isListMessage: true,
        header: "",
        body: "Pick a plan for your business",
        footer: "",
        buttonText: "View plans",
        sections: [
          { title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] },
        ],
      },
    });
    expect(screen.getByText(/pick a plan/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("does NOT show the FBM template section when template is configured", () => {
    renderPanel({
      templateStyle: "list",
      template: {
        isListMessage: true,
        header: "",
        body: "Pick a plan",
        footer: "",
        buttonText: "View",
        sections: [{ title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] }],
      },
    });
    expect(screen.queryByText(/business manager/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the updated tests to verify they fail against the current (unmodified) `WhatsAppRightPanel.jsx`**

Run: `CI=true npx craco test --watchAll=false TemplateTabCollectInput.test.jsx TemplateTabListMessage.test.jsx`
Expected: FAIL — no "Create New" role button exists yet in the "no template" state for these styles (today's code renders the form directly), and the list summary card text differs.

- [ ] **Step 3: Rewrite `TemplateTab` in `WhatsAppRightPanel.jsx`**

Find `function TemplateTab({ data, patch })` and replace its entire body (from that line through its closing `}` — everything through the current `return ( <> ... </> );` block, i.e. everything that today references `showPicker`, `showFallbackPicker`, `showEditor`, `editingFallback`, `creatingNew`, `editingCarousel`, `editingCollectInput`, `editingListMessage`, `newDraft`, `pendingInputType`, `InlineTemplateForm`, `TemplatePicker`, `TemplateEditor`, `CarouselForm`, `CollectInputForm`, `ListMessageForm` as standalone panel renders) with:

```jsx
function TemplateTab({ data, patch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("browse"); // browse | edit-existing
  const [pendingPresetInputType, setPendingPresetInputType] = useState(null);
  const [customTemplatesByStyle, setCustomTemplatesByStyle] = useState({});

  const templateStyle = data.templateStyle ?? null;
  const styleInfo = resolveStyleInfo(templateStyle);
  const { template, wabaNumberId, fallback = {} } = data;

  // ── Step 0: pick a sender number first, then a template style ──
  if (!wabaNumberId || !templateStyle) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label>Sender Number</Label>
          <select
            value={wabaNumberId || ""}
            onChange={(e) => patch({ wabaNumberId: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select a phone number</option>
            {WABA_NUMBERS.map((n) => (
              <option key={n.id} value={n.id} disabled={n.status === "inactive"}>
                {n.nickname} · ····{n.number.slice(-4)}{n.status === "inactive" ? " (Inactive)" : ""}
              </option>
            ))}
          </select>
        </div>

        {wabaNumberId && (
          <TemplateStylePicker
            onSelect={(style) => {
              const resolvedId = style.mapsTo || style.id;
              patch({ templateStyle: resolvedId });
              setPendingPresetInputType(style.presetInputType || null);
              setModalMode("browse");
              setModalOpen(true);
            }}
          />
        )}
      </div>
    );
  }

  const resolvedStyleId = styleInfo ? (styleInfo.mapsTo || styleInfo.id) : templateStyle;

  const handleModalSave = (tpl) => {
    const withId = tpl.id ? tpl : { ...tpl, id: `tpl_${resolvedStyleId}_${Date.now()}` };
    setCustomTemplatesByStyle((prev) => {
      const existing = prev[resolvedStyleId] || [];
      const already = existing.find((t) => t.id === withId.id);
      return { ...prev, [resolvedStyleId]: already ? existing.map((t) => (t.id === withId.id ? withId : t)) : [...existing, withId] };
    });
    patch({ template: withId, variableMap: {} });
    setModalOpen(false);
  };

  return (
    <>
      {modalOpen && (
        <UnifiedTemplateModal
          open
          styleId={resolvedStyleId}
          styleLabel={styleInfo?.label || "Template"}
          presetInputType={pendingPresetInputType}
          initialTemplate={modalMode === "edit-existing" ? template : null}
          customTemplates={customTemplatesByStyle[resolvedStyleId] || []}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Style chip */}
        {styleInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#F0FDF4", borderRadius: 20, border: "1px solid #BBF7D0", alignSelf: "flex-start" }}>
            <styleInfo.Icon size={13} color="#065F46" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>{styleInfo.label}</span>
            <span style={{ fontSize: 11, color: MUTED }}>·</span>
            <span
              onClick={() => { patch({ templateStyle: null, template: null }); setPendingPresetInputType(null); }}
              style={{ fontSize: 11, color: WA_GREEN, cursor: "pointer", fontWeight: 500 }}
            >Change</span>
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

        {/* Template section — one generic summary/CTA for every style */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Template</Label>
          </div>

          {!template ? (
            <button type="button" onClick={() => { setModalMode("browse"); setModalOpen(true); }} style={{
              width: "100%", padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Create New
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {template.name || (template.isCollectInput ? `${template.inputType} input` : template.isListMessage ? "List Message" : "Template")}
                </span>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button onClick={() => { setModalMode("edit-existing"); setModalOpen(true); }} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => { setModalMode("browse"); setModalOpen(true); }} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  {(template.body || template.questionMessage || "").slice(0, 120) || <span style={{ color: MUTED, fontStyle: "italic" }}>No content set</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fallback template */}
        {template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Label>Fallback Template</Label>
              <Toggle on={!!fallback?.enabled} onChange={(v) => patch({ fallback: { ...fallback, enabled: v } })} />
            </div>
            {fallback?.enabled && (
              !fallback.template ? (
                <button onClick={() => setModalOpen(true)} style={{ width: "100%", padding: "12px", border: `2px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: MUTED, fontSize: 12, textAlign: "center" }}>
                  Click to select approved fallback template
                </button>
              ) : (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{fallback.template.name}</span>
                  <button onClick={() => patch({ fallback: { ...fallback, template: null } })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
```

Add the import at the top of the file:
```jsx
import UnifiedTemplateModal from "./UnifiedTemplateModal";
```

Remove the now-unused imports/definitions that only served the deleted branches: `TemplatePicker`, `TemplateEditor`, `CollectInputForm`, `ListMessageForm` imports stay removed from `WhatsAppRightPanel.jsx` (they're used inside `UnifiedTemplateModal.jsx` now, not here); remove the `CAROUSEL_BLUE` top-level constant (line ~26, no longer referenced now that the Carousel summary block is gone); remove the `INPUT_TYPE_EMOJIS` constant if nothing else in the file uses it (it moved into `WhatsAppBubblePreview.jsx` in Task 4 — check with `grep -n "INPUT_TYPE_EMOJIS" WhatsAppRightPanel.jsx` and delete if the only remaining reference was inside the deleted Collect-Input summary block).

- [ ] **Step 4: Delete the superseded modal files**

```bash
git rm src/components/flows/builder/nodes/WhatsAppNode/TemplatePicker.jsx src/components/flows/builder/nodes/WhatsAppNode/TemplateEditor.jsx
```

- [ ] **Step 5: Run the full WhatsAppNode test suite**

Run: `CI=true npx craco test --watchAll=false src/components/flows/builder/nodes/WhatsAppNode`
Expected: PASS — every suite in `__tests__/` (including the two rewritten in Step 1, `CarouselForm.test.jsx`, `FormFields.test.jsx`, `WhatsAppBubblePreview.test.jsx`, `UnifiedTemplateModal.test.jsx`, and `data/__tests__/templateStyleConfigs.test.js`) green, with no leftover references to `TemplatePicker`/`TemplateEditor`.

- [ ] **Step 6: Manual smoke check**

Run: `npm start`, open the flow builder, add a WhatsApp node, and for at least three styles (Standard, Carousel, one Business-Manager-only style like Authentication) confirm: picking the style card opens the modal directly (no intermediate CTA row), the browse grid shows 2 (or 6, for Standard) seeded templates, clicking a card opens the two-pane edit view with a live preview, "+ Create new" opens a blank two-pane edit view, and Save/Cancel close the modal and update (or don't update) the side-panel summary card correctly.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire UnifiedTemplateModal into WhatsAppRightPanel, retire TemplatePicker/TemplateEditor"
```

---

## Self-Review Notes

- **Spec coverage:** Browse view (Task 6/`BrowseView`) ✓. Edit view left-skeleton/right-preview, no toggle (Task 6 layout) ✓. Generic field-schema form for standard-shaped styles (Tasks 3, 5, 6) ✓. Bespoke editors relocated with live preview via `onChange` (Tasks 1, 2, 6) ✓. Generic preview per `previewKind` (Task 4) ✓. 2 seeded dummy templates per style, every style incl. former Business-Manager-only ones (Task 5) ✓. `WhatsAppRightPanel` simplified to one summary card (Task 7) ✓. `TemplatePicker`/`TemplateEditor` deleted (Task 7) ✓. RCS untouched — no task modifies any file under `RCSNode/` ✓. Flow Builder V2 needs no separate task — confirmed shared-component gating via `useFlowVariant` already exists and nothing in this plan changes that gating.
- **Placeholder scan:** No TBDs; every step has literal code or an exact command with expected output.
- **Type consistency:** `UnifiedTemplateModal` props (`styleId`, `styleLabel`, `presetInputType`, `initialTemplate`, `customTemplates`, `onSave`, `onClose`) are the same across Task 6's implementation, Task 6's tests, and Task 7's call site. `FieldRenderer({ field, draft, onPatch })` signature matches between Task 3's implementation/tests and Task 6's `GenericEditForm` usage. `onChange(draft)` on `CarouselForm`/`ListMessageForm`/`CollectInputForm` matches between Task 1/2's implementations and Task 6's call sites.
