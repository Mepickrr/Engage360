# Google Sheet Unified Node — Product Design Spec

**Date:** 2026-07-07
**Status:** Approved for implementation
**Audience:** Internal product team, engineers
**Scope:** Unified Google Sheet action node within Flow Builder (v1 + v2)

---

## 1. Overview

Replace the three separate "Google Sheets" palette entries (Add Row, Update Row, Get Row Data — currently unbuilt stubs under a standalone `gsheets` category) with a single unified **Google Sheet** node under the **Integrations** section, alongside Razorpay, Judge Me, Shopify, Freshdesk, and Webhook. The node uses a card-grid action picker — same visual pattern as the Shopify unified node (`docs/superpowers/specs/2026-07-03-shopify-unified-node-design.md`) — to let sellers choose one of four actions: **Add Row**, **Update Row**, **Get Row Data**, **Upsert Row**. Each action drives distinct right-panel config and a canvas preview line. The node exposes two output handles: **Success** and **Failed**.

This design intentionally improves on the reference behavior (Bik's Google Sheet block — see §2) in two respects, beyond the service-account email swap:
1. **Update Row supports multiple target-column mappings per action** (Bik's UI appears to support only one), via the same repeatable "+ Add Field" pattern already used for Add Row.
2. **Upsert Row** — a fourth action not offered by Bik at all: search for a row, update it if found, append a new row if not. Common CRM-style sync pattern (e.g. syncing a customer record without needing two separate nodes + a conditional branch to check existence first).

---

## 2. Research: Reference Behavior (Bik)

Source: Bik's public help docs (`Google Sheet Block`, `Google Sheets Integration`).

- **Three actions:** Add a Row, Update a Row, Get Row Data.
- **Column identification, two modes:**
  - *Header* — reference columns by header text (friendlier, breaks if headers are renamed/duplicated).
  - *ID* — reference by column letter (A, B, C…), described as "more precise... reduces API calls" — Bik recommends this to avoid quota errors.
- **Authorization:** grant **Editor** access on the target spreadsheet to a fixed service-account email. Sheet is identified by URL; an optional **Sheet ID** targets a specific tab in multi-sheet files (defaults to Sheet ID `0`, i.e. the first sheet, if omitted).
- **Add a Row:** Sheet URL + column identifier mode + repeatable column→value field pairs. Row number of the inserted row is saved to a variable.
- **Update a Row:** two ways to find the target row — *specify row number directly*, or *search for row* (lookup column + lookup value) — then one target column + updated value. Docs do not show support for updating more than one column per action.
- **Get Row Data:** same row-targeting choice (row number vs. lookup), then a multi-select of which column(s) to pull; results are exposed as flow variables (grouped under an "API data responses" / header-style bucket) for downstream use.
- **Known limitations (per Bik docs):** no way to trigger a flow automatically when a new row is added; quota-exceeded errors reported under heavy use (mitigated by preferring ID mode over Header mode); best practices called out — avoid spaces/duplicates in column names, ensure the sheet isn't hidden, keep the primary sheet first if the file has multiple tabs.

**Our service-account placeholder:** all UI copy and tips text use `engagetechsupport@shiprocket.com` in place of Bik's `googlesheet@bikayi-chat.iam.gserviceaccount.com`.

This app's flow builder is a frontend prototype — node configuration is local UI state with no live call to the Google Sheets API. This spec covers the UI/UX and data shape only; no backend integration is included (see §7 Non-Goals).

---

## 3. Migration: Remove Old Nodes

- **NodePalette.jsx:** Delete the entire `gsheets` category (`addrow`, `updaterow`, `getrow` — currently unbuilt, fallback-only config). Add a new `googlesheet` entry to the existing `integrations` category.
- **FlowBuilderV2.jsx `V2_ALLOWED_NODES`:** already excludes `addrow`/`updaterow`/`getrow` (no change needed there); add `"googlesheet"` to the Integrations block of the allow-list.
- No seed/mock flow data references `addrow`/`updaterow`/`getrow` — confirmed via search of `src/data`. Safe to delete outright; no legacy-node fallback rendering needed.

---

## 4. Canvas Node

### 4.1 Unconfigured State
- Dashed border, blue accent (matches Integrations category color, `COLORS.blue` — `#378ADD` / border `#85B7EB`)
- Sheet/Table icon centered
- Label: "Google Sheet"
- Subtext: "Click to configure"

### 4.2 Configured State
- Solid border, blue accent
- Action chip at top (icon + action name)
- Preview line per action:

| Action | Preview Line |
|---|---|
| Add Row | `Row added to Sheet · <Sheet ID or "default">` |
| Update Row (search mode) | `Row updated where <lookupColumn> = <lookupField>` |
| Update Row (row-number mode) | `Row #<n> updated` |
| Get Row Data (search mode) | `Row fetched where <lookupColumn> = <lookupField>` |
| Get Row Data (row-number mode) | `Row #<n> fetched` |
| Upsert Row | `Row added or updated where <lookupColumn> = <lookupField>` |

### 4.3 Output Handles

| Handle | Color | Meaning |
|---|---|---|
| `Success` | Green | Sheet operation succeeded |
| `Failed` | Red | Sheet operation failed (bad URL, no access, row not found, etc.) |

---

## 5. Right Panel

### 5.1 Action Picker (top of panel, shown until an action is selected)

3-column card grid (wraps to a second row of 1) — same visual pattern as `ActionPicker` in `ShopifyRightPanel.jsx`:

| id | Label | Description |
|---|---|---|
| `add_row` | Add Row | Insert a new row into the sheet |
| `update_row` | Update Row | Modify an existing row's data |
| `get_row` | Get Row Data | Retrieve data from a row |
| `upsert_row` | Upsert Row | Update a row if found, else add a new one |

Once selected, the picker is replaced by the action's config. A **"← Change action"** text link resets `action` to `null` and clears action-specific fields (no confirmation dialog) — identical convention to Shopify.

### 5.2 Common Fields (shown at top of every action's config)

- **Sheet URL*** — text input, placeholder `https://docs.google.com/spreadsheets/d/1234...`, helper text "The URL for the Google Sheet". Required to consider the node "configured".
- **Sheet ID (Optional)** — text input, placeholder `123456`, helper text "For multiple sheets in file, specify Sheet ID"

### 5.3 Add Row

- **Column Identifier** toggle: `Header` / `Id`
- **Field(s) to add** — repeatable list of `{ column, field }` pairs (Column ID dropdown eg. "A", Field text input eg. `{{Order ID}}`) + **"+ Add Field"** button
- **Row number for this will be saved in** — read-only, auto-generated variable name `googleSheetAddRow{N}.rowNumber`
- Tips box (static): grant editor access to `engagetechsupport@shiprocket.com`; don't use special characters for value inputs; value input example `{{customer.name}}, {{Order.ID}}, ...`

### 5.4 Update Row

- **Target Row** toggle: `Specify Row Number` (number input) / `Search for Row` (Lookup Column dropdown + Lookup Field text input)
- **Column Identifier** toggle: `Header` / `Id` (governs lookup column and target column(s))
- **Field(s) to update** — repeatable list of `{ target column, updated field }` pairs + **"+ Add Field"** button (improvement over Bik: multiple columns per Update Row action)
- Tips box (static): grant editor access to `engagetechsupport@shiprocket.com`

### 5.5 Get Row Data

- **Target Row** toggle: `Specify Row Number` / `Search for Row` (same as §5.4)
- **Column Identifier** toggle: `Header` / `Id`
- **Column(s) to save data from** — multi-select dropdown of columns
- **Data from Column(s) will be saved in** — editable variable-name prefix, default `googleSheetGetRowData{N}`
- Tips box (static): grant editor access to `engagetechsupport@shiprocket.com`; data will be saved as variables under this name, with sub-names corresponding to each selected column

### 5.6 Upsert Row

- **Lookup Column** dropdown + **Lookup Field** text input — always in "search" mode (there's no row-number variant here, since the whole point is deciding add-vs-update from a search match; if you already know the row number, use Update Row instead)
- **Column Identifier** toggle: `Header` / `Id` (governs lookup column and the shared field list below)
- **Field(s) to write** — one shared repeatable list of `{ column, field }` pairs + **"+ Add Field"** button, written on either path (update or append) — same data whether the row already existed or not, per CRM-sync intent
- **Row number for this will be saved in** — read-only, auto-generated variable name `googleSheetUpsertRow{N}.rowNumber` (the matched row's number if updated, or the newly appended row's number if added)
- **Whether a new row was added** — read-only, auto-generated boolean variable `googleSheetUpsertRow{N}.wasAdded` (`true` if appended, `false` if an existing row was updated) — lets downstream flow steps branch on which path was taken
- Tips box (static): grant editor access to `engagetechsupport@shiprocket.com`; if no row matches the lookup value, a new row is appended with the field(s) above; don't use special characters for value inputs

---

## 6. Data Structure

```js
// Default / initial node data
{
  action: null,  // "add_row" | "update_row" | "get_row" | "upsert_row"

  sheetUrl: "",
  sheetId: "",

  // add_row
  addRow: {
    columnIdMode: "id",       // "header" | "id"
    fields: [],               // [{ column: "A", field: "" }]
    rowNumberVar: "googleSheetAddRow1.rowNumber",
  },

  // update_row
  updateRow: {
    targetMode: "search",     // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "",
    lookupField: "",
    columnIdMode: "id",
    fields: [],               // [{ column: "A", field: "" }]
  },

  // get_row
  getRow: {
    targetMode: "search",     // "row_number" | "search"
    rowNumber: null,
    lookupColumn: "",
    lookupField: "",
    columnIdMode: "id",
    columns: [],              // selected column ids/headers to fetch
    outputVarPrefix: "googleSheetGetRowData1",
  },

  // upsert_row
  upsertRow: {
    lookupColumn: "",
    lookupField: "",
    columnIdMode: "id",
    fields: [],               // [{ column: "A", field: "" }] — shared write list (update or append)
    rowNumberVar: "googleSheetUpsertRow1.rowNumber",
    wasAddedVar: "googleSheetUpsertRow1.wasAdded",
  },
}
```

---

## 7. File Structure

```
src/components/flows/builder/nodes/GoogleSheetNode/
  index.jsx                     ← canvas node (unconfigured + configured states, 2 output handles)
  GoogleSheetRightPanel.jsx      ← right panel with action picker + 4 action-specific sections
  data/
    mockData.js                  ← default data, action definitions, service-account email constant
```

Registration / modification points:

| File | Change |
|---|---|
| `NodePalette.jsx` | Remove `gsheets` category entirely; add `googlesheet` entry to `integrations` |
| `FlowBuilderV2.jsx` | Add `"googlesheet"` to `V2_ALLOWED_NODES` Integrations block |
| `Canvas.jsx` | Add `googlesheet: GoogleSheetNode` to `nodeTypes` map |
| `ConfigTab.jsx` | Add routing block for `node?.type === "googlesheet"` → `GoogleSheetRightPanel` |
| `flowMeta.js` | Add `case "googlesheet"` to `defaultDataForPaletteItem`; add `"googlesheet"` to `rendererTypeForKind` |

---

## 8. Non-Goals (v1)

- No actual Google Sheets API calls — UX only (no live auth check, no "Verify access" button; static tips text only, per explicit decision)
- No auto-fetch of real header names / column letters from a live sheet (fields are free text / static dropdown, matching Bik's manual-entry approach)
- No trigger-on-new-row capability (Bik explicitly does not support this either)
- No multi-action configuration in a single node (one action per node, same as Shopify)
- No "Change Action" confirmation dialog (switching action resets config silently)
- No Delete Row, Clear Row, bulk/whole-sheet read, or create-new-tab actions (see §9 for discussion)

---

## 9. Additional Actions Considered (not in scope, for discussion)

Beyond Bik's three actions, other Google-Sheets-flavored actions we could offer later:

- **Delete Row** — remove a row by row-number or lookup match.
- **Clear Row / Clear Range** — blank out values without deleting the row.
- **Bulk read** — return all rows (or all rows matching a filter) rather than a single row, for building digest/report-style flows.
- **New Sheet/Tab creation** — programmatically add a new tab to the spreadsheet.
- **Trigger flow on new row** — Bik explicitly does not support this; would require real backend polling/webhook infrastructure (Apps Script trigger or push notification from Sheets API), which is a significant scope jump beyond a frontend-only prototype.

None of these are built in this pass — flagged here for a future spec if wanted.
