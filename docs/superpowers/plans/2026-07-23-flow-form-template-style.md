# Flow Form Template Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Flow Form" WhatsApp template style (standard Header/Body/Footer/Buttons plus a "Complete flow" CTA that links a multi-screen in-chat form) to the WhatsApp node's template picker, and hide the "Audio" style, in both Flow Builder v1 and v2.

**Architecture:** All new code lives under `src/components/flows/builder/nodes/WhatsAppNode/`. The new style plugs into the existing generic-field template editor (`UnifiedTemplateModal.jsx` + `FormFields.jsx`'s `FieldRenderer`) via one new field type, `"flow-cta"`, so no changes are needed to the modal shell itself. The CTA field owns its own multi-step UI (type wizard → screens/content/preview builder → browse-existing modal) as a self-contained subtree, matching the existing `HeaderPickerField` pattern of self-contained field components.

**Tech Stack:** React (function components, hooks), inline `style={{...}}` objects (matches every existing file in this subtree — no Tailwind here), lucide-react icons, Jest + React Testing Library.

## Global Constraints

- Every file touched under `src/components/flows/builder/` is shared between Flow Builder v1 and v2 (per `CLAUDE.md`) — this is intentional here since the user asked for the feature in both builders, so edits are made in place, no `FlowVariantContext` forking.
- After all shared-file edits, run: `npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false` and confirm both suites still pass.
- Max 8 screens per Flow Form. Max 8 components per screen (the fixed Continue row doesn't count).
- Char limits: Large/Small heading ≤80, Caption/Body ≤4096, Short-answer/Paragraph/Date-picker label ≤20 / instructions ≤80, Single/Multi/Dropdown label ≤30 / option ≤30, Opt-in consent label ≤300, CTA button text ≤40.
- Option count limits: Single choice 2–10 options, Multi choice / Dropdown 1–10 options.
- Reordering (screens list, component list) uses real native-HTML5 drag-and-drop with a `GripVertical` icon, following the exact pattern already in `src/components/flows/builder/nodes/NextBestActionNode/NextBestActionRightPanel.jsx`'s `ChannelList` (`draggable`, `onDragStart`, `onDragOver`, `onDrop`, a `dragIndex` state, array-splice on drop) — no new dependency.
- Visual style: plain inline `style={{...}}` objects using the `PRIMARY`/`BORDER`/`MUTED` constants exported from `FormFields.jsx`, matching every other file in this subtree (no Tailwind, no CSS modules).
- No backend/Meta submission, no conditional screen branching, no dynamic option-loading, no pre-filled customer data — mock data and local state only, same as every other template style here.

---

### Task 1: Hide "Audio", add "Flow Form" to the style picker (skeleton)

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx:3-11` (icon imports), `:45-62` (`TEMPLATE_STYLE_GROUPS` "Standard" group)
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js:70-286` (add a `flow_form` entry to `TEMPLATE_STYLE_CONFIGS`, using `STANDARD_FIELDS` unchanged for now)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabFlowForm.test.jsx` (new file)

**Interfaces:**
- Produces: `TEMPLATE_STYLE_CONFIGS.flow_form` = `{ previewKind: "standard", fields: STANDARD_FIELDS, defaultDraft: { ...STANDARD_DEFAULT_DRAFT }, mockTemplates: [] }` (fields/defaultDraft get the `flowCta` addition in Task 3 — this task only wires up the picker + a minimal config so the style is selectable and behaves like "standard" until then).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabFlowForm.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("Flow Form style picker", () => {
  it("shows Flow Form and hides Audio in the Standard group", () => {
    renderPanel({ wabaNumberId: "waba_1", templateStyle: null, template: null });

    expect(screen.getByText("Flow Form")).toBeInTheDocument();
    expect(screen.queryByText("Audio")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="TemplateTabFlowForm" --watchAll=false`
Expected: FAIL — "Unable to find an element with the text: Flow Form" (Audio assertion would pass already since it doesn't exist yet, but the whole test fails on the first assertion).

- [ ] **Step 3: Edit the icon imports**

In `WhatsAppRightPanel.jsx`, remove the now-unused `Mic` import and no new import is needed (`ClipboardList` is already imported for the "List" group and can be reused here):

```js
import {
  AlertTriangle, Trash2,
  FileText, MessageCircle, ShieldCheck, GalleryHorizontal, MapPin,
  ShoppingCart, PackageCheck, ClipboardCheck, CreditCard,
  UserRound, Phone, Mail, UserCircle2, MapPinned, Star, LocateFixed, Hash,
  Image as ImageIcon, Video, Type, SlidersHorizontal, PhoneCall,
  Package, Boxes, LayoutGrid, ListOrdered, Flame,
  List as ListIcon, ClipboardList, Trophy,
} from "lucide-react";
```

- [ ] **Step 4: Edit `TEMPLATE_STYLE_GROUPS`'s "Standard" group**

Replace the `audio` entry with a `flow_form` entry:

```js
const TEMPLATE_STYLE_GROUPS = [
  {
    group: "Standard",
    items: [
      { id: "standard", label: "Template", Icon: FileText, popular: true,
        desc: "Meta-approved templates for utility and marketing — automations, promotions, order updates, payment reminders, tracking links, product links, and more" },
      { id: "session", label: "Session", Icon: MessageCircle,
        desc: "Basic conversation session message" },
      { id: "authentication", label: "Authentication", Icon: ShieldCheck,
        desc: "Basic authentication template" },
      { id: "carousel", label: "Carousel", Icon: GalleryHorizontal,
        desc: "Horizontal cards with images, text and buttons" },
      { id: "location", label: "Location send", Icon: MapPin,
        desc: "Share a live or static location pin" },
      { id: "flow_form", label: "Flow Form", Icon: ClipboardList,
        desc: "Send a form to capture customer interests, appointment requests or run surveys." },
    ],
  },
  // ...Order/Ask Customer/Catalog/List groups unchanged
```

- [ ] **Step 5: Add the `flow_form` config entry**

In `data/templateStyleConfigs.js`, add after the `location` entry (before `audio`, which stays untouched for backward compatibility):

```js
  flow_form: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT },
    mockTemplates: [],
  },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx craco test --testPathPattern="TemplateTabFlowForm" --watchAll=false`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabFlowForm.test.jsx
git commit -m "feat: hide Audio style, add Flow Form style to WhatsApp template picker"
```

---

### Task 2: Flow Forms mock data module

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/data/mockFlowForms.js`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/mockFlowForms.test.js` (new file)

**Interfaces:**
- Produces:
  - `createBlankScreen(title = "Screen"): { id, title, components: [], continueLabel: "Continue" }`
  - `createComponent(kind): { id, kind, ...kind-specific default fields }` for kinds: `large_heading`, `small_heading`, `caption`, `body`, `image`, `short_answer`, `paragraph`, `date_picker`, `single_choice`, `multi_choice`, `dropdown`, `opt_in`
  - `FLOW_TYPE_PRESETS`: `{ survey, event, signup, custom }`, each `{ label, desc, seedScreens: Array<Screen> }`
  - `MOCK_FLOW_FORMS`: `Array<{ id, name, flowType, updatedAt, screens }>`

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/mockFlowForms.test.js`:

```js
import { createBlankScreen, createComponent, FLOW_TYPE_PRESETS, MOCK_FLOW_FORMS } from "../mockFlowForms";

describe("mockFlowForms data helpers", () => {
  it("creates a blank screen with a Continue button and no components", () => {
    const screen = createBlankScreen("Your form");
    expect(screen.title).toBe("Your form");
    expect(screen.components).toEqual([]);
    expect(screen.continueLabel).toBe("Continue");
    expect(screen.id).toBeTruthy();
  });

  it("creates a component with correct default shape per kind", () => {
    expect(createComponent("large_heading")).toMatchObject({ kind: "large_heading", text: "" });
    expect(createComponent("image")).toMatchObject({ kind: "image", url: "", height: 400 });
    expect(createComponent("short_answer")).toMatchObject({
      kind: "short_answer", inputType: "text", label: "", instructions: "", required: true,
    });
    expect(createComponent("single_choice")).toMatchObject({ kind: "single_choice", label: "", options: ["", ""], required: true });
    expect(createComponent("multi_choice").options).toEqual([""]);
    expect(createComponent("opt_in")).toMatchObject({
      kind: "opt_in", consentLabel: "", readMoreUrl: "", required: true,
      editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" },
    });
  });

  it("gives every component a unique id", () => {
    const a = createComponent("body");
    const b = createComponent("body");
    expect(a.id).not.toBe(b.id);
  });

  it("defines all four flow type presets with seed screens", () => {
    expect(Object.keys(FLOW_TYPE_PRESETS).sort()).toEqual(["custom", "event", "signup", "survey"]);
    Object.values(FLOW_TYPE_PRESETS).forEach((preset) => {
      expect(preset.label).toBeTruthy();
      expect(preset.desc).toBeTruthy();
      expect(preset.seedScreens.length).toBeGreaterThan(0);
    });
  });

  it("defines mock flow forms with screens", () => {
    expect(MOCK_FLOW_FORMS.length).toBeGreaterThanOrEqual(2);
    MOCK_FLOW_FORMS.forEach((f) => {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.screens.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="mockFlowForms" --watchAll=false`
Expected: FAIL — cannot find module `../mockFlowForms`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/data/mockFlowForms.js`:

```js
// src/components/flows/builder/nodes/WhatsAppNode/data/mockFlowForms.js
let uid = 0;
function nextId(prefix) {
  uid += 1;
  return `${prefix}_${Date.now()}_${uid}`;
}

export function createBlankScreen(title = "Screen") {
  return { id: nextId("scr"), title, components: [], continueLabel: "Continue" };
}

const COMPONENT_DEFAULTS = {
  large_heading: () => ({ text: "" }),
  small_heading: () => ({ text: "" }),
  caption:       () => ({ text: "" }),
  body:          () => ({ text: "" }),
  image:         () => ({ url: "", height: 400 }),
  short_answer:  () => ({ inputType: "text", label: "", instructions: "", required: true }),
  paragraph:     () => ({ label: "", instructions: "", required: true }),
  date_picker:   () => ({ label: "", instructions: "", required: true }),
  single_choice: () => ({ label: "", options: ["", ""], required: true }),
  multi_choice:  () => ({ label: "", options: [""], required: true }),
  dropdown:      () => ({ label: "", options: [""], required: true }),
  opt_in:        () => ({
    consentLabel: "", readMoreUrl: "", required: true,
    editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" },
  }),
};

export function createComponent(kind) {
  const defaults = COMPONENT_DEFAULTS[kind] ? COMPONENT_DEFAULTS[kind]() : {};
  return { id: nextId("cmp"), kind, ...defaults };
}

function surveyScreen() {
  const screen = createBlankScreen("Your form");
  const question = { ...createComponent("multi_choice"), label: "You've found the perfect deal, what do you do next?", options: [
    "Buy it right away", "Check reviews before buying", "Share it with friends + family", "Buy multiple, while its cheap", "None of the above",
  ] };
  screen.components = [question];
  return screen;
}

function eventScreen() {
  const screen = createBlankScreen("Register");
  screen.components = [
    { ...createComponent("short_answer"), label: "Full name", instructions: "" },
    { ...createComponent("short_answer"), inputType: "email", label: "Email address", instructions: "" },
    { ...createComponent("short_answer"), inputType: "phone", label: "Phone number", instructions: "" },
  ];
  screen.continueLabel = "Register";
  return screen;
}

function signupScreen() {
  const screen = createBlankScreen("Sign up");
  screen.components = [
    { ...createComponent("short_answer"), label: "Full name", instructions: "" },
    { ...createComponent("short_answer"), inputType: "phone", label: "Phone number", instructions: "" },
  ];
  screen.continueLabel = "Sign up";
  return screen;
}

export const FLOW_TYPE_PRESETS = {
  survey: {
    label: "Send a survey",
    desc: "Ask questions and collect preferences to better understand your users.",
    seedScreens: [surveyScreen()],
  },
  event: {
    label: "Register for an event",
    desc: "Collect information from your users to register them for an event or promotion",
    seedScreens: [eventScreen()],
  },
  signup: {
    label: "Complete sign-up",
    desc: "Quickly capture contact information",
    seedScreens: [signupScreen()],
  },
  custom: {
    label: "Custom form",
    desc: "Create a form tailored to your specific needs",
    seedScreens: [createBlankScreen("Your form")],
  },
};

export const MOCK_FLOW_FORMS = [
  { id: "ff_1", name: "Post-purchase survey", flowType: "survey", updatedAt: "2 days ago", screens: [surveyScreen()] },
  { id: "ff_2", name: "Event RSVP", flowType: "event", updatedAt: "1 week ago", screens: [eventScreen()] },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="mockFlowForms" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/data/mockFlowForms.js \
        src/components/flows/builder/nodes/WhatsAppNode/data/__tests__/mockFlowForms.test.js
git commit -m "feat: add Flow Form mock data (presets, component factory, saved forms)"
```

---

### Task 3: `flow-cta` field type — unlinked state, registered in `FieldRenderer`

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx` (add exported `Toggle`, register `flow-cta` in `FieldRenderer`)
- Create: `src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js` (flow_form now uses `FLOW_FORM_FIELDS`, adds `flowCta` to its `defaultDraft`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx` (new file)

**Interfaces:**
- Consumes: `PRIMARY`, `BORDER`, `MUTED`, `Label` from `./FormFields` (already exported).
- Produces:
  - `Toggle({ on, onChange })` exported from `FormFields.jsx` (visual pill switch, matches the existing inline implementations in `WhatsAppRightPanel.jsx`/`NextBestActionRightPanel.jsx`).
  - `FlowCtaField({ field, value, onChange })` default export — `value` shape `{ buttonIcon, buttonText, flowFormId, flowFormName }`; calls `onChange(nextValue)` with the full next object (matches `HeaderPickerField`'s convention).
  - `FieldRenderer` gains: `if (field.type === "flow-cta") return <FlowCtaField field={field} value={value} onChange={onChange} />;`

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FlowCtaField from "../FlowCtaField";

describe("FlowCtaField — unlinked state", () => {
  it("renders Type of action, Button icon, Button text, and Create new/Use existing actions", () => {
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={jest.fn()} />);

    expect(screen.getByText(/type of action/i)).toBeInTheDocument();
    expect(screen.getByText("Complete flow")).toBeInTheDocument();
    expect(screen.getByText(/button icon/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("View Flow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use existing/i })).toBeInTheDocument();
  });

  it("patches buttonText as the seller types, respecting the 40 char counter", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue("View Flow"), { target: { value: "Fill the form" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ buttonText: "Fill the form" }));
    expect(screen.getByText("14/40")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: FAIL — cannot find module `../FlowCtaField`

- [ ] **Step 3: Add `Toggle` to `FormFields.jsx`**

In `FormFields.jsx`, after the existing `Label` export, add:

```jsx
export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? PRIMARY : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}
```

- [ ] **Step 4: Write `FlowCtaField.jsx` (unlinked state only for this task)**

Create `src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx`:

```jsx
import React from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";

const DEFAULT_CTA = { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null };

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

export default function FlowCtaField({ field, value, onChange }) {
  const cta = value || DEFAULT_CTA;
  const patch = (next) => onChange({ ...cta, ...next });
  const linked = !!cta.flowFormId;

  return (
    <div>
      <Label>Call to action</Label>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, position: "relative" }}>
        <button
          type="button"
          onClick={() => patch({ flowFormId: null, flowFormName: null })}
          aria-label="Remove call to action link"
          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: MUTED }}
        >
          <X size={14} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, paddingRight: 20 }}>
          <div>
            <Label>Type of action</Label>
            <select value="complete_flow" onChange={() => {}} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="complete_flow">Complete flow</option>
            </select>
          </div>
          <div>
            <Label>Button icon</Label>
            <select value={cta.buttonIcon} onChange={(e) => patch({ buttonIcon: e.target.value })} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="default">Default</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Button text</Label>
            <span style={{ fontSize: 10, color: MUTED }}>{(cta.buttonText || "").length}/40</span>
          </div>
          <input
            value={cta.buttonText}
            maxLength={40}
            onChange={(e) => patch({ buttonText: e.target.value })}
            style={fieldWrapperStyle()}
          />
        </div>

        {!linked ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              + Create new
            </button>
            <button type="button" style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              Use existing
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{cta.flowFormName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Register `flow-cta` in `FieldRenderer`**

In `FormFields.jsx`, add the import and branch:

```jsx
import FlowCtaField from "./FlowCtaField";
// ...
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
```

- [ ] **Step 6: Wire `flowCta` into the `flow_form` style config**

In `data/templateStyleConfigs.js`, add near `STANDARD_FIELDS`:

```js
export const FLOW_FORM_FIELDS = [...STANDARD_FIELDS, { key: "flowCta", label: "Call to action", type: "flow-cta" }];
```

Update the `flow_form` entry (from Task 1):

```js
  flow_form: {
    previewKind: "standard",
    fields: FLOW_FORM_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, flowCta: { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null } },
    mockTemplates: [],
  },
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx
git commit -m "feat: add flow-cta field type (unlinked state) to WhatsApp template forms"
```

---

### Task 4: `FlowCtaField` linked state (chip + Preview/Change + remove)

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx`

**Interfaces:**
- Consumes: nothing new yet (browse/create modals arrive in Tasks 12–13 and get wired into the `onClick`s stubbed here).
- Produces: `FlowCtaField` now renders a "Preview"/"Change" pair when `value.flowFormId` is set, and the trailing ✕ actually clears the link (already true from Task 3 — this task adds test coverage and the Preview/Change buttons).

- [ ] **Step 1: Write the failing test**

Append to `FlowCtaField.test.jsx`:

```jsx
describe("FlowCtaField — linked state", () => {
  const linkedValue = { buttonIcon: "default", buttonText: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" };

  it("shows the linked form name with Preview and Change actions instead of Create new/Use existing", () => {
    render(<FlowCtaField field={{ key: "flowCta" }} value={linkedValue} onChange={jest.fn()} />);

    expect(screen.getByText("Post-purchase survey")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^\+ create new$/i })).not.toBeInTheDocument();
  });

  it("clears the link when the trailing remove button is clicked", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={linkedValue} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText(/remove call to action link/i));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ flowFormId: null, flowFormName: null }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: FAIL — no "Preview"/"Change" buttons yet.

- [ ] **Step 3: Update the linked-state markup**

In `FlowCtaField.jsx`, replace the linked-state block:

```jsx
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cta.flowFormName}
            </span>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button type="button" style={{ fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                Preview
              </button>
              <button type="button" style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                Change
              </button>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: PASS (both describe blocks)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx
git commit -m "feat: add linked state (Preview/Change) to FlowCtaField"
```

---

### Task 5: `SelectFlowTypeModal` — flow type wizard

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/SelectFlowTypeModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowTypeModal.test.jsx` (new file)

**Interfaces:**
- Consumes: `FLOW_TYPE_PRESETS` from `./data/mockFlowForms`.
- Produces: `SelectFlowTypeModal({ onCancel, onCreate })` default export. `onCreate(flowTypeKey: "survey"|"event"|"signup"|"custom")` fires when "Create" is clicked.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowTypeModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectFlowTypeModal from "../SelectFlowTypeModal";

describe("SelectFlowTypeModal", () => {
  it("lists all four flow types with Send a survey pre-selected", () => {
    render(<SelectFlowTypeModal onCancel={jest.fn()} onCreate={jest.fn()} />);

    expect(screen.getByText("Send a survey")).toBeInTheDocument();
    expect(screen.getByText("Register for an event")).toBeInTheDocument();
    expect(screen.getByText("Complete sign-up")).toBeInTheDocument();
    expect(screen.getByText("Custom form")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /send a survey/i })).toBeChecked();
  });

  it("calls onCreate with the selected type when Create is clicked", () => {
    const onCreate = jest.fn();
    render(<SelectFlowTypeModal onCancel={jest.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("radio", { name: /complete sign-up/i }));
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    expect(onCreate).toHaveBeenCalledWith("signup");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<SelectFlowTypeModal onCancel={onCancel} onCreate={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SelectFlowTypeModal" --watchAll=false`
Expected: FAIL — cannot find module `../SelectFlowTypeModal`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/SelectFlowTypeModal.jsx`:

```jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";
import { FLOW_TYPE_PRESETS } from "./data/mockFlowForms";

const TYPE_ORDER = ["survey", "event", "signup", "custom"];

function RadioOption({ typeKey, label, desc, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", cursor: "pointer",
        background: selected ? "#EFF6FF" : "#fff", borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <input
        type="radio"
        name="flow-type"
        aria-label={label}
        checked={selected}
        onChange={onSelect}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{label}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function SelectFlowTypeModal({ onCancel, onCreate }) {
  const [selected, setSelected] = useState("survey");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 760px)", maxHeight: "88vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select a flow type</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: "0 0 55%", overflowY: "auto", borderRight: `1px solid ${BORDER}` }}>
            {TYPE_ORDER.map((key) => (
              <RadioOption
                key={key}
                typeKey={key}
                label={FLOW_TYPE_PRESETS[key].label}
                desc={FLOW_TYPE_PRESETS[key].desc}
                selected={selected === key}
                onSelect={() => setSelected(key)}
              />
            ))}
          </div>
          <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>
              Preview of "{FLOW_TYPE_PRESETS[selected].label}"
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onCreate(selected)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SelectFlowTypeModal" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/SelectFlowTypeModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowTypeModal.test.jsx
git commit -m "feat: add SelectFlowTypeModal (flow type wizard step 1)"
```

---

### Task 6: `CreateFlowFormModal` skeleton — screens panel + drag reorder + footer

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CreateFlowFormModal.test.jsx` (new file)

**Interfaces:**
- Consumes: `createBlankScreen`, `FLOW_TYPE_PRESETS` from `./data/mockFlowForms`.
- Produces: `CreateFlowFormModal({ seed, onCancel, onSave })` default export, where `seed = { flowType, initialScreens, editingForm }` (`editingForm` is `null` when creating fresh, or `{ id, name, screens }` when re-opened via "Change"/edit). `onSave({ name, screens })` fires on Save.
- This task builds the Screens panel + top-level Screen title/Continue label inputs + footer only. The center "component list" and right "preview" panels are placeholder `<div>`s until Tasks 7–11 fill them in — this keeps the task testable on its own (screen CRUD + reorder + save shape) without depending on unwritten components.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/CreateFlowFormModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateFlowFormModal from "../CreateFlowFormModal";
import { createBlankScreen } from "../data/mockFlowForms";

describe("CreateFlowFormModal — screens panel", () => {
  it("starts with the seed screens and lets you rename the active screen's title", () => {
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={jest.fn()} />);

    const titleInput = screen.getByDisplayValue("Your form");
    fireEvent.change(titleInput, { target: { value: "Feedback" } });

    expect(screen.getByDisplayValue("Feedback")).toBeInTheDocument();
  });

  it("adds a new screen up to the max of 8 and disables Add new past the cap", () => {
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Screen 1")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={jest.fn()} />);

    for (let i = 0; i < 7; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: /\+ add new/i }));
      fireEvent.change(screen.getByPlaceholderText(/screen name/i), { target: { value: `Screen ${i + 2}` } });
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    }

    expect(screen.getAllByTestId("flow-form-screen-row")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /\+ add new/i })).not.toBeInTheDocument();
  });

  it("calls onSave with the current name and screens on Save", () => {
    const onSave = jest.fn();
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: expect.any(String),
      screens: expect.arrayContaining([expect.objectContaining({ title: "Your form" })]),
    }));
  });

  it("calls onCancel on Cancel", () => {
    const onCancel = jest.fn();
    const seed = { flowType: "custom", initialScreens: [createBlankScreen("Your form")], editingForm: null };
    render(<CreateFlowFormModal seed={seed} onCancel={onCancel} onSave={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="CreateFlowFormModal" --watchAll=false`
Expected: FAIL — cannot find module `../CreateFlowFormModal`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx`:

```jsx
import React, { useState } from "react";
import { GripVertical, X, Plus } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";
import { createBlankScreen, FLOW_TYPE_PRESETS } from "./data/mockFlowForms";

const MAX_SCREENS = 8;

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function ScreensPanel({ screens, activeScreenId, onSelect, onAdd, onRemove, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const onDragStart = (idx) => (e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    onReorder(dragIndex, idx);
    setDragIndex(null);
  };

  return (
    <div style={{ flex: "0 0 200px", borderRight: `1px solid ${BORDER}`, padding: 12, overflowY: "auto" }}>
      <Label>Screens</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {screens.map((s, idx) => (
          <div
            key={s.id}
            data-testid="flow-form-screen-row"
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop(idx)}
            onClick={() => onSelect(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, cursor: "grab",
              background: activeScreenId === s.id ? "#EFF6FF" : "#fff", border: `1px solid ${activeScreenId === s.id ? PRIMARY : BORDER}`,
            }}
          >
            <GripVertical size={13} style={{ color: MUTED, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.title || "Untitled"}
            </span>
            {screens.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, flexShrink: 0 }}
              ><X size={12} /></button>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div>
          <input
            autoFocus
            placeholder="Screen name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ ...fieldWrapperStyle(), marginBottom: 6 }}
          />
          <button
            type="button"
            onClick={() => { onAdd(newName || "Screen"); setNewName(""); setAdding(false); }}
            style={{ width: "100%", padding: "6px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >Add</button>
        </div>
      ) : screens.length < MAX_SCREENS ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{ fontSize: 12, color: PRIMARY, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
        >+ Add new</button>
      ) : (
        <div style={{ fontSize: 11, color: MUTED }}>Maximum of 8 screens reached</div>
      )}
    </div>
  );
}

export default function CreateFlowFormModal({ seed, onCancel, onSave }) {
  const [name] = useState(seed.editingForm?.name || FLOW_TYPE_PRESETS[seed.flowType]?.label || "Custom form");
  const [screens, setScreens] = useState(seed.editingForm?.screens || seed.initialScreens || [createBlankScreen("Your form")]);
  const [activeScreenId, setActiveScreenId] = useState((seed.editingForm?.screens || seed.initialScreens || [])[0]?.id);

  const activeScreen = screens.find((s) => s.id === activeScreenId) || screens[0];

  const updateScreen = (id, patch) => setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addScreen = (title) => {
    const s = createBlankScreen(title);
    setScreens((prev) => [...prev, s]);
    setActiveScreenId(s.id);
  };
  const removeScreen = (id) => {
    setScreens((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeScreenId === id) setActiveScreenId(next[0]?.id);
      return next;
    });
  };
  const reorderScreens = (fromIdx, toIdx) => setScreens((prev) => {
    const next = [...prev];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return next;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(96vw, 1100px)", height: "88vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Create flow</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ScreensPanel
            screens={screens}
            activeScreenId={activeScreen?.id}
            onSelect={setActiveScreenId}
            onAdd={addScreen}
            onRemove={removeScreen}
            onReorder={reorderScreens}
          />

          <div style={{ flex: 1, overflowY: "auto", padding: 16, borderRight: `1px solid ${BORDER}` }}>
            <div style={{ marginBottom: 14 }}>
              <Label>Screen title</Label>
              <input
                value={activeScreen?.title || ""}
                onChange={(e) => updateScreen(activeScreen.id, { title: e.target.value })}
                style={fieldWrapperStyle()}
              />
            </div>

            {/* Component list — filled in by Task 7 */}
            <div id="flow-form-component-list-slot" />

            <div style={{ marginTop: 14 }}>
              <Label>Continue button label</Label>
              <input
                value={activeScreen?.continueLabel || ""}
                onChange={(e) => updateScreen(activeScreen.id, { continueLabel: e.target.value })}
                style={fieldWrapperStyle()}
              />
            </div>
          </div>

          <div style={{ flex: "0 0 300px", background: "#F8FAFC", padding: 16, overflowY: "auto" }}>
            {/* Preview panel — filled in by Task 10 */}
            <div id="flow-form-preview-slot" />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 11, color: MUTED }}>Once your message template has been created, this flow cannot be edited.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCancel} style={{ padding: "8px 16px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => onSave({ name, screens })} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: PRIMARY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="CreateFlowFormModal" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/CreateFlowFormModal.test.jsx
git commit -m "feat: add CreateFlowFormModal skeleton (screens panel, drag reorder, save shape)"
```

---

### Task 7: `FlowFormComponentList` — add-content flyout + component row shell + drag reorder + delete

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentList.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx` (replace the `#flow-form-component-list-slot` div with `<FlowFormComponentList>`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentList.test.jsx` (new file)

**Interfaces:**
- Consumes: `createComponent` from `./data/mockFlowForms`.
- Produces: `FlowFormComponentList({ components, onChange })` default export. `onChange(nextComponents)` fires on add/remove/reorder. Renders each row as a collapsible shell with a kind label, drag handle, delete button, and a placeholder area (`data-testid="component-settings-slot"`) that Tasks 8–9 will fill with the real per-kind form via a `renderSettings` callback prop — added now as `renderSettings(component, onChangeComponent)` so later tasks don't need to touch this file's row-list/add-menu/reorder logic again.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentList.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import FlowFormComponentList from "../FlowFormComponentList";

describe("FlowFormComponentList", () => {
  it("adds a component of the chosen kind via the nested Add content menu", () => {
    const onChange = jest.fn();
    render(<FlowFormComponentList components={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /\+ add content/i }));
    fireEvent.mouseEnter(screen.getByText("Text"));
    fireEvent.click(screen.getByText("Large heading"));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ kind: "large_heading" })]);
  });

  it("disables Add content once 8 components exist", () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, kind: "caption", text: "" }));
    render(<FlowFormComponentList components={eight} onChange={jest.fn()} />);

    expect(screen.queryByRole("button", { name: /\+ add content/i })).not.toBeInTheDocument();
  });

  it("deletes a component row", () => {
    const onChange = jest.fn();
    const components = [{ id: "c1", kind: "caption", text: "hi" }, { id: "c2", kind: "body", text: "" }];
    render(<FlowFormComponentList components={components} onChange={onChange} />);

    const rows = screen.getAllByTestId("flow-form-component-row");
    fireEvent.click(within(rows[0]).getByLabelText(/delete component/i));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ id: "c2" })]);
  });

  it("reorders components via drag and drop", () => {
    const onChange = jest.fn();
    const components = [{ id: "c1", kind: "caption", text: "first" }, { id: "c2", kind: "body", text: "second" }];
    render(<FlowFormComponentList components={components} onChange={onChange} />);

    const rows = screen.getAllByTestId("flow-form-component-row");
    fireEvent.dragStart(rows[1], { dataTransfer: { effectAllowed: "" } });
    fireEvent.dragOver(rows[0]);
    fireEvent.drop(rows[0]);

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({ id: "c1" }),
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowFormComponentList" --watchAll=false`
Expected: FAIL — cannot find module `../FlowFormComponentList`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentList.jsx`:

```jsx
import React, { useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";
import { createComponent } from "./data/mockFlowForms";

const MAX_COMPONENTS = 8;

const ADD_CONTENT_MENU = [
  { category: "Text", kinds: [
    { kind: "large_heading", label: "Large heading" },
    { kind: "small_heading", label: "Small heading" },
    { kind: "caption", label: "Caption" },
    { kind: "body", label: "Body" },
  ] },
  { category: "Media", kinds: [
    { kind: "image", label: "Image" },
  ] },
  { category: "Text answer", kinds: [
    { kind: "short_answer", label: "Short answer" },
    { kind: "paragraph", label: "Paragraph" },
    { kind: "date_picker", label: "Date picker" },
  ] },
  { category: "Selection", kinds: [
    { kind: "single_choice", label: "Single choice" },
    { kind: "multi_choice", label: "Multi choice" },
    { kind: "dropdown", label: "Dropdown" },
    { kind: "opt_in", label: "Opt-in" },
  ] },
];

const KIND_LABELS = ADD_CONTENT_MENU.flatMap((g) => g.kinds).reduce((acc, k) => ({ ...acc, [k.kind]: k.label }), {});

function AddContentMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [hoverCategory, setHoverCategory] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: PRIMARY, background: "none", border: `1.5px dashed ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", width: "100%" }}
      >
        + Add content
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160 }}>
            {ADD_CONTENT_MENU.map((g) => (
              <div key={g.category} onMouseEnter={() => setHoverCategory(g.category)} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
                  {g.category}
                  <ChevronRight size={12} />
                </div>
                {hoverCategory === g.category && (
                  <div style={{ position: "absolute", left: "100%", top: 0, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160 }}>
                    {g.kinds.map((k) => (
                      <div
                        key={k.kind}
                        onClick={() => { onAdd(k.kind); setOpen(false); }}
                        style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer" }}
                      >{k.label}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FlowFormComponentList({ components, onChange, renderSettings }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const addComponent = (kind) => onChange([...components, createComponent(kind)]);
  const removeComponent = (id) => onChange(components.filter((c) => c.id !== id));
  const updateComponent = (id, patch) => onChange(components.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const onDragStart = (idx) => (e) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const next = [...components];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {components.map((c, idx) => {
          const expanded = expandedId === c.id;
          return (
            <div
              key={c.id}
              data-testid="flow-form-component-row"
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(idx)}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", cursor: "grab" }}>
                <GripVertical size={13} style={{ color: MUTED, flexShrink: 0 }} />
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}
                >
                  {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{KIND_LABELS[c.kind] || c.kind}</span>
                <button
                  type="button"
                  aria-label="Delete component"
                  onClick={() => removeComponent(c.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}
                ><Trash2 size={13} /></button>
              </div>
              {expanded && (
                <div data-testid="component-settings-slot" style={{ padding: 10 }}>
                  {renderSettings ? renderSettings(c, (patch) => updateComponent(c.id, patch)) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {components.length < MAX_COMPONENTS ? (
        <AddContentMenu onAdd={addComponent} />
      ) : (
        <div style={{ fontSize: 11, color: MUTED }}>Maximum of 8 components reached for this screen</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire `FlowFormComponentList` into `CreateFlowFormModal`**

In `CreateFlowFormModal.jsx`, import it and replace the placeholder slot:

```jsx
import FlowFormComponentList from "./FlowFormComponentList";
// ...
            {/* Component list */}
            <FlowFormComponentList
              components={activeScreen?.components || []}
              onChange={(components) => updateScreen(activeScreen.id, { components })}
            />
```

(Remove the `<div id="flow-form-component-list-slot" />` line.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowFormComponentList|CreateFlowFormModal" --watchAll=false`
Expected: PASS (both files)

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentList.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentList.test.jsx
git commit -m "feat: add FlowFormComponentList (add-content menu, drag reorder, delete)"
```

---

### Task 8: Per-kind settings forms — Text kinds + Media

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx` (pass `renderSettings` to `FlowFormComponentList`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx` (new file)

**Interfaces:**
- Produces: `ComponentSettingsForm({ component, onChange })` default export — a dispatcher switching on `component.kind`. This task implements `large_heading`, `small_heading`, `caption`, `body`, `image`. `onChange(patch)` merges into the component (matches `FlowFormComponentList`'s `renderSettings(component, onChangeComponent)` contract from Task 7).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentSettingsForm from "../FlowFormComponentForms";

describe("ComponentSettingsForm — text & media kinds", () => {
  it("renders a text input capped at 80 chars for large_heading", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm component={{ id: "c1", kind: "large_heading", text: "" }} onChange={onChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "80");
    fireEvent.change(input, { target: { value: "Welcome!" } });
    expect(onChange).toHaveBeenCalledWith({ text: "Welcome!" });
  });

  it("renders a textarea capped at 4096 chars for body", () => {
    render(<ComponentSettingsForm component={{ id: "c1", kind: "body", text: "" }} onChange={jest.fn()} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "4096");
  });

  it("renders an image height field defaulting to 400", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm component={{ id: "c1", kind: "image", url: "", height: 400 }} onChange={onChange} />);

    const heightInput = screen.getByLabelText(/image height/i);
    fireEvent.change(heightInput, { target: { value: "500" } });
    expect(onChange).toHaveBeenCalledWith({ height: "500" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowFormComponentForms" --watchAll=false`
Expected: FAIL — cannot find module `../FlowFormComponentForms`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx`:

```jsx
import React from "react";
import { Trash2 } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label, Toggle } from "./FormFields";

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function CharCounter({ value, max }) {
  return <span style={{ fontSize: 10, color: MUTED }}>{(value || "").length}/{max}</span>;
}

function TextKindForm({ component, onChange, max }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Label>Text</Label>
        <CharCounter value={component.text} max={max} />
      </div>
      {max > 80 ? (
        <textarea
          value={component.text}
          maxLength={max}
          rows={4}
          onChange={(e) => onChange({ text: e.target.value })}
          style={{ ...fieldWrapperStyle(), resize: "none" }}
        />
      ) : (
        <input
          value={component.text}
          maxLength={max}
          onChange={(e) => onChange({ text: e.target.value })}
          style={fieldWrapperStyle()}
        />
      )}
    </div>
  );
}

function ImageForm({ component, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <Label>Choose JPG or PNG file</Label>
        <div
          onClick={() => onChange({ url: component.url || "https://placehold.co/400x300?text=Image" })}
          style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: 14, textAlign: "center", cursor: "pointer", background: "#F8FAFC", fontSize: 11, color: MUTED }}
        >
          {component.url ? "Image selected — click to replace" : "Drag and drop your file, or choose file on your device"}
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Maximum file size: 300 KB · Acceptable file types: JPEG, PNG</div>
      </div>
      <div>
        <Label htmlFor="flow-form-image-height">Image height</Label>
        <input
          id="flow-form-image-height"
          aria-label="Image height"
          type="number"
          value={component.height}
          onChange={(e) => onChange({ height: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
    </div>
  );
}

export default function ComponentSettingsForm({ component, onChange }) {
  switch (component.kind) {
    case "large_heading":
    case "small_heading":
      return <TextKindForm component={component} onChange={onChange} max={80} />;
    case "caption":
    case "body":
      return <TextKindForm component={component} onChange={onChange} max={4096} />;
    case "image":
      return <ImageForm component={component} onChange={onChange} />;
    default:
      return null;
  }
}
```

Note: `Label` in `FormFields.jsx` currently renders a plain `<div>`, which doesn't associate with `htmlFor`/`aria-label` on its own — the `aria-label="Image height"` on the `<input>` itself is what makes `getByLabelText(/image height/i)` pass, so no change to `Label` is required.

- [ ] **Step 4: Wire `renderSettings` into `CreateFlowFormModal`**

In `CreateFlowFormModal.jsx`, import `ComponentSettingsForm` and pass it through:

```jsx
import ComponentSettingsForm from "./FlowFormComponentForms";
// ...
            <FlowFormComponentList
              components={activeScreen?.components || []}
              onChange={(components) => updateScreen(activeScreen.id, { components })}
              renderSettings={(component, onChangeComponent) => (
                <ComponentSettingsForm component={component} onChange={onChangeComponent} />
              )}
            />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowFormComponentForms|CreateFlowFormModal" --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx
git commit -m "feat: add component settings forms for Text and Media kinds"
```

---

### Task 9: Per-kind settings forms — Text answer kinds (Short answer, Paragraph, Date picker)

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx`

**Interfaces:**
- Produces: `ComponentSettingsForm` now also handles `short_answer` (with an input-type select: Text/Email/Phone/Password/Number), `paragraph`, `date_picker` — each with Label (≤20), Instructions (≤80, optional), Required toggle.

- [ ] **Step 1: Write the failing test**

Append to `FlowFormComponentForms.test.jsx`:

```jsx
describe("ComponentSettingsForm — text answer kinds", () => {
  it("renders input type, label, instructions, and required toggle for short_answer", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm
      component={{ id: "c1", kind: "short_answer", inputType: "text", label: "", instructions: "", required: true }}
      onChange={onChange}
    />);

    fireEvent.change(screen.getByLabelText(/input type/i), { target: { value: "email" } });
    expect(onChange).toHaveBeenCalledWith({ inputType: "email" });

    fireEvent.change(screen.getByLabelText(/^label$/i), { target: { value: "Email" } });
    expect(onChange).toHaveBeenCalledWith({ label: "Email" });
    expect(screen.getByLabelText(/^label$/i)).toHaveAttribute("maxLength", "20");

    fireEvent.click(screen.getByText(/required/i));
    expect(onChange).toHaveBeenCalledWith({ required: false });
  });

  it("renders label/instructions/required for paragraph and date_picker without an input type select", () => {
    render(<ComponentSettingsForm component={{ id: "c2", kind: "paragraph", label: "", instructions: "", required: true }} onChange={jest.fn()} />);
    expect(screen.queryByLabelText(/input type/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^label$/i)).toBeInTheDocument();

    render(<ComponentSettingsForm component={{ id: "c3", kind: "date_picker", label: "", instructions: "", required: true }} onChange={jest.fn()} />);
    expect(screen.getAllByLabelText(/^label$/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowFormComponentForms" --watchAll=false`
Expected: FAIL — no `short_answer`/`paragraph`/`date_picker` handling yet.

- [ ] **Step 3: Add the text-answer forms**

In `FlowFormComponentForms.jsx`, add before the default export's `switch`:

```jsx
const SHORT_ANSWER_INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "password", label: "Password" },
  { value: "number", label: "Number" },
];

function TextAnswerForm({ component, onChange, showInputType }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {showInputType && (
        <div>
          <Label htmlFor="flow-form-input-type">Input type</Label>
          <select
            id="flow-form-input-type"
            aria-label="Input type"
            value={component.inputType}
            onChange={(e) => onChange({ inputType: e.target.value })}
            style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            {SHORT_ANSWER_INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-label">Label</Label>
          <CharCounter value={component.label} max={20} />
        </div>
        <input
          id="flow-form-label"
          aria-label="Label"
          value={component.label}
          maxLength={20}
          onChange={(e) => onChange({ label: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-instructions">Instructions · Optional</Label>
          <CharCounter value={component.instructions} max={80} />
        </div>
        <input
          id="flow-form-instructions"
          aria-label="Instructions"
          value={component.instructions}
          maxLength={80}
          onChange={(e) => onChange({ instructions: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#334155" }}>Required</span>
        <Toggle on={!!component.required} onChange={(v) => onChange({ required: v })} />
      </div>
    </div>
  );
}
```

Update `Label` usages here rely on `Label` accepting an `htmlFor` prop and rendering it — check `FormFields.jsx`'s `Label`:

```jsx
export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, display: "block" }}>
      {children}
    </label>
  );
}
```

(This is a small upgrade to `Label` from a `<div>` to a `<label>` with `htmlFor` — safe because every existing call site passes only `children`, so `htmlFor` defaults to `undefined` and behavior is unchanged everywhere else. This makes `getByLabelText` work for `Label`+`htmlFor`+`id` pairs used above, in addition to the plain `aria-label` already used on inputs.)

Update the dispatcher:

```jsx
export default function ComponentSettingsForm({ component, onChange }) {
  switch (component.kind) {
    case "large_heading":
    case "small_heading":
      return <TextKindForm component={component} onChange={onChange} max={80} />;
    case "caption":
    case "body":
      return <TextKindForm component={component} onChange={onChange} max={4096} />;
    case "image":
      return <ImageForm component={component} onChange={onChange} />;
    case "short_answer":
      return <TextAnswerForm component={component} onChange={onChange} showInputType />;
    case "paragraph":
    case "date_picker":
      return <TextAnswerForm component={component} onChange={onChange} showInputType={false} />;
    default:
      return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowFormComponentForms" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Run the full FormFields-dependent suite to check the `Label` change didn't break anything**

Run: `npx craco test --testPathPattern="WhatsAppNode" --watchAll=false`
Expected: PASS (all existing WhatsAppNode tests still green — `Label` still renders its children as visible text either way)

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/FormFields.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx
git commit -m "feat: add component settings forms for Text answer kinds"
```

---

### Task 10: Per-kind settings forms — Selection kinds + Opt-in

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx`

**Interfaces:**
- Produces: `ComponentSettingsForm` now also handles `single_choice` (2–10 options), `multi_choice`/`dropdown` (1–10 options), and `opt_in` (consent label, read-more URL, nested "Edit content" sub-page).

- [ ] **Step 1: Write the failing test**

Append to `FlowFormComponentForms.test.jsx`:

```jsx
describe("ComponentSettingsForm — selection kinds", () => {
  it("lets you add/remove options for single_choice within the 2-10 bound", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm component={{ id: "c1", kind: "single_choice", label: "", options: ["", ""], required: true }} onChange={onChange} />);

    expect(screen.getAllByPlaceholderText(/option/i)).toHaveLength(2);
    expect(screen.queryByLabelText(/remove option/i)).not.toBeInTheDocument(); // can't go below 2

    fireEvent.click(screen.getByRole("button", { name: /\+ add option/i }));
    expect(onChange).toHaveBeenCalledWith({ options: ["", "", ""] });
  });

  it("caps multi_choice/dropdown options at 10", () => {
    const tenOptions = Array.from({ length: 10 }, () => "");
    render(<ComponentSettingsForm component={{ id: "c2", kind: "multi_choice", label: "", options: tenOptions, required: true }} onChange={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /\+ add option/i })).not.toBeInTheDocument();
  });

  it("renders consent label, read more url, and an Edit content button for opt_in", () => {
    const onChange = jest.fn();
    render(<ComponentSettingsForm
      component={{ id: "c3", kind: "opt_in", consentLabel: "", readMoreUrl: "", required: true, editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" } }}
      onChange={onChange}
    />);

    expect(screen.getByLabelText(/consent label/i)).toHaveAttribute("maxLength", "300");
    fireEvent.click(screen.getByRole("button", { name: /edit content/i }));
    expect(screen.getByText(/screen title/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowFormComponentForms" --watchAll=false`
Expected: FAIL — no `single_choice`/`multi_choice`/`dropdown`/`opt_in` handling yet.

- [ ] **Step 3: Add the selection and opt-in forms**

In `FlowFormComponentForms.jsx`, add:

```jsx
function OptionsForm({ component, onChange, min, max }) {
  const options = component.options || [];
  const updateOption = (i, v) => onChange({ options: options.map((o, idx) => (idx === i ? v : o)) });
  const removeOption = (i) => onChange({ options: options.filter((_, idx) => idx !== i) });
  const addOption = () => onChange({ options: [...options, ""] });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <Label htmlFor="flow-form-selection-label">Label</Label>
        <input
          id="flow-form-selection-label"
          aria-label="Label"
          value={component.label}
          maxLength={30}
          onChange={(e) => onChange({ label: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              placeholder={`Option ${i + 1}`}
              value={opt}
              maxLength={30}
              onChange={(e) => updateOption(i, e.target.value)}
              style={{ ...fieldWrapperStyle(), flex: 1 }}
            />
            {options.length > min && (
              <button type="button" aria-label="Remove option" onClick={() => removeOption(i)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < max && (
        <button type="button" onClick={addOption} style={{ fontSize: 12, color: PRIMARY, fontWeight: 500, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          + Add option
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#334155" }}>Required</span>
        <Toggle on={!!component.required} onChange={(v) => onChange({ required: v })} />
      </div>
    </div>
  );
}

function OptInEditContentPage({ editContent, onChange, onClose }) {
  const patch = (p) => onChange({ ...editContent, ...p });
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, background: "#F8FAFC" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>Edit content</span>
        <button type="button" onClick={onClose} style={{ fontSize: 11, color: PRIMARY, background: "none", border: "none", cursor: "pointer" }}>Done</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <Label>Screen title</Label>
          <input value={editContent.title} onChange={(e) => patch({ title: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Large heading</Label>
          <input value={editContent.largeHeading} maxLength={80} onChange={(e) => patch({ largeHeading: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Small heading</Label>
          <input value={editContent.smallHeading} maxLength={80} onChange={(e) => patch({ smallHeading: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Caption</Label>
          <input value={editContent.caption} maxLength={4096} onChange={(e) => patch({ caption: e.target.value })} style={fieldWrapperStyle()} />
        </div>
        <div>
          <Label>Body</Label>
          <textarea value={editContent.body} maxLength={4096} rows={3} onChange={(e) => patch({ body: e.target.value })} style={{ ...fieldWrapperStyle(), resize: "none" }} />
        </div>
        <div>
          <Label>Image</Label>
          <div
            onClick={() => patch({ imageUrl: editContent.imageUrl || "https://placehold.co/400x300?text=Image" })}
            style={{ border: `2px dashed ${BORDER}`, borderRadius: 8, padding: 12, textAlign: "center", cursor: "pointer", background: "#fff", fontSize: 11, color: MUTED }}
          >
            {editContent.imageUrl ? "Image selected — click to replace" : "Click to attach an image"}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptInForm({ component, onChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label htmlFor="flow-form-consent-label">Consent label</Label>
          <CharCounter value={component.consentLabel} max={300} />
        </div>
        <textarea
          id="flow-form-consent-label"
          aria-label="Consent label"
          value={component.consentLabel}
          maxLength={300}
          rows={3}
          onChange={(e) => onChange({ consentLabel: e.target.value })}
          style={{ ...fieldWrapperStyle(), resize: "none" }}
        />
      </div>
      <div>
        <Label htmlFor="flow-form-read-more">Read More link</Label>
        <input
          id="flow-form-read-more"
          aria-label="Read More link"
          value={component.readMoreUrl}
          onChange={(e) => onChange({ readMoreUrl: e.target.value })}
          style={fieldWrapperStyle()}
        />
      </div>
      {editing ? (
        <OptInEditContentPage
          editContent={component.editContent}
          onChange={(editContent) => onChange({ editContent })}
          onClose={() => setEditing(false)}
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} style={{ padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Edit content
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#334155" }}>Required</span>
        <Toggle on={!!component.required} onChange={(v) => onChange({ required: v })} />
      </div>
    </div>
  );
}
```

Add `useState` to the file's React import: `import React, { useState } from "react";`

Update the dispatcher:

```jsx
    case "single_choice":
      return <OptionsForm component={component} onChange={onChange} min={2} max={10} />;
    case "multi_choice":
    case "dropdown":
      return <OptionsForm component={component} onChange={onChange} min={1} max={10} />;
    case "opt_in":
      return <OptInForm component={component} onChange={onChange} />;
    default:
      return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowFormComponentForms" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowFormComponentForms.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormComponentForms.test.jsx
git commit -m "feat: add component settings forms for Selection kinds and Opt-in"
```

---

### Task 11: `FlowFormPreview` — live phone-mockup preview panel

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/FlowFormPreview.jsx`
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx` (replace `#flow-form-preview-slot` with `<FlowFormPreview>`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormPreview.test.jsx` (new file)

**Interfaces:**
- Produces: `FlowFormPreview({ screen })` default export — pure render, no callbacks. Renders `screen.title` in a header bar, each `screen.components` entry with a lightweight stand-in per kind, and a green button showing `screen.continueLabel`.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormPreview.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import FlowFormPreview from "../FlowFormPreview";

describe("FlowFormPreview", () => {
  it("renders the screen title, each component, and the Continue button", () => {
    const screenData = {
      id: "scr_1",
      title: "Your form",
      continueLabel: "Continue",
      components: [
        { id: "c1", kind: "large_heading", text: "Big title" },
        { id: "c2", kind: "short_answer", inputType: "text", label: "Name", instructions: "", required: true },
        { id: "c3", kind: "single_choice", label: "Pick one", options: ["A", "B"], required: true },
        { id: "c4", kind: "opt_in", consentLabel: "I agree", readMoreUrl: "", required: true, editContent: {} },
      ],
    };
    render(<FlowFormPreview screen={screenData} />);

    expect(screen.getByText("Your form")).toBeInTheDocument();
    expect(screen.getByText("Big title")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("I agree")).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no components yet", () => {
    render(<FlowFormPreview screen={{ id: "scr_1", title: "Your form", continueLabel: "Continue", components: [] }} />);
    expect(screen.getByText(/select 'add content'/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowFormPreview" --watchAll=false`
Expected: FAIL — cannot find module `../FlowFormPreview`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/FlowFormPreview.jsx`:

```jsx
import React from "react";
import { X, MoreVertical } from "lucide-react";
import { BORDER, MUTED } from "./FormFields";

function ComponentPreview({ component }) {
  switch (component.kind) {
    case "large_heading":
      return <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{component.text || "Large heading"}</div>;
    case "small_heading":
      return <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{component.text || "Small heading"}</div>;
    case "caption":
      return <div style={{ fontSize: 11, color: MUTED }}>{component.text || "Caption"}</div>;
    case "body":
      return <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{component.text || "Body text"}</div>;
    case "image":
      return (
        <div style={{ height: 90, background: "#E2E8F0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: MUTED }}>
          {component.url ? "🖼 Image" : "No image selected"}
        </div>
      );
    case "short_answer":
    case "paragraph":
    case "date_picker":
      return (
        <div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: MUTED }}>
            {component.label || "Label"}
          </div>
          {component.instructions && <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{component.instructions}</div>}
        </div>
      );
    case "single_choice":
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{component.label || "Label"}</div>
          {(component.options || []).map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${BORDER}` }} />
              <span style={{ fontSize: 12, color: "#334155" }}>{opt || `Option ${i + 1}`}</span>
            </div>
          ))}
        </div>
      );
    case "multi_choice":
    case "dropdown":
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{component.label || "Label"}</div>
          {(component.options || []).map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${BORDER}` }} />
              <span style={{ fontSize: 12, color: "#334155" }}>{opt || `Option ${i + 1}`}</span>
            </div>
          ))}
        </div>
      );
    case "opt_in":
      return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${BORDER}`, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#334155" }}>{component.consentLabel || "Consent label"}</span>
        </div>
      );
    default:
      return null;
  }
}

export default function FlowFormPreview({ screen }) {
  const components = screen?.components || [];
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div style={{ height: 16, background: "#CBD5E1" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <X size={16} color={MUTED} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{screen?.title || "Your form"}</span>
        <MoreVertical size={16} color={MUTED} />
      </div>
      <div style={{ padding: 14, minHeight: 180, display: "flex", flexDirection: "column", gap: 12 }}>
        {components.length === 0 ? (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
            Select 'Add content' to start building your form. To add new screens, select 'Add new' in the 'Screens' panel.
          </div>
        ) : (
          components.map((c) => <ComponentPreview key={c.id} component={c} />)
        )}
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ background: "#25D366", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 24, fontSize: 13, fontWeight: 600 }}>
          {screen?.continueLabel || "Continue"}
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: MUTED, marginTop: 6 }}>
          Managed by the business. Learn more
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire `FlowFormPreview` into `CreateFlowFormModal`**

In `CreateFlowFormModal.jsx`:

```jsx
import FlowFormPreview from "./FlowFormPreview";
// ...
          <div style={{ flex: "0 0 300px", background: "#F8FAFC", padding: 16, overflowY: "auto" }}>
            <FlowFormPreview screen={activeScreen} />
          </div>
```

(Remove the `<div id="flow-form-preview-slot" />` line.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowFormPreview|CreateFlowFormModal" --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowFormPreview.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/CreateFlowFormModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowFormPreview.test.jsx
git commit -m "feat: add live phone-mockup preview panel to CreateFlowFormModal"
```

---

### Task 12: `SelectFlowFormModal` — "Use existing" browse modal

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/SelectFlowFormModal.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowFormModal.test.jsx` (new file)

**Interfaces:**
- Consumes: `FlowFormPreview` from `./FlowFormPreview`.
- Produces: `SelectFlowFormModal({ forms, onCancel, onSelect, onPreview })` default export. `forms: Array<{id, name, flowType, updatedAt, screens}>`. `onSelect(form)` fires when a row's Select is clicked. `onPreview(form)` fires when a row's Preview is clicked (parent decides how to show it — Task 13 wires this to a shared preview overlay).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowFormModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectFlowFormModal from "../SelectFlowFormModal";

const FORMS = [
  { id: "ff_1", name: "Post-purchase survey", flowType: "survey", updatedAt: "2 days ago", screens: [{ id: "s1", title: "s", components: [], continueLabel: "Continue" }] },
  { id: "ff_2", name: "Event RSVP", flowType: "event", updatedAt: "1 week ago", screens: [{ id: "s1", title: "s", components: [], continueLabel: "Continue" }] },
];

describe("SelectFlowFormModal", () => {
  it("lists all forms and filters by search", () => {
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={jest.fn()} />);

    expect(screen.getByText("Post-purchase survey")).toBeInTheDocument();
    expect(screen.getByText("Event RSVP")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "event" } });

    expect(screen.queryByText("Post-purchase survey")).not.toBeInTheDocument();
    expect(screen.getByText("Event RSVP")).toBeInTheDocument();
  });

  it("shows an empty state when search matches nothing", () => {
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzz" } });
    expect(screen.getByText(/no flow forms found/i)).toBeInTheDocument();
  });

  it("calls onSelect with the chosen form", () => {
    const onSelect = jest.fn();
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={onSelect} onPreview={jest.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^select$/i })[0]);

    expect(onSelect).toHaveBeenCalledWith(FORMS[0]);
  });

  it("calls onPreview with the chosen form", () => {
    const onPreview = jest.fn();
    render(<SelectFlowFormModal forms={FORMS} onCancel={jest.fn()} onSelect={jest.fn()} onPreview={onPreview} />);

    fireEvent.click(screen.getAllByRole("button", { name: /^preview$/i })[1]);

    expect(onPreview).toHaveBeenCalledWith(FORMS[1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SelectFlowFormModal" --watchAll=false`
Expected: FAIL — cannot find module `../SelectFlowFormModal`

- [ ] **Step 3: Write the implementation**

Create `src/components/flows/builder/nodes/WhatsAppNode/SelectFlowFormModal.jsx`:

```jsx
import React, { useState } from "react";
import { X, Search, Eye } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";

export default function SelectFlowFormModal({ forms, onCancel, onSelect, onPreview }) {
  const [search, setSearch] = useState("");
  const filtered = forms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 640px)", maxHeight: "80vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select an existing flow form</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={18} /></button>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flow forms…"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No flow forms found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {f.screens.length} screen{f.screens.length !== 1 ? "s" : ""} · Updated {f.updatedAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPreview(f)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
                  ><Eye size={13} /> Preview</button>
                  <button
                    type="button"
                    onClick={() => onSelect(f)}
                    style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: PRIMARY, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
                  >Select</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SelectFlowFormModal" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/SelectFlowFormModal.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/SelectFlowFormModal.test.jsx
git commit -m "feat: add SelectFlowFormModal (use-existing browse modal)"
```

---

### Task 13: Wire everything into `FlowCtaField` — full create/use-existing/preview flow

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx`
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx`

**Interfaces:**
- Consumes: `SelectFlowTypeModal`, `CreateFlowFormModal`, `SelectFlowFormModal`, `FlowFormPreview`, `MOCK_FLOW_FORMS` from `./data/mockFlowForms`.
- Produces: `FlowCtaField` now fully wires "Create new" → `SelectFlowTypeModal` → `CreateFlowFormModal` → patches `flowFormId`/`flowFormName` (and remembers the new form in local `customForms` state so it appears in "Use existing" for the rest of the session); "Use existing" → `SelectFlowFormModal` (over `[...MOCK_FLOW_FORMS, ...customForms]`) → patches the link; "Preview"/browse-row-Preview → a lightweight preview overlay using `FlowFormPreview` on the form's first screen.

- [ ] **Step 1: Write the failing test**

Append to `FlowCtaField.test.jsx`:

```jsx
describe("FlowCtaField — full create/use-existing flow", () => {
  it("creates a new flow form end-to-end and links it", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /\+ create new/i }));
    // Step 1: type wizard, default "Send a survey" selected
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    // Step 2: builder opens with a seeded screen
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      flowFormId: expect.stringMatching(/^ff_/),
      flowFormName: "Send a survey",
    }));
  });

  it("links an existing mock flow form via Use existing", () => {
    const onChange = jest.fn();
    render(<FlowCtaField field={{ key: "flowCta" }} value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /use existing/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^select$/i })[0]);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ flowFormId: "ff_1", flowFormName: "Post-purchase survey" }));
  });

  it("opens a preview overlay from the linked chip's Preview button", () => {
    const linkedValue = { buttonIcon: "default", buttonText: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" };
    render(<FlowCtaField field={{ key: "flowCta" }} value={linkedValue} onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    expect(screen.getByText(/your form/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: FAIL — Create new/Use existing/Preview buttons aren't wired to anything yet.

- [ ] **Step 3: Rewrite `FlowCtaField.jsx` with full wiring**

Replace the full contents of `FlowCtaField.jsx`:

```jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, BORDER, MUTED, Label } from "./FormFields";
import { MOCK_FLOW_FORMS, FLOW_TYPE_PRESETS } from "./data/mockFlowForms";
import SelectFlowTypeModal from "./SelectFlowTypeModal";
import CreateFlowFormModal from "./CreateFlowFormModal";
import SelectFlowFormModal from "./SelectFlowFormModal";
import FlowFormPreview from "./FlowFormPreview";

const DEFAULT_CTA = { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null };

function fieldWrapperStyle() {
  return { width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
}

function PreviewOverlay({ form, onClose }) {
  const [screenIdx, setScreenIdx] = useState(0);
  const screen = form.screens[screenIdx];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(90vw, 360px)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{form.name}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={16} /></button>
        </div>
        <FlowFormPreview screen={screen} />
        {form.screens.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <button disabled={screenIdx === 0} onClick={() => setScreenIdx((i) => i - 1)} style={{ fontSize: 12, color: screenIdx === 0 ? MUTED : PRIMARY, background: "none", border: "none", cursor: screenIdx === 0 ? "default" : "pointer" }}>← Previous</button>
            <span style={{ fontSize: 11, color: MUTED }}>Screen {screenIdx + 1} of {form.screens.length}</span>
            <button disabled={screenIdx === form.screens.length - 1} onClick={() => setScreenIdx((i) => i + 1)} style={{ fontSize: 12, color: screenIdx === form.screens.length - 1 ? MUTED : PRIMARY, background: "none", border: "none", cursor: screenIdx === form.screens.length - 1 ? "default" : "pointer" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlowCtaField({ field, value, onChange }) {
  const cta = value || DEFAULT_CTA;
  const patch = (next) => onChange({ ...cta, ...next });
  const linked = !!cta.flowFormId;

  const [customForms, setCustomForms] = useState([]);
  const [step, setStep] = useState(null); // null | "type" | "builder" | "browse"
  const [builderSeed, setBuilderSeed] = useState(null); // { flowType, initialScreens, editingForm }
  const [previewForm, setPreviewForm] = useState(null);

  const allForms = [...MOCK_FLOW_FORMS, ...customForms];
  const linkedForm = allForms.find((f) => f.id === cta.flowFormId) || null;

  const handleCreateType = (flowType) => {
    setBuilderSeed({ flowType, initialScreens: FLOW_TYPE_PRESETS[flowType].seedScreens, editingForm: null });
    setStep("builder");
  };

  const handleSaveForm = ({ name, screens }) => {
    const form = { id: `ff_${Date.now()}`, name, flowType: builderSeed.flowType, updatedAt: "Just now", screens };
    setCustomForms((prev) => [...prev, form]);
    patch({ flowFormId: form.id, flowFormName: form.name });
    setStep(null);
  };

  const handleSelectForm = (form) => {
    patch({ flowFormId: form.id, flowFormName: form.name });
    setStep(null);
  };

  return (
    <div>
      <Label>Call to action</Label>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, position: "relative" }}>
        <button
          type="button"
          onClick={() => patch({ flowFormId: null, flowFormName: null })}
          aria-label="Remove call to action link"
          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: MUTED }}
        >
          <X size={14} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, paddingRight: 20 }}>
          <div>
            <Label>Type of action</Label>
            <select value="complete_flow" onChange={() => {}} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="complete_flow">Complete flow</option>
            </select>
          </div>
          <div>
            <Label>Button icon</Label>
            <select value={cta.buttonIcon} onChange={(e) => patch({ buttonIcon: e.target.value })} style={{ ...fieldWrapperStyle(), background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="default">Default</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Button text</Label>
            <span style={{ fontSize: 10, color: MUTED }}>{(cta.buttonText || "").length}/40</span>
          </div>
          <input
            value={cta.buttonText}
            maxLength={40}
            onChange={(e) => patch({ buttonText: e.target.value })}
            style={fieldWrapperStyle()}
          />
        </div>

        {!linked ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setStep("type")} style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              + Create new
            </button>
            <button type="button" onClick={() => setStep("browse")} style={{ flex: 1, padding: "8px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              Use existing
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cta.flowFormName}
            </span>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={() => linkedForm && setPreviewForm(linkedForm)} style={{ fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                Preview
              </button>
              <button type="button" onClick={() => setStep("browse")} style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {step === "type" && (
        <SelectFlowTypeModal onCancel={() => setStep(null)} onCreate={handleCreateType} />
      )}
      {step === "builder" && builderSeed && (
        <CreateFlowFormModal seed={builderSeed} onCancel={() => setStep(null)} onSave={handleSaveForm} />
      )}
      {step === "browse" && (
        <SelectFlowFormModal forms={allForms} onCancel={() => setStep(null)} onSelect={handleSelectForm} onPreview={setPreviewForm} />
      )}
      {previewForm && (
        <PreviewOverlay form={previewForm} onClose={() => setPreviewForm(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FlowCtaField" --watchAll=false`
Expected: PASS (all describe blocks from Tasks 3, 4, and 13)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/FlowCtaField.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/FlowCtaField.test.jsx
git commit -m "feat: wire FlowCtaField to the full create/use-existing/preview flow"
```

---

### Task 14: Canvas + bubble preview integration

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview.jsx:41-61` (`StandardPreview`)
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/index.jsx:261-266` (`connectableButtons`)
- Test: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabFlowForm.test.jsx`

**Interfaces:**
- Produces: `StandardPreview` renders an extra button row (`🔗 {buttonText}`) whenever `draft.flowCta?.flowFormId` is set. `WhatsAppNode`'s `connectableButtons` includes a synthetic `{ type: "FLOW", label }` entry for `templateStyle === "flow_form"` with a linked `flowCta`, so it gets a canvas output port via the existing `ButtonPortRow`.

- [ ] **Step 1: Write the failing test**

Append to `TemplateTabFlowForm.test.jsx` (reuse the `renderPanel`/`renderStatefulPanel` helpers already defined there, matching `TemplateTabCarousel.test.jsx`'s pattern — add the same two helper functions to this file first if not already present, copying them verbatim from Task 1's version of this file):

```jsx
import WhatsAppBubblePreview from "../WhatsAppBubblePreview";
import WhatsAppNode from "../index";
import { ReactFlowProvider } from "reactflow";
import { isConnectable } from "../data/mockTemplates";

describe("Flow Form — bubble preview and canvas port", () => {
  it("shows a flow button row in the bubble preview when a flow is linked", () => {
    render(
      <WhatsAppBubblePreview
        draft={{ body: "Fill this out", buttons: [], flowCta: { buttonIcon: "default", buttonText: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" } }}
        previewKind="standard"
      />
    );
    expect(screen.getByText("🔗 View Flow")).toBeInTheDocument();
  });

  it("does not show a flow button row when no flow is linked", () => {
    render(<WhatsAppBubblePreview draft={{ body: "Fill this out", buttons: [], flowCta: { flowFormId: null } }} previewKind="standard" />);
    expect(screen.queryByText(/🔗/)).not.toBeInTheDocument();
  });

  it("exposes a connectable FLOW button for the canvas port", () => {
    render(
      <ReactFlowProvider>
        <WhatsAppNode
          id="node_1"
          selected={false}
          data={{
            templateStyle: "flow_form",
            wabaNumberId: "waba_1",
            template: { name: "flow_tpl", body: "Fill this out", buttons: [], flowCta: { buttonText: "View Flow", flowFormId: "ff_1", flowFormName: "Post-purchase survey" } },
          }}
        />
      </ReactFlowProvider>
    );
    expect(screen.getByText("View Flow")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="TemplateTabFlowForm" --watchAll=false`
Expected: FAIL — no flow button row, no connectable port yet.

- [ ] **Step 3: Update `StandardPreview`**

In `WhatsAppBubblePreview.jsx`:

```jsx
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
      {draft.flowCta?.flowFormId && <ButtonRow label={`🔗 ${draft.flowCta.buttonText}`} />}
    </Bubble>
  );
}
```

- [ ] **Step 4: Update `connectableButtons` in `index.jsx`**

```jsx
  // Connectable buttons from template
  const connectableButtons = isListMessageNode
    ? (template?.sections ?? []).flatMap((sec) =>
        (sec.rows ?? []).map((row) => ({ label: row.title || row.id, type: "QUICK_REPLY" }))
      )
    : [
        ...(template?.buttons ?? []),
        ...(data?.templateStyle === "flow_form" && template?.flowCta?.flowFormId
          ? [{ type: "FLOW", label: template.flowCta.buttonText }]
          : []),
      ].filter(isConnectable);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test --testPathPattern="TemplateTabFlowForm" --watchAll=false`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/index.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabFlowForm.test.jsx
git commit -m "feat: show flow CTA in bubble preview and expose a canvas connectable port"
```

---

### Task 15: Full regression pass — lockdown suites + manual smoke test

**Files:** none (verification only)

**Interfaces:** none — this task only runs and confirms existing suites.

- [ ] **Step 1: Run the full WhatsAppNode test suite**

Run: `npx craco test --testPathPattern="WhatsAppNode" --watchAll=false`
Expected: PASS — every test file under `WhatsAppNode/__tests__/` and `WhatsAppNode/data/__tests__/` green, including all new files from Tasks 1–14 and every pre-existing test (Carousel, ListMessage, CollectInput, generalization, etc.).

- [ ] **Step 2: Run both v1/v2 lockdown suites**

Run: `npx craco test --testPathPattern="FlowBuilder.lockdown|FlowBuilderV2.lockdown" --watchAll=false`
Expected: PASS — 2 suites, 10 tests (matches the baseline from CLAUDE.md's mandated check after any shared-file edit).

- [ ] **Step 3: Manual smoke test in the running app**

Start the dev server if not already running, open a flow in either `/flows/builder` or `/flows-v2/builder`, add a WhatsApp node, and manually verify:
1. The style picker shows "Flow Form" and does not show "Audio".
2. Selecting "Flow Form" → filling Body → "Create new" on the CTA → picking "Send a survey" → Create → the builder opens with one seeded screen containing a multi-choice question → Save → the CTA shows the linked form name.
3. The bubble preview on the right of the edit form shows a "🔗 View Flow" row.
4. Saving the template and looking at the canvas card shows a connectable output port for the flow button.
5. Repeat steps 1–4 in the other builder version (v1 if you tested v2 first, or vice versa) to confirm parity.

If any step fails, fix the underlying task's code before considering the plan complete — do not patch around it with a one-off workaround in this task.

- [ ] **Step 4: Commit (if any fixes were needed in Step 3)**

```bash
git add -A
git commit -m "fix: address smoke-test findings for Flow Form template style"
```

(Skip this step entirely if Step 3 found nothing to fix.)

---

## Self-Review Notes

- **Spec coverage:** §2 (hide Audio) → Task 1. §3 (add Flow Form card) → Task 1. §4 (data model) → Tasks 1–3. §5 (CTA field) → Tasks 3, 4, 13. §6.1 (type wizard) → Task 5. §6.2 (builder shell) → Task 6. §6.3 (per-kind forms) → Tasks 8–10. §6.4 (drag reorder) → Tasks 6, 7 (screens and components respectively). §6.5 (use existing) → Task 12. §7 (canvas/preview integration) → Task 14. §8 (out of scope) → nothing built for these, confirmed by omission. §9 (testing) → Task 15 plus a test file per task throughout.
- **Type consistency:** `createComponent(kind)` (Task 2) return shapes match what `ComponentSettingsForm` (Tasks 8–10) and `FlowFormPreview` (Task 11) read (`text`, `url`/`height`, `label`/`instructions`/`required`/`inputType`, `options`, `consentLabel`/`readMoreUrl`/`editContent`) — verified field-by-field against the spec's §4.2 screen shape. `FlowCtaField`'s `cta` shape (`buttonIcon`, `buttonText`, `flowFormId`, `flowFormName`) is consistent from Task 3 through Task 14's canvas integration. `CreateFlowFormModal`'s `onSave({ name, screens })` return shape (Task 6) matches what `FlowCtaField.handleSaveForm` consumes (Task 13).
- **No placeholders:** every step has complete, runnable code; the only intentionally-temporary markers are the two `id="flow-form-component-list-slot"` / `id="flow-form-preview-slot"` divs in Task 6, and both are explicitly removed by name in Tasks 7 and 11 respectively — not left dangling.
