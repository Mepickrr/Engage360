# WhatsApp Channel Detail — Single-Column Redesign

**Date:** 2026-08-13
**Component:** `src/components/settings/channels/WhatsAppNumberDetail.jsx`
**Status:** Approved, ready for implementation planning

## Problem

Settings → Connected Channels → selecting a WhatsApp number opens
`WhatsAppNumberDetail`, currently a two-section `flex gap-6` layout: a form
column (business description, about, address, email, website, account
overview fields, catalog linking) on the left, and a small (`w-64`) static
WhatsApp-style preview card on the right that only mirrors 4 of the fields
(`about`, `businessAddress`, `businessEmail`, `businessWebsite`) as read-only
text. Most fields (brand name, photo, category) never appear in the preview
at all, and the preview itself has no editing affordance — it's just a
mirror of form state.

## Goal

Collapse the two-section layout into one column where the WhatsApp profile
preview **is** the input mechanism for its own visible fields, instead of a
separate form driving a separate read-only mirror.

## Layout (top to bottom, single column)

1. **Header** — unchanged: back button + "Whatsapp" title bar.

2. **Metadata summary bar** — two compact rows, replacing today's header
   badge cluster:
   - Row 1: `Provider: {number.provider}` · `Quality: {number.quality}` ·
     `WABA ID: {number.wabaId}`
   - Row 2: `Messaging limit: {messagingLimit}/day` (keep existing
     `RefreshCw` refresh control) · Default-for-Campaigns badge/button
     (`Badge tone="emerald"` + "Migrate provider" button when
     `isDefaultForCampaigns`, else "Make Default for Campaigns" button —
     same logic as today) · "Migrate provider" button.
   - Uses the existing `Badge` component and tone helpers; no new tone
     logic needed.

3. **Secondary details block** — condensed, folds in everything from
   today's view not covered by items already promoted to the summary bar
   or the preview:
   - WhatsApp voice call (BETA) row + "Setup" action — unchanged behavior
     (`previewToast()` stub).
   - "Messages consumed" counter + refresh — unchanged behavior.
   - Business Portfolio ID, WABA Provider, Phone Number — kept as the
     existing small read-only rows with "Available" pills (WABA ID itself
     moves up to the summary bar and is not duplicated here).
   - TSP Onboarding Status "View Details" / A/B Testing "Test Now" links —
     unchanged, still `previewToast()` stubs.
   - Compliance banner (amber) and "Powered by MM Lite API" banner
     (emerald/violet gradient) — unchanged content, just relocated.
   - This block is purely a compaction/relocation of existing markup — no
     new state, no behavior change.

4. **Catalog linking card** — retained as-is, unchanged: Catalog ID +
   "Manage ↗" link, `catalogAllowAccess` checkbox, `removeOutOfStock`
   checkbox, sync-interval note.

5. **Big editable WhatsApp profile preview** — see below. This is the only
   section with new interaction behavior.

## The editable preview

Replaces the current `w-64 sticky` phone card with a large, centered
mockup (e.g. `max-w-md`), styled to resemble a WhatsApp Business "Business
info" screen rather than a chat-bubble snippet. All fields below are
click-to-edit **directly inside the mockup** — no side form:

- **Profile photo** — circular avatar placeholder; click surfaces an
  upload-overlay affordance (camera icon). No real upload wiring in this
  pass (visual placeholder only, consistent with how Brand Logo/photo are
  treated elsewhere today).
- **Business/Brand name** (`number.brandName`) — click → inline text
  input, Enter/blur saves. Replaces today's masked phone number as the
  mockup's headline text.
- **About** (`about` state) — click → inline text input.
- **Business description** (`businessDescription` state) — click → inline
  textarea. Previously only existed in the side form and was never shown
  in the preview; now visible and directly editable in the mockup.

Interaction pattern for all four: click the rendered value → it swaps to
an input/textarea in place → Enter or blur (or an explicit small
save/cancel affordance, matching `EditableRow`'s existing save/cancel
buttons) commits the change. Reuses the same state-lifting approach
already in the component (`useState` + setter), just changes *where* the
editable surface renders from (inside the mockup vs. a separate form row).

**Below the mockup**, still single column, a compact edit-in-place list
for the less visually-prominent fields, each using the existing
`EditableRow` component unchanged:
- Category — new field; today hardcoded as static text
  ("Shopping and Retail") in the preview with no backing state. Needs a
  new `category` state (default `"Shopping and Retail"` or
  `number.category` if present) wired through `EditableRow`.
- Business address (`businessAddress` state) — relocated from the old
  form column, same `EditableRow` usage.
- Email for business contact (`businessEmail` state) — relocated, same
  `EditableRow` usage.
- Business website (`businessWebsite` state) — relocated, same
  `EditableRow` usage.

## Data flow

No architectural change. All fields remain local `useState` in
`WhatsAppNumberDetail` (no new context, no lifting to `ConnectedChannelsPanel`).
What changes is which JSX renders each piece of state:
- 4 fields (photo, brand name, about, description) move from
  non-interactive/side-form-only into inline-editable surfaces inside the
  big preview mockup.
- 4 fields (category [new], address, email, website) move from the old
  form column into a compact `EditableRow` list positioned below the
  preview instead of beside it.
- Everything else (provider/quality/WABA ID/messaging limit/default
  toggle/migrate button/voice call/messages consumed/account overview
  extras/TSP onboarding/AB testing/banners/catalog linking) is a straight
  relocation of existing markup into the new section groupings, with no
  behavior change.

## Testing

Update `src/components/settings/channels/__tests__/WhatsAppNumberDetail.test.jsx`:
- Existing assertions about badges, default/migrate toggling, `onBack`,
  messages-consumed/messaging-limit refresh, account overview fields, and
  the catalog card should still pass structurally (same `data-testid`s
  where the underlying control didn't change; update testids/queries
  where a control moved from a disabled `<input>` to inline-edit).
- New/updated coverage:
  - Clicking the brand name / about / description / photo in the big
    preview enters edit mode and saves on blur/Enter.
  - Category is now a real editable field (add coverage — previously
    untested since it didn't exist as state).
  - Preview no longer needs separate assertions for "does the preview
    mirror form state" since preview and input are now the same surface —
    replace those with "editing in the preview persists the value."
  - Single-column layout: no more two-column (`flex gap-6`) split to
    assert against.

## Out of scope for this pass

- Real photo upload wiring (stays a visual placeholder, per existing
  codebase convention for Brand Logo).
- Any backend/API integration for save actions (all state remains local
  mock state, matching the rest of this settings area).
- Migrate provider flow (`previewToast()` stub stays a stub).
