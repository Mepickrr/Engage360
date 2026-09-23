# Fastrr Engage 2 — Prototype-Aligned Home Page & Stepped Setup Flow

## Context

The current `fastrr-engage-2` home page (`/fastrr-engage-2`) is a listing-style page built in an earlier iteration: a personalized Hero, `PersonalizedStatStrip`, `JourneyListingSection` (journey cards with Known/Fastrr Identified audience tabs and a cart rail), and `TestimonialSection`. The seller was given a working HTML/JS prototype ("Recovery Activation v4 — Store Data") showing a different, more polished home-page design and a stepped post-selection flow, and asked to rebuild `fastrr-engage-2` to strictly follow it, with the wallet step keeping the feature set already built (AI Suggest chip, coupon, Transfer) and the seller still able to skip it, and a new third step ("WhatsApp Account Setup") replacing today's account-setup page.

**Scope constraint (binding, carried from every prior segment of this project):** changes are strictly limited to `fastrr-engage-2`/`fastrr-journey-2` (`engage2/`, `*2.jsx` pages, `/engage-2/*` and `/fastrr-engage-2`/`/fastrr-journey-2` routes). `fastrr-engage`/`fastrr-journey` (v1) are never touched.

## Decisions made during brainstorming (binding)

1. **Store selector is cosmetic** — one real store in the dropdown list, matching how the rest of this app has always been single-store. No second mock store, no functional store-switching.
2. **"Confirm & Start WhatsApp Setup Manually" and "...with AI" have the same outcome** — both lead into the existing `MetaEmbeddedSignup2` mock via the same `handleStartSignup`-style call. "AI" is framing/copy only, not a real behavioral fork.
3. **"Edit in Engage" is one button in the dashboard header** (`FastrrJourney2`'s header, alongside wallet/profile), navigating to `/flows-v2` (the FlowV2 builder's home/list page). Not a per-journey action.
4. **Full replacement** — the current Hero/`PersonalizedStatStrip`/`JourneyListingSection`/`TestimonialSection` composition and the just-built `FundWalletModal` are replaced outright. Testimonials are dropped. The wallet step becomes a full page (step 2 of 3), not a modal.
5. **The Known/Fastrr Identified audience split is dropped from the listing view.** Each journey type (Abandoned Product/Cart/Checkout) is one card, one checkbox, one message preview — matching the prototype exactly. Selecting a card selects **both** underlying audience-specific `JOURNEYS` entries for that type as one unit (see Data Model section) — the dashboard's own per-audience toggles are untouched.

## A) Routes & Pages

| Route | Change |
|---|---|
| `/fastrr-engage-2` | **Rebuilt.** New prototype-aligned home page. |
| `/engage-2/setup` | **New.** The 3-step flow (Select recap → Fund Wallet → WhatsApp Account Setup). Internal step state (not 3 separate routes) so the progress bar can jump between steps without full remounts, matching the prototype's single-page step switching. |
| `/engage-2/account-setup` | **Removed.** Step 3 of `/engage-2/setup` replaces it. `EngageAccountSetupPage`/`EngageAccountSetup2.jsx` is deleted; its `SetupInstructions`/`PhoneMockup`/`WhatsAppProfilePreview` components are reused, not deleted. |
| `/engage-2/recharge` | Already removed (prior segment). Stays removed. |
| `/engage-2/meta-embedded-signup` | **Unchanged.** Still the actual signup mock, reached from step 3. |
| `/fastrr-journey-2` | **Unchanged structurally.** Gains one header button ("Edit in Engage" → `/flows-v2`) and a visual polish pass on the journey rows (Non-Goals: no structural change). |

## B) Home Page (`/fastrr-engage-2`)

### B.1 Header — store selector

Adds a store-selector dropdown to the existing header-and-stats bar (same bar that currently shows the WhatsApp status pill / wallet balance / profile), styled after the prototype: an initial-avatar chip + store name + caret, opening a small menu with one real store row (checkmarked) — cosmetic per decision #1, no store-switching logic.

### B.2 Funnel stats (replaces `PersonalizedStatStrip`)

Four stat blocks in the prototype's 2×2 grid-with-dividers layout, each with a value, a thin proportional bar, and a note:

1. **Total visitors/day** — `MOCK_STORE_ACTIVITY.visitorsPerDay` (10,000).
2. **Identified shoppers/day** — new field `MOCK_STORE_ACTIVITY.identifiedPerDay = 3400` (a plausible ~34% of visitors, matching the prototype's own ratio). Note: "34% reachable on WhatsApp via Fastrr."
3. **Abandoned carts & checkouts/day** — sum of `JOURNEYS`' Cart + Checkout `estimatedDailyVolume` (4,000 + 1,600 = 5,600). Bar width proportional to visitors.
4. **Missed opportunity** — `(4,000 + 1,600) × MOCK_STORE_ACTIVITY.aov` = ₹560,000/day, run through `formatCompactCurrency`, danger-tinted background (`bg-danger-bg`/`text-danger` or the closest existing token pair — verify exact token names against the design system at implementation time, mirroring the prototype's red "missed opportunity" block).

### B.3 Hero — animated phone mockup + story steps

Ports the prototype's cycling phone-mockup animation:
- **Phases** (matching the prototype's `tick()` state machine, adapted to this app's existing visual language rather than copying its literal colors): checkout form → lock-screen notification → WhatsApp chat bubble → "restoring your cart" loading → payment confirmation → order-placed success, cycling automatically via a `setTimeout` chain (`componentDidMount`-equivalent `useEffect`), each phase a fixed duration.
- Implementation: a small custom hook or local state machine (`usePhoneMockupPhases`) owning `phase` (0–6) and the timing table, cleaned up on unmount.
- **Respects `prefers-reduced-motion`**: freezes on one representative phase (the WhatsApp chat bubble, phase 3) instead of auto-cycling, checked via `window.matchMedia`.
- Beside the phone: the prototype's 4-step "story" list (Shopper drops off → Engage waits → WhatsApp reminder delivered → One tap back to purchase), with the currently-relevant step highlighted based on `phase`.
- Copy/headline: keep the prototype's framing ("Recover abandoned revenue on WhatsApp — automatically"), adapted to this app's existing hero copy conventions (checked against `formatCompactCurrency`/`formatCompactNumber` usage elsewhere for consistency — no incorrect ad-hoc number formatting).

### B.4 Journey selection cards (replaces `JourneyListingSection`'s per-audience cards)

One card per journey type (`JOURNEY_TYPES`: Abandoned Product / Cart / Checkout), redrawn in the prototype's richer style:
- Icon badge (reusing the existing `ICONS` map: Eye/ShoppingCart/CreditCard).
- "Recommended" chip on Abandoned Checkout (matching the prototype's highest-intent framing).
- A checkbox-style selected state (border + checkmark box, not the old pill/tab treatment) reflecting whether **both** underlying `JOURNEYS` entries for that type are selected.
- Volume + "message sent" timing row (reusing `estimatedDailyVolume` and existing wait/trigger copy).
- **"Preview journey" row** — opens the existing `JourneyPreviewModal` in its single-flow layout (Trigger → Wait → Message chart via `WhatsAppBubblePreview`), using **one** representative `JOURNEYS` entry per type (the Known variant, arbitrarily, since message content differs only cosmetically and the modal renders one flow) — **no** `otherAudienceJourney`/dual-audience toggle passed, since there's no audience choice on this page anymore.
- **Selecting the card** toggles both underlying entries for that type together (see Data Model).

### B.5 Sticky bar (`CartRail`, restyled)

Same portalled component and store wiring, restyled to the prototype's dark rounded bar with a count + "Continue" button. **"Continue" now navigates to `/engage-2/setup`** instead of opening `FundWalletModal` (which is removed as a modal — its content becomes step 2's page).

## C) The 3-Step Flow (`/engage-2/setup`)

One page, internal step state (`useState("select" | "wallet" | "setup")`), with a progress bar at the top (3 segments: "Select journeys" / "Fund wallet" / "WhatsApp Account Setup"), each clickable to jump back to a completed step, matching the prototype's `progress` array exactly (bar color states: done/current/upcoming).

### C.1 Step 1 — Select (recap only)

Not the full grid again — a compact recap of the selected journey types (names + a "Change selection" link back to `/fastrr-engage-2`), consistent with the prototype's step-based structure where step 1 is "already done" once you've arrived here via Continue.

### C.2 Step 2 — Fund Wallet (full page, not a modal)

Reuses everything just built: `WalletRechargeCard` with cart-derived `initialAmount` (via `computeCartFunding`), `hideSubtitleOnChange`, the AI Suggest chip + tooltip, coupon flow, and the now-functional Transfer button. Page chrome (heading, subheading) matches the prototype's Step 2 copy style ("Fund your messaging wallet" / billing explanation), not a Dialog. **"Skip and Continue Meta (WhatsApp) Setup"** advances to step 3 without funding (soft gate preserved).

### C.3 Step 3 — WhatsApp Account Setup

Reuses `SetupInstructions` (left column) + `PhoneMockup` + `WhatsAppProfilePreview` (right column, "in the WhatsApp prototype style" already built) — not rebuilt from scratch.

- **New instructions panel** (above/beside the phone mockup): explains what happens next in plain terms — confirm your business details here, then Meta verification happens as one continuous step even though it technically opens in a new tab, plus prerequisites (a WhatsApp Business-capable phone number; basic business details) — written so the hand-off doesn't feel like leaving the product.
- **Pre-filled defaults** on `WhatsAppProfilePreview`'s fields (currently all blank): brand name `"Mystore1"`, description `"Curated home & lifestyle essentials, shipped fast across India."`, website `"mystore1.in"`, email `"hello@mystore1.in"`, support number `"+91 98765 43210"`, address `"12, MG Road, Bengaluru, Karnataka 560001"`, category = existing `DEFAULT_BUSINESS_CATEGORY`, number mode defaults to `"has_number"` with `numberValue` pre-filled `"98765 43210"`. **Default logo**: a gradient-colored initial-avatar placeholder (matching this app's established mock-visual convention — e.g. the phone-mockup's product-thumbnail gradients — rather than an external stock photo asset), not a blank/empty state. All fields remain editable exactly as today.
- **Two CTAs**, both wired to the same underlying `handleStartSignup`-equivalent call into `MetaEmbeddedSignup2` (decision #2): **"Confirm & Start WhatsApp Setup Manually"** and **"Confirm & Start WhatsApp Setup with AI"**.

## D) Dashboard (`/fastrr-journey-2`)

- One new **"Edit in Engage"** button in the header (alongside existing wallet/profile controls), navigating to `/flows-v2`.
- Visual polish pass on the journey rows/cards addressing "plain and lifeless": better spacing, a subtle icon treatment consistent with the home page's new card style, clearer hover/selected states. **No structural change** — same table/toggle mechanics, same `JourneyPreviewModal` single-flow preview, same enable/disable behavior.

## E) Data Model

- **No changes to `journeySelectionStore2`'s public shape** (`selected`, `toggle`, `isSelected`, `selectedJourneys`, `clear`).
- **Card-level "select a journey type" = toggle both audience variants together.** The card's checked state reads as selected if **either** underlying variant is selected (`isSelected(known.id) || isSelected(identified.id)`). Clicking the card is a clean boolean flip on that combined state: if it currently reads selected (either or both true), the click ensures **both** end up deselected; if it reads unselected (both false), the click ensures **both** end up selected. This never leaves the pair in a mixed state from card-level interaction, regardless of what state they started in. `computeCartFunding`'s existing per-`journeyType` dedup already produces the correct total for "both variants selected" — **no changes needed to `cartFunding.js`**.
- **`MOCK_STORE_ACTIVITY` gains one additive field**: `identifiedPerDay: 3400`. `computeRevenueOpportunity()`'s existing return shape is otherwise unchanged (nothing currently consuming it breaks).
- `JOURNEYS`, `JOURNEY_TYPES`, `RATE_CARD`, `WALLET_TOPUP`, `COUPONS` — unchanged.

## Non-Goals

- No real second store or functional store-switching.
- No real behavioral difference between "Manually" and "with AI" setup.
- No changes to `fastrr-engage`/`fastrr-journey` (v1) — verified via zero-diff check at merge time, as in every prior segment.
- No changes to the dashboard's own per-audience (Known/Fastrr Identified) toggles or `JourneysTable` row structure — only header addition + visual polish.
- No new backend/API integration — this remains a fully mocked prototype, consistent with the rest of `engage2/`.
- No changes to `WhatsAppBubblePreview` or `previewToast` (the two files still genuinely shared with v1 per `CLAUDE.md`) beyond how they're already used.
