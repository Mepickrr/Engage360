# Google Sheet Node — Modal Config + Sync Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Google Sheet node's 4 per-action configuration UIs (Add Row, Update Row, Get Row Data, Upsert Row) out of the inline right panel into a central modal, and add a mocked Submit/Sync flow for the shared Sheet URL/ID fields.

**Architecture:** `GoogleSheetRightPanel.jsx` becomes a thin shell (Sheet Connection section + action picker + a one-line summary card per configured action) that opens a new `GoogleSheetConfigModal.jsx` (Radix `Dialog`, same pattern as `ConditionalFilterModal.jsx`) for full per-action editing. The node-canvas preview line and the new panel summary card share one extracted utility function so there's no duplicated logic. Sync is a pure UI mock — a `setTimeout`-driven fake status transition with a fixed dummy column list, no network call.

**Tech Stack:** React (function components, inline `style` objects — matches this file's existing convention), `@/components/ui/dialog` (Radix), Jest + `@testing-library/react` (`fireEvent`, `jest.useFakeTimers`).

## Global Constraints

- No real Google Sheets API integration — Sync is fully mocked (spec §3).
- No field validation/required-field gating on the modal's Save button (spec §2).
- Action selection is never gated on Sheet URL submission — both are independent (spec, Out of scope).
- Dummy detected-columns list on a successful sync is exactly: `["Order ID", "Customer Name", "Phone Number", "Email", "Status", "Amount"]` (spec §3).
- Sync fake delay is ~1.2s via `setTimeout` (spec §3).
- Existing `data-testid` values already covered by tests (`gsheet-action-*`, `gsheet-sheet-url`, `gsheet-sheet-id`, `gsheet-addrow-*`, `gsheet-updaterow-*`, `gsheet-getrow-*`, `gsheet-upsertrow-*`, `gsheet-change-action`) must keep working — they migrate into the modal unchanged where the corresponding field moves there.

---

## File Map

- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/index.jsx` (use extracted summary util)
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/data/summary.js`
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js`
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js` (new defaults)
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetConfigModal.jsx`
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx`
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` (full rewrite of body)
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx` (full rewrite)

No changes needed in `ConfigTab.jsx`, `FlowBuilder.jsx`, or `FlowBuilderV2.jsx` — they already render `GoogleSheetRightPanel` generically and don't reference its internals.

---

### Task 1: Extract shared summary util

**Files:**
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/data/summary.js`
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js`
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/index.jsx:1-50`

**Interfaces:**
- Produces: `getGoogleSheetSummary(data: object): string | null` — exported from `data/summary.js`. Later tasks (the right-panel rewrite) import this to render the same one-line summary shown on the canvas node.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js`:

```js
import { getGoogleSheetSummary } from "../summary";

describe("getGoogleSheetSummary", () => {
  it("returns null when no action is set", () => {
    expect(getGoogleSheetSummary({})).toBeNull();
    expect(getGoogleSheetSummary(null)).toBeNull();
  });

  it("summarizes add_row with the sheet id or 'default'", () => {
    expect(getGoogleSheetSummary({ action: "add_row", sheetId: "" })).toBe("Row added to Sheet · default");
    expect(getGoogleSheetSummary({ action: "add_row", sheetId: "123" })).toBe("Row added to Sheet · 123");
  });

  it("summarizes update_row in search mode", () => {
    expect(getGoogleSheetSummary({
      action: "update_row",
      updateRow: { targetMode: "search", lookupColumn: "A", lookupField: "{{Order ID}}" },
    })).toBe("Row updated where A = {{Order ID}}");
  });

  it("summarizes update_row in row_number mode", () => {
    expect(getGoogleSheetSummary({
      action: "update_row",
      updateRow: { targetMode: "row_number", rowNumber: 5 },
    })).toBe("Row #5 updated");
  });

  it("summarizes get_row in search mode", () => {
    expect(getGoogleSheetSummary({
      action: "get_row",
      getRow: { targetMode: "search", lookupColumn: "B", lookupField: "{{email}}" },
    })).toBe("Row fetched where B = {{email}}");
  });

  it("summarizes get_row in row_number mode", () => {
    expect(getGoogleSheetSummary({
      action: "get_row",
      getRow: { targetMode: "row_number", rowNumber: 9 },
    })).toBe("Row #9 fetched");
  });

  it("summarizes upsert_row", () => {
    expect(getGoogleSheetSummary({
      action: "upsert_row",
      upsertRow: { lookupColumn: "B", lookupField: "{{email}}" },
    })).toBe("Row added or updated where B = {{email}}");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js --watchAll=false`
Expected: FAIL — `Cannot find module '../summary'`

- [ ] **Step 3: Create the implementation**

Create `src/components/flows/builder/nodes/GoogleSheetNode/data/summary.js`:

```js
export function getGoogleSheetSummary(data) {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js --watchAll=false`
Expected: PASS (7 tests)

- [ ] **Step 5: Wire `index.jsx` to use the extracted util**

In `src/components/flows/builder/nodes/GoogleSheetNode/index.jsx`, replace the import line:

```js
import { GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE } from "./data/mockData";
```

with:

```js
import { GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE } from "./data/mockData";
import { getGoogleSheetSummary } from "./data/summary";
```

Then delete the local `getPreviewLine` function (currently lines 29-50, the block starting `function getPreviewLine(data) {` and ending with its closing `}`), and change the call site inside `GoogleSheetNode`:

```js
  const previewLine  = getPreviewLine(data);
```

to:

```js
  const previewLine  = getGoogleSheetSummary(data);
```

- [ ] **Step 6: Run the existing node test to verify no regression**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetNode.test.jsx --watchAll=false`
Expected: PASS (5 tests, unchanged)

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/data/summary.js \
        src/components/flows/builder/nodes/GoogleSheetNode/data/__tests__/summary.test.js \
        src/components/flows/builder/nodes/GoogleSheetNode/index.jsx
git commit -m "refactor: extract Google Sheet node preview-line logic into shared summary util"
```

---

### Task 2: Add sync/connection defaults to mock data

**Files:**
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js`

**Interfaces:**
- Produces: `GOOGLE_SHEET_DUMMY_COLUMNS: string[]` and two new keys on `defaultGoogleSheetNodeData`: `sheetConnected: boolean` and `sync: { status: "idle"|"syncing"|"synced", lastSyncedAt: number|null, detectedColumns: string[] }`. Tasks 3-4 read these.

No new test file for this task — it's pure data with no behavior; Task 4's tests exercise these defaults directly.

- [ ] **Step 1: Add the dummy columns constant and new default fields**

In `src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js`, after the `COLUMN_LETTERS` export (currently line 12), add:

```js

export const GOOGLE_SHEET_DUMMY_COLUMNS = [
  "Order ID", "Customer Name", "Phone Number", "Email", "Status", "Amount",
];
```

Then, inside `defaultGoogleSheetNodeData`, right after the `sheetId: "",` line, add:

```js
  sheetConnected: false,

  sync: {
    status: "idle", // "idle" | "syncing" | "synced"
    lastSyncedAt: null,
    detectedColumns: [],
  },
```

- [ ] **Step 2: Sanity-check the module still loads correctly**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode --listTests --watchAll=false`
Expected: lists all existing Google Sheet node test files with no import errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js
git commit -m "feat: add sheet-connection and sync defaults to Google Sheet node data"
```

---

### Task 3: Create `GoogleSheetConfigModal.jsx`

**Files:**
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetConfigModal.jsx`
- Create: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx`

**Interfaces:**
- Consumes: `GOOGLE_SHEET_ACTIONS`, `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL`, `COLUMN_LETTERS`, `defaultGoogleSheetNodeData` from `./data/mockData` (all already defined, unchanged).
- Produces: default export `GoogleSheetConfigModal({ open, onClose, action, initialData, onSave })` where:
  - `action` is one of `"add_row" | "update_row" | "get_row" | "upsert_row"`.
  - `initialData` is the current sub-object for that action (e.g. `data.addRow`), or `undefined` to fall back to `defaultGoogleSheetNodeData[<key>]`.
  - `onSave(nextSubObject)` is called with the edited sub-object when Save is clicked; `onClose()` is called on Cancel or after Save.
  - Task 4 (the right panel) is the consumer of this component.

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetConfigModal from "../GoogleSheetConfigModal";
import { defaultGoogleSheetNodeData } from "../data/mockData";

const noop = () => {};

describe("GoogleSheetConfigModal", () => {
  it("renders nothing when closed", () => {
    render(<GoogleSheetConfigModal open={false} action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.queryByTestId("gsheet-config-modal")).not.toBeInTheDocument();
  });

  it("shows the action label as the modal title", () => {
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.getByText("Add Row")).toBeInTheDocument();
  });

  it("does not render Sheet URL or Sheet ID fields", () => {
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={noop} />);
    expect(screen.queryByTestId("gsheet-sheet-url")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gsheet-sheet-id")).not.toBeInTheDocument();
  });

  it("add_row: renders field list, adding a field updates local state, and Save commits it", () => {
    const onSave = jest.fn();
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={noop} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
    }));
  });

  it("add_row: Cancel discards local edits and calls onClose without onSave", () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(<GoogleSheetConfigModal open action="add_row" initialData={defaultGoogleSheetNodeData.addRow} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-cancel"));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("update_row: defaults to search mode with lookup fields, and switching to row_number swaps the input", () => {
    render(<GoogleSheetConfigModal open action="update_row" initialData={defaultGoogleSheetNodeData.updateRow} onClose={noop} onSave={noop} />);
    expect(screen.getByTestId("gsheet-updaterow-lookupcolumn")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gsheet-updaterow-targetmode-row_number"));
    expect(screen.getByTestId("gsheet-updaterow-rownumber")).toBeInTheDocument();
  });

  it("get_row: adding a column via the Id-mode picker appends it as a chip, Save commits the columns", () => {
    const onSave = jest.fn();
    render(<GoogleSheetConfigModal open action="get_row" initialData={defaultGoogleSheetNodeData.getRow} onClose={noop} onSave={onSave} />);
    fireEvent.click(screen.getByTestId("gsheet-getrow-column-add"));
    fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ columns: ["A"] }));
  });

  it("upsert_row: renders lookup fields and both read-only output variables", () => {
    render(<GoogleSheetConfigModal open action="upsert_row" initialData={defaultGoogleSheetNodeData.upsertRow} onClose={noop} onSave={noop} />);
    expect(screen.getByTestId("gsheet-upsertrow-lookupcolumn")).toBeInTheDocument();
    expect(screen.getByTestId("gsheet-upsertrow-rownumbervar")).toHaveValue("googleSheetUpsertRow1.rowNumber");
    expect(screen.getByTestId("gsheet-upsertrow-wasaddedvar")).toHaveValue("googleSheetUpsertRow1.wasAdded");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx --watchAll=false`
Expected: FAIL — `Cannot find module '../GoogleSheetConfigModal'`

- [ ] **Step 3: Create the implementation**

Create `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetConfigModal.jsx`:

```jsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  COLUMN_LETTERS, defaultGoogleSheetNodeData,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

const ACTION_KEY = {
  add_row: "addRow",
  update_row: "updateRow",
  get_row: "getRow",
  upsert_row: "upsertRow",
};

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
            onClick={() => { addColumn(pendingLetter); setPendingLetter("A"); }}
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

// ── Per-action field sets ──────────────────────────────────────────────────────
function AddRowFields({ value, onChange }) {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Column Identifier
        </div>
        <SegmentedToggle
          options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
          value={value?.columnIdMode ?? "id"}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-addrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to add</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.addRow.fields}
        columnIdMode={value?.columnIdMode ?? "id"}
        onChange={(fields) => onChange({ fields })}
        addTestId="gsheet-addrow-add-field"
        testIdPrefix="gsheet-addrow-field"
      />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Row number for this will be saved in
        </div>
        <input
          type="text"
          value={value?.rowNumberVar ?? defaultGoogleSheetNodeData.addRow.rowNumberVar}
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
  );
}

function UpdateRowFields({ value, onChange }) {
  const targetMode = value?.targetMode ?? "search";
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Target Row
        </div>
        <SegmentedToggle
          options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
          value={targetMode}
          onChange={(v) => onChange({ targetMode: v })}
          testIdPrefix="gsheet-updaterow-targetmode"
        />
      </div>
      {targetMode === "row_number" ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Row Number
          </div>
          <input
            type="number"
            value={value?.rowNumber ?? ""}
            onChange={(e) => onChange({ rowNumber: e.target.value ? Number(e.target.value) : null })}
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
            {columnIdMode === "id" ? (
              <select
                value={value?.lookupColumn ?? "A"}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
                data-testid="gsheet-updaterow-lookupcolumn"
                style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
              >
                {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value?.lookupColumn ?? ""}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
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
              value={value?.lookupField ?? ""}
              onChange={(e) => onChange({ lookupField: e.target.value })}
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
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-updaterow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to update</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.updateRow.fields}
        columnIdMode={columnIdMode}
        onChange={(fields) => onChange({ fields })}
        addTestId="gsheet-updaterow-add-field"
        testIdPrefix="gsheet-updaterow-field"
        columnLabel="Target Column"
        fieldLabel="Updated Field"
      />
      <TipsBox tips={[
        `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
      ]} />
    </>
  );
}

function GetRowFields({ value, onChange }) {
  const targetMode = value?.targetMode ?? "search";
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Target Row
        </div>
        <SegmentedToggle
          options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
          value={targetMode}
          onChange={(v) => onChange({ targetMode: v })}
          testIdPrefix="gsheet-getrow-targetmode"
        />
      </div>
      {targetMode === "row_number" ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Row Number
          </div>
          <input
            type="number"
            value={value?.rowNumber ?? ""}
            onChange={(e) => onChange({ rowNumber: e.target.value ? Number(e.target.value) : null })}
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
            {columnIdMode === "id" ? (
              <select
                value={value?.lookupColumn ?? "A"}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
                data-testid="gsheet-getrow-lookupcolumn"
                style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
              >
                {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value?.lookupColumn ?? ""}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
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
              value={value?.lookupField ?? ""}
              onChange={(e) => onChange({ lookupField: e.target.value })}
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
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-getrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Column(s) to save data from</div>
      <ColumnMultiSelect
        columnIdMode={columnIdMode}
        columns={value?.columns ?? []}
        onChange={(columns) => onChange({ columns })}
      />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Data from Column(s) will be saved in
        </div>
        <input
          type="text"
          value={value?.outputVarPrefix ?? defaultGoogleSheetNodeData.getRow.outputVarPrefix}
          onChange={(e) => onChange({ outputVarPrefix: e.target.value })}
          data-testid="gsheet-getrow-outputvar"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
      </div>
      <TipsBox tips={[
        `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
        "The data will be saved as variables under this name, with sub-names corresponding to each selected column.",
      ]} />
    </>
  );
}

function UpsertRowFields({ value, onChange }) {
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Lookup Column
          </div>
          {columnIdMode === "id" ? (
            <select
              value={value?.lookupColumn ?? "A"}
              onChange={(e) => onChange({ lookupColumn: e.target.value })}
              data-testid="gsheet-upsertrow-lookupcolumn"
              style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
            >
              {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={value?.lookupColumn ?? ""}
              onChange={(e) => onChange({ lookupColumn: e.target.value })}
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
            value={value?.lookupField ?? ""}
            onChange={(e) => onChange({ lookupField: e.target.value })}
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
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-upsertrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to write</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.upsertRow.fields}
        columnIdMode={columnIdMode}
        onChange={(fields) => onChange({ fields })}
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
            value={value?.rowNumberVar ?? defaultGoogleSheetNodeData.upsertRow.rowNumberVar}
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
            value={value?.wasAddedVar ?? defaultGoogleSheetNodeData.upsertRow.wasAddedVar}
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
  );
}

function ModalBody({ action, initialValue, onCancel, onSave }) {
  const [value, setValue] = useState(initialValue);
  const patch = (changes) => setValue((v) => ({ ...v, ...changes }));
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{actionMeta?.label ?? "Configure action"}</DialogTitle>
      </DialogHeader>
      <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 4 }}>
        {action === "add_row" && <AddRowFields value={value} onChange={patch} />}
        {action === "update_row" && <UpdateRowFields value={value} onChange={patch} />}
        {action === "get_row" && <GetRowFields value={value} onChange={patch} />}
        {action === "upsert_row" && <UpsertRowFields value={value} onChange={patch} />}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: `1px solid ${BORDER}`, marginTop: 16 }}>
        <button
          type="button"
          onClick={onCancel}
          data-testid="gsheet-config-modal-cancel"
          style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(value)}
          data-testid="gsheet-config-modal-save"
          style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 8, background: GOOGLE_SHEET_BLUE, color: "#fff", cursor: "pointer" }}
        >
          Save configuration
        </button>
      </div>
    </>
  );
}

export default function GoogleSheetConfigModal({ open, onClose, action, initialData, onSave }) {
  const actionKey = ACTION_KEY[action];
  const initialValue = initialData ?? defaultGoogleSheetNodeData[actionKey];

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="gsheet-config-modal" className="max-w-2xl">
        {open && (
          <ModalBody
            action={action}
            initialValue={initialValue}
            onCancel={onClose}
            onSave={(v) => { onSave(v); onClose(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx --watchAll=false`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetConfigModal.jsx \
        src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetConfigModal.test.jsx
git commit -m "feat: add GoogleSheetConfigModal for centralized per-action configuration"
```

---

### Task 4: Rewrite `GoogleSheetRightPanel.jsx` (connection section + summary card + modal wiring)

**Files:**
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` (full body rewrite)
- Modify: `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx` (full rewrite)

**Interfaces:**
- Consumes: `GoogleSheetConfigModal` (Task 3), `getGoogleSheetSummary` (Task 1), `GOOGLE_SHEET_DUMMY_COLUMNS` + `sheetConnected`/`sync` defaults (Task 2), `GOOGLE_SHEET_ACTIONS`, `GOOGLE_SHEET_BLUE`, `defaultGoogleSheetNodeData` from `./data/mockData`.
- Produces: same default export signature as before — `GoogleSheetRightPanel({ node, updateNodeData, removeNode })` — no change to how `ConfigTab.jsx` calls it.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx` with:

```jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import GoogleSheetRightPanel from "../GoogleSheetRightPanel";
import { defaultGoogleSheetNodeData, GOOGLE_SHEET_DUMMY_COLUMNS } from "../data/mockData";

const makeNode = (data = {}) => ({ id: "n1", data: { ...defaultGoogleSheetNodeData, ...data } });
const noop = () => {};

describe("GoogleSheetRightPanel", () => {
  describe("Sheet Connection section", () => {
    it("renders Sheet URL and Sheet ID fields regardless of action", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sheet-url")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-sheet-id")).toBeInTheDocument();
    });

    it("editing Sheet URL patches sheetUrl", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
      fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/abc" } });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" }));
    });

    it("Submit is disabled until a Sheet URL is entered", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-submit")).toBeDisabled();
    });

    it("clicking Submit with a URL present marks the sheet as connected", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-submit"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetConnected: true }));
    });

    it("shows a Connected badge once sheetConnected is true", () => {
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc", sheetConnected: true })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("editing the Sheet URL after being connected clears the Connected badge", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc", sheetConnected: true })} updateNodeData={update} removeNode={noop} />);
      fireEvent.change(screen.getByTestId("gsheet-sheet-url"), { target: { value: "https://docs.google.com/spreadsheets/d/xyz" } });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ sheetConnected: false }));
    });

    it("Sync is disabled until a Sheet URL is entered", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sync")).toBeDisabled();
    });

    it("clicking Sync goes syncing then synced with detected column chips", () => {
      jest.useFakeTimers();
      const update = jest.fn();
      const { rerender } = render(<GoogleSheetRightPanel node={makeNode({ sheetUrl: "https://docs.google.com/spreadsheets/d/abc" })} updateNodeData={update} removeNode={noop} />);

      fireEvent.click(screen.getByTestId("gsheet-sync"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        sync: expect.objectContaining({ status: "syncing" }),
      }));
      const syncingData = update.mock.calls[update.mock.calls.length - 1][1];
      rerender(<GoogleSheetRightPanel node={makeNode(syncingData)} updateNodeData={update} removeNode={noop} />);
      expect(screen.getByTestId("gsheet-sync")).toBeDisabled();

      act(() => { jest.advanceTimersByTime(1200); });
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        sync: expect.objectContaining({ status: "synced", detectedColumns: GOOGLE_SHEET_DUMMY_COLUMNS }),
      }));
      const syncedData = update.mock.calls[update.mock.calls.length - 1][1];
      rerender(<GoogleSheetRightPanel node={makeNode(syncedData)} updateNodeData={update} removeNode={noop} />);
      expect(screen.getByText("Last synced just now")).toBeInTheDocument();
      GOOGLE_SHEET_DUMMY_COLUMNS.forEach((col) => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("Action picker and summary card", () => {
    it("shows action picker when no action set", () => {
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Add Row")).toBeInTheDocument();
      expect(screen.getByText("Update Row")).toBeInTheDocument();
      expect(screen.getByText("Get Row Data")).toBeInTheDocument();
      expect(screen.getByText("Upsert Row")).toBeInTheDocument();
    });

    it("selecting an action calls updateNodeData with that action and opens the config modal", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-action-add_row"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "add_row" }));
      expect(screen.getByTestId("gsheet-config-modal")).toBeInTheDocument();
    });

    it("shows a summary card and change-action link once an action is set", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row", sheetId: "" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.getByText("Row added to Sheet · default")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-change-action")).toBeInTheDocument();
    });

    it("change-action resets action to null", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-change-action"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
    });

    it("clicking Edit configuration opens the modal for the current action", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "upsert_row", upsertRow: { ...defaultGoogleSheetNodeData.upsertRow, lookupColumn: "B", lookupField: "{{email}}" } })} updateNodeData={noop} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-edit-config"));
      expect(screen.getByTestId("gsheet-config-modal")).toBeInTheDocument();
      expect(screen.getByTestId("gsheet-upsertrow-lookupcolumn")).toHaveValue("B");
    });

    it("saving from the modal patches the action's sub-object on the node", () => {
      const update = jest.fn();
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={update} removeNode={noop} />);
      fireEvent.click(screen.getByTestId("gsheet-edit-config"));
      fireEvent.click(screen.getByTestId("gsheet-addrow-add-field"));
      fireEvent.click(screen.getByTestId("gsheet-config-modal-save"));
      expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({
        addRow: expect.objectContaining({
          fields: [{ column: "A", field: "" }, { column: "A", field: "" }],
        }),
      }));
    });

    it("does not render per-action fields inline in the panel", () => {
      render(<GoogleSheetRightPanel node={makeNode({ action: "add_row" })} updateNodeData={noop} removeNode={noop} />);
      expect(screen.queryByTestId("gsheet-addrow-add-field")).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx --watchAll=false`
Expected: FAIL — old panel doesn't have `gsheet-submit`, `gsheet-sync`, `gsheet-edit-config`, etc.

- [ ] **Step 3: Rewrite the implementation**

Replace the entire contents of `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx` with:

```jsx
import React, { useState, useRef, useEffect } from "react";
import { Table, CheckCircle2, Loader2 } from "lucide-react";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_DUMMY_COLUMNS, defaultGoogleSheetNodeData,
} from "./data/mockData";
import { getGoogleSheetSummary } from "./data/summary";
import GoogleSheetConfigModal from "./GoogleSheetConfigModal";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const GREEN  = "#16A34A";

const ACTION_KEY = {
  add_row: "addRow",
  update_row: "updateRow",
  get_row: "getRow",
  upsert_row: "upsertRow",
};

const SYNC_DELAY_MS = 1200;

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

// ── Sheet Connection section (URL / ID + Submit + Sync) ───────────────────────
function SheetConnectionSection({ sheetUrl, sheetId, sheetConnected, sync, onChange, onSubmit, onSync }) {
  const status = sync?.status ?? "idle";
  return (
    <div style={{ padding: 16, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>
              Sheet URL *
            </div>
            {sheetConnected && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: GREEN }}>
                <CheckCircle2 size={11} /> Connected
              </span>
            )}
          </div>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => onChange({ sheetUrl: e.target.value, ...(sheetConnected ? { sheetConnected: false } : {}) })}
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

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={!sheetUrl}
          onClick={onSubmit}
          data-testid="gsheet-submit"
          style={{
            flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 8, cursor: sheetUrl ? "pointer" : "not-allowed",
            background: sheetUrl ? GOOGLE_SHEET_BLUE : "#E2E8F0", color: sheetUrl ? "#fff" : "#94A3B8",
          }}
        >
          Submit
        </button>
        <button
          type="button"
          disabled={!sheetUrl || status === "syncing"}
          onClick={onSync}
          data-testid="gsheet-sync"
          style={{
            flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: (sheetUrl && status !== "syncing") ? "pointer" : "not-allowed",
            border: `1px solid ${sheetUrl ? GOOGLE_SHEET_BLUE : BORDER}`, background: "#fff",
            color: sheetUrl ? GOOGLE_SHEET_BLUE : "#94A3B8",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {status === "syncing" && <Loader2 size={12} className="animate-spin" />}
          {status === "syncing" ? "Syncing…" : "Sync"}
        </button>
      </div>

      {status === "synced" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: GREEN, fontWeight: 600, marginBottom: 6 }}>
            <CheckCircle2 size={12} /> Last synced just now
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(sync?.detectedColumns ?? []).map((col) => (
              <span key={col} style={{ background: "#F1F5F9", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151" }}>
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Configured-action summary card ────────────────────────────────────────────
function ActionSummaryCard({ actionMeta, summary, onEdit }) {
  return (
    <div style={{ padding: 16 }}>
      <div
        onClick={onEdit}
        data-testid="gsheet-edit-config"
        style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{actionMeta?.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: GOOGLE_SHEET_BLUE }}>Edit configuration</span>
        </div>
        {summary && (
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{summary}</div>
        )}
      </div>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function GoogleSheetRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const timeoutRef = useRef(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const [modalOpen, setModalOpen] = useState(false);
  // Mirrors data.action, but updated optimistically on selection so the modal
  // can open in the same render — updateNodeData may not feed a new `node`
  // prop back synchronously (e.g. in tests, or depending on store timing).
  const [activeAction, setActiveAction] = useState(data.action ?? null);
  useEffect(() => { setActiveAction(data.action ?? null); }, [data.action]);

  const action     = activeAction;
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);
  const actionKey  = ACTION_KEY[action];

  const resetAction = () => {
    patch({
      action: null,
      addRow:    { ...defaultGoogleSheetNodeData.addRow },
      updateRow: { ...defaultGoogleSheetNodeData.updateRow },
      getRow:    { ...defaultGoogleSheetNodeData.getRow },
      upsertRow: { ...defaultGoogleSheetNodeData.upsertRow },
    });
    setActiveAction(null);
  };

  const handleSelectAction = (a) => {
    patch({ action: a });
    setActiveAction(a);
    setModalOpen(true);
  };

  const handleSubmit = () => patch({ sheetConnected: true });

  const handleSync = () => {
    patch({ sync: { status: "syncing", lastSyncedAt: null, detectedColumns: [] } });
    timeoutRef.current = setTimeout(() => {
      patch({ sync: { status: "synced", lastSyncedAt: Date.now(), detectedColumns: GOOGLE_SHEET_DUMMY_COLUMNS } });
    }, SYNC_DELAY_MS);
  };

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
        <SheetConnectionSection
          sheetUrl={data.sheetUrl ?? ""}
          sheetId={data.sheetId ?? ""}
          sheetConnected={!!data.sheetConnected}
          sync={data.sync ?? defaultGoogleSheetNodeData.sync}
          onChange={patch}
          onSubmit={handleSubmit}
          onSync={handleSync}
        />

        {!action ? (
          <ActionPicker onSelect={handleSelectAction} />
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
            <ActionSummaryCard
              actionMeta={actionMeta}
              summary={getGoogleSheetSummary(data)}
              onEdit={() => setModalOpen(true)}
            />
          </>
        )}
      </div>

      <GoogleSheetConfigModal
        open={modalOpen && !!action}
        onClose={() => setModalOpen(false)}
        action={action}
        initialData={actionKey ? data[actionKey] : undefined}
        onSave={(nextSubObject) => patch({ [actionKey]: nextSubObject })}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx --watchAll=false`
Expected: PASS (all tests in the rewritten suite)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetRightPanel.jsx \
        src/components/flows/builder/nodes/GoogleSheetNode/__tests__/GoogleSheetRightPanel.test.jsx
git commit -m "feat: move Google Sheet action config into a modal, add mocked Submit/Sync"
```

---

### Task 5: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full Google Sheet node test directory**

Run: `CI=true npx craco test src/components/flows/builder/nodes/GoogleSheetNode --watchAll=false`
Expected: PASS — all suites (`GoogleSheetNode`, `GoogleSheetRightPanel`, `GoogleSheetConfigModal`, `data/summary`) green.

- [ ] **Step 2: Run the Start-Trigger Google Sheet test to confirm no cross-impact**

Run: `CI=true npx craco test src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx --watchAll=false`
Expected: PASS — unaffected, confirms this task didn't touch shared trigger code.

- [ ] **Step 3: Run the full test suite once to catch any other consumer of the old inline panel structure**

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS across the repo (or only pre-existing unrelated failures, if any — verify by checking `git stash` baseline if something new fails).

- [ ] **Step 4: Manual smoke check (both builders)**

Start the dev server and, in both `/flows` (FlowBuilder) and its V2 route, add a Google Sheet node, verify: the Sheet Connection section renders above the action picker, Submit toggles the Connected badge, Sync shows a spinner then detected-column chips, clicking each of the 4 actions opens the modal, editing + Save updates the summary card, Cancel discards edits.

- [ ] **Step 5: Commit (only if smoke check surfaced fixes)**

```bash
git add -A
git commit -m "fix: address issues found in Google Sheet node modal smoke test"
```

(Skip this step if the smoke check needed no code changes.)
