# Google Sheet Unified Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three unbuilt "Google Sheets" palette stubs (Add Row, Update Row, Get Row Data) with one unified **Google Sheet** node under Integrations — supporting Add Row, Update Row, Get Row Data, and Upsert Row via an inline action picker — available in both Flow Builder v1 and v2.

**Architecture:** Mirrors the existing Shopify unified node exactly: one palette entry → one canvas node component (`GoogleSheetNode/index.jsx`) → one right-panel component (`GoogleSheetRightPanel.jsx`) with an action-picker card grid at top, replaced by the selected action's fields below (no modal, auto-save on every change via `updateNodeData`). Wired into the shared `NodePalette.jsx`, `Canvas.jsx`, `flowMeta.js`, and `ConfigTab.jsx`, which both `FlowBuilder.jsx` (v1) and `FlowBuilderV2.jsx` (v2) already consume — v2 additionally needs one allow-list entry.

**Tech Stack:** React function components, inline `style` objects (matches existing node components — no CSS modules/Tailwind in this folder), Zustand store (`useFlowBuilderStore`) for node data via `updateNodeData`/`removeNode`, `lucide-react` icons, Jest + React Testing Library (`craco test`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-07-google-sheet-node-design.md` — every field, label, and behavior below must match it exactly.
- Service-account email used in all UI copy: `engagetechsupport@shiprocket.com` (never Bik's `googlesheet@bikayi-chat.iam.gserviceaccount.com`).
- No live Google Sheets API calls — UX/state only (per spec §8 Non-Goals).
- Node `type`/`kind` string: `"googlesheet"`.
- Test runner: `CI=true npx craco test --testPathPattern="<pattern>" --watchAll=false` (confirmed working in this repo).
- Existing seed/mock flow data contains no `addrow`/`updaterow`/`getrow` node instances — safe to delete the old category outright, no legacy-fallback rendering needed.

---

### Task 1: Data module — action list, defaults, service-account constant

**Files:**
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js`
- Test: none (pure data; exercised indirectly by Tasks 2–6)

**Interfaces:**
- Produces: `GOOGLE_SHEET_BLUE` (string hex), `GOOGLE_SHEET_ACTIONS` (array of `{id,label,desc}`), `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL` (string), `COLUMN_LETTERS` (array of 26 strings `"A"`..`"Z"`), `defaultGoogleSheetNodeData` (object, shape below) — all consumed by Tasks 2–7.

- [ ] **Step 1: Create the data file**

```js
// src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js
export const GOOGLE_SHEET_BLUE = "#378ADD";

export const GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL = "engagetechsupport@shiprocket.com";

export const GOOGLE_SHEET_ACTIONS = [
  { id: "add_row",    label: "Add Row",     desc: "Insert a new row into the sheet" },
  { id: "update_row", label: "Update Row",  desc: "Modify an existing row's data" },
  { id: "get_row",    label: "Get Row Data", desc: "Retrieve data from a row" },
  { id: "upsert_row", label: "Upsert Row",  desc: "Update a row if found, else add a new one" },
];

export const COLUMN_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export const defaultGoogleSheetNodeData = {
  action: null, // "add_row" | "update_row" | "get_row" | "upsert_row"

  sheetUrl: "",
  sheetId: "",

  addRow: {
    columnIdMode: "id", // "header" | "id"
    fields: [{ column: "A", field: "" }],
    rowNumberVar: "googleSheetAddRow1.rowNumber",
  },

  updateRow: {
    targetMode: "search", // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    fields: [{ column: "A", field: "" }],
  },

  getRow: {
    targetMode: "search", // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    columns: [],
    outputVarPrefix: "googleSheetGetRowData1",
  },

  upsertRow: {
    lookupColumn: "A",
    lookupField: "",
    columnIdMode: "id",
    fields: [{ column: "A", field: "" }],
    rowNumberVar: "googleSheetUpsertRow1.rowNumber",
    wasAddedVar: "googleSheetUpsertRow1.wasAdded",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js
git commit -m "feat: add Google Sheet node data module"
```

---

### Task 2: Canvas node (`index.jsx`)

**Files:**
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/index.jsx`
- Test: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetNode.test.jsx`

**Interfaces:**
- Consumes: `GOOGLE_SHEET_ACTIONS`, `GOOGLE_SHEET_BLUE` from `./data/mockData` (Task 1).
- Produces: default-export React component `GoogleSheetNode({ id, data, selected })`, rendering `data-testid="rf-google-sheet-node-{id}"`, two output handles `data-testid="handle-success"` / `data-testid="handle-failed"` — consumed by Task 7's `Canvas.jsx` registration.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetNode.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import GoogleSheetNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: "top", Right: "right" },
}));

const baseNode = { id: "n1", data: {} };

describe("GoogleSheetNode", () => {
  it("renders unconfigured state", () => {
    render(<GoogleSheetNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("rf-google-sheet-node-n1")).toBeInTheDocument();
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders configured state for add_row with preview line", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "add_row", sheetId: "" }} selected={false} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
    expect(screen.getByText('Row added to Sheet · default')).toBeInTheDocument();
  });

  it("renders configured state for update_row search mode", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "update_row", updateRow: { targetMode: "search", lookupColumn: "A", lookupField: "{{Order ID}}" } }} selected={false} />);
    expect(screen.getByText("Row updated where A = {{Order ID}}")).toBeInTheDocument();
  });

  it("renders configured state for upsert_row", () => {
    render(<GoogleSheetNode id="n1" data={{ action: "upsert_row", upsertRow: { lookupColumn: "B", lookupField: "{{email}}" } }} selected={false} />);
    expect(screen.getByText("Row added or updated where B = {{email}}")).toBeInTheDocument();
  });

  it("renders Success and Failed handles", () => {
    render(<GoogleSheetNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("handle-success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-failed")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetNode.test" --watchAll=false`
Expected: FAIL with "Cannot find module '../index'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/flows/builder/nodes/GoogleSheetNode/index.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { Table } from "lucide-react";
import { GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE } from "./data/mockData";

const GREEN  = "#16A34A";
const RED    = "#DC2626";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function OutputHandle({ id, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>{label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        style={{
          background: color, width: 10, height: 10,
          position: "relative", top: "auto", right: "auto",
          transform: "none", flexShrink: 0,
        }}
      />
    </div>
  );
}

function getPreviewLine(data) {
  const action = data?.action;
  if (!action) return null;
  if (action === "add_row") {
    return `Row added to Sheet · ${data?.sheetId || "default"}`;
  }
  if (action === "update_row") {
    const ur = data?.updateRow ?? {};
    if (ur.targetMode === "row_number") return `Row #${ur.rowNumber ?? "—"} updated`;
    return `Row updated where ${ur.lookupColumn || "—"} = ${ur.lookupField || "—"}`;
  }
  if (action === "get_row") {
    const gr = data?.getRow ?? {};
    if (gr.targetMode === "row_number") return `Row #${gr.rowNumber ?? "—"} fetched`;
    return `Row fetched where ${gr.lookupColumn || "—"} = ${gr.lookupField || "—"}`;
  }
  if (action === "upsert_row") {
    const ups = data?.upsertRow ?? {};
    return `Row added or updated where ${ups.lookupColumn || "—"} = ${ups.lookupField || "—"}`;
  }
  return null;
}

export default function GoogleSheetNode({ id, data, selected }) {
  const action       = data?.action ?? null;
  const isConfigured = !!action;
  const actionMeta   = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);
  const previewLine  = getPreviewLine(data);

  return (
    <div
      data-testid={`rf-google-sheet-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isConfigured ? "solid" : "dashed"} ${
          isConfigured ? GOOGLE_SHEET_BLUE : "rgba(55,138,221,0.4)"
        }`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(55,138,221,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: GOOGLE_SHEET_BLUE, width: 10, height: 10, top: -5 }}
      />

      {!isConfigured ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: GOOGLE_SHEET_BLUE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Table size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Google Sheet</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          <div style={{
            background: `linear-gradient(135deg, #2C6FB0 0%, ${GOOGLE_SHEET_BLUE} 100%)`,
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Table size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {actionMeta?.label ?? "Google Sheet"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Google Sheet
              </div>
            </div>
          </div>

          <div style={{
            padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 600, color: GOOGLE_SHEET_BLUE,
              background: "#EEF2FF", border: "1px solid #C7D8F5",
              borderRadius: 20, padding: "1px 7px",
            }}>
              {actionMeta?.label}
            </span>
          </div>

          {previewLine && (
            <div style={{
              padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
              background: "#F8FAFC",
            }}>
              <span style={{ fontSize: 10, color: "#475569" }}>{previewLine}</span>
            </div>
          )}
        </>
      )}

      <div style={{
        padding: "8px 10px 10px",
        display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end",
      }}>
        <OutputHandle id="success" label="Success" color={GREEN} />
        <OutputHandle id="failed"  label="Failed"  color={RED}   />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetNode.test" --watchAll=false`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/index.jsx src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetNode.test.jsx
git commit -m "feat: add Google Sheet canvas node component"
```

---

### Task 3: Right panel — action picker, common fields, Add Row

**Files:**
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx`
- Test: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx`

**Interfaces:**
- Consumes: everything from `./data/mockData` (Task 1).
- Produces: default-export `GoogleSheetRightPanel({ node, updateNodeData, removeNode })`; internal helper components `SegmentedToggle`, `FieldRowList`, `CommonSheetFields`, `TipsBox`, `ActionPicker` (not exported — private to this file, same convention as `ShopifyRightPanel.jsx`). These are extended in Tasks 4–6 within the same file.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetRightPanel from "../GoogleSheetRightPanel";
import { defaultGoogleSheetNodeData } from "../data/mockData";

const makeNode = (data = {}) => ({ id: "n1", data: { ...defaultGoogleSheetNodeData, ...data } });
const noop = () => {};

describe("GoogleSheetRightPanel", () => {
  it("shows action picker when no action set", () => {
    render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
    expect(screen.getByText("Update Row")).toBeInTheDocument();
    expect(screen.getByText("Get Row Data")).toBeInTheDocument();
    expect(screen.getByText("Upsert Row")).toBeInTheDocument();
  });

  it("selecting Add Row calls updateNodeData with that action", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-action-add_row"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "add_row" }));
  });

  it("shows change-action link once an action is set", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-change-action")).toBeInTheDocument();
  });

  it("change-action resets action to null", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-change-action"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
  });

  it("renders Sheet URL and Sheet ID fields for the selected action", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-sheet-url")).toBeInTheDocument();
    expect(screen.getByTestId("gsheet-sheet-id")).toBeInTheDocument();
  });

  it("editing Sheet URL patches sheetUrl", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/abc" } });
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" }));
  });

  it("clicking + Add Field appends a new field row for add_row", () => {
    const update = jest.fn();
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
      addRow: expect.objectContaining({
        fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
      }),
    }));
  });

  it("renders the read-only row-number output variable for add_row", () => {
    render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("gsheet-addrow-rownumbervar")).toHaveValue("googleSheetAddRow1.rowNumber");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: FAIL with "Cannot find module '../GoogleSheetRightPanel'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx
import React, { useState } from "react";
import { Table } from "lucide-react";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  COLUMN_LETTERS, defaultGoogleSheetNodeData,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Action picker ─────────────────────────────────────────────────────────────
function ActionPicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Select an action
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {GOOGLE_SHEET_ACTIONS.map(({ id, label, desc }) => {
          const highlight = hovered === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`gsheet-action-${id}`}
              style={{
                borderRadius: 8, padding: "10px 8px", textAlign: "center", cursor: "pointer",
                background: highlight ? "#EEF2FF" : "#fff",
                border: `${highlight ? 2 : 1.5}px solid ${highlight ? GOOGLE_SHEET_BLUE : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <Table size={18} color={GOOGLE_SHEET_BLUE} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Segmented toggle (Header/Id, RowNumber/Search) ────────────────────────────
function SegmentedToggle({ options, value, onChange, testIdPrefix }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            data-testid={`${testIdPrefix}-${opt.id}`}
            style={{
              flex: 1, padding: "7px 10px", fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: active ? "#EEF2FF" : "#fff",
              color: active ? GOOGLE_SHEET_BLUE : "#64748B",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Common Sheet URL / Sheet ID fields ────────────────────────────────────────
function CommonSheetFields({ sheetUrl, sheetId, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Sheet URL *
        </div>
        <input
          type="text"
          value={sheetUrl}
          onChange={(e) => onChange({ sheetUrl: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/1234..."
          data-testid="gsheet-sheet-url"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>The URL for the Google Sheet</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Sheet ID (Optional)
        </div>
        <input
          type="text"
          value={sheetId}
          onChange={(e) => onChange({ sheetId: e.target.value })}
          placeholder="123456"
          data-testid="gsheet-sheet-id"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>For multiple sheets in file, specify Sheet ID</div>
      </div>
    </div>
  );
}

// ── Repeatable Column/Field mapping list (Add Row, Update Row, Upsert Row) ────
function FieldRowList({ fields, columnIdMode, onChange, addTestId, testIdPrefix, columnLabel = "Column", fieldLabel = "Field" }) {
  const updateRow = (i, patch) => onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const addRow = () => onChange([...fields, { column: columnIdMode === "id" ? "A" : "", field: "" }]);
  const removeRow = (i) => onChange(fields.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>{columnLabel}</span>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>{fieldLabel}</span>
        <span style={{ width: 20 }} />
      </div>
      {fields.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
          {columnIdMode === "id" ? (
            <select
              value={row.column}
              onChange={(e) => updateRow(i, { column: e.target.value })}
              data-testid={`${testIdPrefix}-column-${i}`}
              style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
            >
              {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={row.column}
              onChange={(e) => updateRow(i, { column: e.target.value })}
              placeholder="Eg. Customer Name"
              data-testid={`${testIdPrefix}-column-${i}`}
              style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
            />
          )}
          <input
            type="text"
            value={row.field}
            onChange={(e) => updateRow(i, { field: e.target.value })}
            placeholder="Eg. {{Order ID}}"
            data-testid={`${testIdPrefix}-value-${i}`}
            style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
          />
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              data-testid={`${testIdPrefix}-remove-${i}`}
              style={{ width: 20, height: 20, border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        data-testid={addTestId}
        style={{ width: "100%", padding: "8px 0", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, color: MUTED, fontWeight: 600 }}
      >
        + Add Field
      </button>
    </div>
  );
}

// ── Static tips box ────────────────────────────────────────────────────────────
function TipsBox({ tips }) {
  return (
    <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", marginTop: 14 }}>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
        {tips.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function GoogleSheetRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const patchAddRow = (changes) => patch({ addRow: { ...(data.addRow ?? defaultGoogleSheetNodeData.addRow), ...changes } });

  const action     = data.action ?? null;
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);

  const resetAction = () => patch({
    action: null,
    addRow:    { ...defaultGoogleSheetNodeData.addRow },
    updateRow: { ...defaultGoogleSheetNodeData.updateRow },
    getRow:    { ...defaultGoogleSheetNodeData.getRow },
    upsertRow: { ...defaultGoogleSheetNodeData.upsertRow },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: GOOGLE_SHEET_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Table size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Google Sheet</div>
          {actionMeta && <div style={{ fontSize: 11, color: MUTED }}>{actionMeta.label}</div>}
        </div>
        {removeNode && (
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!action ? (
          <ActionPicker onSelect={(a) => patch({ action: a })} />
        ) : (
          <>
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={resetAction}
                data-testid="gsheet-change-action"
                style={{ fontSize: 11, color: GOOGLE_SHEET_BLUE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Change action
              </button>
            </div>

            <div style={{ padding: 16 }}>
              <CommonSheetFields sheetUrl={data.sheetUrl ?? ""} sheetId={data.sheetId ?? ""} onChange={patch} />

              {action === "add_row" && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.addRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchAddRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-addrow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to add</div>
                  <FieldRowList
                    fields={data.addRow?.fields ?? defaultGoogleSheetNodeData.addRow.fields}
                    columnIdMode={data.addRow?.columnIdMode ?? "id"}
                    onChange={(fields) => patchAddRow({ fields })}
                    addTestId="gsheet-addrow-add-field"
                    testIdPrefix="gsheet-addrow-field"
                  />
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Row number for this will be saved in
                    </div>
                    <input
                      type="text"
                      value={data.addRow?.rowNumberVar ?? defaultGoogleSheetNodeData.addRow.rowNumberVar}
                      readOnly
                      data-testid="gsheet-addrow-rownumbervar"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
                    />
                  </div>
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                    "Don't use special characters for value inputs.",
                    "Value input example – {{customer.name}}, {{Order.ID}}, ...",
                  ]} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
git commit -m "feat: add Google Sheet right panel with action picker and Add Row"
```

---

### Task 4: Right panel — Update Row section

**Files:**
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` (append `update_row` branch inside the action `<div style={{ padding: 16 }}>` block, right after the `add_row` branch's closing `)}`)
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx` (append new `describe` block)

**Interfaces:**
- Consumes: `SegmentedToggle`, `FieldRowList`, `TipsBox` from Task 3 (same file, no new exports needed).
- Produces: `update_row` action now renders Target Row toggle, Lookup Column/Field (search mode) or Row Number (row-number mode), Column Identifier toggle, Field(s) to update list.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx`, just before the final closing `});` of the `describe` block:

```jsx
  describe("update_row action", () => {
    it("defaults to Search for Row mode with lookup fields", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-updaterow-lookupcolumn")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-updaterow-lookupfield")).toBeInTheDocument();
    });

    it("switching to Specify Row Number shows a row-number input", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-updaterow-targetmode-row_number"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        updateRow: expect.objectContaining({ targetMode: "row_number" }),
      }));
    });

    it("renders row-number input when targetMode is row_number", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row", updateRow: { ...defaultGoogleSheetNodeData.updateRow, targetMode: "row_number" } })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-updaterow-rownumber")).toBeInTheDocument();
    });

    it("clicking + Add Field appends a second field row to update", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "update_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-updaterow-add-field"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        updateRow: expect.objectContaining({
          fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
        }),
      }));
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: FAIL — `gsheet-updaterow-lookupcolumn` etc. not found (update_row falls through to nothing rendered)

- [ ] **Step 3: Add the Update Row branch**

In `GoogleSheetRightPanel.jsx`, add a `patchUpdateRow` helper next to `patchAddRow`:

```jsx
  const patchUpdateRow = (changes) => patch({ updateRow: { ...(data.updateRow ?? defaultGoogleSheetNodeData.updateRow), ...changes } });
```

Then insert this block immediately after the `{action === "add_row" && ( ... )}` block (still inside `<div style={{ padding: 16 }}>`):

```jsx
              {action === "update_row" && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Target Row
                    </div>
                    <SegmentedToggle
                      options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
                      value={data.updateRow?.targetMode ?? "search"}
                      onChange={(v) => patchUpdateRow({ targetMode: v })}
                      testIdPrefix="gsheet-updaterow-targetmode"
                    />
                  </div>
                  {(data.updateRow?.targetMode ?? "search") === "row_number" ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Row Number
                      </div>
                      <input
                        type="number"
                        value={data.updateRow?.rowNumber ?? ""}
                        onChange={(e) => patchUpdateRow({ rowNumber: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Eg. 5"
                        data-testid="gsheet-updaterow-rownumber"
                        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Column
                        </div>
                        {(data.updateRow?.columnIdMode ?? "id") === "id" ? (
                          <select
                            value={data.updateRow?.lookupColumn ?? "A"}
                            onChange={(e) => patchUpdateRow({ lookupColumn: e.target.value })}
                            data-testid="gsheet-updaterow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
                          >
                            {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={data.updateRow?.lookupColumn ?? ""}
                            onChange={(e) => patchUpdateRow({ lookupColumn: e.target.value })}
                            placeholder="Eg. Order ID"
                            data-testid="gsheet-updaterow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Field
                        </div>
                        <input
                          type="text"
                          value={data.updateRow?.lookupField ?? ""}
                          onChange={(e) => patchUpdateRow({ lookupField: e.target.value })}
                          placeholder="Eg. {{Order ID}}"
                          data-testid="gsheet-updaterow-lookupfield"
                          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.updateRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchUpdateRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-updaterow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to update</div>
                  <FieldRowList
                    fields={data.updateRow?.fields ?? defaultGoogleSheetNodeData.updateRow.fields}
                    columnIdMode={data.updateRow?.columnIdMode ?? "id"}
                    onChange={(fields) => patchUpdateRow({ fields })}
                    addTestId="gsheet-updaterow-add-field"
                    testIdPrefix="gsheet-updaterow-field"
                    columnLabel="Target Column"
                    fieldLabel="Updated Field"
                  />
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                  ]} />
                </>
              )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: PASS, 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
git commit -m "feat: add Update Row section to Google Sheet right panel"
```

---

### Task 5: Right panel — Get Row Data section

**Files:**
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` (add `ColumnMultiSelect` helper + `get_row` branch, after the `update_row` branch)
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx`

**Interfaces:**
- Produces: new private helper `ColumnMultiSelect({ columnIdMode, columns, onChange })`; `get_row` action renders Target Row toggle, Lookup fields (search) or Row Number (row-number), Column Identifier toggle, Column(s) multi-select, output variable prefix input.

- [ ] **Step 1: Write the failing tests**

Append inside the top-level `describe("GoogleSheetRightPanel", ...)` block, after the `update_row` describe:

```jsx
  describe("get_row action", () => {
    it("renders lookup fields by default (search mode)", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "get_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-getrow-lookupcolumn")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-getrow-lookupfield")).toBeInTheDocument();
    });

    it("adding a column via the Id-mode picker appends it as a chip", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "get_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-getrow-column-add"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        getRow: expect.objectContaining({ columns: ["A"] }),
      }));
    });

    it("renders the output variable prefix input with its default value", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "get_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-getrow-outputvar")).toHaveValue("googleSheetGetRowData1");
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: FAIL — get_row testids not found

- [ ] **Step 3: Add `ColumnMultiSelect` and the Get Row Data branch**

Add this component in `GoogleSheetRightPanel.jsx`, right after `FieldRowList`:

```jsx
// ── Multi-select of columns (Get Row Data) ────────────────────────────────────
function ColumnMultiSelect({ columnIdMode, columns, onChange }) {
  const [pendingLetter, setPendingLetter] = useState("A");
  const [textInput, setTextInput] = useState("");

  const addColumn = (col) => {
    const c = col.trim();
    if (!c || columns.includes(c)) return;
    onChange([...columns, c]);
  };
  const removeColumn = (col) => onChange(columns.filter((c) => c !== col));

  return (
    <div>
      {columnIdMode === "id" ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select
            value={pendingLetter}
            onChange={(e) => setPendingLetter(e.target.value)}
            data-testid="gsheet-getrow-column-select"
            style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
          >
            {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            type="button"
            onClick={() => addColumn(pendingLetter)}
            data-testid="gsheet-getrow-column-add"
            style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, background: GOOGLE_SHEET_BLUE, color: "#fff", cursor: "pointer" }}
          >
            Add
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColumn(textInput); setTextInput(""); } }}
            placeholder="Eg. Customer Name"
            data-testid="gsheet-getrow-column-text"
            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
          />
        </div>
      )}
      {columns.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {columns.map((c) => (
            <span key={c} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151" }}>
              {c}
              <button type="button" onClick={() => removeColumn(c)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

Add a `patchGetRow` helper next to `patchUpdateRow`:

```jsx
  const patchGetRow = (changes) => patch({ getRow: { ...(data.getRow ?? defaultGoogleSheetNodeData.getRow), ...changes } });
```

Then insert this block after the `update_row` branch:

```jsx
              {action === "get_row" && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Target Row
                    </div>
                    <SegmentedToggle
                      options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
                      value={data.getRow?.targetMode ?? "search"}
                      onChange={(v) => patchGetRow({ targetMode: v })}
                      testIdPrefix="gsheet-getrow-targetmode"
                    />
                  </div>
                  {(data.getRow?.targetMode ?? "search") === "row_number" ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Row Number
                      </div>
                      <input
                        type="number"
                        value={data.getRow?.rowNumber ?? ""}
                        onChange={(e) => patchGetRow({ rowNumber: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Eg. 5"
                        data-testid="gsheet-getrow-rownumber"
                        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Column
                        </div>
                        {(data.getRow?.columnIdMode ?? "id") === "id" ? (
                          <select
                            value={data.getRow?.lookupColumn ?? "A"}
                            onChange={(e) => patchGetRow({ lookupColumn: e.target.value })}
                            data-testid="gsheet-getrow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
                          >
                            {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={data.getRow?.lookupColumn ?? ""}
                            onChange={(e) => patchGetRow({ lookupColumn: e.target.value })}
                            placeholder="Eg. Order ID"
                            data-testid="gsheet-getrow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Field
                        </div>
                        <input
                          type="text"
                          value={data.getRow?.lookupField ?? ""}
                          onChange={(e) => patchGetRow({ lookupField: e.target.value })}
                          placeholder="Eg. {{Order ID}}"
                          data-testid="gsheet-getrow-lookupfield"
                          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.getRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchGetRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-getrow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Column(s) to save data from</div>
                  <ColumnMultiSelect
                    columnIdMode={data.getRow?.columnIdMode ?? "id"}
                    columns={data.getRow?.columns ?? []}
                    onChange={(columns) => patchGetRow({ columns })}
                  />
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Data from Column(s) will be saved in
                    </div>
                    <input
                      type="text"
                      value={data.getRow?.outputVarPrefix ?? defaultGoogleSheetNodeData.getRow.outputVarPrefix}
                      onChange={(e) => patchGetRow({ outputVarPrefix: e.target.value })}
                      data-testid="gsheet-getrow-outputvar"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
                    />
                  </div>
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                    "The data will be saved as variables under this name, with sub-names corresponding to each selected column.",
                  ]} />
                </>
              )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: PASS, 15 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
git commit -m "feat: add Get Row Data section to Google Sheet right panel"
```

---

### Task 6: Right panel — Upsert Row section

**Files:**
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` (add `upsert_row` branch, after `get_row`)
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx`

**Interfaces:**
- Produces: `upsert_row` action renders Lookup Column/Field (always search — no row-number mode), Column Identifier toggle, shared Field(s) to write list, two read-only output variables (`rowNumberVar`, `wasAddedVar`).

- [ ] **Step 1: Write the failing tests**

Append inside the top-level describe, after the `get_row` describe:

```jsx
  describe("upsert_row action", () => {
    it("renders lookup fields and the shared field list", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "upsert_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-upsertrow-lookupcolumn")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-upsertrow-lookupfield")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-upsertrow-add-field")).toBeInTheDocument();
    });

    it("clicking + Add Field appends a second shared field row", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "upsert_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-upsertrow-add-field"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        upsertRow: expect.objectContaining({
          fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
        }),
      }));
    });

    it("renders both read-only output variables", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "upsert_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-upsertrow-rownumbervar")).toHaveValue("googleSheetUpsertRow1.rowNumber");
      expect(screen.getByTestId("gsheet-upsertrow-wasaddedvar")).toHaveValue("googleSheetUpsertRow1.wasAdded");
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: FAIL — upsert_row testids not found

- [ ] **Step 3: Add the Upsert Row branch**

Add a `patchUpsertRow` helper next to `patchGetRow`:

```jsx
  const patchUpsertRow = (changes) => patch({ upsertRow: { ...(data.upsertRow ?? defaultGoogleSheetNodeData.upsertRow), ...changes } });
```

Then insert this block after the `get_row` branch (still inside the same `<div style={{ padding: 16 }}>`):

```jsx
              {action === "upsert_row" && (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Lookup Column
                      </div>
                      {(data.upsertRow?.columnIdMode ?? "id") === "id" ? (
                        <select
                          value={data.upsertRow?.lookupColumn ?? "A"}
                          onChange={(e) => patchUpsertRow({ lookupColumn: e.target.value })}
                          data-testid="gsheet-upsertrow-lookupcolumn"
                          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
                        >
                          {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={data.upsertRow?.lookupColumn ?? ""}
                          onChange={(e) => patchUpsertRow({ lookupColumn: e.target.value })}
                          placeholder="Eg. Order ID"
                          data-testid="gsheet-upsertrow-lookupcolumn"
                          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Lookup Field
                      </div>
                      <input
                        type="text"
                        value={data.upsertRow?.lookupField ?? ""}
                        onChange={(e) => patchUpsertRow({ lookupField: e.target.value })}
                        placeholder="Eg. {{Order ID}}"
                        data-testid="gsheet-upsertrow-lookupfield"
                        style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.upsertRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchUpsertRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-upsertrow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to write</div>
                  <FieldRowList
                    fields={data.upsertRow?.fields ?? defaultGoogleSheetNodeData.upsertRow.fields}
                    columnIdMode={data.upsertRow?.columnIdMode ?? "id"}
                    onChange={(fields) => patchUpsertRow({ fields })}
                    addTestId="gsheet-upsertrow-add-field"
                    testIdPrefix="gsheet-upsertrow-field"
                  />
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Row number for this will be saved in
                      </div>
                      <input
                        type="text"
                        value={data.upsertRow?.rowNumberVar ?? defaultGoogleSheetNodeData.upsertRow.rowNumberVar}
                        readOnly
                        data-testid="gsheet-upsertrow-rownumbervar"
                        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Whether a new row was added
                      </div>
                      <input
                        type="text"
                        value={data.upsertRow?.wasAddedVar ?? defaultGoogleSheetNodeData.upsertRow.wasAddedVar}
                        readOnly
                        data-testid="gsheet-upsertrow-wasaddedvar"
                        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                    "If no row matches the lookup value, a new row is appended with the field(s) above.",
                    "Don't use special characters for value inputs.",
                  ]} />
                </>
              )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="GoogleSheetRightPanel.test" --watchAll=false`
Expected: PASS, 18 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
git commit -m "feat: add Upsert Row section to Google Sheet right panel"
```

---

### Task 7: Wire the node into both Flow Builders; remove old stub nodes

**Files:**
- Modify: `src/components/flows/builder/NodePalette.jsx` (`integrations` and `gsheets` category blocks — match by content shown below, not line number, since other edits may have shifted line numbers by the time this task runs)
- Modify: `src/pages/FlowBuilderV2.jsx` (`V2_ALLOWED_NODES` Integrations line)
- Modify: `src/components/flows/builder/Canvas.jsx` (imports + `nodeTypes` map)
- Modify: `src/lib/flowMeta.js` (import + `defaultDataForPaletteItem` + `rendererTypeForKind`)
- Modify: `src/components/flows/builder/panels/ConfigTab.jsx` (import + routing block)
- Modify: `src/components/flows/builder/__tests__/NodePalette.test.jsx`

**Interfaces:**
- Consumes: `GoogleSheetNode` (Task 2), `GoogleSheetRightPanel` (Tasks 3–6), `defaultGoogleSheetNodeData` (Task 1).

- [ ] **Step 1: Write the failing NodePalette tests**

Append to `src/components/flows/builder/__tests__/NodePalette.test.jsx`, inside the existing `describe` block:

```jsx
  it("does not render the old Google Sheets category or its Add Row/Update Row/Get Row Data items", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.queryByText("Google Sheets")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Row")).not.toBeInTheDocument();
    expect(screen.queryByText("Update Row")).not.toBeInTheDocument();
    expect(screen.queryByText("Get Row Data")).not.toBeInTheDocument();
  });

  it("renders a single Google Sheet entry under Integrations", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.getByText("Google Sheet")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="NodePalette.test" --watchAll=false`
Expected: FAIL — "Google Sheets" (old category label) still present; "Google Sheet" (new entry) not found

- [ ] **Step 3: Update `NodePalette.jsx`**

Find the `integrations` category and replace its `nodes` array to add the new entry:

```jsx
  {
    id: "integrations", label: "Integrations", Icon: Plug, color: "blue",
    nodes: [
      { id:"judgeme",     name:"Judge Me",     Icon:Star,         kind:"judgeme",     subtype:null  },
      { id:"shopify",     name:"Shopify",      Icon:ShoppingCart, kind:"shopify",     subtype:null  },
      { id:"razorpay",    name:"Razor Pay",    Icon:CreditCard,   kind:"razorpay",    subtype:null  },
      { id:"freshdesk",   name:"Freshdesk",    Icon:Headphones,   kind:"action",      subtype:"freshdesk" },
      { id:"webhook",     name:"Webhook",      Icon:Webhook,      kind:"webhook",     subtype:null  },
      { id:"googlesheet", name:"Google Sheet", Icon:Table,        kind:"googlesheet", subtype:null  },
    ],
  },
```

Then find and delete the entire `gsheets` category block (it appears later in the same `CATEGORIES` array, after `flowcontrol`):

```jsx
  {
    id: "gsheets", label: "Google Sheets", Icon: Table, color: "green",
    nodes: [
      { id:"addrow",    name:"Add Row",      Icon:CirclePlus,      kind:"action", subtype:"addrow"    },
      { id:"updaterow", name:"Update Row",   Icon:Pencil,          kind:"action", subtype:"updaterow" },
      { id:"getrow",    name:"Get Row Data", Icon:ArrowUpFromLine, kind:"action", subtype:"getrow"    },
    ],
  },
```

The `Table` icon import already exists at the top of the file and is now used by the new `googlesheet` entry instead of the deleted category, so no import changes are needed for it. `CirclePlus`, `Pencil`, and `ArrowUpFromLine` are used nowhere else in this file once the `gsheets` category is deleted — remove all three from the `lucide-react` import list at the top (currently: `Table, CirclePlus, Pencil, ArrowUpFromLine,`), leaving just `Table,` in their place.

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="NodePalette.test" --watchAll=false`
Expected: PASS, 4 tests

- [ ] **Step 5: Update `FlowBuilderV2.jsx` allow-list**

In `src/pages/FlowBuilderV2.jsx`, change:

```jsx
  // Integrations (shopify added, old separate nodes removed)
  "webhook", "judgeme", "razorpay", "shopify",
```

to:

```jsx
  // Integrations (shopify + googlesheet added, old separate nodes removed)
  "webhook", "judgeme", "razorpay", "shopify", "googlesheet",
```

- [ ] **Step 6: Register the node type in `Canvas.jsx`**

Add the import next to the other node imports (after `import ShopifyNode from "./nodes/ShopifyNode";`):

```jsx
import GoogleSheetNode from "./nodes/GoogleSheetNode";
```

Add the entry to the `nodeTypes` map (after `shopify: ShopifyNode,`):

```jsx
  googlesheet:     GoogleSheetNode,
```

- [ ] **Step 7: Register default data and renderer type in `flowMeta.js`**

Add the import next to `import { defaultShopifyNodeData } from "@/components/flows/builder/nodes/ShopifyNode/data/mockData";`:

```js
import { defaultGoogleSheetNodeData } from "@/components/flows/builder/nodes/GoogleSheetNode/data/mockData";
```

Add a case to `defaultDataForPaletteItem` (after the `case "shopify":` block):

```js
    case "googlesheet":
      return { ...defaultGoogleSheetNodeData };
```

Add a line to `rendererTypeForKind` (after `if (kind === "shopify") return "shopify";`):

```js
  if (kind === "googlesheet") return "googlesheet";
```

- [ ] **Step 8: Route the right panel in `ConfigTab.jsx`**

Add the import next to `import ShopifyRightPanel from "@/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel";`:

```jsx
import GoogleSheetRightPanel from "@/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel";
```

Add a routing block right after the `if (node?.type === "shopify") { ... }` block:

```jsx
  if (node?.type === "googlesheet") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <GoogleSheetRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
      </div>
    );
  }
```

- [ ] **Step 9: Run the full test suite**

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — all test suites green, no regressions (including the pre-existing `ShopifyNode`, `ShopifyRightPanel`, and other node suites)

- [ ] **Step 10: Commit**

```bash
git add src/components/flows/builder/NodePalette.jsx src/components/flows/builder/__tests__/NodePalette.test.jsx src/pages/FlowBuilderV2.jsx src/components/flows/builder/Canvas.jsx src/lib/flowMeta.js src/components/flows/builder/panels/ConfigTab.jsx
git commit -m "feat: wire Google Sheet node into Flow Builder v1 and v2, remove old stub nodes"
```

---

## Post-Plan Verification

After Task 7, manually smoke-test in the browser (both builders use the same shared files, so one check per builder is enough):

1. Start the dev server (`npm start`), open a v1 flow in Flow Builder and a v2 flow in Flow Builder v2.
2. In each, open the Integrations category in the left palette — confirm "Google Sheet" appears once, and there is no separate "Google Sheets" category with Add Row/Update Row/Get Row Data.
3. Drag a Google Sheet node onto the canvas in each builder. Confirm the unconfigured "Click to configure" state renders.
4. Click the node; in the right panel, pick each of the 4 actions in turn and confirm the fields described in the spec render, "+ Add Field" adds rows, and the "← Change action" link resets back to the picker.
5. Confirm the canvas node's header/preview line updates as fields are filled in for each action.
