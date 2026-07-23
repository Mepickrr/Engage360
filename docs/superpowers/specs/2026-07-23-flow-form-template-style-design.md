# Flow Form Template Style (WhatsApp Node, Flow Builder v1 + v2) — Design Spec

**Date:** 2026-07-23
**Status:** Draft
**Scope:** `src/components/flows/builder/nodes/WhatsAppNode/` — shared between Flow Builder v1 and v2 (edited in place per CLAUDE.md, since this is a real feature for both, not a v2-only redesign)

**Relation to prior spec:** `2026-06-27-whatsapp-flow-template-design.md` describes a similarly-named but unrelated, unimplemented concept scoped to the standalone Templates page (`src/pages/Templates.jsx`, still a "Coming soon" stub). This spec targets the Flow Builder canvas's WhatsApp node instead, has a different (smaller) component catalogue, and a different data model. No code exists for the prior spec, so there is nothing to reconcile or reuse.

---

## 1. Summary

Two changes to the WhatsApp node's "Choose Template Style" picker, in both Flow Builder v1 and v2:

1. Hide the **Audio** style from the picker (old flows using it keep working).
2. Add a new **Flow Form** style: a standard template (Header/Body/Footer/Buttons, unchanged) plus a new **Call to action** section fixed to "Complete flow" — lets the seller attach a multi-screen in-chat form (WhatsApp Flow) as the message's CTA, with the same "create new" / "use existing" pattern used elsewhere in the app.

---

## 2. Hiding Audio

`TEMPLATE_STYLE_GROUPS` in `WhatsAppRightPanel.jsx` (Standard group) loses its `audio` entry — no longer pickable for new templates.

`TEMPLATE_STYLE_CONFIGS.audio` (in `data/templateStyleConfigs.js`) and `AudioPreview` (in `WhatsAppBubblePreview.jsx`) are left untouched, so any WhatsApp node whose `data.templateStyle === "audio"` from before this change keeps rendering and editing correctly — it's just impossible to newly select going forward.

---

## 3. Adding "Flow Form" to the picker

New entry in `TEMPLATE_STYLE_GROUPS`'s "Standard" group in `WhatsAppRightPanel.jsx`:

```js
{ id: "flow_form", label: "Flow Form", Icon: ClipboardList /* or similar existing lucide icon already imported */,
  desc: "Send a form to capture customer interests, appointment requests or run surveys." }
```

No changes needed to `TemplateStylePicker` or `resolveStyleInfo` — both are data-driven off this array already.

---

## 4. Data model

### 4.1 Template style config

In `data/templateStyleConfigs.js`:

```js
export const FLOW_FORM_FIELDS = [...STANDARD_FIELDS, { key: "flowCta", label: "Call to action", type: "flow-cta" }];

flow_form: {
  previewKind: "standard",
  fields: FLOW_FORM_FIELDS,
  defaultDraft: {
    ...STANDARD_DEFAULT_DRAFT,
    flowCta: { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null },
  },
  mockTemplates: [ /* 1-2 examples, one with flowCta pre-linked to a MOCK_FLOW_FORMS entry */ ],
},
```

Because `fields` is non-null, this style flows entirely through `UnifiedTemplateModal.jsx`'s existing `GenericEditForm` path — **no changes to `UnifiedTemplateModal.jsx` itself.**

### 4.2 Flow Forms store (new, separate from automation Flows)

New file `data/mockFlowForms.js`:

```js
export const FLOW_TYPE_PRESETS = {
  survey:   { label: "Send a survey", desc: "Ask questions and collect preferences to better understand your users.", seedScreens: [ /* one screen, one multi-choice question, matching wireframe 2's preview */ ] },
  event:    { label: "Register for an event", desc: "Collect information from your users to register them for an event or promotion", seedScreens: [ /* short answer: name, email */ ] },
  signup:   { label: "Complete sign-up", desc: "Quickly capture contact information", seedScreens: [ /* short answer: name, phone, email */ ] },
  custom:   { label: "Custom form", desc: "Create a form tailored to your specific needs", seedScreens: [ /* one blank screen, matching wireframe 4's empty state */ ] },
};

export const MOCK_FLOW_FORMS = [
  { id: "ff_1", name: "Post-purchase survey", flowType: "survey", updatedAt: "2 days ago", screens: [ /* ... */ ] },
  { id: "ff_2", name: "Event RSVP", flowType: "event", updatedAt: "1 week ago", screens: [ /* ... */ ] },
];
```

`screens` shape (shared by presets and saved forms):

```js
{
  id: "scr_1",
  title: "Your form",
  components: [
    { id: "c1", kind: "large_heading", text: "" },
    { id: "c1", kind: "small_heading", text: "" },
    { id: "c1", kind: "caption", text: "" },
    { id: "c1", kind: "body", text: "" },
    { id: "c2", kind: "image", url: "", height: 400 },
    { id: "c3", kind: "short_answer", inputType: "text", label: "", instructions: "", required: true },
    { id: "c4", kind: "paragraph", label: "", instructions: "", required: true },
    { id: "c5", kind: "date_picker", label: "", instructions: "", required: true },
    { id: "c6", kind: "single_choice", label: "", options: ["", ""], required: true },
    { id: "c7", kind: "multi_choice", label: "", options: [""], required: true },
    { id: "c8", kind: "dropdown", label: "", options: [""], required: true },
    { id: "c9", kind: "opt_in", consentLabel: "", readMoreUrl: "", editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" }, required: true },
  ],
  continueLabel: "Continue",
}
```

Max 8 screens per form. Max 8 components per screen (the fixed Continue button doesn't count).

### 4.3 WhatsApp node draft — `flowCta` stays independent of `buttons`

`flowCta` is never merged into the `buttons` array in storage. It's combined with `buttons` only at render time (preview bubble, canvas connectable ports) — see §7.

---

## 5. The "Call to action" field

New component `FlowCtaField.jsx`, registered in `FormFields.jsx`'s `FieldRenderer` for `type: "flow-cta"`.

**Unlinked state** (no `flowCta.flowFormId`):
- "Type of action" select — one fixed option, "Complete flow" (kept as a real `<select>` for future extension, not a static label).
- "Button icon" select — one fixed option, "Default".
- "Button text" text input, 40-char counter, placeholder/default "View Flow".
- "Create new" button → opens `SelectFlowTypeModal`.
- "Use existing" button → opens `SelectFlowFormModal`.
- Trailing ✕ — only shown once a flow is linked (removes the whole CTA, reverting `flowFormId`/`flowFormName` to null; the type/icon/text inputs remain since they're harmless without a link, matching the screenshot which always shows the ✕ once the CTA row exists).

**Linked state** (after create or use-existing completes):
- Same Type/Icon/Text row, plus a compact chip below showing the linked form's name with **Preview** (reopens read-only phone-mockup preview) and **Change** (reopens `SelectFlowFormModal`) actions.

---

## 6. Flow creation flow

### 6.1 `SelectFlowTypeModal.jsx` (wireframe 2)

- Left: 4 radio rows (Survey / Register for event / Complete sign-up / Custom form), each with a one-line description, matching `FLOW_TYPE_PRESETS` labels/descriptions.
- Right: a static preview panel showing a representative phone mockup for the currently-selected type (illustrative only, not live-editable — matches the wireframe's "Question 1 of 3" survey preview).
- Footer: Cancel / Create. Create closes this modal and opens `CreateFlowFormModal`, seeded with `FLOW_TYPE_PRESETS[type].seedScreens`.

### 6.2 `CreateFlowFormModal.jsx` (wireframes 3–8) — the multi-screen builder

Three-panel layout, `position: fixed` full-viewport modal like `UnifiedTemplateModal`:

**Screens panel (left):**
- List of screens, each row draggable via a leading `GripVertical` icon (see §6.4), click to select/edit.
- "+ Add new" — inline text input + confirm (wireframe 6), appends a blank screen (max 8, button disabled/hidden past the cap with a note).
- Per-screen ✕ to delete (only when more than 1 screen remains).

**Edit content panel (center):**
- "Screen title" field, always first, required.
- Ordered list of the screen's components, each row collapsible (expand/collapse chevron), with:
  - A leading `GripVertical` drag handle for reordering (see §6.4).
  - Delete (trash) icon.
  - A per-kind settings form (see §6.3).
- "+ Add content" split-button with a nested category flyout: **Text** (Large heading / Small heading / Caption / Body) → **Media** (Image) → **Text answer** (Short answer / Paragraph / Date picker) → **Selection** (Single choice / Multi choice / Dropdown / Opt-in). Disabled/hidden once 8 components are already on the screen.
- Fixed "Continue" row at the bottom (editable button label), always present, not part of the 8-component cap.

**Preview panel (right):**
- Phone-mockup chrome (status bar, X / screen title / ⋮ header, "Managed by the business · Learn more" footer) matching the wireframes.
- Renders the selected screen's components live, top to bottom, using lightweight preview stand-ins per kind (heading sizes, a bordered input outline with label/instructions, radio/checkbox rows for selection types, a placeholder image block).
- Green "Continue" button at the bottom always reflects the current `continueLabel`.

**Footer:** disclaimer text "Once your message template has been created, this flow cannot be edited." + Cancel / Save. Save writes the finished `{ id, name, flowType, screens }` into `MOCK_FLOW_FORMS` (new forms) or updates in place (editing an existing one via "Change" → re-open), then calls back into `FlowCtaField` to set `flowFormId`/`flowFormName` and closes.

### 6.3 Per-kind settings forms (center panel, inside each component row)

| Kind | Fields |
|---|---|
| Large heading / Small heading | Text (≤80 chars) |
| Caption / Body | Text (≤4096 chars) |
| Image | Upload (JPG/PNG, ≤300KB) + Image height (number, default 400) |
| Short answer | Input type select (Text / Email / Phone / Password / Number), Label (≤20), Instructions (≤80, optional), Required toggle (default on) |
| Paragraph | Label (≤20), Instructions (≤80, optional), Required toggle — informational "600 character customer limit" note, not enforced in the mock |
| Date picker | Label (≤20), Instructions (≤80, optional), Required toggle |
| Single choice | Label (≤30), options list (2–10, each ≤30 chars, add/remove), Required toggle |
| Multi choice | Label (≤30), options list (1–10, each ≤30 chars), Required toggle |
| Dropdown | Same shape as Multi choice, rendered as a dropdown in preview |
| Opt-in | Consent label (≤300), Read More URL, "Edit content" button opening a nested sub-page (Screen title, Large heading, Small heading, Caption, Body, Image — a mini version of the same screen editor, one level deep only), Required toggle |

All of these reuse the existing `Label`/input/toggle visual primitives already in `FormFields.jsx` for consistency (small uppercase muted labels, char counters, pill toggle).

### 6.4 Reordering

Real drag-and-drop, matching the wireframe's `⠿` grip icon literally. No new dependency needed — the codebase already has a working native-HTML5 drag-to-reorder pattern in `NextBestActionRightPanel.jsx`'s `ChannelList` (`draggable` + `onDragStart`/`onDragOver`/`onDrop`, tracking a `dragIndex` in local state, splicing the array on drop), rendered with lucide's `GripVertical` icon. Reuse this exact pattern for:
- Screens panel: dragging a screen row reorders `screens` within the form.
- Edit content panel: dragging a component row reorders `components` within the selected screen.

Each draggable row gets `cursor: "grab"` and a leading `<GripVertical size={13} />`, consistent with the existing implementation's visual treatment.

### 6.5 `SelectFlowFormModal.jsx` ("Use existing")

Centered dialog (visually consistent with `UnifiedTemplateModal`'s `BrowseView`, not `StartFlowRightPanel`'s sidebar-panel look, since this must work as a modal-over-modal):

- Header + search box filtering `MOCK_FLOW_FORMS` by name.
- Grid/list of rows: name, flow-type badge, screen count, "Updated {x}" — each with **Preview** (read-only phone mockup, reusing the `CreateFlowFormModal` preview renderer) and **Select** actions.
- Empty state: "No flow forms found."
- Selecting a row sets `flowFormId`/`flowFormName` on the CTA and closes both this modal and returns to the WhatsApp node's edit form.

---

## 7. Canvas + bubble preview integration

- `WhatsAppBubblePreview.jsx`'s `StandardPreview`: when `draft.flowCta?.flowFormId` is set, append one more `<ButtonRow label={`🔗 ${draft.flowCta.buttonText}`} />` after the regular `buttons` rows. No new `previewKind`.
- `WhatsAppNode/index.jsx`'s `connectableButtons` computation: for `templateStyle === "flow_form"`, build the list as `[...(template.buttons ?? []), ...(template.flowCta?.flowFormId ? [{ type: "FLOW", label: template.flowCta.buttonText }] : [])].filter(isConnectable)` — `isConnectable` already accepts `type === "FLOW"` (confirmed in `data/mockTemplates.js`), so the flow CTA automatically gets a canvas output port via the existing `ButtonPortRow`, no new branch required.

---

## 8. Out of scope / explicitly not building

- No backend/Meta submission — this mirrors every other template style in this codebase (mock data, local state only).
- No conditional screen branching, no dynamic option-loading, no pre-filling from customer data (matches the "Not Supported in v1" list in the earlier, unrelated Templates-page spec — same constraints apply here for consistency).
- Editing a Flow Form after it's linked to a saved-and-used template: the spec's disclaimer text is shown but not enforced as a hard lock (no state machine for "template already created" in this mock environment) — consistent with not over-building enforcement logic that has no real backend to check against.

---

## 9. Testing

- New `__tests__/TemplateTabFlowForm.test.jsx` (mirrors `TemplateTabCarousel.test.jsx`): style picker shows "Flow Form" and no longer shows "Audio"; CTA create-new opens the type wizard then the builder; use-existing links a mock form; preview bubble shows the flow button row; canvas node exposes a connectable port for it.
- Run `npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false` after all shared-file edits (WhatsAppRightPanel.jsx, FormFields.jsx, templateStyleConfigs.js, WhatsAppBubblePreview.jsx, WhatsAppNode/index.jsx) to confirm no v1/v2 leakage, per CLAUDE.md.
