# Start Trigger Wizard: Merge to Single Screen (Flow Builder V2)

## Scope

Flow Builder V2 only — the Start Trigger configuration modal (`StartTriggerWizard.jsx` and its child step components). No other builder surface changes except the "hide User Affinity" item below, which is explicitly cross-cutting.

## 1. Merge Step 1 + Step 2 into one screen

Today, four trigger kinds go through a two-stage flow (`stage: "step1" → "step2"`):

- Standard Event trigger (`Step1WhenContent` → `Step2WhoContent`)
- Webhook (`WebhookTriggerStep1` → `Step2WhoContent`)
- Date-relative (`DateRelativeTriggerContent` → `Step2WhoContent`)
- Event-offset (`EventOffsetTriggerContent` → `Step2WhoContent`)

These four collapse into a single scrollable screen per kind: the existing step-1 content renders first (internals unchanged), immediately followed by the (rewritten) "Who" section — with no intermediate step, no `stage: "step2"`.

The "Who" section only renders when `skipStep2` is false, same gating logic as today (`isGoogleSheet || (!isDateRelative && primaryCard && !primaryCard.audience_qualification_allow)`). When it's true, the screen ends after the step-1 content, same as current behavior.

Broadcast (`BroadcastConfig`), Broadcast-source (`BroadcastSourceStep1` → `BroadcastSourceStep2`), and Google Sheet (`GoogleSheetTriggerStep1`, single screen, no audience) are structurally different and are **not** merged — they keep their existing content structure. Only their header/footer chrome changes (see §4).

## 2. "Who" section: reorder + content changes

New top-to-bottom order (replaces current `Step2WhoContent.jsx` layout):

1. **Limit entry frequency** — checkbox + "Limit to [N] time(s) within [N] [days/weeks/months]". Always visible whenever the Who section renders (not gated by the main selector). Unchanged behavior/state shape (`audience.limit_enabled`, `audience.limit_entry`), just moved above the selector.
2. **Main selector** (radio): "All users who match the start trigger" / "Filter users by" — unchanged (`audience.include_all`).
3. If "Filter users by": **Audience Type** pills (All Users / Engage Identified / Known User) + include-filter `AudienceFilterBuilder` with tabs **User property, User behavior, Custom segment** (no affinity — see §3).
4. If "Filter users by": **Exclude Users** — checkbox + exclude-filter `AudienceFilterBuilder`, same 3 tabs. **Newly gated**: only rendered when "Filter users by" is selected (today it always shows regardless of the main selector).
5. ~~Show count~~ — **removed entirely** (button, count state, and `showCount`/`count`/`loadingCount` props/plumbing from `StartTriggerWizard.jsx` down to `Step2WhoContent`).

AND/OR combination across multiple filter blocks within a filter builder already exists via `CombinatorPill`/`blocksCombinator` — no new work needed.

## 3. Hide "User Affinity" across Flow Builder V2

Remove the `{ id: "affinity", label: "User affinity" }` entry from the block-type list in:

- `Step2WhoContent.jsx` (`TRIGGER_BLOCK_TYPES`)
- `BroadcastSourceStep2.jsx` (`TRIGGER_BLOCK_TYPES`)
- `nodes/ConditionalSplitNode/data/mockData.js` (its own block-type list)

This is UI-only: it removes the tab so sellers can no longer pick/see "User affinity" as a filter type. No data migration — any previously saved `affinity` blocks simply won't render/be editable (matches "hide"). `UserAffinityConditions.jsx`, `AudienceFilterBuilder.jsx`'s `affinity` case, and the shared helpers in `triggerHelpers.js`/`triggerNodeUtils.js` are left in place (dead code for now, not deleted) since old saved flows may still reference `affinity_type` data.

Legacy `FlowTriggerModal.jsx` (V1, not used by the V2 wizard) is untouched — out of scope.

## 4. Header simplified, footer says "Submit" — applies to every trigger kind

Applies uniformly across Event, Webhook, Date-relative, Event-offset, Google Sheet, Broadcast, and Broadcast-source:

- Header title changes from "Configure trigger" → **"Configure Start Trigger"**.
- The step-label subtitle (`stepperLabel`, e.g. "1. When will users enter the flow → 2. Who will enter the flow") and the step-dot row (`StepDot` pair) are removed entirely — no step numbering/labels anywhere.
- The footer's final action button label changes from "Finish" → **"Submit"** everywhere (`handleFinish` logic unchanged).
- Broadcast-source keeps its internal "Next" button between its two screens (source select → schedule & audience) — that pagination is unrelated to the step1/step2 merge and stays as-is; only its last screen's action becomes "Submit".
- The merged kinds (Event/Webhook/Date-relative/Event-offset) no longer have a "Next"/"Back" pair at all, since there's only one screen — footer is just "Cancel" + "Submit" (lockdown mode's "Back" case on `step2` no longer applies since there's no `step2` stage for these kinds).

## Out of scope / unchanged

- Broadcast-source's own "Exclude users" gating (already always-visible regardless of its "Filter by conditions" selector) — not touched, since it wasn't part of this request and is a distinct code path from `Step2WhoContent`.
- Google Sheet trigger: still has no audience/Who section (unchanged), just gets the simplified header/footer.
- Event picker modal (`EventPickerModal.jsx`) — separate dialog, untouched.
