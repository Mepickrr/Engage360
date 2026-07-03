# WhatsApp List Message Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FBM-redirect path for the `list` template style with a self-contained right-panel form that builds a WhatsApp Interactive List Message.

**Architecture:** Extract a `ListMessageForm` component (its own file, parallel to `CollectInputForm`) wired into `TemplateTab` via an early-exit path, and extend the canvas node's `connectableButtons` to read from list rows so each row gets an output port.

**Tech Stack:** React (useState, functional components), @testing-library/react + fireEvent for tests, craco test runner.

## Global Constraints

- Character limits (from WhatsApp API): header ≤ 60, body ≤ 1024, footer ≤ 60, buttonText ≤ 20, section title ≤ 24, row title ≤ 24, row description ≤ 72
- Max 10 sections total; max 10 rows total across all sections
- Row IDs auto-assigned as `row_1`, `row_2`, … — never shown to seller, never reassigned
- Apply button disabled until: `body` non-empty + `buttonText` non-empty + at least one row with non-empty title
- `template.isListMessage = true` is the canonical flag used by both canvas node and right panel to identify a configured list template
- Style guide: match existing component style (inline styles, `WA_GREEN = "#25D366"`, `PRIMARY = "#6C3AE8"`, `BORDER = "#E5E7EB"`, `MUTED = "#94A3B8"`)
- No new dependencies — use only what is already in the project

---

### Task 1: Canvas node — output ports and preview for list messages

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/index.jsx:208-219` (isListMessageNode flag + connectableButtons)
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/index.jsx:283-300` (canvas preview + subtitle label)
- Create: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageNode.test.jsx`

**Interfaces:**
- Consumes: `data.templateStyle === "list"`, `data.template.isListMessage`, `data.template.sections[].rows[].{id, title}`
- Produces: `connectableButtons` array `[{ label: row.title || row.id, type: "QUICK_REPLY" }]` for existing `ButtonPortRow` renderer at line 360

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageNode.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import WhatsAppNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id}`} data-type={type} />,
  Position: { Top: "top", Right: "right" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const listTemplate = {
  isListMessage: true,
  header: "Pick a plan",
  body: "Choose the plan that works best for you.",
  footer: "Reply anytime",
  buttonText: "View plans",
  sections: [
    {
      title: "Monthly",
      rows: [
        { id: "row_1", title: "Basic", description: "₹199/mo" },
        { id: "row_2", title: "Pro", description: "₹499/mo" },
      ],
    },
    {
      title: "Annual",
      rows: [
        { id: "row_3", title: "Basic Annual", description: "₹1999/yr" },
      ],
    },
  ],
};

describe("WhatsAppNode — list style", () => {
  it("renders one output handle per row (btn_0, btn_1, btn_2)", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByTestId("handle-btn_0")).toBeInTheDocument();
    expect(screen.getByTestId("handle-btn_1")).toBeInTheDocument();
    expect(screen.getByTestId("handle-btn_2")).toBeInTheDocument();
  });

  it("labels ports with row titles", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Basic Annual")).toBeInTheDocument();
  });

  it("renders body text in the canvas preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText(/choose the plan/i)).toBeInTheDocument();
  });

  it("renders button label in the canvas preview", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: listTemplate }}
        selected={false}
      />
    );
    expect(screen.getByText(/view plans/i)).toBeInTheDocument();
  });

  it("does not render any btn handles when templateStyle is list but template is null", () => {
    render(
      <WhatsAppNode
        id="node_1"
        data={{ templateStyle: "list", template: null }}
        selected={false}
      />
    );
    expect(screen.queryByTestId("handle-btn_0")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageNode.test.jsx --watchAll=false
```

Expected: 5 tests FAIL — `handle-btn_0` not found, `Basic` not found, etc.

- [ ] **Step 3: Add `ListMessageNodePreview` component and extend `connectableButtons` in `index.jsx`**

After the `CollectInputNodePreview` function (around line 196), add:

```jsx
// ── List Message canvas preview ─────────────────────────────────
function ListMessageNodePreview({ template }) {
  const totalRows = (template?.sections ?? []).reduce((sum, s) => sum + (s.rows?.length ?? 0), 0);
  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
      {template.header && (
        <div style={{ fontSize: 10, fontWeight: 700, color: "#111", marginBottom: 4, padding: "0 4px" }}>
          {template.header}
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", padding: "6px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 11, color: "#111", lineHeight: 1.5 }}>
          {template.body
            ? (template.body.length > 80 ? template.body.slice(0, 80) + "…" : template.body)
            : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>No body set</span>}
        </div>
        {template.footer && (
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{template.footer}</div>
        )}
        <div style={{ textAlign: "right", fontSize: 9, color: "#aaa", marginTop: 2 }}>16:48 ✓✓</div>
      </div>
      <div style={{ marginTop: 6, padding: "5px 8px", background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{ fontSize: 10 }}>📋</span>
        <span style={{ fontSize: 10, color: "#25D366", fontWeight: 600 }}>
          {template.buttonText || "View list"}
        </span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>
          · {totalRows} option{totalRows !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
```

In the `WhatsAppNode` function body, replace the `connectableButtons` line (line ~219):

```jsx
// Before:
const connectableButtons = (template?.buttons ?? []).filter(isConnectable);

// After:
const isListMessageNode = data?.templateStyle === "list" && template?.isListMessage;
const connectableButtons = isListMessageNode
  ? (template?.sections ?? []).flatMap((sec) =>
      (sec.rows ?? []).map((row) => ({ label: row.title || row.id, type: "QUICK_REPLY" }))
    )
  : (template?.buttons ?? []).filter(isConnectable);
```

In the subtitle label (line ~286), replace:

```jsx
// Before:
{template.name || (data?.templateStyle === "collect_input" ? "Collect Input" : "")}

// After:
{template.name || (data?.templateStyle === "collect_input" ? "Collect Input" : data?.templateStyle === "list" ? "List Message" : "")}
```

In the preview render block (line ~298), add `isListMessageNode` branch:

```jsx
// Before:
{isCollectInput ? (
  <CollectInputNodePreview template={template} />
) : isCarousel ? (
  <CarouselNodePreview template={template} />
) : (
  <div style={{ margin: "0 8px 8px", ... }}>
    ...
  </div>
)}

// After:
{isCollectInput ? (
  <CollectInputNodePreview template={template} />
) : isCarousel ? (
  <CarouselNodePreview template={template} />
) : isListMessageNode ? (
  <ListMessageNodePreview template={template} />
) : (
  <div style={{ margin: "0 8px 8px", ... }}>
    ...
  </div>
)}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageNode.test.jsx --watchAll=false
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/index.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageNode.test.jsx
git commit -m "feat: add list message output ports and canvas preview to WhatsApp node"
```

---

### Task 2: `ListMessageForm` component

**Files:**
- Create: `src/components/flows/builder/nodes/WhatsAppNode/ListMessageForm.jsx`
- Create: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx`

**Interfaces:**
- Consumes: `{ initial: object|null, onApply: (draft) => void, onCancel: () => void }`
- Produces: calls `onApply` with `{ isListMessage: true, header, body, footer, buttonText, sections: [{ title, rows: [{ id, title, description }] }] }`

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ListMessageForm from "../ListMessageForm";

const noop = () => {};

describe("ListMessageForm", () => {
  it("renders the form heading", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });

  it("renders Body Text, Button Label, Header, Footer fields", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText("Body Text")).toBeInTheDocument();
    expect(screen.getByText("Button Label")).toBeInTheDocument();
    expect(screen.getByText(/header/i)).toBeInTheDocument();
    expect(screen.getByText(/footer/i)).toBeInTheDocument();
  });

  it("starts with one empty section and one row pre-populated", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByPlaceholderText("Row title")).toBeInTheDocument();
  });

  it("Apply button is disabled when body and buttonText are empty", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("Apply button is enabled when body, buttonText, and one row title are filled", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
    fireEvent.change(screen.getByPlaceholderText(/choose an option/i), { target: { value: "View" } });
    fireEvent.change(screen.getByPlaceholderText("Row title"), { target: { value: "Option A" } });
    expect(screen.getByRole("button", { name: /apply/i })).not.toBeDisabled();
  });

  it("calls onApply with isListMessage:true and correct shape", () => {
    const onApply = jest.fn();
    render(<ListMessageForm initial={null} onApply={onApply} onCancel={noop} />);
    fireEvent.change(screen.getByPlaceholderText(/message body/i), { target: { value: "Pick a plan" } });
    fireEvent.change(screen.getByPlaceholderText(/choose an option/i), { target: { value: "View" } });
    fireEvent.change(screen.getByPlaceholderText("Row title"), { target: { value: "Option A" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        isListMessage: true,
        body: "Pick a plan",
        buttonText: "View",
        sections: expect.arrayContaining([
          expect.objectContaining({
            rows: expect.arrayContaining([
              expect.objectContaining({ title: "Option A" }),
            ]),
          }),
        ]),
      })
    );
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<ListMessageForm initial={null} onApply={noop} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows + Add Row button and adds a row on click", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    const addRowBtn = screen.getByRole("button", { name: /add row/i });
    expect(addRowBtn).toBeInTheDocument();
    fireEvent.click(addRowBtn);
    expect(screen.getAllByPlaceholderText("Row title")).toHaveLength(2);
  });

  it("shows + Add Section button and adds a section on click", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    const addSectionBtn = screen.getByRole("button", { name: /add section/i });
    expect(addSectionBtn).toBeInTheDocument();
    fireEvent.click(addSectionBtn);
    // now 2 sections, each with a row title input → 2 total
    expect(screen.getAllByPlaceholderText("Row title")).toHaveLength(2);
  });

  it("displays row count against 10-row cap", () => {
    render(<ListMessageForm initial={null} onApply={noop} onCancel={noop} />);
    expect(screen.getByText(/1 \/ 10 rows used/i)).toBeInTheDocument();
  });

  it("pre-fills fields from initial draft", () => {
    const initial = {
      isListMessage: true,
      header: "My Header",
      body: "My body",
      footer: "My footer",
      buttonText: "Click",
      sections: [{ title: "Sec 1", rows: [{ id: "row_1", title: "Row A", description: "Desc A" }] }],
    };
    render(<ListMessageForm initial={initial} onApply={noop} onCancel={noop} />);
    expect(screen.getByDisplayValue("My body")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Click")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Row A")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx --watchAll=false
```

Expected: all 10 tests FAIL — `ListMessageForm` does not exist.

- [ ] **Step 3: Create `ListMessageForm.jsx`**

Create `src/components/flows/builder/nodes/WhatsAppNode/ListMessageForm.jsx`:

```jsx
import React, { useState } from "react";
import { Trash2 } from "lucide-react";

const WA_GREEN  = "#25D366";
const PRIMARY   = "#6C3AE8";
const BORDER    = "#E5E7EB";
const MUTED     = "#94A3B8";

const MAX_BODY          = 1024;
const MAX_HEADER        = 60;
const MAX_FOOTER        = 60;
const MAX_BUTTON        = 20;
const MAX_SECTION_TITLE = 24;
const MAX_ROW_TITLE     = 24;
const MAX_ROW_DESC      = 72;
const MAX_SECTIONS      = 10;
const MAX_ROWS_TOTAL    = 10;

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function CharInput({ value, onChange, max, placeholder, multiline, rows }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <Tag
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={multiline ? (rows || 4) : undefined}
        style={{
          width: "100%", padding: "7px 10px", fontSize: 13,
          border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
          fontFamily: "inherit", resize: multiline ? "none" : undefined,
          lineHeight: multiline ? 1.55 : undefined,
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, textAlign: "right", marginTop: 2 }}>
        {value.length}/{max}
      </div>
    </div>
  );
}

function defaultRow(globalIdx) {
  return { id: `row_${globalIdx + 1}`, title: "", description: "" };
}

function defaultSection(globalRowIdx) {
  return { title: "", rows: [defaultRow(globalRowIdx)] };
}

function defaultDraft() {
  return {
    isListMessage: true,
    header: "",
    body: "",
    footer: "",
    buttonText: "",
    sections: [defaultSection(0)],
  };
}

export default function ListMessageForm({ initial, onApply, onCancel }) {
  const [draft, setDraft] = useState(
    initial?.isListMessage ? initial : defaultDraft()
  );

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const totalRows = draft.sections.reduce(
    (sum, s) => sum + (s.rows?.length ?? 0), 0
  );

  const canApply =
    draft.body.trim().length > 0 &&
    draft.buttonText.trim().length > 0 &&
    draft.sections.some((s) => s.rows.some((r) => r.title.trim().length > 0));

  const updateSection = (si, update) =>
    patch({ sections: draft.sections.map((s, i) => (i === si ? { ...s, ...update } : s)) });

  const deleteSection = (si) => {
    if (draft.sections.length <= 1) return;
    patch({ sections: draft.sections.filter((_, i) => i !== si) });
  };

  const addSection = () => {
    if (draft.sections.length >= MAX_SECTIONS) return;
    patch({ sections: [...draft.sections, defaultSection(totalRows)] });
  };

  const addRow = (si) => {
    if (totalRows >= MAX_ROWS_TOTAL) return;
    patch({
      sections: draft.sections.map((s, i) =>
        i === si ? { ...s, rows: [...s.rows, defaultRow(totalRows)] } : s
      ),
    });
  };

  const deleteRow = (si, ri) => {
    const section = draft.sections[si];
    if (draft.sections.length === 1 && section.rows.length <= 1) return;
    if (section.rows.length <= 1) {
      patch({ sections: draft.sections.filter((_, i) => i !== si) });
    } else {
      patch({
        sections: draft.sections.map((s, i) =>
          i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s
        ),
      });
    }
  };

  const updateRow = (si, ri, update) =>
    patch({
      sections: draft.sections.map((s, i) =>
        i === si
          ? { ...s, rows: s.rows.map((r, j) => (j === ri ? { ...r, ...update } : r)) }
          : s
      ),
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Heading */}
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Configure List Message</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>📋 Interactive list · session message</div>
      </div>

      {/* Body */}
      <div>
        <Label>Body Text</Label>
        <CharInput
          value={draft.body}
          onChange={(v) => patch({ body: v })}
          max={MAX_BODY}
          placeholder="Message body shown to the customer…"
          multiline
        />
      </div>

      {/* Button label */}
      <div>
        <Label>Button Label</Label>
        <CharInput
          value={draft.buttonText}
          onChange={(v) => patch({ buttonText: v })}
          max={MAX_BUTTON}
          placeholder="e.g. Choose an option"
        />
      </div>

      {/* Header (optional) */}
      <div>
        <Label>Header (Optional)</Label>
        <CharInput
          value={draft.header}
          onChange={(v) => patch({ header: v })}
          max={MAX_HEADER}
          placeholder="Short header text…"
        />
      </div>

      {/* Footer (optional) */}
      <div>
        <Label>Footer (Optional)</Label>
        <CharInput
          value={draft.footer}
          onChange={(v) => patch({ footer: v })}
          max={MAX_FOOTER}
          placeholder="Optional footer text…"
        />
      </div>

      {/* Sections */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Sections</Label>
          <span style={{ fontSize: 10, color: MUTED }}>{totalRows} / {MAX_ROWS_TOTAL} rows used</span>
        </div>

        {draft.sections.map((section, si) => (
          <div key={si} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <input
                value={section.title}
                onChange={(e) => updateSection(si, { title: e.target.value.slice(0, MAX_SECTION_TITLE) })}
                placeholder={`Section ${si + 1} title (optional)`}
                style={{ flex: 1, padding: "4px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => deleteSection(si)}
                disabled={draft.sections.length <= 1}
                style={{ background: "none", border: "none", padding: 4, cursor: draft.sections.length <= 1 ? "not-allowed" : "pointer", color: draft.sections.length <= 1 ? MUTED : "#EF4444" }}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Rows */}
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {section.rows.map((row, ri) => {
                const isOnlyRow = draft.sections.length === 1 && section.rows.length <= 1;
                return (
                  <div key={ri} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        value={row.title}
                        onChange={(e) => updateRow(si, ri, { title: e.target.value.slice(0, MAX_ROW_TITLE) })}
                        placeholder="Row title"
                        style={{ width: "100%", padding: "5px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit" }}
                      />
                      <input
                        value={row.description}
                        onChange={(e) => updateRow(si, ri, { description: e.target.value.slice(0, MAX_ROW_DESC) })}
                        placeholder="Description (optional)"
                        style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit", color: MUTED }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRow(si, ri)}
                      disabled={isOnlyRow}
                      style={{ background: "none", border: "none", padding: 4, marginTop: 2, cursor: isOnlyRow ? "not-allowed" : "pointer", color: isOnlyRow ? MUTED : "#EF4444" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {totalRows < MAX_ROWS_TOTAL && (
                <button
                  type="button"
                  onClick={() => addRow(si)}
                  style={{ alignSelf: "flex-start", fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  + Add Row
                </button>
              )}
            </div>
          </div>
        ))}

        {draft.sections.length < MAX_SECTIONS && (
          <button
            type="button"
            onClick={addSection}
            style={{ width: "100%", padding: "8px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center" }}
          >
            + Add Section
          </button>
        )}
      </div>

      {/* Cancel / Apply */}
      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          disabled={!canApply}
          title={!canApply ? "Fill in body, button label, and at least one row title" : undefined}
          style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 8,
            background: canApply ? WA_GREEN : "#E2E8F0",
            color: canApply ? "#fff" : MUTED,
            fontSize: 13, fontWeight: 600,
            cursor: canApply ? "pointer" : "not-allowed",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx --watchAll=false
```

Expected: 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/ListMessageForm.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/ListMessageForm.test.jsx
git commit -m "feat: add ListMessageForm component for WhatsApp interactive list messages"
```

---

### Task 3: Wire `ListMessageForm` into `TemplateTab`

**Files:**
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx`
  - Add import for `ListMessageForm`
  - Add `editingListMessage` state
  - Add `isListMessage` flag
  - Add early-exit render path
  - Add configured summary card
- Create: `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx`

**Interfaces:**
- Consumes: `ListMessageForm` (default export from `./ListMessageForm`)
- Produces: `data.template = { isListMessage: true, id: "list_<timestamp>", ...draft }` via `patch()`

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx`:

```jsx
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
  it("shows ListMessageForm when templateStyle is list and no template", () => {
    renderPanel({ templateStyle: "list", template: null });
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
        body: "Pick a plan for your business",
        buttonText: "View plans",
        sections: [
          { title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] },
        ],
      },
    });
    expect(screen.getByText("List Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByText(/pick a plan/i)).toBeInTheDocument();
  });

  it("does NOT show the FBM template section when template is configured", () => {
    renderPanel({
      templateStyle: "list",
      template: {
        isListMessage: true,
        body: "Pick a plan",
        buttonText: "View",
        sections: [{ title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] }],
      },
    });
    expect(screen.queryByText(/open whatsapp manager/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+ create new/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select existing/i)).not.toBeInTheDocument();
  });

  it("re-opens ListMessageForm when Edit is clicked on the summary card", () => {
    renderPanel({
      templateStyle: "list",
      template: {
        isListMessage: true,
        body: "Pick a plan",
        buttonText: "View",
        sections: [{ title: "", rows: [{ id: "row_1", title: "Basic", description: "" }] }],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByText("Configure List Message")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx --watchAll=false
```

Expected: 4 tests FAIL — `Configure List Message` not found (FBM amber warning appears instead), summary card not found.

- [ ] **Step 3: Add import for `ListMessageForm` at the top of `WhatsAppRightPanel.jsx`**

After the existing `CollectInputForm` import (line 5):

```jsx
// Before:
import CollectInputForm from "./CollectInputForm";

// After:
import CollectInputForm from "./CollectInputForm";
import ListMessageForm from "./ListMessageForm";
```

- [ ] **Step 4: Add state and flags to `TemplateTab`**

In the `TemplateTab` function body, after `const [editingCollectInput, setEditingCollectInput] = useState(false);` (line ~561):

```jsx
// Add:
const [editingListMessage, setEditingListMessage] = useState(false);
```

After the existing `const isCollectInput = templateStyle === "collect_input";` line (line ~567):

```jsx
// Add:
const isListMessage = templateStyle === "list";
```

- [ ] **Step 5: Add the early-exit render path for list**

Insert this block immediately before the carousel early-exit (before `if (isCarousel && (!template || editingCarousel)) {`, line ~597):

```jsx
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
```

- [ ] **Step 6: Add the configured summary card for list, and suppress the FBM template section**

**6a — Summary card.** In the main return JSX, after the collect_input summary card block (after the closing `)}` of `{isCollectInput && template && (`, line ~710):

```jsx
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
```

**6b — Suppress the FBM template section.** The early-exit path in Step 5 handles `!template`. But when `isListMessage && template` is set, the main render is reached and its "Template" section (FBM edit UI: label, `+ Create New`, Select Existing, amber warning) would render below the summary card. Null it out.

Find the Template section's header row (around line 723):
```jsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
  <Label>Template</Label>
  {isStandard && (
    <button type="button" onClick={() => setCreatingNew(true)} ...>
      + Create New
    </button>
  )}
</div>
```

Wrap the entire `<div>` block that contains the Template label + its content in a guard:

```jsx
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
      /* existing CTAs block — unchanged */
    ) : isCarousel ? (
      /* existing carousel summary — unchanged */
    ) : (
      /* existing standard template summary — unchanged */
    )}
  </div>
)}
```

- [ ] **Step 7: Run tests to confirm they all pass**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx --watchAll=false
```

Expected: 4 tests PASS.

- [ ] **Step 8: Run the full WhatsApp node test suite to confirm no regressions**

```bash
npx craco test src/components/flows/builder/nodes/WhatsAppNode/ --watchAll=false
```

Expected: all existing tests PASS alongside the new ones.

- [ ] **Step 9: Commit**

```bash
git add src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx \
        src/components/flows/builder/nodes/WhatsAppNode/__tests__/TemplateTabListMessage.test.jsx
git commit -m "feat: wire ListMessageForm into TemplateTab — list style now uses session-based form, not FBM"
```
