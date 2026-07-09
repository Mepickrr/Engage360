# Email Node: Provider Field, To Email Dropdown, Template Gallery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Email Provider selector, rename/replace Reply-To with a "To Email" variable-mappable dropdown, and replace the Email node's two-button template flow with a single "Select Template" entry point that opens a WhatsApp-style illustrative template gallery modal.

**Architecture:** All changes are scoped to `src/components/flows/builder/nodes/EmailNode/` — this is the single component (`EmailRightPanel.jsx`) shared by both Flow Builder and Flow Builder V2 via `ConfigTab.jsx`, so there is nothing to change outside this folder. A new `EmailTemplateGalleryModal.jsx` file is added, modeled on the existing WhatsApp `UnifiedTemplateModal.jsx` browse-view pattern, and wired to reuse the existing `TemplateEditorModal.jsx` for both edit and create.

**Tech Stack:** React (function components + hooks), inline style objects (matches existing convention in this folder — no CSS modules/Tailwind used inside `EmailNode/`), Jest + `@testing-library/react` for tests (`craco test`).

## Global Constraints

- Do not commit changes during this work — build and verify locally only; the user will review before any commit.
- No backend/API wiring — Provider and To Email remain mocked/local state, consistent with the rest of the flow builder.
- Reuse the existing `TemplateEditorModal.jsx` unchanged for both "edit" and "create new" — do not rebuild it as a split-view form.
- Follow the existing file convention in `EmailNode/`: local inline style objects, local color constants (`EMAIL_BLUE`, `BORDER`, `MUTED`) redeclared per file rather than imported from a shared theme file.
- Keep `data.template`, `data.subject`, `data.previewText` and all other existing node-data fields unchanged in shape.

---

### Task 1: Add Provider, To Email variable options, and updated default data to `mockData.js`

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/data/mockData.js`
- Test: `src/components/flows/builder/nodes/EmailNode/__tests__/mockData.test.js` (new)

**Interfaces:**
- Produces: `EMAIL_PROVIDERS` (array of `{ id, label }`), `TO_EMAIL_VARIABLES` (flattened array of `{ key, label, example }` derived from `SYSTEM_VARIABLES`), and updated `defaultEmailNodeData` shape: `{ ..., provider: "trust_signal", toEmailMode: "auto", toEmailVariable: null }` (no more `replyTo`).
- Consumes: existing `SYSTEM_VARIABLES` object (already defined in this file, lines 70-94) — flatten its categories into `TO_EMAIL_VARIABLES`.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/EmailNode/__tests__/mockData.test.js`:

```jsx
import {
  EMAIL_PROVIDERS,
  TO_EMAIL_VARIABLES,
  defaultEmailNodeData,
} from "../data/mockData";

describe("EmailNode mockData", () => {
  it("defines the mocked email providers with Trust signal as the default first option", () => {
    expect(EMAIL_PROVIDERS[0]).toEqual({ id: "trust_signal", label: "Trust signal" });
    expect(EMAIL_PROVIDERS.some((p) => p.id === "karix")).toBe(true);
  });

  it("flattens SYSTEM_VARIABLES into a To Email variable list containing customer.email", () => {
    expect(TO_EMAIL_VARIABLES.some((v) => v.key === "customer.email")).toBe(true);
    expect(TO_EMAIL_VARIABLES[0]).toHaveProperty("label");
  });

  it("defaults new email node data to auto-detect To Email mode and no replyTo field", () => {
    expect(defaultEmailNodeData.toEmailMode).toBe("auto");
    expect(defaultEmailNodeData.toEmailVariable).toBe(null);
    expect(defaultEmailNodeData.provider).toBe("trust_signal");
    expect(defaultEmailNodeData.replyTo).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/mockData.test.js --watchAll=false`
Expected: FAIL — `EMAIL_PROVIDERS` / `TO_EMAIL_VARIABLES` are not exported yet, and `defaultEmailNodeData.toEmailMode` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `src/components/flows/builder/nodes/EmailNode/data/mockData.js`, add after `EMAIL_FROM_ADDRESSES` (after line 6):

```js
export const EMAIL_PROVIDERS = [
  { id: "trust_signal", label: "Trust signal" },
  { id: "karix",        label: "Karix" },
];
```

Add after the `SYSTEM_VARIABLES` block (after line 94):

```js
export const TO_EMAIL_VARIABLES = Object.values(SYSTEM_VARIABLES).flat();
```

Replace the `defaultEmailNodeData` object (lines 126-142) with:

```js
export const defaultEmailNodeData = {
  label:       "Send Email",
  template:    null,
  provider:    "trust_signal",
  fromId:      "from_1",
  toEmailMode:     "auto",
  toEmailVariable: null,
  subject:     "",
  previewText: "",
  attachments: [],
  gmailAnnotation: { enabled: false, logo: "", discount: "", code: "", expiry: "" },
  outputConfig: {
    routingMode:      "next_step",
    deliveryOutputs:  [],
    wiredPorts:       [],
  },
  utm: { enabled: false, source: "email", medium: "journey", campaign: "" },
  aiBestTime: false,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/mockData.test.js --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Do not commit** (per Global Constraints) — leave changes in the working tree for review.

---

### Task 2: Add Provider field and replace Reply-To with the To Email dropdown in `EmailRightPanel.jsx`

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx:1-11` (imports), `:464-489` (Sender Details section)
- Test: `src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx` (new)

**Interfaces:**
- Consumes: `EMAIL_PROVIDERS`, `TO_EMAIL_VARIABLES` from Task 1's `data/mockData.js`; existing `SelectField` component already defined in this file (lines 47-65).
- Produces: node data fields `data.provider`, `data.toEmailMode`, `data.toEmailVariable` are read/written via the existing `patch()` helper — no new exported interfaces, this is a leaf UI change.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailRightPanel from "../EmailRightPanel";
import { defaultEmailNodeData } from "../data/mockData";

function makeNode(overrides = {}) {
  return { id: "email_1", type: "email", data: { ...defaultEmailNodeData, ...overrides } };
}

describe("EmailRightPanel — Provider and To Email fields", () => {
  it("renders an Email Provider select above From Address, defaulting to Trust signal", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("Email Provider")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Trust signal")).toBeInTheDocument();
  });

  it("updates data.provider when a different provider is selected", () => {
    const updateNodeData = jest.fn();
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("Trust signal"), { target: { value: "karix" } });
    expect(updateNodeData).toHaveBeenCalledWith("email_1", { provider: "karix" });
  });

  it("renders a To Email dropdown defaulting to the auto-detect option, not a free-text Reply-To field", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByText("To Email")).toBeInTheDocument();
    expect(screen.queryByText("Reply-To Email")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Automatically detects the email address")).toBeInTheDocument();
  });

  it("sets toEmailMode to variable and stores the chosen key when a variable is selected", () => {
    const updateNodeData = jest.fn();
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={updateNodeData} removeNode={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("Automatically detects the email address"), { target: { value: "customer.email" } });
    expect(updateNodeData).toHaveBeenCalledWith("email_1", { toEmailMode: "variable", toEmailVariable: "customer.email" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx --watchAll=false`
Expected: FAIL — "Email Provider" text not found, "Reply-To Email" still present.

- [ ] **Step 3: Write minimal implementation**

In `EmailRightPanel.jsx`, update the import block (lines 8-11) to also pull in the new data:

```js
import {
  EMAIL_FROM_ADDRESSES, MOCK_EMAIL_TEMPLATES,
  EMAIL_DELIVERY_OPTIONS, EMAIL_PROVIDERS, TO_EMAIL_VARIABLES,
  defaultEmailNodeData,
} from "./data/mockData";
```

Replace the "Sender Details" section body (lines 464-489) with:

```jsx
<Section title="Sender Details" defaultOpen>
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div>
      <Label>Email Provider</Label>
      <SelectField
        value={data.provider}
        onChange={(v) => patch({ provider: v })}
        options={EMAIL_PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
      />
    </div>
    <div>
      <Label>From Address</Label>
      <SelectField
        value={data.fromId}
        onChange={(v) => patch({ fromId: v })}
        options={fromAddressOptions}
      />
      {selectedFrom && !selectedFrom.verified && (
        <div style={{ display: "flex", gap: 5, marginTop: 5, padding: "5px 8px", background: "#FFFBEB", borderRadius: 6, border: "1px solid #FDE68A", alignItems: "center" }}>
          <AlertCircle size={12} color="#D97706" />
          <span style={{ fontSize: 11, color: "#92400E" }}>Domain not verified. Emails may land in spam.</span>
        </div>
      )}
    </div>
    <div>
      <Label>To Email</Label>
      <SelectField
        value={data.toEmailMode === "variable" ? data.toEmailVariable : "auto"}
        onChange={(v) => {
          if (v === "auto") patch({ toEmailMode: "auto", toEmailVariable: null });
          else patch({ toEmailMode: "variable", toEmailVariable: v });
        }}
        options={[
          { value: "auto", label: "Automatically detects the email address" },
          ...TO_EMAIL_VARIABLES.map((v) => ({ value: v.key, label: `{{${v.key}}} — ${v.label}` })),
        ]}
      />
    </div>
  </div>
</Section>
```

Note: `SelectField` (defined at lines 47-65) has no `placeholder` passed here, so it always shows a selected value — matches the test expecting `getByDisplayValue` to find the selected option's label immediately.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Do not commit** — leave changes in the working tree for review.

---

### Task 3: Build `EmailTemplateGalleryModal.jsx` with illustrative template cards

**Files:**
- Create: `src/components/flows/builder/nodes/EmailNode/EmailTemplateGalleryModal.jsx`
- Test: `src/components/flows/builder/nodes/EmailNode/__tests__/EmailTemplateGalleryModal.test.jsx` (new)

**Interfaces:**
- Consumes: `MOCK_EMAIL_TEMPLATES` shape from `data/mockData.js` — each template has `{ id, name, subject, previewText, category, thumbnailColor, status, lastUpdated, blocks: [{ type: "image"|"text"|"button", ... }] }`.
- Produces: `export default function EmailTemplateGalleryModal({ open, templates, onSelect, onCreateNew, onClose })`. `onSelect(template)` is called with the clicked template object. `onCreateNew()` is called with no args. Neither closes the modal itself — the caller (Task 4) is responsible for closing it in response to these callbacks, matching how `UnifiedTemplateModal`'s `onClose` is caller-driven.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/EmailNode/__tests__/EmailTemplateGalleryModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailTemplateGalleryModal from "../EmailTemplateGalleryModal";
import { MOCK_EMAIL_TEMPLATES } from "../data/mockData";

const noop = () => {};

describe("EmailTemplateGalleryModal", () => {
  it("renders nothing when closed", () => {
    render(<EmailTemplateGalleryModal open={false} templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    expect(screen.queryByText("Select Email Template")).not.toBeInTheDocument();
  });

  it("shows the gallery title, a Create new button, and every seeded template's name", () => {
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    expect(screen.getByText("Select Email Template")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new/i })).toBeInTheDocument();
    expect(screen.getByText("Cart Recovery — Minimal")).toBeInTheDocument();
    expect(screen.getByText("Welcome Series — Day 1")).toBeInTheDocument();
  });

  it("filters templates by the search input", () => {
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/search templates/i), { target: { value: "welcome" } });
    expect(screen.getByText("Welcome Series — Day 1")).toBeInTheDocument();
    expect(screen.queryByText("Cart Recovery — Minimal")).not.toBeInTheDocument();
  });

  it("calls onSelect with the clicked template", () => {
    const onSelect = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={onSelect} onCreateNew={noop} onClose={noop} />);
    fireEvent.click(screen.getByText("Cart Recovery — Minimal"));
    expect(onSelect).toHaveBeenCalledWith(MOCK_EMAIL_TEMPLATES[0]);
  });

  it("calls onCreateNew when the Create new button is clicked", () => {
    const onCreateNew = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={onCreateNew} onClose={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("calls onClose when Cancel or the close button is clicked", () => {
    const onClose = jest.fn();
    render(<EmailTemplateGalleryModal open templates={MOCK_EMAIL_TEMPLATES} onSelect={noop} onCreateNew={noop} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailTemplateGalleryModal.test.jsx --watchAll=false`
Expected: FAIL — module `../EmailTemplateGalleryModal` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/flows/builder/nodes/EmailNode/EmailTemplateGalleryModal.jsx`:

```jsx
import React, { useState } from "react";
import { X, Search, Image as ImageIcon } from "lucide-react";

const EMAIL_BLUE = "#3B82F6";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

function BlockPreview({ block }) {
  if (block.type === "image") {
    return (
      <div style={{ height: 22, borderRadius: 4, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={12} color={MUTED} />
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div style={{ alignSelf: "flex-start", padding: "3px 10px", borderRadius: 4, background: EMAIL_BLUE, fontSize: 8, color: "#fff", fontWeight: 700 }}>
        {block.label || "Button"}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: 5, width: "85%", borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
      <div style={{ height: 5, width: "55%", borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
    </div>
  );
}

function EmailTemplateCard({ template, onSelect }) {
  const previewBlocks = (template.blocks || []).slice(0, 3);
  return (
    <div
      onClick={onSelect}
      style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "#fff", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = EMAIL_BLUE)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ height: 92, background: template.thumbnailColor, padding: 10, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
        {previewBlocks.map((block, i) => <BlockPreview key={i} block={block} />)}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{template.name}</span>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: template.status === "Active" ? "#ECFDF5" : "#F1F5F9", color: template.status === "Active" ? "#065F46" : "#6B7280", fontWeight: 600, flexShrink: 0 }}>
            {template.status}
          </span>
        </div>
        <div style={{ fontSize: 10, color: MUTED }}>{template.category}</div>
      </div>
    </div>
  );
}

export default function EmailTemplateGalleryModal({ open, templates, onSelect, onCreateNew, onClose }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = (templates || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 900px)", maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select Email Template</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button type="button" onClick={onCreateNew} style={{ padding: "8px 16px", background: EMAIL_BLUE, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Create new
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No templates found</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {filtered.map((t) => <EmailTemplateCard key={t.id} template={t} onSelect={() => onSelect(t)} />)}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: MUTED }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</span>
          <button onClick={onClose} style={{ padding: "7px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailTemplateGalleryModal.test.jsx --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Do not commit** — leave changes in the working tree for review.

---

### Task 4: Wire the gallery modal into `EmailRightPanel.jsx`, removing the old two-button flow

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx:1-12` (imports), `:402-405` (state), `:529-584` (Template section), `:679-685` (old picker overlay removal)
- Test: `src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx` (extend from Task 2)

**Interfaces:**
- Consumes: `EmailTemplateGalleryModal` from Task 3 (`{ open, templates, onSelect, onCreateNew, onClose }`), existing `TemplateEditorModal` (`{ open, template, data, onSave, onClose }`, unchanged), existing `TemplatePreviewCard` (unchanged), `MOCK_EMAIL_TEMPLATES` from `data/mockData.js`.
- Produces: no new exports — this finishes the wiring so `data.template` selection flows: gallery → editor → `patch({ template, ... })`, same as today's "Edit Template" path.

- [ ] **Step 1: Write the failing test**

Append to `src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx`:

```jsx
describe("EmailRightPanel — Template gallery flow", () => {
  it("shows a single Select Template button and no Create New Template button when unselected", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    expect(screen.getByRole("button", { name: /select template/i })).toBeInTheDocument();
    expect(screen.queryByText("Create New Template")).not.toBeInTheDocument();
  });

  it("opens the gallery modal when Select Template is clicked, and selecting a card opens the template editor", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select template/i }));
    expect(screen.getByText("Select Email Template")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cart Recovery — Minimal"));
    expect(screen.getByText("Edit Template")).toBeInTheDocument();
  });

  it("opens the template editor with a blank draft when Create new is clicked inside the gallery", () => {
    const node = makeNode();
    render(<EmailRightPanel node={node} updateNodeData={() => {}} removeNode={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /select template/i }));
    fireEvent.click(screen.getByRole("button", { name: /create new/i }));
    expect(screen.getByPlaceholderText(/template name/i)).toHaveValue("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx --watchAll=false`
Expected: FAIL — "Create New Template" button is still present, gallery title not found. (If the "template name" placeholder text in `TemplateEditorModal` differs, inspect `TemplateEditorModal.jsx` for the exact placeholder before writing this assertion — see Step 3 note.)

- [ ] **Step 3: Write minimal implementation**

In `EmailRightPanel.jsx`, add the import (near the existing `TemplateEditorModal` import, line 12):

```js
import TemplateEditorModal from "./TemplateEditorModal";
import EmailTemplateGalleryModal from "./EmailTemplateGalleryModal";
```

Replace `const [showPicker, setShowPicker] = useState(false);` (line 403) with:

```js
const [showGallery, setShowGallery] = useState(false);
```

Replace the entire "Template" section body (lines 530-584, the `<Section title="Template" defaultOpen>...</Section>` block) with:

```jsx
<Section title="Template" defaultOpen>
  {!data.template ? (
    <button
      onClick={() => setShowGallery(true)}
      style={{
        width: "100%", padding: "11px 14px",
        border: `1.5px dashed ${EMAIL_BLUE}`,
        borderRadius: 9, background: "#EFF6FF",
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10,
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 7, background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Eye size={15} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: EMAIL_BLUE }}>Select Template</div>
        <div style={{ fontSize: 11, color: "#93C5FD" }}>Choose from your template library or create new</div>
      </div>
    </button>
  ) : (
    <TemplatePreviewCard
      template={data.template}
      subject={data.subject}
      previewText={data.previewText}
      onEdit={() => setShowEditor(true)}
      onClear={() => patch({ template: null })}
    />
  )}
</Section>
```

Replace the old "Template Picker overlay" block (lines 679-685):

```jsx
{/* Template Picker overlay */}
{showPicker && (
  <TemplatePicker
    onSelect={(t) => { patch({ template: t, subject: data.subject || t.subject, previewText: data.previewText || t.previewText }); setShowPicker(false); }}
    onClose={() => setShowPicker(false)}
  />
)}
```

with:

```jsx
{/* Template Gallery modal */}
<EmailTemplateGalleryModal
  open={showGallery}
  templates={MOCK_EMAIL_TEMPLATES}
  onSelect={(t) => {
    patch({ template: t, subject: data.subject || t.subject, previewText: data.previewText || t.previewText });
    setShowGallery(false);
    setShowEditor(true);
  }}
  onCreateNew={() => { setShowGallery(false); setShowEditor(true); }}
  onClose={() => setShowGallery(false)}
/>
```

Note: the outer `<div>` that previously wrapped the panel and the `TemplatePicker` overlay (line 427, `position: "relative"`) can keep its `position: "relative"` — `EmailTemplateGalleryModal` is `position: "fixed"` so it no longer needs the parent to be a positioning context, but leaving it doesn't break anything, so no change needed there.

Also remove the now-unused `TemplatePicker` function definition (lines 147-214) since nothing references it after this change — leaving dead code would fail the "don't add unused code" bar. Delete the whole `TemplatePicker` function block.

Before finalizing Step 3's test assertions, open `TemplateEditorModal.jsx` and confirm the exact placeholder text used for the template name input (search for `templateName` state, around line 220 and its corresponding `<input>` render) — use that exact placeholder string in the "blank draft" test assertion instead of guessing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode/__tests__/EmailRightPanel.test.jsx --watchAll=false`
Expected: PASS (all 7 tests across both `describe` blocks)

- [ ] **Step 5: Do not commit** — leave changes in the working tree for review.

---

### Task 5: Full-suite regression check

**Files:** none (verification only)

**Interfaces:** none — this task only runs existing tests to confirm nothing else broke.

- [ ] **Step 1: Run the full EmailNode test directory**

Run: `npx craco test src/components/flows/builder/nodes/EmailNode --watchAll=false`
Expected: All tests PASS (Tasks 1-4's new test files, no existing EmailNode tests to regress since none existed before this plan).

- [ ] **Step 2: Run the full flow builder test suite to catch any cross-file breakage**

Run: `npx craco test src/components/flows/builder --watchAll=false`
Expected: All tests PASS. If any unrelated snapshot/test references the old "Reply-To Email" label, "Create New Template" text, or `TemplatePicker`, update that reference to match the new "To Email" / "Select Template" copy — do not leave it broken.

- [ ] **Step 3: Manual smoke check**

Run the app locally (`npm start` or the project's existing dev-server skill) and in either Flow Builder or Flow Builder V2, add/select an Email node, then:
- Confirm "Email Provider" shows above "From Address" with Trust signal / Karix options.
- Confirm "To Email" shows the auto-detect default and lists variables like `customer.email` when opened.
- Confirm the Template section shows only "Select Template", and clicking it opens the illustrative gallery modal with cards for all 4 seeded templates, a working search box, and a "+ Create new" button.
- Confirm clicking a card opens the existing block editor pre-loaded with that template, and "+ Create new" opens it blank.

- [ ] **Step 4: Do not commit** — report completion to the user; they will review and decide when/what to commit.

## Self-Review Notes

- **Spec coverage:** Provider field (Task 2) ✅, To Email dropdown (Task 2) ✅, remove Create New Template button + illustrative gallery modal (Tasks 3-4) ✅, reuse existing TemplateEditorModal for edit/create (Task 4) ✅, dead-code cleanup of `TemplatePicker` (Task 4) ✅.
- **Placeholder scan:** no TBD/TODO; every step has literal code and exact commands.
- **Type/name consistency:** `EmailTemplateGalleryModal` prop names (`open`, `templates`, `onSelect`, `onCreateNew`, `onClose`) are identical between Task 3's definition and Task 4's usage. `TO_EMAIL_VARIABLES` and `EMAIL_PROVIDERS` names match between Task 1's export and Task 2's import. `data.provider`, `data.toEmailMode`, `data.toEmailVariable` are consistent across Tasks 1, 2, and the manual smoke check in Task 5.
