# Fastrr Journey Dashboard — Design

## Purpose

After the seller finishes the Meta Embedded Signup mock, instead of the
popup simply closing, they should land on a new **Fastrr Journey**
dashboard: the "command center" for the 6 predefined WhatsApp recovery
journeys (Abandoned Product / Cart / Checkout, each split into "Known"
and "Fastrr Identified" visitor variants). The dashboard shows 5 KPI
cards (with subtle, honest zero-state nudges rather than bare "0"s), a
table of the 6 journeys with per-row status/metrics/actions, and a
redesigned single-view flow preview modal.

## Non-goals

- No real backend/API integration — journey enable/disable is
  client-side state only, for this browser session.
- No real analytics/report generation — the kebab menu's "View
  Analytics" / "Download ... Report" / "View All Chat" items and the
  modal's "Edit on Engage" all fire this codebase's existing
  `previewToast()` helper (`@/components/common/PreviewHeader`), the
  established convention for "not wired yet" actions elsewhere in the
  app — not a bespoke `// TODO` comment pattern.
- No fabricated metrics: a journey shows `—` for Sent/Delivered/Opened/
  Clicked/Orders/Revenue while Paused, and `0` (not invented numbers)
  the moment it's switched Active, since nothing has actually sent yet.
- Not a generic "flow canvas" — the preview modal is a static,
  non-interactive strip (three fixed blocks + connectors), not a
  drag-drop ReactFlow canvas.

## Approach

**New full-bleed page** (`/fastrr-journey`), a sibling of the `AppShell`
route — same pattern as `/engage/account-setup` and
`/engage/meta-embedded-signup` — with its own compact header rather
than the main app's sidebar/global TopBar, matching the reference
screenshot and the "you just finished onboarding, here's your new
command center" moment (as opposed to just another sidebar item).

**Popup hand-off:** `MetaEmbeddedSignup.jsx`'s `handleFinish` changes
from `window.close()` to: if `window.opener` exists, navigate the
opener to `/fastrr-journey` then close this popup; otherwise (the URL
was opened directly, no opener) navigate the current tab itself as a
fallback. This avoids cramming a 5-card KPI row and a wide table into
the wizard's 560×780 popup.

**Reuse over invention:** the preview modal's WhatsApp block reuses
the existing `WhatsAppBubblePreview` component verbatim (already
self-contained, no ReactFlow dependency); the Start Trigger / Wait
blocks are static, non-interactive re-creations of the Flow Builder's
own node visuals (`StartTriggerNode.jsx`, `LogicNode.jsx`'s `wait`
kind) — same icons/colors/card shape, just without any canvas/drag
behavior; the row-level toggle follows `FlowsV2.jsx`'s existing inline
pill-toggle convention (the closest precedent for a table-row
enable/disable control in this app).

## Files

| File | Purpose |
|---|---|
| `src/pages/FastrrJourney.jsx` | The page. Composes `JourneyHeader`, `JourneyStatsRow`, `JourneysTable`, and (conditionally) `JourneyPreviewModal`. Owns the 6 journeys' enabled/disabled state and which journey (if any) is being previewed. |
| `src/components/engage/journey-dashboard/JourneyHeader.jsx` | Compact top bar: brand mark, wallet-balance pill + "Recharge" link (visual style borrowed from `TopBar.jsx`'s existing wallet UI, but this page has its own header — `TopBar.jsx` itself isn't rendered here), a profile icon, "Open Engage" link to `/`. |
| `src/components/engage/journey-dashboard/JourneyStatsRow.jsx` | The 5 KPI cards in one row. Takes `activeCount` (number of enabled journeys) as a prop; the other 4 cards are always zero-state for this prototype. |
| `src/components/engage/journey-dashboard/JourneysTable.jsx` | The 6-row table. Takes the journeys list + enabled-state map + handlers (`onToggle`, `onPreview`) as props. |
| `src/components/engage/journey-dashboard/JourneyPreviewModal.jsx` | The single-view preview: Start Trigger → Wait → WhatsApp bubble strip, "Edit on Engage" + "Activate Now". Takes the journey being previewed + `onActivate`/`onClose`. |
| `src/components/engage/journey-dashboard/data.js` | `JOURNEYS` — the 6 journeys' static config (id, name, audience type, tooltip copy, trigger label, WhatsApp preview draft). |
| `src/pages/MetaEmbeddedSignup.jsx` (modify) | `handleFinish` navigates the opener (or self, as fallback) to `/fastrr-journey` instead of `window.close()`-only. |
| `src/App.js` (modify) | Add `/fastrr-journey` route as a sibling of `AppShell`. |

## Behavior

### Header (`JourneyHeader.jsx`)

Brand mark on the left. On the right: wallet balance pill (e.g.
`₹0.00` styled like `TopBar.jsx`'s existing wallet chip) with a
"Recharge" text link next to it; a plain circular profile icon; "Open
Engage" text link navigating to `/` (the main app).

### KPI row (`JourneyStatsRow.jsx`)

Five cards, single row: **Active Journeys | Revenue Attribution |
Deliverability | Users Targeted | ROI**.

| Card | Display | Micro-copy (small, muted, one line) |
|---|---|---|
| Active Journeys | `{activeCount} / 6` | "Turn one on below to start recovering revenue" |
| Revenue Attribution | `—` | "Shows up once a journey is running" |
| Deliverability | `—` | "Tracked from your first message send" |
| Users Targeted | `—` | "Counts anonymous + known visitors reached" |
| ROI | `—` | "Compares message spend to recovered revenue" |

Only "Active Journeys" is dynamic (reflects `activeCount`); the other
4 stay at their static zero-state display for this prototype — no
fabricated data generation when a journey is toggled on.

### Journeys table (`JourneysTable.jsx`, `data.js`)

Columns: **Journey Name | Status | Sent | Delivered | Opened | Clicked
| Orders | Revenue | Action**.

The 6 rows (`id`, `journeyType`, `audience`, `tooltip`, `triggerLabel`,
`waDraft`):

| journeyType | audience | tooltip |
|---|---|---|
| Abandoned Product | Known | "Nudges known customers who viewed a product but didn't add it to cart, using their verified WhatsApp number." |
| Abandoned Product | Fastrr Identified | "Re-engages anonymous visitors identified by Fastrr who viewed a product but didn't add it to cart." |
| Abandoned Cart | Known | "Reminds known customers who added items to cart but didn't check out." |
| Abandoned Cart | Fastrr Identified | "Recovers anonymous, Fastrr-identified visitors who added items to cart but didn't check out." |
| Abandoned Checkout | Known | "Follows up with known customers who started checkout but didn't complete payment." |
| Abandoned Checkout | Fastrr Identified | "Recovers Fastrr-identified visitors who started checkout but didn't complete payment — the highest-intent recovery moment." |

Each row's Journey Name cell shows the journey type + an audience-type
badge underneath ("Known" / "Fastrr Identified"), with the tooltip
text available on hover (via `ui/tooltip.jsx`).

All 6 journeys start **disabled** (`enabled: false`) — this is the
honest zero-state, nothing has been turned on yet.

- **Status column:** dot + label — "Paused" (gray) while disabled,
  "Active" (green) while enabled.
- **Sent / Delivered / Opened / Clicked / Orders / Revenue:** render
  `—` while the row is disabled; render `0` the instant it's enabled
  (freshly started, nothing sent yet — never a fabricated number).
- **Action column:**
  - The `FlowsV2.jsx`-style inline pill toggle (enable/disable),
    calling `onToggle(id)`.
  - An `Eye` icon button opening `JourneyPreviewModal` for that row
    (`onPreview(id)`).
  - A kebab (`MoreVertical`) `DropdownMenu` with 5 items — **View
    Analytics**, **Download Order Report**, **Download Error Report**,
    **Download Conversation Report**, **View All Chat** — each calling
    `previewToast()`.

### Preview modal (`JourneyPreviewModal.jsx`)

Header: journey name + audience badge, close (X).

Body — one horizontal strip, three static blocks left-to-right,
connected by a short line + `ChevronRight` (matching Canvas.jsx's edge
stroke color `#94A3B8` for visual consistency with the real Flow
Builder):

1. **Start Trigger** block (adapted from `StartTriggerNode.jsx`'s
   visual: lightning icon in a filled square, "Trigger" eyebrow label,
   the journey's `triggerLabel` as the main line — e.g. "Known buyer
   adds product to cart" for Abandoned Cart / Known).
2. **Wait** block (adapted from `LogicNode.jsx`'s `wait` kind: clock
   icon, "Wait" eyebrow label, **"30 Minutes"** — fixed for all 6
   journeys per the reference note).
3. **WhatsApp** block: the existing `WhatsAppBubblePreview` component,
   rendered with that journey's `waDraft` (see below).

Footer: **"Edit on Engage"** (outline button, `previewToast()`) +
**"Activate Now"** (primary button — calls `onActivate(id)`, which
sets that journey's row to Active, then closes the modal).

**Trigger labels** (Start Trigger block's main line):

| journeyType / audience | triggerLabel |
|---|---|
| Abandoned Product / Known | "Known buyer views a product" |
| Abandoned Product / Fastrr Identified | "Fastrr-identified visitor views a product" |
| Abandoned Cart / Known | "Known buyer adds product to cart" |
| Abandoned Cart / Fastrr Identified | "Fastrr-identified visitor adds product to cart" |
| Abandoned Checkout / Known | "Known buyer starts checkout" |
| Abandoned Checkout / Fastrr Identified | "Fastrr-identified visitor starts checkout" |

**WhatsApp preview copy** (`waDraft.body`, using `WhatsAppBubblePreview`'s
existing merge-field style `{{1}}`/`{{2}}`/`{{3}}` placeholders):

| journeyType / audience | body |
|---|---|
| Abandoned Product / Known | "Hey {{1}}, still thinking about {{2}}? It's waiting for you — tap below to grab it before it's gone." |
| Abandoned Product / Fastrr Identified | "Spotted you browsing {{1}}! Here's a closer look — tap below to check it out again." |
| Abandoned Cart / Known | "Hey {{1}}, you left {{2}} in your cart! Complete your order now and get {{3}} off." |
| Abandoned Cart / Fastrr Identified | "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off." |
| Abandoned Checkout / Known | "Hey {{1}}, you're just one step away! Complete your payment for {{2}} now." |
| Abandoned Checkout / Fastrr Identified | "Almost done! Your order is saved — tap below to complete checkout in seconds." |

### Popup hand-off (`MetaEmbeddedSignup.jsx`)

```js
function handleFinish() {
  if (window.opener) {
    window.opener.location.href = "/fastrr-journey";
    window.close();
  } else {
    navigate("/fastrr-journey");
  }
}
```
(`window.opener.location.href` triggers a full reload of the opener
tab — acceptable and expected for a cross-window hand-off like this,
same as real third-party OAuth/embedded-signup popups.)

## Styling

The Start Trigger / Wait block visuals intentionally borrow the Flow
Builder's own node colors/icons (`#6C3AE8` trigger, `#64748B` wait,
WhatsApp's `#25D366`/`WhatsAppBubblePreview`'s own internal styling)
for recognizability with the real builder — this is a "mimic an
existing in-app visual language for a static preview" case, not the
"mimic a third-party product" case used elsewhere (`FastrrEngagePanel`,
`WhatsAppBubblePreview` itself). Everything else on the page (header,
KPI cards, table) uses the existing Engage 360 Tailwind tokens
(`bg-primary`, `bg-primary-tint`, `text-text-primary/secondary`,
`border-border`, `bg-surface`, `bg-app-bg`) and the existing
`ui/table.jsx`, `ui/dropdown-menu.jsx`, `ui/tooltip.jsx`,
`ui/dialog.jsx`, `ui/badge.jsx`, `ui/card.jsx` primitives — no new
tokens.

## Testing

- `data.js`: no dedicated test (static config, exercised through the
  table's own tests).
- `JourneyStatsRow.test.jsx`: renders all 5 cards with their zero-state
  copy; "Active Journeys" reflects a given `activeCount` prop.
- `JourneysTable.test.jsx`: all 6 rows render with correct name/
  audience/tooltip; metrics show `—` when disabled and `0` when
  enabled; toggling a row calls `onToggle` with the right id; the
  kebab menu's 5 items each call `previewToast()` (mocked); the Eye
  button calls `onPreview` with the right id.
- `JourneyPreviewModal.test.jsx`: renders the given journey's trigger
  label, "30 Minutes", and WhatsApp draft body; "Edit on Engage" calls
  `previewToast()`; "Activate Now" calls `onActivate` with the right
  id.
- `FastrrJourney.test.jsx` (page-level): renders header/KPI row/table
  together; toggling a row via the table updates the KPI row's active
  count; opening and activating from the preview modal also updates
  the table row and KPI count.
- `MetaEmbeddedSignup.test.jsx` (extend existing suite): `handleFinish`
  navigates `window.opener.location.href` and calls `window.close()`
  when an opener exists; falls back to `navigate()` on the current
  tab when it doesn't (both paths mocked).

## Open items (explicitly deferred, not blocking this design)

- No real journey activation, analytics, or report generation — this
  is a client-side, session-only prototype throughout.
- Whether the Start Trigger/Wait block visuals should later become a
  shared primitive with the real Flow Builder's node components —
  kept as static, bespoke re-creations for now per YAGNI (only one
  consumer today).
