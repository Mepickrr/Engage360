# Google Sheet Data Entry Start Trigger — Design Spec

**Date:** 2026-07-08
**Status:** Approved for implementation (frontend-only)
**Audience:** Internal product team, engineers
**Scope:** New start-trigger kind for Flow Builder (v1 and v2 — they share the same wizard) that represents a flow starting when a new row is added to a connected Google Sheet. **Frontend UX only** — no backend, no live Google Sheets API calls, no scheduler/poller. See §4 for what real backend work this defers.

---

## 1. Overview

Sellers can already read from and write to a Google Sheet mid-flow via the Google Sheet **node** (`docs/superpowers/specs/2026-07-07-google-sheet-node-design.md`) — that's what the flow *does* once it's running. This spec is a different, independent concept: a start **trigger** — what *starts* the flow in the first place. That node spec explicitly deferred "trigger flow on new row" as a non-goal, noting it "would require real backend polling/webhook infrastructure... a significant scope jump beyond a frontend-only prototype" (§9).

This spec adds that trigger as a new kind, `google_sheet_new_row`, seller-facing label **"Google Sheet Data Entry"**, alongside the existing kinds (`event`, `webhook`, `broadcast`, `date_relative`, `event_offset`, `broadcast_source`) surfaced in `StartTriggerWizard.jsx`. It is placed under the existing **"Webhook and API"** catalogue header, in the **"External signals"** section, next to "Webhook trigger" — both represent an external system/data source starting the flow.

**Why not the existing "Webhook" trigger kind:** Google Sheets does not push webhooks natively. Making this work as a true webhook would require the seller to install and authorize an Apps Script snippet inside their own sheet — extra setup burden, and it silently breaks if the seller edits or deletes that script. It also turns out the existing "Webhook" trigger kind has no working backend receiver behind it today (`webhookHelpers.js::generateWebhookUrl()` only builds a display string) — so there is no working webhook infrastructure to reuse in the first place. A polling model (seller shares the sheet with a service account, we periodically check for new rows) needs zero extra seller setup and reuses an access grant sellers already understand. This spec adopts polling as the target model, but **only builds the UX for it now** — see §4.

**Why frontend-only:** This entire codebase is a frontend prototype today — no node/step execution engine, event bus, queue, or scheduled-job infrastructure exists (confirmed: no cron/queue libraries in `package.json`/`requirements.txt`; `backend/routes/flows.py` is pure CRUD). Building a real, working trigger would mean building that infrastructure from scratch, which is out of scope for this pass. This spec follows the same convention already established for the Google Sheet node itself (no live API calls, no "Verify access" button, per that spec's §8) — the trigger is configurable and saved like any other trigger kind, but nothing actually polls anything yet.

---

## 2. Seller-Facing UX

### 2.1 Trigger Picker

`google_sheet_new_row` is added as a new card, **"Google Sheet Data Entry"**, in the trigger catalogue (`eventCatalogue.json`) under the existing **"Webhook and API"** header → **"External signals"** section, alongside "Webhook trigger".

### 2.2 Step 1 — "Configure Google Sheet Data Entry"

New component `GoogleSheetTriggerStep1.jsx`, following the structural pattern of `WebhookTriggerStep1.jsx`:

| Field | Behavior |
|---|---|
| **Sheet URL*** | Text input, same placeholder/helper as the Google Sheet node's `CommonSheetFields`. |
| **Sheet ID (Optional)** | Text input — targets a specific tab in a multi-tab file, same convention as the node. |
| **Column Identifier** | `Header` / `Id` toggle, same convention as the node. Switching modes clears captured columns and the contact-identifier selection (their meaning depends on the mode). |
| **Columns to capture as variables** | Chip-based multi-select: in `Id` mode, pick a column letter (A–Z) and click Add; in `Header` mode, type a header name and press Enter. Mirrors the node's `ColumnMultiSelect` (Get Row Data) pattern. Manual entry, no live fetch — consistent with the node's non-goal of no live header fetch. |
| **Contact identifier column** | Dropdown populated from the columns captured above. Tells us which column value identifies the contact the flow should run for (e.g. `Phone` or `Email`). Required. |
| **Check for new rows (poll interval)** | Dropdown: 1 / 5 / 15 / 30 / 60 minutes, default 5. This is configuration the seller sets now; it has no runtime effect yet since no poller exists (§4). |
| **Simulate a new row** (optional) | Since there's no live connection to pull a real row from, the seller can type one sample value per captured column and click "Simulate New Row" to see a local preview of variable count and which value resolves as the contact identifier — mirrors the Webhook trigger's "Paste Sample Payload" + "Send Test Event" pattern, adapted to manual column entry instead of pasted JSON. |
| Tips box (static) | Same service-account sharing copy as the node: "Please give edit access to `engagetechsupport@shiprocket.com` for this trigger to work," plus a note that new rows should be appended at the bottom, not inserted mid-sheet. |
| Baseline notice (static copy) | "Only rows added after you save this trigger will start the flow. Existing rows in the sheet won't trigger it." — sets correct expectations for when this becomes real. |

Finish is disabled until: Sheet URL is present, at least one column has been captured, and a contact identifier column is selected.

**Explicitly not included (deferred with the backend, §4):** a live "Verify access" button, live-fetched real header names, and any actual polling. These require a live Sheets API connection this pass does not build.

### 2.3 Step 2 — "Who"

Skipped (`skipStep2`), same mechanism as broadcast-type triggers — achieved by setting `audience_qualification_allow: false` on the catalogue entry, no special-casing needed. The contact identifier column in Step 1 already resolves who the flow runs for; there is no separate audience-qualification concept for a per-row trigger.

### 2.4 Canvas / Trigger Node Summary

`StartTriggerNode.jsx` shows the sheet URL, "Checked every N minute(s)", and (once set) "Contact: `<column>` · N column(s) captured" — driven by a new `summariseGoogleSheet()` case in `triggerNodeUtils.js`.

---

## 3. Seller-Side Setup Checklist (as designed — not yet functionally wired to anything)

1. Have a Google Sheet with a header row; new entries appended at the bottom.
2. Share the sheet with `engagetechsupport@shiprocket.com`, Editor access — same grant sellers already make for the Google Sheet node.
3. In the Start Trigger Wizard, pick "Google Sheet Data Entry" under "Webhook and API".
4. Paste the Sheet URL (+ Sheet ID if targeting a specific tab).
5. Capture the columns this flow needs as variables, and choose the contact-identifier column.
6. Choose a poll interval.
7. (Optional) Simulate a sample row to sanity-check the setup.
8. Finish and publish the flow.

Step 8 onward — actually starting flows from real sheet activity — requires the backend work in §4, which is not built in this pass.

---

## 4. Backend Infrastructure (net-new, explicitly NOT built in this pass)

Deferred to a future spec once/if backend investment is greenlit. Recorded here so the frontend config shape anticipates it correctly:

- **Poller/scheduler**: one scheduled job per active `google_sheet_new_row` trigger, run at its configured interval.
- **Row-diff logic (append-only assumption)**: each poll reads the sheet via the Sheets API, compares current row count against the last-seen row count, and treats any newly-present rows as new-row events.
- **Flow start**: each detected new-row event resolves the contact via the configured identifier column and starts one flow run for that contact, using the row's column values as flow variables.
- **Lifecycle**: poller starts when the flow is published, stops when paused/unpublished, reusing the existing flow status transitions (`backend/routes/flows.py`).
- **Live "Verify access" + header fetch**: a real Sheets API call to replace the manual column entry and enable the "Verify Access" button described as a want, not a build, in the original draft of this spec.

None of the above exists after this pass — the frontend config (`sheetUrl`, `sheetId`, `columnIdMode`, `columns`, `contactIdentifierColumn`, `pollIntervalMinutes`, `sampleValues`) is shaped so it can be consumed by this backend later without a config migration.

---

## 5. Non-Goals / Known Limitations (this pass)

- **No backend of any kind** — no live Sheets API calls, no scheduler, no execution engine. The trigger can be fully configured and saved, but nothing will actually start a flow from sheet activity.
- **No live "Verify access" or header auto-fetch** — columns are captured manually (letter or typed header text), consistent with the Google Sheet node's existing manual-entry convention.
- **Not real-time even once built.** Latency will be bounded by the configured poll interval (min 1 minute), not instant — this is a product decision independent of the frontend/backend split.
- **Append-only assumption** (once backend exists): rows inserted mid-sheet or reordering of existing rows are not distinguished from genuinely new rows. Flagged as a known future limitation, not solved here.
- **No Drive API push-notification / Apps Script push option** — considered and rejected in favor of polling; see prior draft rationale (push notifications are file-level, expire and need renewal; Apps Script push needs the seller to install/authorize a script). May be revisited later if sub-minute latency is required.
- **No retro-fire for existing rows** at connect time (see baseline notice, §2.2) — by design, not a gap.

---

## 6. File Structure (additive, frontend only)

```
src/components/flows/builder/trigger/
  GoogleSheetTriggerStep1.jsx     ← new, mirrors WebhookTriggerStep1.jsx structure
  googleSheetTriggerHelpers.js    ← new, pure helpers (empty config, simulate-sample-row, poll interval options); reuses COLUMN_LETTERS / GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL from the node's mockData.js

src/data/eventCatalogue.json      ← add "Google Sheet Data Entry" card under "Webhook and API" → "External signals" (and the mirrored "ALL" bucket copy), audience_qualification_allow: false
StartTriggerWizard.jsx            ← route "step1" content to GoogleSheetTriggerStep1 for this kind, add Finish-button validity gate
triggerNodeUtils.js               ← add summariseGoogleSheet() case for google_sheet_new_row
StartTriggerNode.jsx              ← add GoogleSheetEntryBlock canvas rendering
```

Both Flow Builder v1 and v2 render `StartTriggerWizard` directly with no trigger-kind allow-list, so this is automatically available in both with no v2-specific code.
