# Google Sheet Data Entry Start Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new frontend-only start-trigger kind, `google_sheet_new_row`, labeled "Google Sheet Data Entry" in the trigger picker, available identically in both Flow Builder v1 and Flow Builder v2 (they share the same wizard component).

**Architecture:** A new Step1 content component (`GoogleSheetTriggerStep1.jsx`) plugs into the existing `StartTriggerWizard.jsx` state machine the same way `WebhookTriggerStep1.jsx` does. A new catalogue entry makes it pickable. `triggerNodeUtils.js` gets a new summariser so the canvas node (`StartTriggerNode.jsx`) can render it. No backend, no live Google Sheets API calls — matches the existing Google Sheet action node's frontend-only convention.

**Tech Stack:** React, Tailwind CSS (trigger folder convention — not the inline-style convention used in `nodes/GoogleSheetNode/`), Jest + React Testing Library.

## Global Constraints

- Frontend-only. No live Google Sheets API calls, no "Verify access" backend call, no scheduler/poller. This is UX and data-shape only, matching the non-goals already established for the Google Sheet action node (`docs/superpowers/specs/2026-07-07-google-sheet-node-design.md` §8).
- Trigger kind identifier: `google_sheet_new_row`.
- Seller-facing label: **"Google Sheet Data Entry"**, placed under the existing **"Webhook and API"** catalogue header, **"External signals"** section (alongside "Webhook trigger").
- Reuse `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL` and `COLUMN_LETTERS` from `src/components/flows/builder/nodes/GoogleSheetNode/data/mockData.js` — do not redefine these constants.
- Step 2 ("Who will enter the flow") is skipped for this trigger kind — set `audience_qualification_allow: false` on the catalogue entry so the existing `skipStep2` logic in `StartTriggerWizard.jsx` handles this automatically. Contact resolution happens via a "contact identifier column" field in Step 1 instead.
- No backend/server-side work of any kind in this plan.
- Both Flow Builder v1 and v2 render `StartTriggerWizard` directly with no trigger-kind allow-list (confirmed: `FlowBuilderV2.jsx` imports the same `StartTriggerWizard` from `@/components/flows/builder/trigger/StartTriggerWizard` and passes no kind-filtering prop) — so no v2-specific code changes are needed, only verification.

---

### Task 1: Google Sheet trigger pure helpers

**Files:**
- Create: `src/components/flows/builder/trigger/googleSheetTriggerHelpers.js`
- Test: `src/components/flows/builder/trigger/__tests__/googleSheetTriggerHelpers.test.js`

**Interfaces:**
- Produces: `COLUMN_LETTERS` (re-exported), `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL` (re-exported), `POLL_INTERVAL_OPTIONS: Array<{value: number, label: string}>`, `emptyGoogleSheetTriggerConfig(): object`, `simulateSampleRow(config): {success: boolean, variableCount: number, resolvedContactValue: string|null, error: string|null}` — all consumed by Task 2 and Task 4.

- [ ] **Step 1: Write the failing test**

```js
// src/components/flows/builder/trigger/__tests__/googleSheetTriggerHelpers.test.js
import {
  emptyGoogleSheetTriggerConfig,
  simulateSampleRow,
  POLL_INTERVAL_OPTIONS,
  COLUMN_LETTERS,
  GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
} from "../googleSheetTriggerHelpers";

describe("emptyGoogleSheetTriggerConfig", () => {
  it("returns sensible defaults", () => {
    const cfg = emptyGoogleSheetTriggerConfig();
    expect(cfg.sheetUrl).toBe("");
    expect(cfg.sheetId).toBe("");
    expect(cfg.columnIdMode).toBe("id");
    expect(cfg.columns).toEqual([]);
    expect(cfg.contactIdentifierColumn).toBe("");
    expect(cfg.pollIntervalMinutes).toBe(5);
    expect(cfg.sampleValues).toEqual({});
  });
});

describe("re-exported constants", () => {
  it("exposes 26 column letters and the shared service account email", () => {
    expect(COLUMN_LETTERS).toHaveLength(26);
    expect(COLUMN_LETTERS[0]).toBe("A");
    expect(GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL).toBe("engagetechsupport@shiprocket.com");
  });

  it("offers five poll interval options from 1 to 60 minutes", () => {
    expect(POLL_INTERVAL_OPTIONS.map((o) => o.value)).toEqual([1, 5, 15, 30, 60]);
  });
});

describe("simulateSampleRow", () => {
  it("errors when there are no captured columns", () => {
    const result = simulateSampleRow(emptyGoogleSheetTriggerConfig());
    expect(result).toEqual({
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Add at least one column before simulating.",
    });
  });

  it("errors when columns exist but no sample values were entered", () => {
    const cfg = { ...emptyGoogleSheetTriggerConfig(), columns: ["Phone", "Order ID"] };
    const result = simulateSampleRow(cfg);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Enter at least one sample value to simulate a row.");
  });

  it("succeeds and resolves the contact value when the identifier column has a sample value", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      columns: ["Phone", "Order ID"],
      contactIdentifierColumn: "Phone",
      sampleValues: { Phone: "+919999999999", "Order ID": "" },
    };
    const result = simulateSampleRow(cfg);
    expect(result).toEqual({
      success: true,
      variableCount: 1,
      resolvedContactValue: "+919999999999",
      error: null,
    });
  });

  it("succeeds with null resolvedContactValue when no identifier column is set", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      columns: ["Order ID"],
      sampleValues: { "Order ID": "555" },
    };
    const result = simulateSampleRow(cfg);
    expect(result.success).toBe(true);
    expect(result.resolvedContactValue).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/flows/builder/trigger/__tests__/googleSheetTriggerHelpers.test.js`
Expected: FAIL with "Cannot find module '../googleSheetTriggerHelpers'"

- [ ] **Step 3: Write the implementation**

```js
// src/components/flows/builder/trigger/googleSheetTriggerHelpers.js
// Pure, framework-free helpers for the Google Sheet Data Entry Start Trigger.
// No React dependencies — independently testable.

import { COLUMN_LETTERS, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL } from "../nodes/GoogleSheetNode/data/mockData";

export { COLUMN_LETTERS, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL };

export const POLL_INTERVAL_OPTIONS = [
  { value: 1, label: "Every 1 minute" },
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every 60 minutes" },
];

export function emptyGoogleSheetTriggerConfig() {
  return {
    sheetUrl: "",
    sheetId: "",
    columnIdMode: "id", // "header" | "id"
    columns: [],
    contactIdentifierColumn: "",
    pollIntervalMinutes: 5,
    sampleValues: {},
  };
}

// Simulates what a triggered run would look like from manually-entered sample
// values, since there is no live Sheets API connection to pull a real row from.
export function simulateSampleRow(config) {
  const columns = config?.columns || [];
  const sampleValues = config?.sampleValues || {};
  const contactIdentifierColumn = config?.contactIdentifierColumn || "";

  if (columns.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Add at least one column before simulating.",
    };
  }
  const filled = columns.filter((c) => (sampleValues[c] || "").trim());
  if (filled.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Enter at least one sample value to simulate a row.",
    };
  }
  const resolvedContactValue = contactIdentifierColumn
    ? sampleValues[contactIdentifierColumn] || null
    : null;
  return { success: true, variableCount: filled.length, resolvedContactValue, error: null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/flows/builder/trigger/__tests__/googleSheetTriggerHelpers.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/googleSheetTriggerHelpers.js src/components/flows/builder/trigger/__tests__/googleSheetTriggerHelpers.test.js
git commit -m "feat: add pure helpers for Google Sheet Data Entry start trigger"
```

---

### Task 2: Google Sheet trigger Step 1 UI component

**Files:**
- Create: `src/components/flows/builder/trigger/GoogleSheetTriggerStep1.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/GoogleSheetTriggerStep1.test.jsx`

**Interfaces:**
- Consumes: `emptyGoogleSheetTriggerConfig`, `simulateSampleRow`, `COLUMN_LETTERS`, `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL`, `POLL_INTERVAL_OPTIONS` from Task 1's `googleSheetTriggerHelpers.js`.
- Produces: default export `GoogleSheetTriggerStep1({ config, setConfig })` and named export `isGoogleSheetStep1Valid(config): boolean` — both consumed by Task 4 (`StartTriggerWizard.jsx`).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/trigger/__tests__/GoogleSheetTriggerStep1.test.jsx
import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleSheetTriggerStep1, { isGoogleSheetStep1Valid } from "../GoogleSheetTriggerStep1";
import { emptyGoogleSheetTriggerConfig } from "../googleSheetTriggerHelpers";

function Harness({ initial }) {
  const [config, setConfig] = useState(initial || emptyGoogleSheetTriggerConfig());
  return <GoogleSheetTriggerStep1 config={config} setConfig={setConfig} />;
}

describe("GoogleSheetTriggerStep1", () => {
  it("updates the sheet URL and sheet ID fields", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), {
      target: { value: "https://docs.google.com/spreadsheets/d/abc" },
    });
    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-id"), { target: { value: "999" } });
    expect(screen.getByTestId("gsheet-trigger-sheet-url")).toHaveValue("https://docs.google.com/spreadsheets/d/abc");
    expect(screen.getByTestId("gsheet-trigger-sheet-id")).toHaveValue("999");
  });

  it("adds columns by letter in Id mode and removes them", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "B" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    expect(screen.getByTestId("gsheet-trigger-column-chips")).toHaveTextContent("B");
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-remove-B"));
    expect(screen.queryByTestId("gsheet-trigger-column-chips")).not.toBeInTheDocument();
  });

  it("adds columns by typed header text in Header mode", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("gsheet-trigger-colmode-header"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-text"), { target: { value: "Customer Name" } });
    fireEvent.keyDown(screen.getByTestId("gsheet-trigger-column-text"), { key: "Enter" });
    expect(screen.getByTestId("gsheet-trigger-column-chips")).toHaveTextContent("Customer Name");
  });

  it("clears columns and contact identifier when switching column identifier mode", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-colmode-header"));
    expect(screen.queryByTestId("gsheet-trigger-column-chips")).not.toBeInTheDocument();
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("");
  });

  it("lets the seller pick a contact identifier column from the captured columns", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    expect(screen.getByTestId("gsheet-trigger-contact-column")).toHaveValue("A");
  });

  it("defaults the poll interval to 5 minutes and allows changing it", () => {
    render(<Harness />);
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("5");
    fireEvent.change(screen.getByTestId("gsheet-trigger-poll-interval"), { target: { value: "15" } });
    expect(screen.getByTestId("gsheet-trigger-poll-interval")).toHaveValue("15");
  });

  it("simulates a new row from sample values and shows the resolved contact value", () => {
    render(<Harness />);
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-sample-A"), { target: { value: "+919999999999" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-simulate-btn"));
    expect(screen.getByTestId("gsheet-trigger-simulate-result")).toHaveTextContent("Contact resolved to +919999999999");
  });

  it("shows the shared service-account tip and baseline notice", () => {
    render(<Harness />);
    expect(screen.getByText(/engagetechsupport@shiprocket.com/)).toBeInTheDocument();
    expect(screen.getByText(/Only rows added after you save this trigger/)).toBeInTheDocument();
  });
});

describe("isGoogleSheetStep1Valid", () => {
  it("is false with no sheet URL, columns, or contact column", () => {
    expect(isGoogleSheetStep1Valid(emptyGoogleSheetTriggerConfig())).toBe(false);
  });

  it("is false with a sheet URL and columns but no contact identifier column", () => {
    const cfg = { ...emptyGoogleSheetTriggerConfig(), sheetUrl: "https://x", columns: ["A"] };
    expect(isGoogleSheetStep1Valid(cfg)).toBe(false);
  });

  it("is true once sheet URL, at least one column, and a contact identifier column are set", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      sheetUrl: "https://x",
      columns: ["A"],
      contactIdentifierColumn: "A",
    };
    expect(isGoogleSheetStep1Valid(cfg)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/flows/builder/trigger/__tests__/GoogleSheetTriggerStep1.test.jsx`
Expected: FAIL with "Cannot find module '../GoogleSheetTriggerStep1'"

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/flows/builder/trigger/GoogleSheetTriggerStep1.jsx
import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  COLUMN_LETTERS,
  GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  POLL_INTERVAL_OPTIONS,
  simulateSampleRow,
} from "./googleSheetTriggerHelpers";

export function isGoogleSheetStep1Valid(config) {
  return (
    !!config?.sheetUrl?.trim() &&
    (config?.columns?.length || 0) > 0 &&
    !!config?.contactIdentifierColumn
  );
}

export default function GoogleSheetTriggerStep1({ config, setConfig }) {
  const [pendingLetter, setPendingLetter] = useState("A");
  const [textInput, setTextInput] = useState("");
  const [simResult, setSimResult] = useState(null);

  const update = (patch) => setConfig({ ...config, ...patch });
  const columns = config.columns || [];

  const addColumn = (col) => {
    const c = col.trim();
    if (!c || columns.includes(c)) return;
    update({ columns: [...columns, c] });
  };

  const removeColumn = (col) => {
    const nextColumns = columns.filter((c) => c !== col);
    const patch = { columns: nextColumns };
    if (config.contactIdentifierColumn === col) patch.contactIdentifierColumn = "";
    if (config.sampleValues?.[col] !== undefined) {
      const nextSampleValues = { ...config.sampleValues };
      delete nextSampleValues[col];
      patch.sampleValues = nextSampleValues;
    }
    update(patch);
  };

  const setColumnIdMode = (mode) =>
    update({ columnIdMode: mode, columns: [], contactIdentifierColumn: "", sampleValues: {} });

  const setSampleValue = (col, value) => {
    setSimResult(null);
    update({ sampleValues: { ...(config.sampleValues || {}), [col]: value } });
  };

  const handleSimulate = () => setSimResult(simulateSampleRow(config));

  return (
    <div className="space-y-6" data-testid="google-sheet-step1">
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Sheet URL *</div>
        <input
          type="text"
          value={config.sheetUrl}
          onChange={(e) => update({ sheetUrl: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/1234..."
          data-testid="gsheet-trigger-sheet-url"
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        <div className="mt-1 text-xs text-text-muted">The URL for the Google Sheet</div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Sheet ID (Optional)</div>
        <input
          type="text"
          value={config.sheetId}
          onChange={(e) => update({ sheetId: e.target.value })}
          placeholder="123456"
          data-testid="gsheet-trigger-sheet-id"
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        <div className="mt-1 text-xs text-text-muted">For multiple sheets in file, specify Sheet ID</div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Column Identifier</div>
        <div className="flex border border-border rounded-md overflow-hidden w-48">
          {[{ id: "header", label: "Header" }, { id: "id", label: "Id" }].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setColumnIdMode(opt.id)}
              data-testid={`gsheet-trigger-colmode-${opt.id}`}
              className={`flex-1 px-3 py-1.5 text-sm font-medium ${
                config.columnIdMode === opt.id ? "bg-primary-tint text-primary" : "bg-surface text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Columns to capture as variables</div>
        {config.columnIdMode === "id" ? (
          <div className="flex items-center gap-2 mb-2">
            <select
              value={pendingLetter}
              onChange={(e) => setPendingLetter(e.target.value)}
              data-testid="gsheet-trigger-column-select"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              {COLUMN_LETTERS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { addColumn(pendingLetter); setPendingLetter("A"); }}
              data-testid="gsheet-trigger-column-add"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColumn(textInput);
                setTextInput("");
              }
            }}
            placeholder="Eg. Customer Name — press Enter to add"
            data-testid="gsheet-trigger-column-text"
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface mb-2 focus:outline-none focus:border-primary/60"
          />
        )}
        {columns.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="gsheet-trigger-column-chips">
            {columns.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-slate-100 border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeColumn(c)}
                  data-testid={`gsheet-trigger-column-remove-${c}`}
                  aria-label={`Remove ${c}`}
                  className="text-text-muted hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Contact identifier column</div>
        <select
          value={config.contactIdentifierColumn}
          onChange={(e) => update({ contactIdentifierColumn: e.target.value })}
          disabled={columns.length === 0}
          data-testid="gsheet-trigger-contact-column"
          className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60 disabled:opacity-40"
        >
          <option value="">Select a column…</option>
          {columns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="mt-1 text-xs text-text-muted">
          Which column identifies the contact this flow should run for (e.g. Phone or Email).
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Check for new rows</div>
        <select
          value={config.pollIntervalMinutes}
          onChange={(e) => update({ pollIntervalMinutes: Number(e.target.value) })}
          data-testid="gsheet-trigger-poll-interval"
          className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
        >
          {POLL_INTERVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {columns.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-text-primary mb-1">Simulate a new row (optional)</div>
          <div className="space-y-2">
            {columns.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <span className="w-32 text-xs text-text-muted truncate">{c}</span>
                <input
                  type="text"
                  value={config.sampleValues?.[c] || ""}
                  onChange={(e) => setSampleValue(c, e.target.value)}
                  placeholder="Sample value"
                  data-testid={`gsheet-trigger-sample-${c}`}
                  className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSimulate}
            data-testid="gsheet-trigger-simulate-btn"
            className="mt-2 px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
          >
            Simulate New Row
          </button>
          {simResult && (
            <div
              data-testid="gsheet-trigger-simulate-result"
              className={`mt-2 px-3 py-2 rounded-md text-sm border ${
                simResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {simResult.success
                ? `Simulated row — ${simResult.variableCount} variable(s) filled${
                    simResult.resolvedContactValue ? ` · Contact resolved to ${simResult.resolvedContactValue}` : ""
                  }`
                : simResult.error}
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 border border-border rounded-md px-3 py-2.5">
        <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
          <li>{`Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this trigger to work.`}</li>
          <li>New entries should be appended at the bottom of the sheet, not inserted in the middle.</li>
          <li>Only rows added after you save this trigger will start the flow — existing rows won't trigger it.</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/flows/builder/trigger/__tests__/GoogleSheetTriggerStep1.test.jsx`
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/trigger/GoogleSheetTriggerStep1.jsx src/components/flows/builder/trigger/__tests__/GoogleSheetTriggerStep1.test.jsx
git commit -m "feat: add Google Sheet Data Entry trigger Step 1 UI"
```

---

### Task 3: Add catalogue entry and wire into StartTriggerWizard

**Files:**
- Modify: `src/data/eventCatalogue.json`
- Modify: `src/components/flows/builder/trigger/StartTriggerWizard.jsx`
- Test: `src/components/flows/builder/trigger/__tests__/StartTriggerWizard.googleSheet.test.jsx`

**Interfaces:**
- Consumes: `GoogleSheetTriggerStep1`, `isGoogleSheetStep1Valid` from Task 2; `emptyGoogleSheetTriggerConfig` from Task 1.
- Produces: a `handleFinish` config shape `{ kind: "google_sheet_new_row", sheetUrl, sheetId, columnIdMode, columns, contactIdentifierColumn, pollIntervalMinutes, sampleValues }` — consumed by Task 4 (`triggerNodeUtils.js`) and Task 5 (`StartTriggerNode.jsx`).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/trigger/__tests__/StartTriggerWizard.googleSheet.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StartTriggerWizard from "../StartTriggerWizard";

function pickGoogleSheetTrigger() {
  fireEvent.click(screen.getByTestId("event-picker-header-Webhook and API"));
  fireEvent.click(screen.getByTestId("event-picker-card-Google Sheet Data Entry"));
}

describe("StartTriggerWizard — Google Sheet Data Entry trigger", () => {
  it("routes to GoogleSheetTriggerStep1 instead of Step1WhenContent when picked", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickGoogleSheetTrigger();
    expect(screen.getByTestId("google-sheet-step1")).toBeInTheDocument();
  });

  it("skips straight to a Finish button (no Step 2) and disables it until Step 1 is valid", () => {
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={() => {}} />);
    pickGoogleSheetTrigger();
    expect(screen.queryByTestId("trigger-wizard-next")).not.toBeInTheDocument();
    expect(screen.getByTestId("trigger-wizard-finish")).toBeDisabled();

    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), { target: { value: "https://docs.google.com/x" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    expect(screen.getByTestId("trigger-wizard-finish")).not.toBeDisabled();
  });

  it("finishes with a kind: google_sheet_new_row config", () => {
    const onComplete = jest.fn();
    render(<StartTriggerWizard open initialConfig={null} onClose={() => {}} onComplete={onComplete} />);
    pickGoogleSheetTrigger();

    fireEvent.change(screen.getByTestId("gsheet-trigger-sheet-url"), { target: { value: "https://docs.google.com/x" } });
    fireEvent.change(screen.getByTestId("gsheet-trigger-column-select"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("gsheet-trigger-column-add"));
    fireEvent.change(screen.getByTestId("gsheet-trigger-contact-column"), { target: { value: "A" } });
    fireEvent.click(screen.getByTestId("trigger-wizard-finish"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "google_sheet_new_row",
        sheetUrl: "https://docs.google.com/x",
        columns: ["A"],
        contactIdentifierColumn: "A",
        pollIntervalMinutes: 5,
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/flows/builder/trigger/__tests__/StartTriggerWizard.googleSheet.test.jsx`
Expected: FAIL — `event-picker-card-Google Sheet Data Entry` test id not found (catalogue entry doesn't exist yet)

- [ ] **Step 3a: Add the catalogue entry**

In `src/data/eventCatalogue.json`, find the `"Webhook and API"` header block:

```json
    "Webhook and API": {
      "External signals": [
        {
          "name": "Webhook trigger",
          "description": "Third-party system sends data to your URL",
          "source": "",
          "device_tag": [
            "iOS",
            "Android",
            "Website"
          ],
          "attribute_allowed": true,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "Webhook and API",
          "section": "External signals"
        }
      ]
    },
```

Replace with:

```json
    "Webhook and API": {
      "External signals": [
        {
          "name": "Webhook trigger",
          "description": "Third-party system sends data to your URL",
          "source": "",
          "device_tag": [
            "iOS",
            "Android",
            "Website"
          ],
          "attribute_allowed": true,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "Webhook and API",
          "section": "External signals"
        },
        {
          "name": "Google Sheet Data Entry",
          "description": "A new row is added to a connected Google Sheet",
          "source": "",
          "device_tag": [],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": false,
          "time_attribute_allow": false,
          "header": "Webhook and API",
          "section": "External signals"
        }
      ]
    },
```

Then find the matching entry inside the canonical `"ALL"` bucket (same card, `"header": "ALL"`, used only to render the "All" tab of the picker):

```json
      "External signals": [
        {
          "name": "Webhook trigger",
          "description": "Third-party system sends data to your URL",
          "source": "",
          "device_tag": [
            "iOS",
            "Android",
            "Website"
          ],
          "attribute_allowed": true,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "ALL",
          "section": "External signals"
        }
      ],
      "Audience source": [
```

Replace with:

```json
      "External signals": [
        {
          "name": "Webhook trigger",
          "description": "Third-party system sends data to your URL",
          "source": "",
          "device_tag": [
            "iOS",
            "Android",
            "Website"
          ],
          "attribute_allowed": true,
          "advance_evaluate": false,
          "audience_qualification_allow": true,
          "time_attribute_allow": false,
          "header": "ALL",
          "section": "External signals"
        },
        {
          "name": "Google Sheet Data Entry",
          "description": "A new row is added to a connected Google Sheet",
          "source": "",
          "device_tag": [],
          "attribute_allowed": false,
          "advance_evaluate": false,
          "audience_qualification_allow": false,
          "time_attribute_allow": false,
          "header": "ALL",
          "section": "External signals"
        }
      ],
      "Audience source": [
```

- [ ] **Step 3b: Wire the wizard**

In `src/components/flows/builder/trigger/StartTriggerWizard.jsx`:

Add imports after the existing webhook imports:

```js
import WebhookTriggerStep1, { isWebhookStep1Valid } from "./WebhookTriggerStep1";
import { emptyWebhookConfig, flattenPayload } from "./webhookHelpers";
```
→
```js
import WebhookTriggerStep1, { isWebhookStep1Valid } from "./WebhookTriggerStep1";
import { emptyWebhookConfig, flattenPayload } from "./webhookHelpers";
import GoogleSheetTriggerStep1, { isGoogleSheetStep1Valid } from "./GoogleSheetTriggerStep1";
import { emptyGoogleSheetTriggerConfig } from "./googleSheetTriggerHelpers";
```

Add state after the webhook state:

```js
  const [isWebhook, setIsWebhook] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState(emptyWebhookConfig());
```
→
```js
  const [isWebhook, setIsWebhook] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState(emptyWebhookConfig());
  const [isGoogleSheet, setIsGoogleSheet] = useState(false);
  const [googleSheetConfig, setGoogleSheetConfig] = useState(emptyGoogleSheetTriggerConfig());
```

Update the hydration effect's webhook/date_relative/event_offset branches to reset `isGoogleSheet`, and add a new branch for `google_sheet_new_row`:

```js
      if (initialConfig?.kind === "webhook") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setWebhookConfig({
          webhookUrl: initialConfig.webhookUrl,
          authProtected: initialConfig.authProtected || false,
          authConfig: initialConfig.authConfig || null,
          samplePayload: initialConfig.samplePayload || "",
          uniqueId: initialConfig.uniqueId || null,
          secondaryId: initialConfig.secondaryId || null,
          variableMappings: initialConfig.variableMappings || [],
        });
        setStage("step1");
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (initialConfig?.kind === "event_offset") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(true);
        setEventOffsetConfig(initialConfig.eventOffsetConfig || emptyEventOffsetConfig());
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
```
→
```js
      if (initialConfig?.kind === "webhook") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setWebhookConfig({
          webhookUrl: initialConfig.webhookUrl,
          authProtected: initialConfig.authProtected || false,
          authConfig: initialConfig.authConfig || null,
          samplePayload: initialConfig.samplePayload || "",
          uniqueId: initialConfig.uniqueId || null,
          secondaryId: initialConfig.secondaryId || null,
          variableMappings: initialConfig.variableMappings || [],
        });
        setStage("step1");
      } else if (initialConfig?.kind === "date_relative") {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setIsDateRelative(true);
        setDateConfig(initialConfig.dateConfig || emptyDateConfig());
        setStage("step1");
      } else if (initialConfig?.kind === "event_offset") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
        setIsEventOffset(true);
        setEventOffsetConfig(initialConfig.eventOffsetConfig || emptyEventOffsetConfig());
        setStage("step1");
      } else if (initialConfig?.kind === "google_sheet_new_row") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(true);
        setGoogleSheetConfig({
          sheetUrl: initialConfig.sheetUrl || "",
          sheetId: initialConfig.sheetId || "",
          columnIdMode: initialConfig.columnIdMode || "id",
          columns: initialConfig.columns || [],
          contactIdentifierColumn: initialConfig.contactIdentifierColumn || "",
          pollIntervalMinutes: initialConfig.pollIntervalMinutes || 5,
          sampleValues: initialConfig.sampleValues || {},
        });
        setStage("step1");
      } else if (ev?.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
```

Update the final `else` branch of the hydration effect:

```js
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setStage("step1");
      }
    } else {
```
→
```js
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setStage("step1");
      }
    } else {
```

Update the reset-on-close branch:

```js
      setIsDateRelative(false);
      setIsEventOffset(false);
      setIsWebhook(false);
      setWebhookConfig(emptyWebhookConfig());
      setDateConfig(emptyDateConfig());
      setEventOffsetConfig(emptyEventOffsetConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
```
→
```js
      setIsDateRelative(false);
      setIsEventOffset(false);
      setIsWebhook(false);
      setIsGoogleSheet(false);
      setWebhookConfig(emptyWebhookConfig());
      setDateConfig(emptyDateConfig());
      setEventOffsetConfig(emptyEventOffsetConfig());
      setGoogleSheetConfig(emptyGoogleSheetTriggerConfig());
      setStage("picker");
      setPickingForGroupIdx(null);
    }
```

Update `onPickEvent`:

```js
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      setTriggerGroups([emptyGroup(card.name)]);
      if (card.name === "Webhook trigger") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setWebhookConfig(emptyWebhookConfig());
        setStage("step1");
      } else if (card.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else if (card.date_relative) {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig(card.attribute_key));
        setStage("step1");
      } else if (card.system_event_relative) {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(true);
        setEventOffsetConfig(emptyEventOffsetConfig(card.name));
        setStage("step1");
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setStage("step1");
      }
    } else {
```
→
```js
  const onPickEvent = (card) => {
    if (pickingForGroupIdx == null) {
      setTriggerGroups([emptyGroup(card.name)]);
      if (card.name === "Webhook trigger") {
        setIsWebhook(true);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setWebhookConfig(emptyWebhookConfig());
        setStage("step1");
      } else if (card.name === "Google Sheet Data Entry") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(true);
        setGoogleSheetConfig(emptyGoogleSheetTriggerConfig());
        setStage("step1");
      } else if (card.header === "Broadcast") {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        if (card.name === "Saved segment" || card.name === "CSV upload") {
          setBroadcastSourceType(card.name === "CSV upload" ? "csv" : "segment");
          setBroadcastSourceConfig(emptyBroadcastSourceConfig());
          setBroadcastSourceSchedule(emptyBroadcastSourceSchedule());
          setStage("broadcast-source-1");
        } else {
          setStage("broadcast");
        }
      } else if (card.date_relative) {
        setIsWebhook(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setIsDateRelative(true);
        setDateConfig(emptyDateConfig(card.attribute_key));
        setStage("step1");
      } else if (card.system_event_relative) {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsGoogleSheet(false);
        setIsEventOffset(true);
        setEventOffsetConfig(emptyEventOffsetConfig(card.name));
        setStage("step1");
      } else {
        setIsWebhook(false);
        setIsDateRelative(false);
        setIsEventOffset(false);
        setIsGoogleSheet(false);
        setStage("step1");
      }
    } else {
```

Update `handleFinish`:

```js
    if (isWebhook) {
      config = {
        kind: "webhook",
        ...webhookConfig,
        payloadVariables: flattenPayload(webhookConfig.samplePayload).variables,
        audience,
      };
    } else if (isBroadcastSource) {
```
→
```js
    if (isWebhook) {
      config = {
        kind: "webhook",
        ...webhookConfig,
        payloadVariables: flattenPayload(webhookConfig.samplePayload).variables,
        audience,
      };
    } else if (isGoogleSheet) {
      config = { kind: "google_sheet_new_row", ...googleSheetConfig };
    } else if (isBroadcastSource) {
```

Update `stepperLabel`:

```js
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : stage === "broadcast-source-1" || stage === "broadcast-source-2"
      ? `1. ${sourceStepLabel} → 2. Schedule & audience`
      : isWebhook
      ? "1. Configure Webhook → 2. Who will enter the flow"
      : "1. When will users enter the flow → 2. Who will enter the flow";
```
→
```js
  const stepperLabel =
    stage === "broadcast"
      ? "Configure broadcast"
      : stage === "broadcast-source-1" || stage === "broadcast-source-2"
      ? `1. ${sourceStepLabel} → 2. Schedule & audience`
      : isWebhook
      ? "1. Configure Webhook → 2. Who will enter the flow"
      : isGoogleSheet
      ? "1. Configure Google Sheet Data Entry"
      : "1. When will users enter the flow → 2. Who will enter the flow";
```

Update the Step 1 `StepDot` label:

```jsx
              <StepDot n={1} active={stage === "step1"} done={stage === "step2"} label={isWebhook ? "Configure Webhook" : "When"} />
```
→
```jsx
              <StepDot n={1} active={stage === "step1"} done={stage === "step2"} label={isWebhook ? "Configure Webhook" : isGoogleSheet ? "Configure Google Sheet Data Entry" : "When"} />
```

Add the render branch and exclude it from the generic `Step1WhenContent` gate:

```jsx
            {stage === "step1" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "step1" && isDateRelative && !isWebhook && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && isEventOffset && !isWebhook && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isEventOffset && !isWebhook && (
              <Step1WhenContent
```
→
```jsx
            {stage === "step1" && isWebhook && (
              <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
            )}
            {stage === "step1" && isGoogleSheet && (
              <GoogleSheetTriggerStep1 config={googleSheetConfig} setConfig={setGoogleSheetConfig} />
            )}
            {stage === "step1" && isDateRelative && !isWebhook && (
              <DateRelativeTriggerContent
                dateConfig={dateConfig}
                setDateConfig={setDateConfig}
              />
            )}
            {stage === "step1" && isEventOffset && !isWebhook && (
              <EventOffsetTriggerContent
                config={eventOffsetConfig}
                setConfig={setEventOffsetConfig}
              />
            )}
            {stage === "step1" && !isDateRelative && !isEventOffset && !isWebhook && !isGoogleSheet && (
              <Step1WhenContent
```

Finally, gate the Finish button's disabled state so it can't be clicked before Step 1 is valid:

```jsx
              {(stage === "step2" ||
                (stage === "step1" && skipStep2) ||
                stage === "broadcast" ||
                stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```
→
```jsx
              {(stage === "step2" ||
                (stage === "step1" && skipStep2) ||
                stage === "broadcast" ||
                stage === "broadcast-source-2") && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isGoogleSheet && !isGoogleSheetStep1Valid(googleSheetConfig)}
                  data-testid="trigger-wizard-finish"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
                >
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
```

Note: `skipStep2` (`!isDateRelative && primaryCard && !primaryCard.audience_qualification_allow`) needs no code change — since the new catalogue card has `audience_qualification_allow: false` and `isDateRelative` is false for this kind, it already evaluates to `true` automatically, which is why the Finish button (not Next) renders directly after Step 1 for this trigger.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/flows/builder/trigger/__tests__/StartTriggerWizard.googleSheet.test.jsx`
Expected: PASS (3 tests)

Also re-run the existing webhook/dateTime wizard tests to confirm no regression:

Run: `npx jest src/components/flows/builder/trigger/__tests__/StartTriggerWizard`
Expected: PASS (all existing + new suites)

- [ ] **Step 5: Commit**

```bash
git add src/data/eventCatalogue.json src/components/flows/builder/trigger/StartTriggerWizard.jsx src/components/flows/builder/trigger/__tests__/StartTriggerWizard.googleSheet.test.jsx
git commit -m "feat: wire Google Sheet Data Entry trigger into StartTriggerWizard"
```

---

### Task 4: Canvas summary — triggerNodeUtils.js

**Files:**
- Modify: `src/components/flows/builder/triggerNodeUtils.js`
- Test: `src/components/flows/builder/__tests__/triggerNodeUtils.googleSheet.test.js`

**Interfaces:**
- Consumes: config shape produced by Task 3 (`{ kind: "google_sheet_new_row", sheetUrl, sheetId, columns, contactIdentifierColumn, pollIntervalMinutes, ... }`).
- Produces: `summariseTriggerConfig(config)` now returns, for this kind, an object including `isGoogleSheet: true`, `sheetUrl`, `columns`, `contactIdentifierColumn`, `pollIntervalMinutes` — consumed by Task 5 (`StartTriggerNode.jsx`).

- [ ] **Step 1: Write the failing test**

```js
// src/components/flows/builder/__tests__/triggerNodeUtils.googleSheet.test.js
import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — google_sheet_new_row", () => {
  const baseConfig = {
    kind: "google_sheet_new_row",
    sheetUrl: "https://docs.google.com/spreadsheets/d/abc123",
    sheetId: "",
    columnIdMode: "id",
    columns: ["A", "B"],
    contactIdentifierColumn: "A",
    pollIntervalMinutes: 15,
    sampleValues: {},
  };

  it("marks the summary as a Google Sheet trigger with sheet and polling fields", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isGoogleSheet).toBe(true);
    expect(summary.isWebhook).toBe(false);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.sheetUrl).toBe(baseConfig.sheetUrl);
    expect(summary.columns).toEqual(["A", "B"]);
    expect(summary.contactIdentifierColumn).toBe("A");
    expect(summary.pollIntervalMinutes).toBe(15);
  });

  it("has no exit condition and no audience pill, since Step 2 is skipped for this kind", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
    expect(summary.audienceTypePill).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/flows/builder/__tests__/triggerNodeUtils.googleSheet.test.js`
Expected: FAIL — `summary.isGoogleSheet` is `undefined`, not `true`

- [ ] **Step 3: Write the implementation**

In `src/components/flows/builder/triggerNodeUtils.js`, add a new summariser function right before the `// ── main export ──` comment:

```js
function summariseGoogleSheet(config) {
  return {
    headerLabel: "Start Trigger",
    isWebhook: false,
    isBroadcast: false,
    isDateRelative: false,
    isEventOffset: false,
    isGoogleSheet: true,
    sheetUrl: config.sheetUrl,
    sheetId: config.sheetId,
    columns: config.columns || [],
    contactIdentifierColumn: config.contactIdentifierColumn,
    pollIntervalMinutes: config.pollIntervalMinutes,
    whoLine: null,
    whoExtraCount: 0,
    frequencyLine: null,
    audienceTypePill: null,
    audienceTab: null,
    audienceConditions: [],
    audienceCombinator: "AND",
    noExitCondition: true,
    exitLine: null,
    exitExtraCount: 0,
    exitEvents: [],
    exitCombinator: "OR",
  };
}
```

Then update the dispatcher:

```js
export function summariseTriggerConfig(config) {
  if (!config) return null;
  if (config.kind === "webhook") return summariseWebhook(config);
  if (config.kind === "date_relative") return summariseDateRelative(config);
  if (config.kind === "event_offset") return summariseEventOffset(config);
```
→
```js
export function summariseTriggerConfig(config) {
  if (!config) return null;
  if (config.kind === "webhook") return summariseWebhook(config);
  if (config.kind === "google_sheet_new_row") return summariseGoogleSheet(config);
  if (config.kind === "date_relative") return summariseDateRelative(config);
  if (config.kind === "event_offset") return summariseEventOffset(config);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/flows/builder/__tests__/triggerNodeUtils.googleSheet.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/triggerNodeUtils.js src/components/flows/builder/__tests__/triggerNodeUtils.googleSheet.test.js
git commit -m "feat: summarise google_sheet_new_row trigger config for canvas display"
```

---

### Task 5: Canvas node rendering — StartTriggerNode.jsx

**Files:**
- Modify: `src/components/flows/builder/nodes/StartTriggerNode.jsx`
- Test: `src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx`

**Interfaces:**
- Consumes: `summary` object from Task 4's `summariseGoogleSheet` (fields: `isGoogleSheet`, `sheetUrl`, `columns`, `contactIdentifierColumn`, `pollIntervalMinutes`).

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import StartTriggerNode from "../StartTriggerNode";

jest.mock("reactflow", () => ({
  Handle: ({ id, type }) => <div data-testid={`handle-${id || "out"}`} data-type={type} />,
  Position: { Top: "top", Bottom: "bottom" },
}));
jest.mock("@/components/flows/analytics/NodeAnalyticsFooter", () => () => null);

const googleSheetConfig = {
  kind: "google_sheet_new_row",
  sheetUrl: "https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz",
  sheetId: "",
  columnIdMode: "id",
  columns: ["A", "B"],
  contactIdentifierColumn: "A",
  pollIntervalMinutes: 15,
  sampleValues: {},
};

describe("StartTriggerNode — Google Sheet Data Entry trigger", () => {
  it("renders the sheet URL and the poll interval instead of the event entry list", () => {
    render(<StartTriggerNode data={{ config: googleSheetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Checked every 15 minutes/)).toBeInTheDocument();
  });

  it("shows the contact identifier column and captured column count", () => {
    render(<StartTriggerNode data={{ config: googleSheetConfig, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Contact: A · 2 columns captured/)).toBeInTheDocument();
  });

  it("uses singular wording for a single captured column and 1-minute interval", () => {
    const singleColumn = { ...googleSheetConfig, columns: ["A"], pollIntervalMinutes: 1 };
    render(<StartTriggerNode data={{ config: singleColumn, onEdit: () => {} }} selected={false} />);
    expect(screen.getByText(/Checked every 1 minute\b/)).toBeInTheDocument();
    expect(screen.getByText(/1 column captured/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx`
Expected: FAIL — text "Checked every 15 minutes" not found (nothing renders the google-sheet entry block yet)

- [ ] **Step 3: Write the implementation**

In `src/components/flows/builder/nodes/StartTriggerNode.jsx`, add `Table` to the lucide-react import:

```jsx
import {
  Zap, Radio, ShoppingBag, ShoppingCart, CreditCard, Package,
  Receipt, PackageCheck, Truck, XCircle, RefreshCcw, CornerUpLeft,
  Search, UserPlus, Heart, Star, AlertCircle, Users, UserMinus,
  CheckCircle, LogOut, MessageCircle, Hash, MessageSquare, Mail,
  Cake, Gift, RefreshCw, TrendingDown, Headphones, CheckSquare,
  Pencil, Clock, Link2,
} from "lucide-react";
```
→
```jsx
import {
  Zap, Radio, ShoppingBag, ShoppingCart, CreditCard, Package,
  Receipt, PackageCheck, Truck, XCircle, RefreshCcw, CornerUpLeft,
  Search, UserPlus, Heart, Star, AlertCircle, Users, UserMinus,
  CheckCircle, LogOut, MessageCircle, Hash, MessageSquare, Mail,
  Cake, Gift, RefreshCw, TrendingDown, Headphones, CheckSquare,
  Pencil, Clock, Link2, Table,
} from "lucide-react";
```

Add a new entry block after `DateOffsetEntryBlock`:

```jsx
function DateOffsetEntryBlock({ summary }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
        <span className="text-[11px] font-semibold text-text-primary">{summary.offsetLine}</span>
      </div>
      {summary.recurrenceLine && (
        <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
          {summary.recurrenceLine}
        </div>
      )}
    </div>
  );
}
```
→
```jsx
function DateOffsetEntryBlock({ summary }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
        <span className="text-[11px] font-semibold text-text-primary">{summary.offsetLine}</span>
      </div>
      {summary.recurrenceLine && (
        <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
          {summary.recurrenceLine}
        </div>
      )}
    </div>
  );
}

function GoogleSheetEntryBlock({ summary }) {
  const columnCount = summary.columns?.length || 0;
  const intervalLabel = summary.pollIntervalMinutes === 1 ? "1 minute" : `${summary.pollIntervalMinutes} minutes`;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Table className="w-3 h-3 flex-shrink-0" style={{ color: PRIMARY }} />
        <span
          className="text-[10px] font-mono text-text-secondary truncate flex-1"
          title={summary.sheetUrl}
        >
          {truncMid(summary.sheetUrl)}
        </span>
      </div>
      <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-medium text-text-muted border border-border">
        {`Checked every ${intervalLabel}`}
      </div>
      {summary.contactIdentifierColumn && (
        <div className="mt-1 text-[10px] text-text-muted">
          {`Contact: ${summary.contactIdentifierColumn} · ${columnCount} column${columnCount === 1 ? "" : "s"} captured`}
        </div>
      )}
    </div>
  );
}
```

Add the render gate next to the existing webhook/date-offset gates:

```jsx
        {summary.isWebhook && <WebhookEntryBlock summary={summary} />}

        {(summary.isDateRelative || summary.isEventOffset) && summary.offsetLine && (
          <DateOffsetEntryBlock summary={summary} />
        )}

        {!summary.isBroadcast && !summary.isWebhook && !summary.isDateRelative && !summary.isEventOffset && (
```
→
```jsx
        {summary.isWebhook && <WebhookEntryBlock summary={summary} />}

        {summary.isGoogleSheet && <GoogleSheetEntryBlock summary={summary} />}

        {(summary.isDateRelative || summary.isEventOffset) && summary.offsetLine && (
          <DateOffsetEntryBlock summary={summary} />
        )}

        {!summary.isBroadcast && !summary.isWebhook && !summary.isDateRelative && !summary.isEventOffset && !summary.isGoogleSheet && (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx`
Expected: PASS (3 tests)

Also re-run the full trigger-related test suites to confirm no regression:

Run: `npx jest src/components/flows/builder/nodes/__tests__/StartTriggerNode src/components/flows/builder/__tests__/triggerNodeUtils src/components/flows/builder/trigger/__tests__`
Expected: PASS (all suites, old and new)

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/StartTriggerNode.jsx src/components/flows/builder/nodes/__tests__/StartTriggerNode.googleSheet.test.jsx
git commit -m "feat: render Google Sheet Data Entry trigger on the canvas node"
```

---

### Task 6: Manual verification in Flow Builder v1 and v2

**Files:** none (verification only — no code changes expected; this task exists to confirm the "both v1 and v2" requirement is actually met, since Task 3 only touched shared components).

- [ ] **Step 1: Start the app**

Run the project's dev server (check `package.json` for the exact script, typically `npm run dev`).

- [ ] **Step 2: Verify in Flow Builder v1**

Open a flow in the v1 builder, click the Start Trigger node to open the wizard, select "Webhook and API" in the left rail, confirm "Google Sheet Data Entry" appears as a card alongside "Webhook trigger", pick it, fill in a sheet URL + one column + a contact identifier column, click Finish, and confirm the canvas node now shows the sheet URL and "Checked every 5 minutes".

- [ ] **Step 3: Verify in Flow Builder v2**

Repeat the same steps in the v2 builder (`FlowBuilderV2.jsx`). Since v2 renders the identical `StartTriggerWizard`, this should work with no additional code — this step exists purely to catch any v2-specific regression (e.g. a v2 wrapper that filters trigger kinds) that static analysis might have missed.

- [ ] **Step 4: Run the full test suite**

Run: `npx jest src/components/flows/builder`
Expected: PASS — no regressions across the whole flow-builder test tree.

No commit for this task (verification only).
