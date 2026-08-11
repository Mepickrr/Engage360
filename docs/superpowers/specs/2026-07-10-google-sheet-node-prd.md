# Google Sheet Node — Product Requirements Document

## Table of Contents

0. [What the Prototype Shows](#0-what-the-prototype-shows)
1. [Feature Brief](#1-feature-brief)
2. [The Job](#2-the-job)
3. [Success Metrics](#3-success-metrics)
4. [Who Uses This and When](#4-who-uses-this-and-when)
5. [User Flows](#5-user-flows)
6. [Functional Specification](#6-functional-specification)
7. [States](#7-states)
8. [Edge Cases](#8-edge-cases)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Analytics & Instrumentation](#10-analytics--instrumentation)
11. [Copy](#11-copy)
12. [Dependencies](#12-dependencies)
13. [Out of Scope](#13-out-of-scope)
14. [Open Questions](#14-open-questions)
15. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

**Scope note:** this PRD covers the Google Sheet **action node** only — the mid-flow step a seller drops onto the canvas to read from or write to a sheet. It does not cover the separate "Google Sheet Data Entry" **start trigger** (`docs/superpowers/specs/2026-07-08-google-sheet-new-row-trigger-design.md`), which starts a flow, rather than acting inside one.

**What's built** (`src/components/flows/builder/nodes/GoogleSheetNode/`):
- A canvas node (`index.jsx`) with an unconfigured state ("Click to configure") and a configured state showing the action label and a one-line preview (`data/summary.js::getGoogleSheetSummary`), plus `Success`/`Failed` output handles.
- A right panel (`GoogleSheetRightPanel.jsx`) with three always-visible sections: **Sheet Connection** (Sheet URL, Sheet ID, Submit, Sync), **Action picker** (4 cards: Add Row, Update Row, Get Row Data, Upsert Row) when no action is set, and a **configured-action summary card** ("Edit configuration" + "← Change action") once one is.
- A config modal (`GoogleSheetConfigModal.jsx`) holding all per-action fields, opened automatically on first action pick and via "Edit configuration" afterward. Local `useState` edit buffer; Cancel discards, Save commits via `onSave` and closes.
- Four action field sets inside the modal, identical in shape to `docs/superpowers/specs/2026-07-07-google-sheet-node-design.md` §5.3–5.6: Add Row, Update Row, Get Row Data, Upsert Row — each with a `Header`/`Id` column-identifier toggle, row-targeting (row number vs. lookup search) where applicable, repeatable field lists or column multi-selects, read-only output-variable fields where applicable, and a static tips box naming the service-account email.
- Wired identically into both Flow Builder v1 and v2: `NodePalette.jsx` (palette entry), `Canvas.jsx` (`nodeTypes.googlesheet`), `ConfigTab.jsx` (right-panel routing), `lib/flowMeta.js` (default data + renderer-type mapping), `FlowBuilderV2.jsx`'s `V2_ALLOWED_NODES` (includes `"googlesheet"`).
- Test coverage: `GoogleSheetNode.test.jsx` (canvas states + preview lines), `GoogleSheetRightPanel.test.jsx` (connection section, action picker, summary card), `GoogleSheetConfigModal.test.jsx` (per-action field sets, Save/Cancel).

**What's incomplete:**
- **Sync is fully mocked.** Clicking Sync sets `sync.status = "syncing"`, waits a fixed ~1.2s (`setTimeout`, no real network call), then sets `status = "synced"` and populates `detectedColumns` with a **hardcoded list** (`["Order ID", "Customer Name", "Phone Number", "Email", "Status", "Amount"]`) regardless of what sheet URL was entered or what that sheet actually contains.
- **Submit is fully mocked.** Clicking Submit with any non-empty Sheet URL sets `sheetConnected: true` — there is no check that the URL is a valid Google Sheet, that it exists, or that the service account has access.
- **Detected columns are decorative.** The chips rendered after a successful Sync are not wired to anything — the `Header`/`Id` toggle, `FieldRowList`, and `ColumnMultiSelect` inside the config modal are all still manual free-text/letter entry, with no connection to `sync.detectedColumns`.
- **No validation anywhere.** Save in the config modal is always enabled; no required-field checks (per §5, out of scope by explicit product decision, not an oversight).

**What's absent entirely:**
- Any real Google Sheets API call, OAuth flow, or service-account credential exchange. `GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL` is a static string; there is no backend endpoint that verifies sharing/access.
- Row-level execution at flow-runtime — this is a frontend-only prototype (confirmed in the trigger spec, §1 of that doc): there is no node/step execution engine anywhere in the codebase, so "Add Row" configured here does not, today, ever actually add a row when a flow runs.
- Any error state surfaced from a failed sheet operation at runtime (the `Failed` output handle exists on the canvas node as a wireable branch, but nothing in this codebase ever routes execution down it, since nothing executes).
- A tab/worksheet name picker — "Sheet ID" is a free-text numeric field, not a dropdown of real tabs (this is explicitly proposed as a future improvement in the sibling trigger UX-redesign doc, `2026-07-10-google-sheet-trigger-modal-ux-redesign.md`, but not built here).

---

## 1. Feature Brief

The Google Sheet node lets a seller insert a step into their flow that reads from or writes to a Google Sheet — logging an order to a spreadsheet, looking up a customer's record, or keeping a CRM-style sheet in sync — without leaving the flow builder or writing a script. Today, a seller configures the connection and the exact fields to add, update, or fetch entirely inside the builder UI; the "Sync" affordance previews what setting this up would feel like once turned on, without yet performing a real sheet operation. The pain removed is the alternative: leaving the flow builder to hand-build a Zapier/Apps-Script-style integration for the same task.

## 2. The Job

**The job:** let a seller declare, entirely inside the flow builder, which spreadsheet a step reads or writes and exactly which columns/rows are involved — producing a node configuration precise enough that a real backend integration could execute it unchanged.

**Three things that, if missing, make it not worth shipping:**
1. The seller can identify their sheet (URL + optional tab) without leaving the builder.
2. The seller can express all four real-world operations sellers actually need on a sheet (append, update-in-place, read, and upsert) without needing two nodes plus a conditional branch to fake upsert.
3. The configuration produced is unambiguous enough to hand to an execution engine later — column identity, target row, and field values must be fully specified, not left to runtime guesswork.

## 3. Success Metrics

No live usage exists yet (frontend-only prototype, no execution engine — see §0). Metrics below are the targets to instrument for once a backend exists; they cannot be measured today.

| Metric | Baseline | Target |
|---|---|---|
| % of flows using a Google Sheet node that reach "configured" (action selected + Save clicked at least once) | N/A (not instrumented) | 90%+ of flows where the node is dropped on canvas |
| % of configured Google Sheet nodes with `sheetConnected: true` at flow publish time | N/A | 100% — publishing with an unconnected sheet should be rare once validation exists (see §14) |
| Support tickets citing "Google Sheet node not working" / "row not added" per 100 active flows using the node | N/A (no real execution yet, so no signal) | Becomes meaningful only after real Sheets API execution ships |
| Time from dropping the node to first successful Save in the config modal | N/A | <60s median (proxy for "the config UI itself isn't the blocker") |

## 4. Who Uses This and When

**Persona 1 — The order-ops seller.** Runs an e-commerce store, wants every completed order logged to a shared spreadsheet their fulfillment team already watches. Emotional state: impatient, doesn't want to learn Apps Script. Success: drops the node after an "Order Placed" trigger, picks Add Row, maps 3–4 fields, moves on. Failure: gets stuck deciding between Header and Id mode with no sheet in front of them to check column letters against.

**Persona 2 — The CRM-sync seller.** Wants a lightweight CRM: every customer interaction should either create or update that customer's row. Emotional state: wants "just make it work" without designing two branches (check-then-decide). Success: uses Upsert Row, sets a lookup column (e.g. email), never has to think about "does this row already exist." Failure: doesn't realize Upsert always uses search-by-lookup (no row-number mode) and expects an option that isn't offered.

**Persona 3 — The lookup-and-personalize seller.** Wants to pull a customer's loyalty tier or order history from a sheet mid-flow to personalize a message. Emotional state: needs confidence the fetched data will actually be available as flow variables downstream. Success: uses Get Row Data, selects columns, sees the generated variable-prefix, and can reference `{{googleSheetGetRowData1.ColumnName}}` in a later node. Failure: doesn't realize column names/letters they type must exactly match the real sheet, since nothing here checks that against a live sheet.

## 5. User Flows

### 5.1 Happy path — Add Row from scratch

1. Seller drags "Google Sheet" from the Integrations palette onto the canvas → node renders unconfigured ("Click to configure").
2. Seller clicks the node → right panel opens, showing the Sheet Connection section (empty) above the 4-card action picker.
3. Seller pastes a Sheet URL. System: `patch({ sheetUrl })`, no validation.
4. Seller clicks Submit. System: `sheetConnected: true`, green "Connected" badge appears next to the URL field.
5. (Optional) Seller clicks Sync. System: button shows a spinner, disables, and after ~1.2s renders "Last synced just now" plus 6 fixed dummy column chips — **not the real sheet's actual columns**.
6. Seller clicks the "Add Row" card. System: `patch({ action: "add_row" })` and the config modal opens immediately.
7. Seller sets Column Identifier to Header, types 2–3 field rows (e.g. `Customer Name` → `{{customer.name}}`), sees the read-only "row number saved in" variable name, reads the tips box (share access with the service account email).
8. Seller clicks "Save configuration". System: modal closes, patches `data.addRow`, panel now shows a compact summary card ("Row added to Sheet · default · 3 field(s) mapped") with "Edit configuration" and "← Change action".
9. Canvas node updates its preview line to match. Seller wires the node's `Success` handle onward and continues building the flow.

### 5.2 Re-edit flow

1. Seller returns to an already-configured node, clicks "Edit configuration". System: modal reopens with the current `data.addRow` (or whichever action) as its local edit buffer — the panel's underlying node data is untouched until Save.
2. Seller adds a field row, then clicks Cancel. System: modal closes, `onSave` is never called — the node's persisted data is unchanged (verified in `GoogleSheetConfigModal.test.jsx`).
3. Seller reopens Edit configuration, makes the same edit, clicks "Save configuration" this time. System: `data.addRow.fields` is patched with the new row; the summary card's field count updates on the next render.

### 5.3 Switching actions

1. Seller has a configured Update Row node, decides they actually need Upsert Row. Clicks "← Change action". System: `patch({ action: null })` **and simultaneously resets `addRow`, `updateRow`, `getRow`, `upsertRow` back to their defaults** — any half-finished config on the previous action is discarded, not preserved for reuse.
2. Action picker reappears. Seller picks Upsert Row → modal opens fresh with default Upsert values.

**Persistent intermediate state note:** the config modal's local `useState` buffer is the only "draft" state in this flow — it exists only while the modal is open, is discarded on Cancel or on closing via the dialog's outside-click/escape handling (`onOpenChange` calls `onClose`), and is never persisted anywhere if the seller navigates away mid-edit (e.g. clicks another node) without clicking Save — this closes the modal via React unmount, equivalent to Cancel.

### 5.4 Failure / recovery (as far as the prototype models failure)

There is no real failure path today because there is no real network call. The closest the flow gets:
- Submit/Sync are both gated only on "Sheet URL is non-empty" — an obviously malformed URL (e.g. `"x"`) still succeeds. This is a known gap, not a designed failure state (see §8).
- The canvas node's `Failed` output handle exists as a wireable branch for a future real integration, but nothing in this prototype ever routes execution down it.

## 6. Functional Specification

### 6.1 Sheet Connection section (shared across all actions)

| Field | Type | Required | Validation | Default |
|---|---|---|---|---|
| `sheetUrl` | text | Yes, to enable Submit/Sync | None today (any non-empty string passes) | `""` |
| `sheetId` | text | No | None | `""` — helper copy: "For multiple sheets in file, specify Sheet ID" |
| Submit (action) | button | — | Disabled while `sheetUrl` is empty | — |
| Sync (action) | button | — | Disabled while `sheetUrl` is empty OR `sync.status === "syncing"` | — |

- **Default reasoning:** `sheetUrl`/`sheetId` default to empty because there's no seller-specific value to prefill; requiring Submit to be a deliberate click (rather than auto-connecting on blur) matches the explicit "Connected" badge model — the seller should know exactly when the system considers the sheet linked.
- Editing `sheetUrl` **after** `sheetConnected: true` immediately resets `sheetConnected: false` (badge disappears) — the system never displays a stale "Connected" state against a URL that hasn't been re-submitted.
- Editing `sheetUrl` does **not** reset `sync.status` — Sync and Submit are independent, per the modal-design spec's explicit out-of-scope note (§ Out of scope, "both are independent, per product decision").

### 6.2 Sync (mock)

| Field | Type | Notes |
|---|---|---|
| `sync.status` | enum `"idle" \| "syncing" \| "synced"` | Drives button label/spinner and whether the detected-columns block renders |
| `sync.lastSyncedAt` | timestamp or `null` | Set to `Date.now()` on fake completion; never displayed as an actual time, only as the static string "Last synced just now" |
| `sync.detectedColumns` | string array | Fixed to `GOOGLE_SHEET_DUMMY_COLUMNS` (6 hardcoded names) on every successful sync, regardless of `sheetUrl` |

Sync always takes exactly ~1.2s and always succeeds with the same 6 columns — there is no represented failure mode for Sync (see §8 for what real backend work this implies).

### 6.3 Action picker

Four cards, unconditionally available regardless of `sheetConnected`/`sync.status` (picking an action does not require the sheet to be connected first — a deliberate decision per the modal-design spec, not a gap):

| id | Label | Description |
|---|---|---|
| `add_row` | Add Row | Insert a new row into the sheet |
| `update_row` | Update Row | Modify an existing row's data |
| `get_row` | Get Row Data | Retrieve data from a row |
| `upsert_row` | Upsert Row | Update a row if found, else add a new one |

Selecting a card for the first time both sets `data.action` and opens `GoogleSheetConfigModal` immediately — there is no intermediate "action chosen, not yet configured" resting state.

### 6.4 Add Row (`data.addRow`)

| Field | Type | Required | Default |
|---|---|---|---|
| `columnIdMode` | enum `"header" \| "id"` | — | `"id"` |
| `fields` | array of `{ column, field }` | At least 1 row always present (not removable below 1) | `[{ column: "A", field: "" }]` |
| `rowNumberVar` | string, read-only | — | `"googleSheetAddRow1.rowNumber"` — the row number of the inserted row, exposed as a variable for downstream nodes |

In `id` mode, `column` is picked from a fixed A–Z dropdown (`COLUMN_LETTERS`). In `header` mode, `column` is free-text. `field` is always free-text (supports `{{variable}}` interpolation per the tips-box example copy).

### 6.5 Update Row (`data.updateRow`)

| Field | Type | Required | Default |
|---|---|---|---|
| `targetMode` | enum `"row_number" \| "search"` | — | `"search"` |
| `rowNumber` | number or `null` | Only meaningful when `targetMode === "row_number"` | `null` |
| `lookupColumn` / `lookupField` | text / text | Only meaningful when `targetMode === "search"` | `"A"` / `""` |
| `columnIdMode` | enum `"header" \| "id"` | — | `"id"` — governs both `lookupColumn` and every row in `fields` |
| `fields` | array of `{ column, field }` | At least 1 row | `[{ column: "A", field: "" }]` — improvement over the Bik reference behavior noted in the 2026-07-07 spec: supports multiple target columns per action |

### 6.6 Get Row Data (`data.getRow`)

| Field | Type | Required | Default |
|---|---|---|---|
| `targetMode` | enum `"row_number" \| "search"` | — | `"search"` |
| `rowNumber` / `lookupColumn`+`lookupField` | as above | as above | as above |
| `columnIdMode` | enum | — | `"id"` |
| `columns` | string array (multi-select, add via letter+Add or Enter-to-add text) | At least 1 for the output to mean anything (not enforced) | `[]` |
| `outputVarPrefix` | text, editable | — | `"googleSheetGetRowData1"` — each selected column becomes a sub-variable under this prefix |

### 6.7 Upsert Row (`data.upsertRow`)

| Field | Type | Required | Default |
|---|---|---|---|
| `lookupColumn` / `lookupField` | text / text | Always in search mode — no row-number variant, since the entire point is deciding add-vs-update from a match | `"A"` / `""` |
| `columnIdMode` | enum | — | `"id"` |
| `fields` | array of `{ column, field }` | At least 1 row | `[{ column: "A", field: "" }]` — same shared list written on either the update or the append path |
| `rowNumberVar` | string, read-only | — | `"googleSheetUpsertRow1.rowNumber"` |
| `wasAddedVar` | string, read-only | — | `"googleSheetUpsertRow1.wasAdded"` — boolean, lets downstream nodes branch on which path was taken |

### 6.8 Config modal mechanics

- `initialData` seeds a local edit buffer (`useState`) scoped to the action being edited; `Save` calls `onSave(localBuffer)`, which patches only `data[actionKey]` on the node, then closes; `Cancel`/outside-click/escape discard the buffer entirely.
- Save has **no validation gate** — always enabled, matching the current product decision recorded in the 2026-07-10 modal spec ("Out of scope: Validation/required-field gating on Save").
- Sheet URL/Sheet ID are explicitly excluded from the modal (`GoogleSheetConfigModal.test.jsx`: "does not render Sheet URL or Sheet ID fields") — they live only in the panel's Sheet Connection section, since they're shared across all four actions.

### 6.9 Canvas node output branches

| Handle | Color | Meaning | Downstream behavior if unwired |
|---|---|---|---|
| `Success` | Green | Sheet operation succeeded | Flow simply doesn't continue past this node on that branch — no error surfaced, since nothing executes today |
| `Failed` | Red | Sheet operation failed | Same as above |

## 7. States

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|---|---|---|---|---|---|
| Empty (canvas, unconfigured) | Node just dropped | Dashed border, "Google Sheet" label, "Click to configure" | Click to open panel | None | Clicking the node |
| Empty (panel, no action) | Panel opened, `data.action` is `null` | Connection section + 4-card picker, no summary card | Fill URL, Submit, Sync, pick an action | None until an action card is clicked | Picking an action |
| Loading (Sync in progress) | Sync clicked | Spinner + "Syncing…" on the Sync button; Sync button disabled | Wait (Submit remains clickable) | `setTimeout` fires after ~1.2s | Timer completion (always succeeds — no error branch modeled) |
| Success (Sync complete) | Timer fires | Green check "Last synced just now" + 6 fixed column chips | Re-click Sync to re-run | Overwrites `sync` with the same fixed dummy columns every time | Editing `sheetUrl` does NOT clear this state (only Submit's badge is coupled to URL edits) |
| Connected (Submit) | Submit clicked with non-empty URL | Green "Connected" badge next to URL field | Edit URL to invalIDate | `sheetConnected: true` | Editing `sheetUrl` (clears to `false`) |
| Configured (action set, modal closed) | Action picked once + modal closed (Save or auto-open-then-Save) | Summary card with one-line description + field/mapped count, "Edit configuration", "← Change action" | Edit configuration, Change action | None | Change action (resets to Empty-panel state) or Edit configuration (reopens modal) |
| Draft (modal open) | Action card clicked (first time) or "Edit configuration" clicked | Modal with the action's full field set, Cancel/Save footer | Edit any field, Cancel, Save | Local buffer only, no node patch yet | Save (commits + closes) or Cancel/outside-click/escape (discards + closes) |
| Read-only (output variable fields) | Add Row / Upsert Row's `rowNumberVar`/`wasAddedVar` fields | Greyed input, not editable | None — copy-paste only (no explicit copy button) | Auto-named, numbered per action instance (`...1`, would need `...2` etc. for a second node — not verified whether numbering increments across multiple nodes; see §14) | N/A |
| Limit-reached | N/A | Not applicable — no field-count cap, no quota gating exists anywhere in this node | — | — | — |

## 8. Edge Cases

**Situation:** Seller pastes a non-Google-Sheets URL (e.g. a random webpage link) into Sheet URL.
**Wrong behavior:** Submit still succeeds and shows "Connected"; Sync still succeeds and shows the same 6 fixed dummy columns, implying the system read that URL as a valid sheet.
**Correct behavior (once backend exists):** Submit/Sync should call a real endpoint that validates the URL resolves to an actual accessible Google Sheet, and surface a distinct failure state (see §14 — not designed today).

**Situation:** Seller clicks Sync before sharing the sheet with the service account (`engagetechsupport@shiprocket.com`).
**Wrong behavior:** Today, Sync always "succeeds" after 1.2s regardless of access — the seller gets false confidence their access grant worked.
**Correct behavior:** Sync should fail with a specific "no access — share the sheet first" message distinct from a generic error, since this is the single most common setup mistake this node's own tips-box copy is trying to prevent.

**Situation:** Seller types a column letter (Id mode) or header name that doesn't actually exist in their real sheet (e.g. `Z` when the sheet only has 6 columns, or a typo'd header).
**Wrong behavior:** Nothing in the UI catches this — the field accepts anything, and there's no live sheet to check against (detected columns from Sync aren't wired into the field pickers at all).
**Correct behavior:** Once `sync.detectedColumns` reflects a real sheet, `Header`-mode fields should be validated (or better, populated as a dropdown) against that list instead of free-text.

**Situation:** Seller changes `columnIdMode` from `Id` to `Header` (or back) after already filling in `fields`/`lookupColumn` values.
**Wrong behavior:** Existing letter values (e.g. `"B"`) are silently left in place as the seller switches to Header mode, now displayed in a free-text input as if `"B"` were a header name — likely wrong, with no warning that the mode switch didn't clear/translate anything.
**Correct behavior:** Either clear dependent fields on mode switch (as the sibling trigger's Step 1 spec chose to do for its own column-mode toggle) or translate known values — but do not leave a stale value silently misrepresented under the new mode.

**Situation:** Seller has zero rows in `fields` (Add Row / Update Row / Upsert Row).
**Wrong behavior:** Not reachable today — `FieldRowList` only allows removing a row when `fields.length > 1`, so the array can never go below 1 element. This is correct behavior already, just worth stating as a deliberate floor, not an oversight.
**Correct behavior:** (already satisfied) — always at least 1 field row.

**Situation:** Seller clicks "← Change action" with unsaved-but-committed configuration on the current action (e.g. a fully-filled Add Row).
**Wrong behavior:** None per se — behavior is defined (resets all four action sub-objects to defaults) — but it is a **silent, irreversible** reset with no confirmation, which will read as data loss to a seller who didn't intend to discard their Add Row setup just to preview Upsert Row.
**Correct behavior:** Confirm before discarding a populated configuration, or preserve per-action sub-objects independently so switching back and forth doesn't lose work. (Explicitly a known non-goal in the 2026-07-07 spec §8 — "No 'Change Action' confirmation dialog" — flagged here again because it remains a real risk, not because it's unaddressed by design.)

**Situation:** Two Google Sheet nodes exist in the same flow, both using Add Row.
**Wrong behavior/uncertain:** Both nodes' `rowNumberVar` defaults to the literal string `"googleSheetAddRow1.rowNumber"` — there's no evidence in the code that this number increments per node instance. If both nodes keep the same variable name, a downstream reference to `{{googleSheetAddRow1.rowNumber}}` is ambiguous about which node it means.
**Correct behavior:** Needs a real per-instance uniqueness scheme (e.g. node ID-based suffix) once this matters for actual variable resolution — flagged in §14, not resolved by this PRD.

**Situation:** Seller clicks Sync twice in a row before the first cycle completes.
**Wrong behavior:** Not reachable — the Sync button is `disabled` while `status === "syncing"`, so a second click can't fire mid-cycle. Confirmed correct, not a gap.
**Correct behavior:** (already satisfied.)

**Situation:** Modal is closed by outside-click/escape rather than an explicit Cancel button click.
**Wrong behavior/uncertain:** `Dialog`'s `onOpenChange` routes to the same `onClose` as Cancel, so this should discard identically — but this specific path is not covered by an explicit test (`GoogleSheetConfigModal.test.jsx` only exercises the Cancel button, not outside-click/escape dismissal). Behaviorally should be identical; flagged as a test gap, not a known defect.
**Correct behavior:** Confirm with a test that outside-click/escape dismissal discards edits exactly like the Cancel button does.

## 9. Non-Functional Requirements

- **Performance:** All current interactions are local state updates — no network latency exists to budget for yet. Once real Sheets API calls exist, Submit (existence/access check) and Sync (schema read) should each resolve in well under the seller's patience threshold for a "connect a service" flow — target <3s for Submit, <5s for Sync on a typical sheet, with the loading state (already modeled, just currently timer-driven) covering the wait.
- **Scale:** No volume constraints modeled today (mock data, no real reads/writes). Once real: Google Sheets API imposes both per-project and per-100-seconds rate limits (100 requests/100s/user is Google's standard default for the Sheets API) — a seller with many flows each polling/writing to sheets could hit this; needs to be designed for once real execution exists, not addressed here.
- **Security:** The service-account email (`engagetechsupport@shiprocket.com`) is a static string shared across all sellers/sheets — every seller grants the *same* service account access to *their own* sheet. This is a legitimate model (matches the reference Bik behavior per the 2026-07-07 spec §2) but means credential/scope isolation between sellers' sheets is entirely enforced by Google's own per-sheet sharing, not by anything in this app — worth explicitly confirming with security review once real API calls are added, since a single compromised service-account credential would have access to every seller's shared sheet.
- **Reliability:** N/A today (no dependency to be unreliable). Once real: the node's `Failed` output handle already exists as a UI affordance for "the sheet operation didn't succeed" — this needs to become the actual behavior on Sheets API errors (auth failure, sheet deleted, rate limit, network error) rather than remaining an unreachable branch.

## 10. Analytics & Instrumentation

Nothing is instrumented today. Recommended events once shipped for real:

| Event | Trigger | Properties | Purpose |
|---|---|---|---|
| `gsheet_node_action_selected` | Seller clicks an action card | `action` (add_row/update_row/get_row/upsert_row), `flow_id`, `node_id` | Which actions are actually used, to prioritize future improvements |
| `gsheet_node_config_saved` | Save clicked in modal | `action`, `field_count`, `column_id_mode` | Configuration complexity in the wild |
| `gsheet_node_sheet_submit` | Submit clicked | `flow_id`, `had_prior_connection` (bool) | How often sellers reconnect vs. connect once |
| `gsheet_node_sync_attempted` | Sync clicked | `flow_id` | Precursor metric for eventual sync success/failure rate once real |
| `gsheet_node_change_action` | "← Change action" clicked | `previous_action`, `had_configured_fields` (bool) | Measures how often the silent-reset edge case (§8) actually bites someone |

**Reporting metrics:** "Configuration completion rate" = `gsheet_node_config_saved` / (node dropped on canvas) per flow, attributed at flow-save time, no attribution window needed since this is a same-session UI funnel, not a marketing conversion.

## 11. Copy

Existing tips-box copy per action (verbatim, already shipped):

> Please give edit access to "engagetechsupport@shiprocket.com" for this action to work.

Add Row additionally:
> Don't use special characters for value inputs.
> Value input example – {{customer.name}}, {{Order.ID}}, ...

Get Row Data additionally:
> The data will be saved as variables under this name, with sub-names corresponding to each selected column.

Upsert Row additionally:
> If no row matches the lookup value, a new row is appended with the field(s) above.
> Don't use special characters for value inputs.

Connection section:
> The URL for the Google Sheet
> For multiple sheets in file, specify Sheet ID

Sync success state:
> Last synced just now

**Copy gaps to fill once real backend exists** (none of the below exist today because there's no failure mode to word):
- Submit failure ("This doesn't look like a Google Sheet link — check the URL and try again," rather than a generic error) — must name the problem, not just fail silently.
- Sync failure due to no access ("We can't read this sheet yet — share it with engagetechsupport@shiprocket.com (Editor access) and try again") — distinct from a generic network failure, since access is the most common real-world blocker.
- Runtime failure surfaced wherever flow-run history/logs eventually exist ("Couldn't add the row — [specific reason]"), routed through the `Failed` handle.

## 12. Dependencies

| Dependency | What's needed | If unavailable | Degrades or fails | Owner |
|---|---|---|---|---|
| Google Sheets API | Real read/write calls for Submit/Sync/Add/Update/Get/Upsert | Today: N/A, everything is mocked. Once real: node becomes entirely non-functional | Fails completely (no fallback mode makes sense for a sheet-writing action) | Backend team (not yet assigned — no backend integration exists) |
| Google service-account credential management | A backend-held credential the app authenticates as, matching the public-facing `engagetechsupport@shiprocket.com` | Same as above | Fails completely | Backend team |
| Flow execution engine | Something that actually runs a published flow's nodes in order, including this one | Does not exist anywhere in this codebase today (per the trigger spec's findings, confirmed no cron/queue/execution infra) | This entire node is inert without it — configuring it has zero runtime effect | Not yet scoped as a project |

## 13. Out of Scope

- **Real Google Sheets API integration** — reason: this is a frontend-only prototype (see Dependencies); building it requires backend credential management and an execution engine that don't exist yet. Prerequisite: a scoped backend project (not this PRD).
- **Field/required-value validation on Save** — reason: explicit product decision recorded in the 2026-07-10 modal spec, consistent with the rest of this builder's nodes not gating Save on completeness.
- **Live column-name/letter autofetch into the config modal's fields** — reason: `sync.detectedColumns` exists but is intentionally decorative (mocked columns, not wired to field pickers) in this pass; a real fetch is the natural next step once Sync is real, not before.
- **Delete Row, Clear Row/Range, bulk/whole-sheet read, new-tab creation** — reason: not offered by the reference behavior (Bik) this node was modeled on; flagged for a future spec if seller demand appears (per 2026-07-07 spec §9).
- **Confirmation dialog on "Change action"** — reason: explicit non-goal, though flagged again in §8 as a real risk worth revisiting.
- **Trigger-on-new-row** — reason: that's the separate "Google Sheet Data Entry" start trigger, out of scope for this node PRD entirely.

## 14. Open Questions

1. **Does `rowNumberVar`/`outputVarPrefix`/`wasAddedVar` numbering actually increment per node instance, or do all Add Row nodes in a flow collide on `googleSheetAddRow1.rowNumber`?** Why open: not evidenced anywhere in the read code or tests — the literal string is a static default, and no per-instance counter was found. Owner: engineering. Resolves via: reading/testing multi-node-instance behavior directly, or deciding this needs a fix.
2. **What should Submit/Sync failure actually check and say, once real?** Why open: no backend exists yet to define the real failure taxonomy (bad URL vs. no access vs. rate-limited vs. sheet deleted). Owner: product + backend, once the integration project is scoped. Resolves via: a follow-up spec alongside the backend integration itself.
3. **Should "← Change action" get a confirmation dialog, given the silent-data-loss risk in §8?** Why open: explicitly deferred twice now (2026-07-07 spec and this PRD) without a final call. Owner: product. Resolves via: a product decision, independent of any backend work — this is buildable today.
4. **Should the sheet-connection state (`sheetConnected`, `sync`) live at the node level (today's model — one URL/sync-state per node) or be promoted to a flow-level/reusable "connection" concept if a seller uses the same sheet across multiple nodes?** Why open: today, two Google Sheet nodes pointing at the same URL each maintain independent `sheetConnected`/`sync` state, meaning a seller must Submit+Sync per node even for the identical sheet. Owner: product/design. Resolves via: seller research on how often multi-node-same-sheet actually happens.

## 15. Decision Log

- **Decision:** Move all per-action fields into a central modal (`GoogleSheetConfigModal`) instead of rendering them inline in the right panel. Alternatives considered: keep inline (original 2026-07-07 design). Rationale: matches a newer pattern already established elsewhere in the codebase (`ConditionalSplitNode`'s filter modal) and keeps the panel short regardless of which action is selected. Tradeoff accepted: an extra click (open modal) to see/edit config that used to be visible at a glance in the panel.
- **Decision:** Make Sheet URL/Sheet ID panel-level fields, shared across all four actions, rather than duplicated per-action. Alternatives considered: none documented — this was true even in the original inline design (`CommonSheetFields`). Rationale: one sheet connection per node, regardless of which action that node performs. Tradeoff accepted: none significant — this was already the shape of the data.
- **Decision:** Mock Sync with a fixed delay and fixed dummy column list, rather than leaving Sync unbuilt. Alternatives considered: no Sync affordance at all until real backend exists. Rationale: lets design/product validate the "connect → see confirmation → see your columns" interaction shape before investing in the real integration. Tradeoff accepted: risk of the mock reading as real to a QA/demo audience unless clearly caveated (this PRD's §0 exists partly to make that gap explicit).
- **Decision:** Gate action selection and sheet connection independently (no requirement to Submit/Sync before picking an action, or vice versa). Alternatives considered: require a connected sheet before allowing action configuration. Rationale: explicit product decision recorded in the 2026-07-10 spec's Out of Scope section. Tradeoff accepted: a seller can fully configure an action against a sheet they never actually connected, then discover the access problem only once real execution exists.
- **Decision:** Upsert Row has no row-number targeting mode (search-only), unlike Update Row and Get Row Data. Alternatives considered: offer the same row-number/search toggle for symmetry. Rationale: if the seller already knows the row number, the ambiguity Upsert exists to resolve (does this row exist or not) is already answered — they should use Update Row instead. Tradeoff accepted: slight asymmetry across the four actions' UI, in exchange for not offering a mode that doesn't make conceptual sense for Upsert's purpose.
