# Fastrr Journey V2 — Listing-First Seller Experience (Design)

## Purpose

Rethink the Fastrr Journey V2 seller experience as an e-commerce flow: browse a listing of journeys (the "products"), select the ones you want (the "cart"), pay by funding your wallet (the "checkout"), complete a short setup (the "shipping details"), then land on a dashboard that shows what's live (the "order confirmation" / usage view). This applies to `engage2`/`*2` only — the original Fastrr Engage / Fastrr Journey flow (v1) is not touched in any way by this design.

Inspiration: a wireframe HTML prototype the user shared (`fastrr-journey-phase0-1-prototype.html`), treated as a directional starting point for structure/tone/pattern (hero teaser → journey gallery → sticky cart rail → summary panel), not a pixel spec to replicate literally. Its concrete numbers (e.g. "₹1.2Cr/month", "10,000 visitors/day", "40% abandon") already match this codebase's existing `MOCK_STORE_ACTIVITY`/`computeRevenueOpportunity()` mock data (`src/components/engage2/RevenueOpportunityCard2.jsx`), confirming this is a natural fit rather than a new data model.

## Current State (v2 today)

Four pages, in this order: `FastrrEngage2.jsx` (marketing landing, auto-opens `FastrrEngagePanel2` side panel) → `EngageAccountSetup2.jsx` (a form: brand name/category/website/email/phone, "Start Signup" opens Meta Embedded Signup as a **popup window**) → `MetaEmbeddedSignup2.jsx` (the 8-step wizard) → `FastrrJourney2.jsx` (dashboard; on first arrival, shows `WelcomeModal` with a congrats header, a rate card, and an embedded wallet-recharge nudge; journeys arrive all disabled, toggled on manually).

The underlying journey data (`src/components/engage2/journey-dashboard/data.js`) already has exactly the shape this design needs: 3 journey types (Abandoned Product, Abandoned Cart, Abandoned Checkout), each with a **Known** and a **Fastrr Identified** audience variant — 6 `JOURNEYS` entries total. No new journey/audience modeling is required, only new presentation and two new additive fields per entry (see Data Model Changes).

## New Sequence

Five stops. `FastrrEngage2.jsx` stays inside `AppShell` (still the sidebar-reachable entry point); everything from Recharge onward stays outside `AppShell`, matching today's existing boundary — only one new stop is inserted into that existing outside-`AppShell` chain.

```
1. HOME (Listing)         /fastrr-engage-2            [inside AppShell]
        │ seller selects journeys (Known / Fastrr Identified per type), clicks Continue
        ▼
2. RECHARGE                /engage-2/recharge          [outside AppShell — new]
        │ funds wallet, or clicks "Skip for now" (soft gate)
        ▼
3. ACCOUNT SETUP            /engage-2/account-setup     [outside AppShell — unchanged content]
        │ "Start Signup" now navigates in-tab (was: opens a popup)
        ▼
4. META EMBEDDED SIGNUP      /engage-2/meta-embedded-signup [outside AppShell — unchanged wizard]
        │ Finish navigates in-tab to the dashboard (existing "no opener" code path)
        ▼
5. DASHBOARD                 /fastrr-journey-2           [outside AppShell — unchanged route]
     Journeys selected in step 1 arrive already enabled.
```

A new `engage2`-only store (`journeySelectionStore2`, plain in-memory zustand, not persisted) carries the seller's selections from step 1 through to step 5. Because step 4 now navigates in-tab instead of via a popup+reload (see "Technical Decision" below), the JS realm — and this store — survives the whole funnel without needing `sessionStorage`.

## Page-by-Page Design

### 1. Home / Listing (`src/pages/FastrrEngage2.jsx` — rebuilt composition)

Replaces today's 7-section composition (Hero, LogoStrip, RevenueOpportunityCard, DarkStatBand, BentoFeatureGrid, TestimonialSection, FinalCTA) with:

1. **Hero (trimmed + personalized)** — same `ChatPreviewMockup2` illustration, new copy:
   - Eyebrow pill: `"Your Store · today's activity"` (not a fictional brand name — those are reserved for testimonials elsewhere in `engage2`).
   - Headline: `"₹{monthlyRevenueAtRisk} a month is walking out through your checkout."` — computed via `computeRevenueOpportunity(MOCK_STORE_ACTIVITY)` from `RevenueOpportunityCard2`, not hardcoded copy.
   - Subhead: `"{abandonedCheckoutPerDay} shoppers a day abandon before paying. Pick the moments worth messaging below, fund your wallet, and go live in minutes."`
2. **Personalized stat strip** (replaces `DarkStatBand`'s generic 4-stat industry-benchmark block, which stops making sense once the page is about *this* seller's store): 3 stats from the same `computeRevenueOpportunity()` call — visitors/day, abandonment rate, monthly revenue at risk.
3. **Journey Listing** (new) — 3 cards, one per `journeyType`, each showing:
   - A **Known** / **Fastrr Identified** pill pair that is simultaneously (a) a tab — clicking it makes that variant's message the visible preview below — and (b) an independent selection toggle — clicking it *also* flips that pill's own selection state (filled + checked ⟷ outline + unchecked), independent of the other pill's selection state and independent of which pill is currently the active preview. So a seller can select Known, Identified, or both, and switching which one is previewed never changes either one's selection. Concretely: clicking an unselected, non-previewed pill selects it and makes it the preview; clicking an already-previewed, already-selected pill deselects it but leaves it as the preview; clicking the *other* pill (not currently previewed) always makes it the new preview, regardless of its own selection state, and independently flips its own selection.
   - An inline, always-visible preview bubble showing the **resolved** message (real sample name/product substituted in — never raw `{{1}}`/`{{2}}` template syntax). Uses a new `previewSample` field (see Data Model Changes) — the existing `waDraft.body` template stays untouched for whatever already consumes it (the dashboard's `JourneyPreviewModal`, `WhatsAppBubblePreview`).
   - Footer: estimated daily volume (new `estimatedDailyVolume` field), the WhatsApp Marketing rate (₹1.50/message, reused from existing `RATE_CARD`), and a one-line audience explainer per pill (Known: *"customers reached on their verified WhatsApp number"*; Fastrr Identified: *"anonymous visitors Fastrr recognizes from browsing, before they've ever signed up"*) — both audience concepts are new enough to a first-time seller to deserve one clarifying line each.
   - An "Add to Setup" affordance per selected pill (folded into the pill's own toggle state — no separate button).
4. **Sticky cart rail**, shown once anything is selected: `"{N} journeys selected · est. ₹{X} to fund 3 days"` + a `Continue` button navigating to `/engage-2/recharge`. `{X}` is derived from the *selected* variants only (each selected variant's `estimatedDailyVolume` × its message rate × the existing 3-day runway from `WALLET_TOPUP.aiSuggestRunwayDays`) — not the whole store's abandonment volume regardless of selection.
5. **Testimonials** (kept, moved to the bottom) — reinforcement for anyone who scrolls past without selecting anything yet.

Dropped entirely: `LogoStrip`, `BentoFeatureGrid`, `FinalCTA`, `DarkStatBand`, and rendering the `RevenueOpportunityCard` component itself (its card-shaped UI, not its file) — all made redundant by the listing itself carrying that persuasive weight at a more concrete, per-journey level, and by the new personalized stat strip replacing the generic benchmark block. Note: `RevenueOpportunityCard2.jsx` the *file* is still imported on this page — just its named export `computeRevenueOpportunity()`, not its default-exported card component — to drive the hero headline and stat strip above.

Also removed: the `useEffect(() => { open() }, [open])` auto-open of `FastrrEngagePanel2` on mount — that panel showed a condensed version of the old pitch; once the Listing page *is* the full pitch inline, re-showing a shorter version in a slide-in panel is redundant. `FastrrEngagePanel2.jsx` and `fastrrEngagePanelStore2.js` stay in the codebase, simply no longer triggered from this page.

### 2. Recharge (new: `src/pages/RechargeStep2.jsx`)

A full page (not a modal), outside `AppShell`, `data-testid="page-recharge"` (matching the existing `page-engage-account-setup` / `page-meta-embedded-signup` / `page-fastrr-journey-2` naming convention), reusing `src/components/engage2/journey-dashboard/WalletRechargeCard.jsx` directly with two new optional props:
- an amount-seeding override (so the AI-suggested default reflects the cart's total, not the whole store's abandonment volume);
- an `onContinue` callback, called both when "Add to Wallet" succeeds and when a new "Skip for now" link is clicked (soft gate — matches the existing `WelcomeModal`'s established "Skip for now" pattern) — both paths advance to `/engage-2/account-setup`.

No other changes to `WalletRechargeCard`'s existing behavior (AI suggestion, increment chips, discount code + rate tooltip, "Transfer from Checkout Wallet" stub) — `WelcomeModal` and `RechargeWalletModal` (used from the dashboard header for later top-ups) keep working exactly as they do today.

### 3. Account Setup (`src/pages/EngageAccountSetup2.jsx`)

Content and fields unchanged. One behavioral change: `handleStartSignup` calls `navigate("/engage-2/meta-embedded-signup")` instead of `openSignupPopup()` (see Technical Decision below). The existing "Exit setup" link (`to="/fastrr-engage-2"`) is unchanged — it still correctly returns to the Listing.

### 4. Meta Embedded Signup (`src/pages/MetaEmbeddedSignup2.jsx`)

No changes to the wizard itself. Because Account Setup now navigates to it in-tab (no `window.opener`), it already runs its existing, tested "no opener" code path: `handleFinish` calls `navigate("/fastrr-journey-2")`, `handleCancel` calls `navigate("/engage-2/account-setup")` — both paths already exist and are already covered by `MetaEmbeddedSignup2.test.jsx`.

### 5. Dashboard (`src/pages/FastrrJourney2.jsx`)

On mount, seeds `enabledMap` from `journeySelectionStore2`'s `selectedJourneys()` (instead of starting `{}`) — the journeys picked on the Listing arrive already enabled, matching an order being fulfilled rather than requiring one more manual "activate" step — then calls the store's `clear()` so a later, unrelated visit to the Dashboard never re-seeds stale selections.

`WelcomeModal` (`src/components/engage2/journey-dashboard/WelcomeModal.jsx`) keeps its congrats header and rate card (still worth seeing once), but its embedded `WalletRechargeCard` section is removed — redundant now that recharge happens upstream — replaced with a one-line recap (`"✓ ₹{balance} funded, {N} journeys are live"`) and a single dismiss button. The dashboard header's wallet pill still opens `RechargeWalletModal` for later top-ups, unchanged.

## Data Model Changes (all additive — nothing existing renamed or removed)

In `src/components/engage2/journey-dashboard/data.js`:

- Each of the 6 `JOURNEYS` entries gains:
  - `previewSample` (string) — the same message as `waDraft.body`, with template placeholders resolved to concrete sample values. Six values:
    | id | `previewSample` |
    |---|---|
    | `abandoned-product-known` | "Hey Aanya, still thinking about the Juniper Throw? It's waiting for you — tap below to grab it before it's gone." |
    | `abandoned-product-identified` | "Spotted you browsing the Linen Weave Throw! Here's a closer look — tap below to check it out again." |
    | `abandoned-cart-known` | "Hey Aanya, you left the Juniper Throw in your cart! Complete your order now and get 10% off." |
    | `abandoned-cart-identified` | "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off." |
    | `abandoned-checkout-known` | "Hey Aanya, you're just one step away! Complete your payment for ₹1,840 now." |
    | `abandoned-checkout-identified` | "Almost done! Your order is saved — tap below to complete checkout in seconds." |
  - `estimatedDailyVolume` (number) — illustrative daily-occurrence volume for the *journey type* (not per-audience-variant; both Known/Identified rows of the same type share the same number, since they're two ways of reaching the same underlying moment): Abandoned Cart → `4000`, Abandoned Checkout → `1600`, Abandoned Product → `1200`. Directionally illustrative, same convention as the page's other benchmark numbers.
- New export `JOURNEY_TYPES` — 3 entries grouping the listing by type, each `{ id, journeyType, icon, description }`, used by the new listing cards to group the 6 `JOURNEYS` rows into 3 cards (`journeyType` matches the existing field, `icon` is a `lucide-react` name — Abandoned Product → `Eye`, Abandoned Cart → `ShoppingCart`, Abandoned Checkout → `CreditCard` — `description` is a one-line summary of the moment, e.g. "Views a product but never adds it to cart"). Purely additive — does not replace or restructure `JOURNEYS`.

`RATE_CARD`, `WALLET_TOPUP`, `COUPONS` unchanged.

## New Components & Files

- `src/pages/RechargeStep2.jsx` (+ test) — new page, per Page-by-Page Design §2.
- `src/components/engage2/home/JourneyListingCard.jsx` (+ test) — one of the 3 cards: pill pair, inline preview, footer, selection state.
- `src/components/engage2/home/JourneyListingSection.jsx` (+ test) — wraps the 3 cards + owns/reads `journeySelectionStore2` + renders the cart rail.
- `src/components/engage2/home/CartRail.jsx` (+ test) — the sticky bottom bar.
- `src/components/engage2/home/PersonalizedStatStrip.jsx` (+ test) — replaces `DarkStatBand` on this page only (that component itself is left in the codebase, just unused from this page).
- `src/store/journeySelectionStore2.js` (+ test) — new zustand store, shape:
  ```js
  {
    selected: {},              // { [journeyId]: true } — only true entries present, never false
    toggle: (journeyId) => {}, // flips selected[journeyId]
    isSelected: (journeyId) => boolean,
    selectedJourneys: () => Journey[], // resolves selected ids against JOURNEYS, in JOURNEYS' own order
    clear: () => {},            // resets to {} — called once the Dashboard has consumed the selection on mount
  }
  ```

## Copywriting Direction

Concrete and numeric over abstract marketing language, throughout — "₹1.2Cr a month," "~4,000/day" — matching the wireframe's tone and this codebase's existing personalization pattern (the AI-suggestion copy already does this). Per-card copy leads with the concrete trigger moment. "Add to Setup" is the selection-affordance label (not "Select" or "Choose"), matching the wireframe.

## Technical Decision: Signup launches in-tab, not as a popup (v2 only)

Today, Meta Embedded Signup opens as a **popup window**; finishing it does `window.opener.location.href = "/fastrr-journey-2"` — a full reload of the main tab. That's harmless today because wallet recharge happens *after* that reload (via `WelcomeModal`, downstream of it). In the new sequence, recharge happens *before* signup — the same reload would wipe both the funded wallet balance and the new selection cart, since neither is persisted anywhere durable.

Resolution: for `engage2` only, `EngageAccountSetup2.jsx`'s `handleStartSignup` calls `navigate("/engage-2/meta-embedded-signup")` instead of `openSignupPopup()`. `MetaEmbeddedSignup2.jsx` already fully supports this "no opener" mode today (an existing, tested code path — the popup was simply the only path exercised so far); this is a one-line change at the single call site that decides to open a popup, not a rewrite of the wizard. It avoids needing any new `sessionStorage` persistence layer. v1 keeps its popup behavior exactly as-is — this change is scoped to `EngageAccountSetup2.jsx` only.

## Non-Goals

- v1 (`fastrr-engage`, `fastrr-journey`, and every file under the original `engage/` folders) is not touched in any way.
- No backend/API integration — still a fully mocked prototype.
- No changes to the 6 `JOURNEYS` entries' existing fields (`journeyType`, `audience`, `tooltip`, `triggerLabel`, `waDraft`) — only additive new fields, so `JourneyPreviewModal`, `JourneysTable`, and the shared `WhatsAppBubblePreview` component keep working unchanged against the same data.
- `RATE_CARD`, `WALLET_TOPUP`, `COUPONS` unchanged.
- Not rebuilding the Meta Embedded Signup wizard — only how it's launched changes.
- No new `sessionStorage`/`localStorage` persistence layer — the in-tab-navigation fix above makes that unnecessary.
- `FastrrEngagePanel2.jsx` and `fastrrEngagePanelStore2.js` are not deleted, only no longer triggered from the new Home page.
