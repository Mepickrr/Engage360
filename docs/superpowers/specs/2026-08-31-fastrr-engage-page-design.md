# Fastrr Engage Page + Fastrr Journey Pitch Panel — Design

## Purpose

Add a new "Fastrr Engage" destination to the main sidebar nav. It is a
prototype/demo page whose purpose is to pitch **Fastrr Journey** —
WhatsApp Marketing Journeys — as the flagship capability bridging
Fastrr Checkout and Fastrr Engage. On load, the page opens a right-side
slide-over panel (visual/style reference: the "Conversion Booster —
Pay After Delivery" panel screenshot supplied by the user) that makes
the ROI case for running automated WhatsApp journeys against
identified/unknown website visitors and checkout drop-offs.

This is a stakeholder-demo prototype, not a wired-up feature: no
backend calls, no real analytics data. All CTAs are visually complete
but functionally no-op until instructed otherwise. All stat numbers
are illustrative placeholders, clearly flagged in code for later
replacement with real benchmarks.

## Non-goals

- No real enablement flow behind "Enable Fastrr Journey" (explicitly
  deferred — user will instruct later).
- No new backend/API integration.
- No changes to the actual Flows/Campaigns journey-building features.
- No generic/reusable "promo panel engine" — this is a single bespoke
  component (see Approach below).

## Approach

Build `FastrrEngagePanel` as its own bespoke component (Hero, StatGrid,
JourneyList, CTA sections as internal sub-sections of one file), not a
generic config-driven `<PromoPanel config={...} />` system. There is
only one consumer today; a shared primitive can be extracted once a
second promo panel actually exists. This matches the existing
bespoke-panel pattern in the codebase (`ConversationPanel`,
`ArtefactPanel`).

## Files

| File | Purpose |
|---|---|
| `src/pages/FastrrEngage.jsx` | New page. Placeholder hero content + "View Fastrr Journey" button. Opens the panel on mount. |
| `src/components/engage/FastrrEngagePanel.jsx` | The right-side slide-over pitch panel, built on the existing `Sheet`/`SheetContent side="right"` primitive (`src/components/ui/sheet.jsx`). |
| `src/store/fastrrEngagePanelStore.js` | Tiny zustand store: `{ isOpen, open(), close() }`. Mirrors `useConversationStore`'s pattern. |
| `src/App.js` | Add route `<Route path="/fastrr-engage" element={<FastrrEngagePage />} />` inside the existing `AppShell` route. Mount `<FastrrEngagePanel />` as a global sibling near `<ConversationPanel />` / `<Toaster />` so it can be controlled from anywhere via the store. |
| `src/components/layout/Sidebar.jsx` | Add a new entry to `SIDEBAR_ITEMS`, positioned immediately after "Home V6": `{ label: "Fastrr Engage", icon: Sparkles, route: "/fastrr-engage", testId: "nav-fastrr-engage" }`. Import `Sparkles` from `lucide-react`. |

## Behavior

- **Nav**: New "Fastrr Engage" icon appears in the sidebar, right after
  "Home V6", using the `Sparkles` icon, following the existing
  `NavLink` + Radix `Tooltip` rendering pattern already in `Sidebar.jsx`.
- **Page load**: `FastrrEngage.jsx` calls `open()` from
  `useFastrrEngagePanelStore` in a `useEffect` on mount — the panel
  auto-opens **every** visit (no localStorage/dismissal memory).
- **Closing**: Clicking the panel's close (X) reveals the placeholder
  page underneath.
- **Reopening**: The placeholder page shows a "View Fastrr Journey"
  button that calls `open()` again.
- **CTAs inside the panel** (primary "Enable Fastrr Journey", footer
  CTA, and secondary "See how it works"): all render as fully styled,
  clickable buttons but are **no-ops** for now — no toast, no
  navigation, no state change. Mark each with an inline comment
  `// TODO: wire up once enablement flow is defined`.

## Page content (`FastrrEngage.jsx`)

Minimal placeholder, matching the `Push.jsx` page template
(`max-w-[1400px] mx-auto` wrapper, `data-testid="page-fastrr-engage"`):

- Page title: "Fastrr Engage"
- One-line description: e.g. "Customer engagement journeys, bridging
  Fastrr Checkout and Fastrr Engage."
- Centered card/empty-state with a short illustration (reuse an
  existing lucide icon, e.g. `Sparkles` or `MessageCircle`, in a
  tinted circle — same visual language as other empty states in the
  app if one exists; otherwise a simple centered icon + heading) and
  the "View Fastrr Journey" button.

## Panel content (`FastrrEngagePanel.jsx`)

Built on `Sheet` / `SheetContent side="right"`, sticky header and
footer, scrollable middle — mirroring the reference screenshot's
layout. Top to bottom:

1. **Header** (sticky): close (X) button, title "Fastrr Journey",
   subtitle tag "Powered by Fastrr Engage".
2. **Hero card**: gradient background (brand `--color-primary` →
   a teal/mint accent, echoing the reference's purple→mint gradient).
   Contains a small self-contained CSS/SVG mockup of a WhatsApp chat
   bubble sequence (e.g. three stacked bubbles: "Cart reminder" →
   "Reply" → "Order confirmed"). Headline: "Recover Revenue From Every
   Missed Visit". Sub-line expanding on it. Two buttons: primary
   "Enable Fastrr Journey" (no-op) and secondary/outline "See how it
   works" (no-op).
3. **Value prop heading**: "WhatsApp Marketing Journeys" with one-line
   sub-copy: "Turn anonymous website visitors and drop-offs into
   recovered revenue — automatically."
4. **Live Impact stat grid** (2–3 tiles, styled like the reference's
   `Upto 14% / Upto 8%` boxes). Placeholder values, each flagged with
   `// TODO: replace with real benchmark`:
   - "Upto 3.2x ROI on automated WhatsApp journeys"
   - "Upto 25% cart recovery rate"
   - "Upto 40% of unknown visitors re-identified & re-engaged"
5. **Trust line** (muted background bar): "Trusted by X+ sellers
   recovering ₹Y+ in monthly revenue" — placeholder, flagged
   `// TODO: replace with real trust stat`.
6. **"Journeys Supported"** — three-row icon list (icon + bold name +
   one-line description each):
   - **Abandoned Product** (`Eye` icon) — "Visitor viewed a product but
     didn't add to cart — send a timely nudge with the exact product."
   - **Abandoned Cart** (`ShoppingCart` icon) — "Items sitting in cart
     — recover with a reminder + incentive before they leave."
   - **Abandoned Checkout** (`AlertTriangle` or `CreditCard` icon) —
     "Checkout started but not completed — the highest-intent recovery
     moment."
7. **"Why Sellers Enable It"** — bullet list mirroring the reference's
   green-tint callout style:
   - "Identifies unknown/anonymous visitors for retargeting"
   - "No manual campaign setup — journeys run automatically"
   - "Ease of onboarding: live in under 15 minutes"
   Ends in a highlighted green pill: **"Get started in as little as 15
   minutes"** (placeholder, flagged `// TODO: confirm onboarding time`).
8. **Sticky footer**: full-width primary button "Enable Fastrr Journey"
   (no-op).

## Naming / positioning

- Sidebar nav label and route: **"Fastrr Engage"**.
- Panel title: **"Fastrr Journey"**, framed as a feature within Fastrr
  Engage (subtitle tag "Powered by Fastrr Engage"), matching how the
  reference panel pitched "Pay After Delivery" as a feature of
  "Conversion Booster".

## State management

`src/store/fastrrEngagePanelStore.js`:

```js
import { create } from "zustand";

export const useFastrrEngagePanelStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

`FastrrEngagePanel.jsx` reads `isOpen`/`close` from this store and
renders `<Sheet open={isOpen} onOpenChange={(v) => !v && close()}>`.

## Styling

Use existing Tailwind/shadcn tokens throughout (`bg-surface`,
`border-border`, `text-text-primary/secondary/muted`, `--color-primary`,
`--color-primary-tint`, `success`/`info` tokens for the green callout)
— no new design tokens introduced. Reuse `Card`, `Badge`, `Button`
primitives from `src/components/ui/`.

## Testing

- Add `data-testid` attributes consistent with existing conventions
  (`page-fastrr-engage`, `nav-fastrr-engage`, panel container testid).
- Manual verification via the `run` skill: navigate to `/fastrr-engage`,
  confirm panel auto-opens, confirm close/reopen cycle, confirm all
  buttons render but are inert (no console errors, no navigation).
- No new automated test suite required for this prototype (matches
  the "prototype/demo" scope); existing lockdown suites
  (`FlowBuilder.lockdown`/`FlowBuilderV2.lockdown`) are unaffected —
  this work does not touch flow builder files.

## Open items (explicitly deferred, not blocking this design)

- Real ROI/benchmark numbers to replace the flagged placeholders.
- CTA behavior once "Enable Fastrr Journey" has a real destination.
- Whether `FastrrEngagePanel` should be extracted into a reusable
  promo-panel primitive once a second such panel is needed elsewhere.
