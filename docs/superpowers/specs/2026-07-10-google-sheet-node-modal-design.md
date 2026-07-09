# Google Sheet Node — Modal Config + Sync Mock Design

## Context

`GoogleSheetNode` (used identically in FlowBuilder and FlowBuilderV2, both wired
through the shared `ConfigTab.jsx`) currently renders all 4 action configs
(Add Row, Update Row, Get Row Data, Upsert Row) inline in the right panel once
an action is picked. This makes the panel long and inconsistent with newer
patterns in the codebase (e.g. `ConditionalSplitNode`'s filter modal), which
use a compact summary + "Edit" button in the panel and push full configuration
into a `Dialog`-based modal.

This spec covers:
1. Moving each action's configuration UI into a central modal.
2. Adding a Submit + Sync affordance for the Sheet URL, with Sync mocked
   (no real backend call).

## 1. Right panel restructure (`GoogleSheetRightPanel.jsx`)

Panel becomes three stacked sections, always visible, no gating between them:

- **Sheet Connection** (new, top of panel): Sheet URL input, Sheet ID input
  (moved out of per-action fields since they're shared across all 4 actions),
  a **Submit** button, and a **Sync** button (see §3).
- **Action picker**: unchanged — the existing 4-card `ActionPicker`.
- **Configured action summary**: once `data.action` is set, render a compact
  summary card using the shared one-line summary (§4) instead of expanding
  all fields inline, plus:
  - **Edit configuration** button → opens `GoogleSheetConfigModal`.
  - Existing "← Change action" link (resets `action` to null).

Clicking an action card for the first time opens the modal immediately
(consistent with picking = configuring); subsequent edits go through
"Edit configuration".

## 2. `GoogleSheetConfigModal.jsx` (new file)

Location: `src/components/flows/builder/nodes/GoogleSheetNode/GoogleSheetConfigModal.jsx`

Follows the `ConditionalFilterModal.jsx` pattern: a `Dialog`/`DialogContent`
wrapping a body component keyed by `action`. Props:

```
GoogleSheetConfigModal({ open, onClose, action, initialData, onSave })
```

- `initialData` is the current `data[actionKey]` sub-object (e.g. `data.addRow`)
  for the action being edited.
- Body renders exactly today's inline fields for that action, unchanged:
  - `add_row`: `SegmentedToggle` (columnIdMode) + `FieldRowList` + read-only
    "row number saved in" field + `TipsBox`.
  - `update_row`: target mode toggle, row number / lookup column+field,
    columnIdMode toggle, `FieldRowList`, `TipsBox`.
  - `get_row`: target mode toggle, row number / lookup column+field,
    columnIdMode toggle, `ColumnMultiSelect`, output var prefix field, `TipsBox`.
  - `upsert_row`: lookup column+field, columnIdMode toggle, `FieldRowList`,
    read-only row number/was-added vars, `TipsBox`.
- **No** Sheet URL/Sheet ID fields in the modal — those live in the panel only.
- Local `useState` holds in-progress edits; `Cancel` discards them and closes;
  `Save` calls `onSave(localState)` (patches `data[actionKey]` in the node)
  and closes. Save is always enabled (no field validation), consistent with
  current behavior and `ConditionalFilterModal`.
- `ActionPicker`, `SegmentedToggle`, `CommonSheetFields` (removed),
  `FieldRowList`, `ColumnMultiSelect`, `TipsBox` helper components move from
  `GoogleSheetRightPanel.jsx` into this new modal file except `ActionPicker`,
  which stays in the panel, and `CommonSheetFields`, which is repurposed for
  the panel's Sheet Connection section.

## 3. Sync mock behavior

New node-data field:

```js
sync: {
  status: "idle" | "syncing" | "synced",
  lastSyncedAt: null, // timestamp, set on fake completion
  detectedColumns: [], // e.g. ["Order ID", "Customer Name", ...]
}
```

- **Submit**: enabled whenever Sheet URL is non-empty. Sets
  `data.sheetConnected = true` and shows a green "Connected" badge next to the
  Sheet URL field. Re-editing the URL after submit clears the badge
  (`sheetConnected: false`) until re-submitted.
- **Sync**: enabled whenever Sheet URL is non-empty (independent of Submit).
  On click:
  1. `patch({ sync: { status: "syncing", lastSyncedAt: null, detectedColumns: [] } })`
  2. After a fixed ~1.2s `setTimeout`, `patch({ sync: { status: "synced",
     lastSyncedAt: <timestamp>, detectedColumns: [dummy list] } })`.
  - Dummy list is fixed: `["Order ID", "Customer Name", "Phone Number",
    "Email", "Status", "Amount"]`.
  - While `status === "syncing"`, button shows a spinner and is disabled.
  - Once `status === "synced"`, render a green check + "Last synced just now"
    + the detected columns as read-only chips below the button row.
  - No real network/API call is made anywhere in this flow.
  - Re-clicking Sync re-runs the same fake cycle from the top.

## 4. Shared summary util (reuse)

`index.jsx` currently has `getPreviewLine(data)` used for the canvas-node
preview line. Extract it into
`src/components/flows/builder/nodes/GoogleSheetNode/data/summary.js` as
`getGoogleSheetSummary(data)`, and use it in both:
- `index.jsx` (canvas node preview, unchanged output).
- `GoogleSheetRightPanel.jsx` (new configured-action summary card).

Extend it so `add_row` and `upsert_row` also report field-mapping counts for
the panel summary card, e.g. `"3 field(s) mapped"` (the canvas preview keeps
its existing shorter text — summary.js can return both a `short` and `panel`
variant, or the panel can compose additional detail on top of the existing
short line — implementer's choice, as long as no logic is duplicated).

## 5. Testing

- Update `GoogleSheetRightPanel.test.jsx`: panel shell (connection section,
  action picker, summary card + edit button), Submit badge behavior, Sync
  fake-timer flow (`syncing` → `synced` with detected columns).
- New `GoogleSheetConfigModal.test.jsx`: field sets per action, Save commits
  to node data via `onSave`, Cancel discards edits, no Sheet URL/ID fields
  present in modal.
- `GoogleSheetNode.test.jsx`: verify canvas preview lines still render
  correctly after `getPreviewLine` is extracted to `summary.js`.

## Out of scope

- Any real Google Sheets API integration — Sync remains fully mocked.
- Validation/required-field gating on Save.
- Gating action selection on Sheet URL submission (both are independent, per
  product decision).
