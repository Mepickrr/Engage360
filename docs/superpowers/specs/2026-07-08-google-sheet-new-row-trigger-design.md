# Google Sheet "New Row" Start Trigger — Design Spec

**Date:** 2026-07-08
**Status:** Draft — pending review
**Audience:** Internal product team, engineers
**Scope:** New start-trigger kind for Flow Builder that starts a flow when a new row is added to a connected Google Sheet, plus the backend polling infrastructure it requires.

---

## 1. Overview

Sellers can already read from and write to a Google Sheet mid-flow via the Google Sheet node (`docs/superpowers/specs/2026-07-07-google-sheet-node-design.md`). That spec explicitly deferred "trigger flow on new row" as a non-goal, noting it "would require real backend polling/webhook infrastructure... a significant scope jump beyond a frontend-only prototype" (§9).

This spec covers that scope jump: a new start-trigger kind, `google_sheet_new_row`, alongside the existing kinds (`event`, `webhook`, `broadcast`, `date_relative`, `event_offset`, `broadcast_source`) surfaced in `StartTriggerWizard.jsx`. When a seller adds a row to a connected sheet, the flow starts for the contact identified by that row.

**Why not the existing "Webhook" trigger kind:** Google Sheets does not push webhooks natively. Making this work as a true webhook would require the seller to install and authorize an Apps Script snippet inside their own sheet — extra setup burden, and it silently breaks if the seller edits or deletes that script. It also turns out the existing "Webhook" trigger kind has no working backend receiver behind it today (`webhookHelpers.js::generateWebhookUrl()` only builds a display string) — so there is no working webhook infrastructure to reuse in the first place. Polling via the same service-account credentials already used by the Google Sheet node needs zero extra seller setup and reuses an access grant sellers already understand, at the cost of near-real-time latency. This spec adopts polling.

---

## 2. Seller-Facing UX

### 2.1 Trigger Picker

`google_sheet_new_row` is added as a new entry in the trigger catalogue surfaced by `EventPickerModal` (backed by `eventCatalogue.json`), under an "Integrations"-style grouping alongside other data-source triggers.

### 2.2 Step 1 — "Configure Google Sheet Trigger"

New component `GoogleSheetTriggerStep1.jsx`, following the structural pattern of `WebhookTriggerStep1.jsx`:

| Field | Behavior |
|---|---|
| **Sheet URL*** | Text input, same placeholder/helper as the Google Sheet node's `CommonSheetFields`. |
| **Sheet ID (Optional)** | Text input — targets a specific tab in a multi-tab file, same convention as the node. |
| **Poll interval** | Dropdown: 1 / 5 / 15 / 30 / 60 minutes. Default 5. Helper text: "We'll check this sheet for new rows every N minutes." Floor of 1 minute enforced (no free-text entry) to protect Sheets API quota (300 read requests/100s/project) and polling cost as usage scales across sellers. |
| **Verify access** button | Live call to the Sheets API (via the same service-account credentials as the node) confirming read access, and fetching the real header row. Unlike the node (which has no live-check by explicit decision, §8 of the node spec), a live check here is required: a bad connection on an action node fails loud and immediately; a bad connection on a trigger fails silent and forever, since nothing else would ever surface it. Must succeed before the seller can complete Step 1. |
| **Header/column preview** | Populated from the live Verify Access call (not manually typed, unlike the node's column fields) — shown as a read-only list, e.g. "Customer Name, Phone, Order ID...". Re-fetchable via a "Refresh" link if the seller edits their sheet's headers after connecting. |
| **Contact identifier column** | Dropdown of the fetched headers. Tells us which column value identifies the contact the flow should run for (e.g. `Phone` or `Email`). Required — mirrors the "unique-ID mapping" concept already present in `WebhookTriggerStep1.jsx`. |
| Tips box (static) | Same service-account sharing copy as the node: "Please give edit access to `engagetechsupport@shiprocket.com` for this trigger to work." Editor access is requested (not Viewer) for consistency with the node, even though the trigger itself only reads. |
| Baseline notice (static copy, non-interactive) | "Only rows added after you save this trigger will start the flow. Existing rows in the sheet won't trigger it." |

Step 1 "Next" is disabled until: Sheet URL is present, Verify Access has succeeded at least once for the current Sheet URL/ID, and a contact identifier column is selected.

### 2.3 Step 2 — "Who"

Skipped, same as broadcast-type triggers (`skipStep2`). The contact identifier column in Step 1 already resolves who the flow runs for; there is no separate audience-qualification concept for a per-row trigger.

### 2.4 Canvas / Trigger Node Summary

`StartTriggerNode.jsx` / `triggerNodeUtils.js` summary line for this kind: `New row in <Sheet name or URL host> · every <N> min`.

---

## 3. Seller-Side Setup Checklist

1. Have a Google Sheet with a header row; new entries appended at the bottom (see §5 limitation on mid-sheet inserts).
2. Share the sheet with `engagetechsupport@shiprocket.com`, Editor access — same grant sellers already make for the Google Sheet node.
3. In the Start Trigger Wizard, paste the Sheet URL (+ Sheet ID if targeting a specific tab).
4. Choose a poll interval.
5. Click **Verify Access** — confirms the share succeeded and loads real column headers.
6. Select the contact-identifier column.
7. Publish the flow.

Pausing/resuming/un-publishing the flow starts and stops polling in lockstep, reusing the existing flow status state machine (`backend/routes/flows.py`).

---

## 4. Backend Infrastructure (net-new)

No node/step execution engine, event bus, queue, or scheduled-job infrastructure exists in this codebase today (confirmed: no cron/queue libraries in `package.json`/`requirements.txt`, `backend/routes/flows.py` is pure CRUD). This trigger is the first thing that actually needs to fire a flow, so it introduces the minimum backend needed to do that:

- **Poller/scheduler**: one scheduled job per active `google_sheet_new_row` trigger, run at its configured interval. Given no scheduling infra exists yet, this is the first consumer of one (e.g. a lightweight interval-based job runner) — sizing/choice of scheduler technology is an implementation-time decision, not a product-design one, and is out of scope for this spec.
- **Row-diff logic (MVP, append-only assumption)**: each poll reads the sheet via the Sheets API, compares current row count against the last-seen row count recorded at the previous poll (or at trigger-save time, for the first poll), and treats any newly-present rows as new-row events. Rows are assumed to only ever be appended at the bottom.
- **Flow start**: each detected new-row event resolves the contact via the configured identifier column and starts one flow run for that contact, using the row's column values as available flow variables (keyed by header name, matching the preview shown in Step 1).
- **Lifecycle**: poller starts when the flow is published, stops when paused/unpublished — driven by the same flow status transitions already implemented for publish/pause/resume.

---

## 5. Non-Goals / Known Limitations (v1)

- **Not real-time.** Latency is bounded by the configured poll interval (min 1 minute), not instant.
- **Append-only assumption.** Rows inserted in the middle of the sheet, or reordering of existing rows, are not distinguished from genuinely new rows and may be missed or misdetected by the row-count-diff approach. Flagged as a known MVP limitation, not solved in this pass. A future iteration could track a unique-key column per row (hash/compare) instead of row count, at the cost of requiring the seller to designate a unique-key column.
- **No Drive API push-notification / Apps Script push option.** Considered and rejected for v1: push notifications are file-level (require a diff step anyway), expire every ~7 days requiring channel renewal, and need a public verified HTTPS receiver; Apps Script push requires the seller to install and authorize a script in their own sheet. Both are strictly more infrastructure than polling for a first version. May be revisited later if sellers need sub-minute latency.
- **One trigger per sheet+tab is assumed**, not explicitly deduplicated or prevented in this spec — if the same Sheet URL/ID is wired into two separate triggers (or two flows), both poll independently. Not addressed here.
- **No retro-fire for existing rows** at connect time (see baseline notice, §2.2) — by design, not a gap.

---

## 6. File Structure (additive)

```
src/components/flows/builder/trigger/
  GoogleSheetTriggerStep1.jsx     ← new, mirrors WebhookTriggerStep1.jsx structure
  googleSheetTriggerHelpers.js    ← new, live Sheets API call for Verify Access + header fetch

eventCatalogue.json               ← add google_sheet_new_row entry (audience_qualification_allow: false)
StartTriggerWizard.jsx            ← route "step1" content to GoogleSheetTriggerStep1 for this kind
triggerNodeUtils.js               ← add summary-line case for google_sheet_new_row
```

Backend additions (naming/shape to be finalized at implementation-plan time, not fixed here):
- Poller/scheduler service
- Row-diff state per trigger (last-seen row count, last poll timestamp)
- Flow-start invocation path (new — first real trigger-to-execution wiring in the codebase)
