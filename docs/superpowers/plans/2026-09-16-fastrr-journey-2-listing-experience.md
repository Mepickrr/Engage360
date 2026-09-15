# Fastrr Journey V2 Listing Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Fastrr Journey V2 (`engage2`/`*2` only) seller experience as an e-commerce-style flow — a journey listing/cart on Home, a Recharge step, then Account Setup, Meta Embedded Signup, and a Dashboard that arrives with the selected journeys already live.

**Architecture:** A new `journeySelectionStore2` (zustand) carries the seller's picks from the new Listing (rebuilt `FastrrEngage2.jsx`) through a new `RechargeStep2` page to the Dashboard (`FastrrJourney2.jsx`), which seeds its enabled-journeys state from it on arrival. Signup switches from a popup window to same-tab navigation so that in-memory store survives the whole funnel without new persistence. Everything lives under `src/components/engage2/`, `src/pages/*2.jsx`, and `src/store/*2.js` — v1 (`fastrr-engage`, `fastrr-journey`) is not touched anywhere in this plan.

**Tech Stack:** React 19, react-router-dom v7, zustand, Jest + React Testing Library (via `craco test`).

**Spec:** `docs/superpowers/specs/2026-09-16-fastrr-journey-2-listing-experience-design.md`

## Global Constraints

- v1 (`fastrr-engage`, `fastrr-journey`, everything under the original `src/components/engage/` folders) is never modified by any task in this plan.
- `RATE_CARD`, `WALLET_TOPUP`, `COUPONS` in `src/components/engage2/journey-dashboard/data.js` are unchanged. The 6 `JOURNEYS` entries keep every existing field (`id`, `journeyType`, `audience`, `tooltip`, `triggerLabel`, `waDraft`) — only two new fields are added (`previewSample`, `estimatedDailyVolume`), and one new export (`JOURNEY_TYPES`) is added alongside them.
- All messaging is priced at the WhatsApp Marketing rate (`RATE_CARD.enabled.find(c => c.id === "wa-marketing")`), consistent with the existing per-message cost already shown on the dashboard's journey preview modal.
- The 3-day wallet-runway constant is `WALLET_TOPUP.aiSuggestRunwayDays` — reused everywhere a funding estimate is computed, never a new hardcoded "3".
- New route: `/engage-2/recharge`, outside `AppShell` (matching `/engage-2/account-setup` and `/engage-2/meta-embedded-signup`), page wrapper `data-testid="page-recharge"`.
- Currency formatting for compact figures (e.g. hero headline, stat strip) uses the existing `formatCompactCurrency`/`formatCompactNumber` from `src/lib/analyticsFormat.js` — note `formatCompactCurrency` abbreviates crores as `"C"` (e.g. `"₹1.2C"`), not `"Cr"`.
- `computeRevenueOpportunity()` (no argument — it defaults to `MOCK_STORE_ACTIVITY`) from `src/components/engage2/RevenueOpportunityCard2.jsx` returns `{ visitorsPerDay: 10000, abandonedCheckoutPerDay: 4000, abandonmentRate: 40, dailyRevenueAtRisk: 400000, monthlyRevenueAtRisk: 12000000 }` — these exact numbers are used throughout this plan's test assertions.
- Test conventions already established in this codebase, followed throughout: `react-router-dom` cannot be resolved by real Jest here (ESM-only `exports` map) — every test touching it uses `jest.mock("react-router-dom", () => ({...}), { virtual: true })`; Radix-based components (`Dialog`, `Tooltip`, `Select`) need `window.HTMLElement.prototype.hasPointerCapture/releasePointerCapture/scrollIntoView = jest.fn()` in `beforeAll`; zustand store tests reset state via `useXStore.getState().clear()` or `useXStore.setState({...})` in `beforeEach`.

---

### Task 1: Journey data — add preview samples, daily volumes, and journey-type groupings

**Files:**
- Modify: `src/components/engage2/journey-dashboard/data.js`

**Interfaces:**
- Produces: each of the 6 `JOURNEYS` entries gains `previewSample` (string) and `estimatedDailyVolume` (number). New export `JOURNEY_TYPES` (array of `{ id, journeyType, icon, description }`, 3 entries). Later tasks (2, 3, 4, 6, 7, 8) import `JOURNEYS`, `JOURNEY_TYPES`, `RATE_CARD`, `WALLET_TOPUP` from this file.
- Consumes: nothing new — this is the foundational data task.

- [ ] **Step 1: Modify `data.js`'s `JOURNEYS` array — add `previewSample` and `estimatedDailyVolume` to each entry**

Change the `JOURNEYS` export from:

```js
export const JOURNEYS = [
  {
    id: "abandoned-product-known",
    journeyType: "Abandoned Product",
    audience: "Known",
    tooltip:
      "Nudges known customers who viewed a product but didn't add it to cart, using their verified WhatsApp number.",
    triggerLabel: "Known buyer views a product",
    waDraft: {
      body: "Hey {{1}}, still thinking about {{2}}? It's waiting for you — tap below to grab it before it's gone.",
      buttons: [{ label: "View Product" }],
    },
  },
  {
    id: "abandoned-product-identified",
    journeyType: "Abandoned Product",
    audience: "Fastrr Identified",
    tooltip:
      "Re-engages anonymous visitors identified by Fastrr who viewed a product but didn't add it to cart.",
    triggerLabel: "Fastrr-identified visitor views a product",
    waDraft: {
      body: "Spotted you browsing {{1}}! Here's a closer look — tap below to check it out again.",
      buttons: [{ label: "View Product" }],
    },
  },
  {
    id: "abandoned-cart-known",
    journeyType: "Abandoned Cart",
    audience: "Known",
    tooltip: "Reminds known customers who added items to cart but didn't check out.",
    triggerLabel: "Known buyer adds product to cart",
    waDraft: {
      body: "Hey {{1}}, you left {{2}} in your cart! Complete your order now and get {{3}} off.",
      buttons: [{ label: "Complete Order" }],
    },
  },
  {
    id: "abandoned-cart-identified",
    journeyType: "Abandoned Cart",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers anonymous, Fastrr-identified visitors who added items to cart but didn't check out.",
    triggerLabel: "Fastrr-identified visitor adds product to cart",
    waDraft: {
      body: "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off.",
      buttons: [{ label: "Resume Cart" }],
    },
  },
  {
    id: "abandoned-checkout-known",
    journeyType: "Abandoned Checkout",
    audience: "Known",
    tooltip: "Follows up with known customers who started checkout but didn't complete payment.",
    triggerLabel: "Known buyer starts checkout",
    waDraft: {
      body: "Hey {{1}}, you're just one step away! Complete your payment for {{2}} now.",
      buttons: [{ label: "Complete Payment" }],
    },
  },
  {
    id: "abandoned-checkout-identified",
    journeyType: "Abandoned Checkout",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers Fastrr-identified visitors who started checkout but didn't complete payment — the highest-intent recovery moment.",
    triggerLabel: "Fastrr-identified visitor starts checkout",
    waDraft: {
      body: "Almost done! Your order is saved — tap below to complete checkout in seconds.",
      buttons: [{ label: "Complete Checkout" }],
    },
  },
];
```

to (only the additions are new; every existing field/value is untouched):

```js
export const JOURNEYS = [
  {
    id: "abandoned-product-known",
    journeyType: "Abandoned Product",
    audience: "Known",
    tooltip:
      "Nudges known customers who viewed a product but didn't add it to cart, using their verified WhatsApp number.",
    triggerLabel: "Known buyer views a product",
    waDraft: {
      body: "Hey {{1}}, still thinking about {{2}}? It's waiting for you — tap below to grab it before it's gone.",
      buttons: [{ label: "View Product" }],
    },
    previewSample:
      "Hey Aanya, still thinking about the Juniper Throw? It's waiting for you — tap below to grab it before it's gone.",
    estimatedDailyVolume: 1200,
  },
  {
    id: "abandoned-product-identified",
    journeyType: "Abandoned Product",
    audience: "Fastrr Identified",
    tooltip:
      "Re-engages anonymous visitors identified by Fastrr who viewed a product but didn't add it to cart.",
    triggerLabel: "Fastrr-identified visitor views a product",
    waDraft: {
      body: "Spotted you browsing {{1}}! Here's a closer look — tap below to check it out again.",
      buttons: [{ label: "View Product" }],
    },
    previewSample:
      "Spotted you browsing the Linen Weave Throw! Here's a closer look — tap below to check it out again.",
    estimatedDailyVolume: 1200,
  },
  {
    id: "abandoned-cart-known",
    journeyType: "Abandoned Cart",
    audience: "Known",
    tooltip: "Reminds known customers who added items to cart but didn't check out.",
    triggerLabel: "Known buyer adds product to cart",
    waDraft: {
      body: "Hey {{1}}, you left {{2}} in your cart! Complete your order now and get {{3}} off.",
      buttons: [{ label: "Complete Order" }],
    },
    previewSample:
      "Hey Aanya, you left the Juniper Throw in your cart! Complete your order now and get 10% off.",
    estimatedDailyVolume: 4000,
  },
  {
    id: "abandoned-cart-identified",
    journeyType: "Abandoned Cart",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers anonymous, Fastrr-identified visitors who added items to cart but didn't check out.",
    triggerLabel: "Fastrr-identified visitor adds product to cart",
    waDraft: {
      body: "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off.",
      buttons: [{ label: "Resume Cart" }],
    },
    previewSample: "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off.",
    estimatedDailyVolume: 4000,
  },
  {
    id: "abandoned-checkout-known",
    journeyType: "Abandoned Checkout",
    audience: "Known",
    tooltip: "Follows up with known customers who started checkout but didn't complete payment.",
    triggerLabel: "Known buyer starts checkout",
    waDraft: {
      body: "Hey {{1}}, you're just one step away! Complete your payment for {{2}} now.",
      buttons: [{ label: "Complete Payment" }],
    },
    previewSample: "Hey Aanya, you're just one step away! Complete your payment for ₹1,840 now.",
    estimatedDailyVolume: 1600,
  },
  {
    id: "abandoned-checkout-identified",
    journeyType: "Abandoned Checkout",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers Fastrr-identified visitors who started checkout but didn't complete payment — the highest-intent recovery moment.",
    triggerLabel: "Fastrr-identified visitor starts checkout",
    waDraft: {
      body: "Almost done! Your order is saved — tap below to complete checkout in seconds.",
      buttons: [{ label: "Complete Checkout" }],
    },
    previewSample: "Almost done! Your order is saved — tap below to complete checkout in seconds.",
    estimatedDailyVolume: 1600,
  },
];

// Groups the 6 JOURNEYS entries above into the 3 listing cards shown on the
// v2 Home page — each card offers both audience variants (Known / Fastrr
// Identified) of one journeyType. `icon` names a lucide-react icon,
// resolved by the presentation layer (JourneyListingCard), not here, so
// this file stays free of component/JSX imports.
export const JOURNEY_TYPES = [
  {
    id: "abandoned-product",
    journeyType: "Abandoned Product",
    icon: "Eye",
    description: "Views a product but never adds it to cart.",
  },
  {
    id: "abandoned-cart",
    journeyType: "Abandoned Cart",
    icon: "ShoppingCart",
    description: "Adds to cart but doesn't check out.",
  },
  {
    id: "abandoned-checkout",
    journeyType: "Abandoned Checkout",
    icon: "CreditCard",
    description: "Starts checkout but doesn't complete payment.",
  },
];
```

- [ ] **Step 2: Run the full existing `journey-dashboard` test suite to confirm the additive change breaks nothing**

Run: `npx craco test --testPathPattern="components/engage2/journey-dashboard" --watchAll=false`
Expected: PASS — every existing test in this folder still passes unchanged (they only assert the fields that already existed; the two new fields and the new export are additive and untouched by any existing assertion).

- [ ] **Step 3: Commit**

```bash
git add src/components/engage2/journey-dashboard/data.js
git commit -m "feat(fastrr-journey-2): add preview samples, daily volumes, and journey-type groupings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `journeySelectionStore2` — the cart

**Files:**
- Create: `src/store/journeySelectionStore2.js`
- Test: `src/store/__tests__/journeySelectionStore2.test.js`

**Interfaces:**
- Consumes: `JOURNEYS` from `@/components/engage2/journey-dashboard/data` (Task 1).
- Produces: `useJourneySelectionStore2` — zustand hook with state `{ selected: {} }` and actions `toggle(journeyId)`, `isSelected(journeyId)`, `selectedJourneys()` (returns full `JOURNEYS` entries for every selected id, in `JOURNEYS`' own declared order — not insertion order), `clear()`. Later tasks (3, 4, 8, 9, 11) use this store.

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/journeySelectionStore2.test.js`:

```js
import { useJourneySelectionStore2 } from "../journeySelectionStore2";

const getState = () => useJourneySelectionStore2.getState();

beforeEach(() => {
  getState().clear();
});

describe("journeySelectionStore2", () => {
  it("starts with nothing selected", () => {
    expect(getState().selected).toEqual({});
    expect(getState().selectedJourneys()).toEqual([]);
  });

  it("toggle() selects an unselected journey id", () => {
    getState().toggle("abandoned-cart-known");
    expect(getState().isSelected("abandoned-cart-known")).toBe(true);
  });

  it("toggle() deselects an already-selected journey id", () => {
    getState().toggle("abandoned-cart-known");
    getState().toggle("abandoned-cart-known");
    expect(getState().isSelected("abandoned-cart-known")).toBe(false);
  });

  it("selectedJourneys() resolves selected ids against JOURNEYS, in JOURNEYS' own order regardless of click order", () => {
    getState().toggle("abandoned-checkout-known");
    getState().toggle("abandoned-product-known");
    const result = getState().selectedJourneys();
    expect(result.map((j) => j.id)).toEqual(["abandoned-product-known", "abandoned-checkout-known"]);
  });

  it("clear() resets all selections", () => {
    getState().toggle("abandoned-cart-known");
    getState().clear();
    expect(getState().selected).toEqual({});
    expect(getState().selectedJourneys()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="journeySelectionStore2" --watchAll=false`
Expected: FAIL — cannot find module `../journeySelectionStore2`.

- [ ] **Step 3: Write minimal implementation**

Create `src/store/journeySelectionStore2.js`:

```js
// engage2-only cart: which journey ids the seller picked on the Listing
// page, carried through Recharge -> Account Setup -> Signup (all same-tab
// navigation, per the design's Technical Decision) to the Dashboard, which
// seeds its enabled-journeys state from this on arrival, then clears it.

import { create } from "zustand";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";

export const useJourneySelectionStore2 = create((set, get) => ({
  selected: {},
  toggle: (journeyId) =>
    set((s) => {
      const next = { ...s.selected };
      if (next[journeyId]) {
        delete next[journeyId];
      } else {
        next[journeyId] = true;
      }
      return { selected: next };
    }),
  isSelected: (journeyId) => !!get().selected[journeyId],
  selectedJourneys: () => JOURNEYS.filter((j) => get().selected[j.id]),
  clear: () => set({ selected: {} }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="journeySelectionStore2" --watchAll=false`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/journeySelectionStore2.js src/store/__tests__/journeySelectionStore2.test.js
git commit -m "feat(fastrr-journey-2): add journeySelectionStore2 (the cart)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `JourneyListingCard` — one journey-type card with the Known/Identified pill toggle

**Files:**
- Create: `src/components/engage2/home/JourneyListingCard.jsx`
- Test: `src/components/engage2/home/__tests__/JourneyListingCard.test.jsx`

**Interfaces:**
- Consumes: `JOURNEYS`, `RATE_CARD` from `@/components/engage2/journey-dashboard/data` (Task 1); `useJourneySelectionStore2` (Task 2).
- Produces: `JourneyListingCard` (default export, prop: `journeyTypeConfig` — one `JOURNEY_TYPES` entry `{ id, journeyType, icon, description }`). Renders `data-testid={\`journey-listing-card-${journeyTypeConfig.id}\`}`, and per-audience `data-testid={\`journey-listing-pill-${journeyId}\`}` / `data-testid={\`journey-listing-preview-${journeyId}\`}`. Later task (5) renders one of these per `JOURNEY_TYPES` entry.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage2/home/__tests__/JourneyListingCard.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyListingCard from "../JourneyListingCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

const cartConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Cart");

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingCard", () => {
  it("renders the journey type name, description, and both audience pills", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Adds to cart but doesn't check out.")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-pill-abandoned-cart-known")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-pill-abandoned-cart-identified")).toBeInTheDocument();
  });

  it("defaults to previewing the Known variant, showing its resolved sample message and daily volume", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-preview-abandoned-cart-known")).toHaveTextContent(
      "Juniper Throw"
    );
    expect(screen.getByText("~4,000/day")).toBeInTheDocument();
  });

  it("clicking the Fastrr Identified pill switches the preview to it", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(
      screen.getByTestId("journey-listing-preview-abandoned-cart-identified")
    ).toHaveTextContent("We saved your cart");
  });

  it("clicking a pill also selects it in the store, independent of the other pill", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking an already-selected, already-previewed pill deselects it but keeps it as the preview", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    const knownPill = screen.getByTestId("journey-listing-pill-abandoned-cart-known");
    fireEvent.click(knownPill); // select + preview
    fireEvent.click(knownPill); // deselect, stays preview
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(screen.getByTestId("journey-listing-preview-abandoned-cart-known")).toBeInTheDocument();
  });

  it("clicking the other pill previews and selects it without changing the first pill's selection", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/JourneyListingCard" --watchAll=false`
Expected: FAIL — cannot find module `../JourneyListingCard`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage2/home/JourneyListingCard.jsx`:

```jsx
import React, { useState } from "react";
import { Eye, ShoppingCart, CreditCard, Check } from "lucide-react";
import { JOURNEYS, RATE_CARD } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

const ICONS = { Eye, ShoppingCart, CreditCard };

const AUDIENCE_EXPLAINER = {
  Known: "Customers reached on their verified WhatsApp number.",
  "Fastrr Identified":
    "Anonymous visitors Fastrr recognizes from browsing, before they've ever signed up.",
};

const MARKETING_RATE = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").price;

export default function JourneyListingCard({ journeyTypeConfig }) {
  const [activeAudience, setActiveAudience] = useState("Known");
  const toggle = useJourneySelectionStore2((s) => s.toggle);
  const selected = useJourneySelectionStore2((s) => s.selected);

  const variants = {
    Known: JOURNEYS.find(
      (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Known"
    ),
    "Fastrr Identified": JOURNEYS.find(
      (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Fastrr Identified"
    ),
  };

  const activeJourney = variants[activeAudience];
  const Icon = ICONS[journeyTypeConfig.icon];

  function handlePillClick(audience) {
    setActiveAudience(audience);
    toggle(variants[audience].id);
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg p-5"
      data-testid={`journey-listing-card-${journeyTypeConfig.id}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-base font-semibold text-text-primary">
            {journeyTypeConfig.journeyType}
          </div>
          <div className="text-xs text-text-secondary">{journeyTypeConfig.description}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {["Known", "Fastrr Identified"].map((audience) => {
          const isSelected = !!selected[variants[audience].id];
          const isActive = activeAudience === audience;
          return (
            <button
              key={audience}
              type="button"
              data-testid={`journey-listing-pill-${variants[audience].id}`}
              onClick={() => handlePillClick(audience)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border hover:border-primary"
              } ${isActive ? "ring-2 ring-primary/30" : ""}`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {audience}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted mb-3">{AUDIENCE_EXPLAINER[activeAudience]}</p>

      <div
        className="bg-app-bg border border-border rounded-md p-3 mb-3"
        data-testid={`journey-listing-preview-${activeJourney.id}`}
      >
        <p className="text-sm text-text-primary">{`"${activeJourney.previewSample}"`}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{`~${activeJourney.estimatedDailyVolume.toLocaleString("en-IN")}/day`}</span>
        <span className="tabular-nums">{MARKETING_RATE}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/JourneyListingCard" --watchAll=false`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/JourneyListingCard.jsx src/components/engage2/home/__tests__/JourneyListingCard.test.jsx
git commit -m "feat(fastrr-journey-2): add JourneyListingCard with Known/Identified pill toggle

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `CartRail` — sticky bottom bar

**Files:**
- Create: `src/components/engage2/home/CartRail.jsx`
- Test: `src/components/engage2/home/__tests__/CartRail.test.jsx`

**Interfaces:**
- Consumes: `useJourneySelectionStore2` (Task 2); `RATE_CARD`, `WALLET_TOPUP` from `@/components/engage2/journey-dashboard/data` (Task 1).
- Produces: `CartRail` (default export, no props). Renders nothing when nothing is selected; otherwise `data-testid="cart-rail"`, `data-testid="cart-rail-summary"`, `data-testid="cart-rail-continue"` (navigates to `/engage-2/recharge`). Later task (5) renders this once, after the 3 cards.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage2/home/__tests__/CartRail.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CartRail from "../CartRail";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  mockNavigate.mockClear();
});

describe("CartRail", () => {
  it("renders nothing when nothing is selected", () => {
    render(<CartRail />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });

  it("shows the selected count and a funding estimate once a journey is selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<CartRail />);
    // 4,000/day * ₹1.50/message * 3-day runway = ₹18,000
    expect(screen.getByTestId("cart-rail")).toBeInTheDocument();
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("1 journey selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹18,000");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("3 days");
  });

  it("pluralizes and sums the estimate across multiple selections", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    useJourneySelectionStore2.getState().toggle("abandoned-checkout-known");
    render(<CartRail />);
    // (4,000 + 1,600)/day * ₹1.50 * 3 days = ₹25,200
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("2 journeys selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹25,200");
  });

  it("clicking Continue to Recharge navigates to /engage-2/recharge", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<CartRail />);
    fireEvent.click(screen.getByTestId("cart-rail-continue"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/recharge");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/CartRail" --watchAll=false`
Expected: FAIL — cannot find module `../CartRail`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage2/home/CartRail.jsx`:

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { RATE_CARD, WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

const MARKETING_RATE_PER_MESSAGE = RATE_CARD.enabled.find(
  (c) => c.id === "wa-marketing"
).pricePerMessage;

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CartRail() {
  const navigate = useNavigate();
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());

  if (selectedJourneys.length === 0) return null;

  const dailyCost = selectedJourneys.reduce(
    (sum, j) => sum + j.estimatedDailyVolume * MARKETING_RATE_PER_MESSAGE,
    0
  );
  const total = dailyCost * WALLET_TOPUP.aiSuggestRunwayDays;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 flex justify-center pb-5 px-4" data-testid="cart-rail">
      <div className="w-full max-w-[900px] bg-slate-900 text-white rounded-xl shadow-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold" data-testid="cart-rail-summary">
            {`${selectedJourneys.length} journey${
              selectedJourneys.length > 1 ? "s" : ""
            } selected · est. ${formatINR(total)} to fund ${WALLET_TOPUP.aiSuggestRunwayDays} days`}
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            Funds stay in your wallet until each journey actually sends.
          </div>
        </div>
        <Button
          type="button"
          className="bg-white text-slate-900 hover:bg-white/90 flex-shrink-0"
          data-testid="cart-rail-continue"
          onClick={() => navigate("/engage-2/recharge")}
        >
          Continue to Recharge
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/CartRail" --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/CartRail.jsx src/components/engage2/home/__tests__/CartRail.test.jsx
git commit -m "feat(fastrr-journey-2): add sticky CartRail

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `JourneyListingSection` — composes the 3 cards + cart rail

**Files:**
- Create: `src/components/engage2/home/JourneyListingSection.jsx`
- Test: `src/components/engage2/home/__tests__/JourneyListingSection.test.jsx`

**Interfaces:**
- Consumes: `JourneyListingCard` (Task 3), `CartRail` (Task 4), `JOURNEY_TYPES` from `@/components/engage2/journey-dashboard/data` (Task 1).
- Produces: `JourneyListingSection` (default export, no props), `data-testid="journey-listing-section"`. Later task (9) renders this on the Home page.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage2/home/__tests__/JourneyListingSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import JourneyListingSection from "../JourneyListingSection";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingSection", () => {
  it("renders the heading and all 3 journey type cards", () => {
    render(<JourneyListingSection />);
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByText("Pick the moments worth messaging")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-product")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-checkout")).toBeInTheDocument();
  });

  it("does not render the cart rail when nothing is selected", () => {
    render(<JourneyListingSection />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/JourneyListingSection" --watchAll=false`
Expected: FAIL — cannot find module `../JourneyListingSection`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage2/home/JourneyListingSection.jsx`:

```jsx
import React from "react";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

export default function JourneyListingSection() {
  return (
    <div className="mb-10" data-testid="journey-listing-section">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Pick the moments worth messaging
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Each card shows the real message your shoppers would see. Select the ones you want —
          add as many as you like.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {JOURNEY_TYPES.map((type) => (
          <JourneyListingCard key={type.id} journeyTypeConfig={type} />
        ))}
      </div>
      <CartRail />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/JourneyListingSection" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/JourneyListingSection.jsx src/components/engage2/home/__tests__/JourneyListingSection.test.jsx
git commit -m "feat(fastrr-journey-2): add JourneyListingSection composing the 3 cards + cart rail

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Rewrite `HeroSection` — personalized, no CTA buttons

**Files:**
- Modify: `src/components/engage2/home/HeroSection.jsx`
- Modify: `src/components/engage2/home/__tests__/HeroSection.test.jsx`

**Interfaces:**
- Consumes: `computeRevenueOpportunity` from `@/components/engage2/RevenueOpportunityCard2` (already exists); `formatCompactCurrency` from `@/lib/analyticsFormat` (already exists); `ChatPreviewMockup` (sibling file, unchanged).
- Produces: `HeroSection` (default export, **no props** — this removes the previous `onEnable` prop entirely, since there are no more CTA buttons). `data-testid="hero-headline"`, `data-testid="hero-subhead"`. Later task (9) renders `<HeroSection />` with no props.

- [ ] **Step 1: Replace the test file**

Replace the full contents of `src/components/engage2/home/__tests__/HeroSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import HeroSection from "../HeroSection";

describe("HeroSection", () => {
  it("renders a personalized headline and subhead computed from the store's mock activity, and the chat preview mockup", () => {
    render(<HeroSection />);
    // monthlyRevenueAtRisk = 4,000/day * ₹100 AOV * 30 days = ₹1,20,00,000 -> formatCompactCurrency -> "₹1.2C"
    expect(screen.getByTestId("hero-headline")).toHaveTextContent(
      "₹1.2C a month is walking out through your checkout."
    );
    expect(screen.getByTestId("hero-subhead")).toHaveTextContent(
      "4,000 shoppers a day abandon before paying"
    );
    expect(screen.getByTestId("chat-preview-mockup")).toBeInTheDocument();
  });

  it("no longer renders the old CTA buttons", () => {
    render(<HeroSection />);
    expect(screen.queryByTestId("fastrr-engage-hero-cta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fastrr-engage-hero-secondary-cta")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/HeroSection" --watchAll=false`
Expected: FAIL — current `HeroSection` still renders the old headline/CTAs and takes an `onEnable` prop, so `hero-headline`/`hero-subhead` testids don't exist yet.

- [ ] **Step 3: Replace the implementation**

Replace the full contents of `src/components/engage2/home/HeroSection.jsx`:

```jsx
import React from "react";
import ChatPreviewMockup from "./ChatPreviewMockup";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { formatCompactCurrency } from "@/lib/analyticsFormat";

export default function HeroSection() {
  const { abandonedCheckoutPerDay, monthlyRevenueAtRisk } = computeRevenueOpportunity();

  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-block bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Your Store · Today's Activity
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
            data-testid="hero-headline"
          >
            {`${formatCompactCurrency(monthlyRevenueAtRisk)} a month is walking out through your checkout.`}
          </h1>
          <p className="text-base text-text-secondary" data-testid="hero-subhead">
            {`${abandonedCheckoutPerDay.toLocaleString(
              "en-IN"
            )} shoppers a day abandon before paying. Pick the moments worth messaging below, fund your wallet, and go live in minutes.`}
          </p>
        </div>
        <div>
          <ChatPreviewMockup />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/HeroSection" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/HeroSection.jsx src/components/engage2/home/__tests__/HeroSection.test.jsx
git commit -m "feat(fastrr-journey-2): rewrite HeroSection as personalized, CTA-free

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: `PersonalizedStatStrip`

**Files:**
- Create: `src/components/engage2/home/PersonalizedStatStrip.jsx`
- Test: `src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx`

**Interfaces:**
- Consumes: `computeRevenueOpportunity` from `@/components/engage2/RevenueOpportunityCard2`; `formatCompactCurrency`, `formatCompactNumber` from `@/lib/analyticsFormat`.
- Produces: `PersonalizedStatStrip` (default export, no props), `data-testid="personalized-stat-strip"`. Later task (9) renders this on the Home page, replacing `DarkStatBand`.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import PersonalizedStatStrip from "../PersonalizedStatStrip";

describe("PersonalizedStatStrip", () => {
  it("renders 3 stats computed from the store's mock activity", () => {
    render(<PersonalizedStatStrip />);
    expect(screen.getByTestId("personalized-stat-strip")).toBeInTheDocument();
    // visitorsPerDay: 10,000 -> formatCompactNumber -> "10K"
    expect(screen.getByText("10K")).toBeInTheDocument();
    expect(screen.getByText("visitors/day")).toBeInTheDocument();
    // abandonmentRate: 40
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("abandon before paying")).toBeInTheDocument();
    // monthlyRevenueAtRisk: 12,000,000 -> formatCompactCurrency -> "₹1.2C"
    expect(screen.getByText("₹1.2C")).toBeInTheDocument();
    expect(screen.getByText("at risk / month")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/PersonalizedStatStrip" --watchAll=false`
Expected: FAIL — cannot find module `../PersonalizedStatStrip`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage2/home/PersonalizedStatStrip.jsx`:

```jsx
import React from "react";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/analyticsFormat";

export default function PersonalizedStatStrip() {
  const { visitorsPerDay, abandonmentRate, monthlyRevenueAtRisk } = computeRevenueOpportunity();

  const stats = [
    { value: formatCompactNumber(visitorsPerDay), label: "visitors/day" },
    { value: `${abandonmentRate}%`, label: "abandon before paying" },
    { value: formatCompactCurrency(monthlyRevenueAtRisk), label: "at risk / month" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" data-testid="personalized-stat-strip">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface border border-border rounded-lg p-5 text-center">
          <div className="text-2xl font-bold text-primary">{stat.value}</div>
          <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage2/home/__tests__/PersonalizedStatStrip" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/PersonalizedStatStrip.jsx src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx
git commit -m "feat(fastrr-journey-2): add PersonalizedStatStrip

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: `RechargeStep2` page + `WalletRechargeCard`'s new `initialAmount` prop + route

**Files:**
- Modify: `src/components/engage2/journey-dashboard/WalletRechargeCard.jsx`
- Modify: `src/components/engage2/journey-dashboard/__tests__/WalletRechargeCard.test.jsx`
- Create: `src/pages/RechargeStep2.jsx`
- Test: `src/pages/__tests__/RechargeStep2.test.jsx`
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `WalletRechargeCard` (existing, gains one new optional prop); `useJourneySelectionStore2` (Task 2); `useJourneyWalletStore` from `@/store/journeyWalletStore2` (existing); `RATE_CARD`, `WALLET_TOPUP` from `@/components/engage2/journey-dashboard/data` (Task 1).
- Produces: `WalletRechargeCard` gains prop `initialAmount` (number, defaults to `WALLET_TOPUP.defaultAmount` — fully backward compatible, `WelcomeModal` and `RechargeWalletModal` keep working unchanged since neither passes it). New page `RechargeStep2Page` (default export, no props) at route `/engage-2/recharge`, `data-testid="page-recharge"`, with `data-testid="recharge-skip"` on its Skip link. Later task (11) is unaffected by this task; nothing later consumes `RechargeStep2` itself (it's a route leaf).

- [ ] **Step 1: Add the failing assertion to `WalletRechargeCard.test.jsx`**

Add this test to the existing `describe("WalletRechargeCard", ...)` block in `src/components/engage2/journey-dashboard/__tests__/WalletRechargeCard.test.jsx` (do not remove or modify any existing test in this file):

```jsx
  it("seeds the amount from initialAmount when given, instead of the default", () => {
    render(<WalletRechargeCard initialAmount={18000} />);
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WalletRechargeCard" --watchAll=false`
Expected: FAIL on the new test only (`WalletRechargeCard` doesn't accept `initialAmount` yet, so the input still shows the default `500`) — every pre-existing test in this file still passes.

- [ ] **Step 3: Add the `initialAmount` prop**

In `src/components/engage2/journey-dashboard/WalletRechargeCard.jsx`, change:

```jsx
export default function WalletRechargeCard({
  eyebrow = "Fund Your Wallet",
  subtitle = "Add balance so your journeys keep sending without interruption.",
  onDone,
}) {
  const [expandCoupon, setExpandCoupon] = useState(false);
  const [amount, setAmount] = useState(WALLET_TOPUP.defaultAmount);
```

to:

```jsx
export default function WalletRechargeCard({
  eyebrow = "Fund Your Wallet",
  subtitle = "Add balance so your journeys keep sending without interruption.",
  onDone,
  initialAmount = WALLET_TOPUP.defaultAmount,
}) {
  const [expandCoupon, setExpandCoupon] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="WalletRechargeCard" --watchAll=false`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Commit this part**

```bash
git add src/components/engage2/journey-dashboard/WalletRechargeCard.jsx src/components/engage2/journey-dashboard/__tests__/WalletRechargeCard.test.jsx
git commit -m "feat(fastrr-journey-2): add initialAmount prop to WalletRechargeCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Write the failing test for the new page**

Create `src/pages/__tests__/RechargeStep2.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RechargeStep2Page from "../RechargeStep2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  useJourneyWalletStore.setState({ balance: 0 });
  mockNavigate.mockClear();
});

describe("RechargeStep2Page", () => {
  it("seeds the wallet-recharge card's amount from the selected journeys' cart total", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<RechargeStep2Page />);
    expect(screen.getByTestId("page-recharge")).toBeInTheDocument();
    // 4,000/day * ₹1.50/message * 3-day runway = ₹18,000
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
  });

  it("falls back to the default amount when nothing was selected", () => {
    render(<RechargeStep2Page />);
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(500);
  });

  it("clicking Add to Wallet navigates to account setup", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<RechargeStep2Page />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
  });

  it("clicking Skip for now navigates to account setup without crediting the wallet", () => {
    render(<RechargeStep2Page />);
    fireEvent.click(screen.getByTestId("recharge-skip"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/RechargeStep2" --watchAll=false`
Expected: FAIL — cannot find module `../RechargeStep2`.

- [ ] **Step 8: Write the page implementation**

Create `src/pages/RechargeStep2.jsx`:

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import WalletRechargeCard from "@/components/engage2/journey-dashboard/WalletRechargeCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { RATE_CARD, WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

const MARKETING_RATE_PER_MESSAGE = RATE_CARD.enabled.find(
  (c) => c.id === "wa-marketing"
).pricePerMessage;

export default function RechargeStep2Page() {
  const navigate = useNavigate();
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());

  const dailyCost = selectedJourneys.reduce(
    (sum, j) => sum + j.estimatedDailyVolume * MARKETING_RATE_PER_MESSAGE,
    0
  );
  const cartAmount = dailyCost * WALLET_TOPUP.aiSuggestRunwayDays || WALLET_TOPUP.defaultAmount;

  function handleContinue() {
    navigate("/engage-2/account-setup");
  }

  return (
    <div
      className="min-h-screen bg-app-bg flex items-center justify-center px-6 py-10"
      data-testid="page-recharge"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Fund Your Wallet</h1>
          <p className="text-sm text-text-secondary mt-1">
            One step before setup — add balance so your selected journeys can start sending the
            moment they go live.
          </p>
        </div>

        <WalletRechargeCard
          eyebrow="Recharge for Your Selected Journeys"
          subtitle="This covers the journeys you just picked for their first 3 days."
          initialAmount={cartAmount}
          onDone={handleContinue}
        />

        <button
          type="button"
          className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto block mt-4"
          onClick={handleContinue}
          data-testid="recharge-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/RechargeStep2" --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 10: Wire the route into `src/App.js`**

Change:

```jsx
import FastrrJourneyPage2 from "@/pages/FastrrJourney2";
```

to:

```jsx
import FastrrJourneyPage2 from "@/pages/FastrrJourney2";
import RechargeStep2Page from "@/pages/RechargeStep2";
```

Change:

```jsx
          <Route path="/engage-2/account-setup" element={<EngageAccountSetupPage2 />} />
          <Route path="/engage-2/meta-embedded-signup" element={<MetaEmbeddedSignup2 />} />
          <Route path="/fastrr-journey-2" element={<FastrrJourneyPage2 />} />
```

to:

```jsx
          <Route path="/engage-2/recharge" element={<RechargeStep2Page />} />
          <Route path="/engage-2/account-setup" element={<EngageAccountSetupPage2 />} />
          <Route path="/engage-2/meta-embedded-signup" element={<MetaEmbeddedSignup2 />} />
          <Route path="/fastrr-journey-2" element={<FastrrJourneyPage2 />} />
```

There is no test file covering `App.js` route wiring yet (that's added in Task 9 of the earlier fork plan's follow-up, out of scope here) — verify this manually by re-reading the two changed regions of `src/App.js` after editing, confirming the import and route line both landed correctly and nothing else in the file changed.

- [ ] **Step 11: Commit**

```bash
git add src/pages/RechargeStep2.jsx src/pages/__tests__/RechargeStep2.test.jsx src/App.js
git commit -m "feat(fastrr-journey-2): add RechargeStep2 page and wire its route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Rebuild `FastrrEngage2.jsx` — the Home/Listing page

**Files:**
- Modify: `src/pages/FastrrEngage2.jsx`
- Modify: `src/pages/__tests__/FastrrEngage2.test.jsx`

**Interfaces:**
- Consumes: `HeroSection` (Task 6, no props now), `PersonalizedStatStrip` (Task 7), `JourneyListingSection` (Task 5), `TestimonialSection` (existing, unchanged, `data-testid="fastrr-engage-testimonials"`).
- Produces: `FastrrEngagePage` (default export, no props), `data-testid="page-fastrr-engage"` (unchanged). No longer imports or touches `useFastrrEngagePanelStore`, `RevenueOpportunityCard`, `LogoStrip`, `DarkStatBand`, `BentoFeatureGrid`, `FinalCTA`, or `useNavigate` — none of those are removed as files, just no longer referenced from this page.

- [ ] **Step 1: Replace the test file**

Replace the full contents of `src/pages/__tests__/FastrrEngage2.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage2";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

beforeEach(() => {
  useFastrrEngagePanelStore.getState().close();
  useJourneySelectionStore2.getState().clear();
});

describe("FastrrEngagePage (v2 listing)", () => {
  it("renders the page wrapper, hero, stat strip, listing section, and testimonials", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
    expect(screen.getByTestId("personalized-stat-strip")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
  });

  it("does not auto-open the FastrrEngagePanel2 side panel on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage2" --watchAll=false`
Expected: FAIL — the current page still renders the old 7-section composition and auto-opens the panel; none of the new testids exist yet on this page.

- [ ] **Step 3: Replace the page implementation**

Replace the full contents of `src/pages/FastrrEngage2.jsx`:

```jsx
import React from "react";
import HeroSection from "@/components/engage2/home/HeroSection";
import PersonalizedStatStrip from "@/components/engage2/home/PersonalizedStatStrip";
import JourneyListingSection from "@/components/engage2/home/JourneyListingSection";
import TestimonialSection from "@/components/engage2/home/TestimonialSection";

export default function FastrrEngagePage() {
  return (
    <div className="max-w-[1100px] mx-auto" data-testid="page-fastrr-engage">
      <HeroSection />
      <PersonalizedStatStrip />
      <JourneyListingSection />
      <TestimonialSection />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage2" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/FastrrEngage2.jsx src/pages/__tests__/FastrrEngage2.test.jsx
git commit -m "feat(fastrr-journey-2): rebuild FastrrEngage2 as the journey listing home page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Launch Meta Embedded Signup in-tab instead of as a popup

**Files:**
- Modify: `src/pages/EngageAccountSetup2.jsx`
- Modify: `src/pages/__tests__/EngageAccountSetup2.test.jsx`

**Interfaces:**
- Consumes: `useNavigate` from `react-router-dom`; `buildSignupPayload`, `writeSignupPayload` from `@/lib/metaSignupMock2` (drops `openSignupPopup`).
- Produces: `EngageAccountSetupPage` (default export, unchanged signature) — `handleStartSignup` now calls `navigate("/engage-2/meta-embedded-signup")` instead of opening a popup. No other behavior changes.

- [ ] **Step 1: Replace the test file**

Replace the full contents of `src/pages/__tests__/EngageAccountSetup2.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngageAccountSetupPage from "../EngageAccountSetup2";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
  mockNavigate.mockClear();
});

describe("EngageAccountSetupPage", () => {
  it("renders both columns and an exit-setup link back to /fastrr-engage-2", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-engage-account-setup")).toBeInTheDocument();
    expect(screen.getByTestId("setup-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("whatsapp-profile-preview")).toBeInTheDocument();
    expect(screen.getByTestId("exit-setup-link")).toHaveAttribute("href", "/fastrr-engage-2");
  });

  it("clicking either signup CTA writes the current form snapshot to localStorage and navigates to Meta Embedded Signup in-tab", () => {
    render(
      <MemoryRouter>
        <EngageAccountSetupPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    fireEvent.click(screen.getByTestId("setup-cta-manual"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.brandName).toBe("Avimee");
    expect(stored.phoneNumber).toBe("+91 98765 43210");
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");

    window.localStorage.clear();
    mockNavigate.mockClear();
    fireEvent.click(screen.getByTestId("setup-cta-ai"));

    const storedAgain = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(storedAgain.brandName).toBe("Avimee");
    expect(storedAgain.phoneNumber).toBe("+91 98765 43210");
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageAccountSetup2" --watchAll=false`
Expected: FAIL — the current page still opens a popup via `window.open`, never calls `useNavigate`'s mocked function.

- [ ] **Step 3: Replace the page implementation**

Replace the full contents of `src/pages/EngageAccountSetup2.jsx`:

```jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SetupInstructions from "@/components/engage2/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { buildSignupPayload, writeSignupPayload } from "@/lib/metaSignupMock2";

export default function EngageAccountSetupPage() {
  const navigate = useNavigate();
  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState("");
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");

  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState(DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState("");
  const [supportNumber, setSupportNumber] = useState("");
  const [address, setAddress] = useState("");

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  }

  function handleStartSignup() {
    const payload = buildSignupPayload({
      brandName,
      category,
      website,
      email,
      numberMode,
      numberValue,
      virtualNumberValue,
    });
    writeSignupPayload(payload);
    navigate("/engage-2/meta-embedded-signup");
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-account-setup">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <span className="text-sm font-semibold text-text-primary">Fastrr Engage</span>
        <Link
          to="/fastrr-engage-2"
          data-testid="exit-setup-link"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Exit setup
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <div>
          <SetupInstructions onStart={handleStartSignup} />
        </div>
        <div className="flex justify-center lg:sticky lg:top-10 lg:self-start">
          <PhoneMockup>
            <WhatsAppProfilePreview
              numberMode={numberMode}
              onNumberModeChange={setNumberMode}
              numberValue={numberValue}
              onNumberValueChange={setNumberValue}
              virtualNumberValue={virtualNumberValue}
              onVirtualNumberChange={setVirtualNumberValue}
              appId={appId}
              onAppIdChange={setAppId}
              apiKeySecret={apiKeySecret}
              onApiKeySecretChange={setApiKeySecret}
              logoUrl={logoUrl}
              onLogoFileChange={handleLogoFileChange}
              brandName={brandName}
              onBrandNameChange={setBrandName}
              description={description}
              onDescriptionChange={setDescription}
              website={website}
              onWebsiteChange={setWebsite}
              category={category}
              onCategoryChange={setCategory}
              email={email}
              onEmailChange={setEmail}
              supportNumber={supportNumber}
              onSupportNumberChange={setSupportNumber}
              address={address}
              onAddressChange={setAddress}
            />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageAccountSetup2" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/EngageAccountSetup2.jsx src/pages/__tests__/EngageAccountSetup2.test.jsx
git commit -m "feat(fastrr-journey-2): launch Meta Embedded Signup in-tab instead of as a popup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Dashboard arrival — seed `enabledMap` from the cart, simplify `WelcomeModal`'s recap

**Files:**
- Modify: `src/components/engage2/journey-dashboard/WelcomeModal.jsx`
- Modify: `src/components/engage2/journey-dashboard/__tests__/WelcomeModal.test.jsx`
- Modify: `src/pages/FastrrJourney2.jsx`
- Modify: `src/pages/__tests__/FastrrJourney2.test.jsx`

**Interfaces:**
- Consumes: `useJourneySelectionStore2` (Task 2); `useJourneyWalletStore` from `@/store/journeyWalletStore2` (existing).
- Produces: `WelcomeModal` gains a new optional prop `activatedCount` (number, default `0`) and drops its `WalletRechargeCard` usage entirely; new `data-testid="welcome-recap"` and `data-testid="welcome-modal-done"` replace the old `wallet-recharge-card` usage and `welcome-modal-skip` button (this is the one deliberate exception in this task: `welcome-modal-skip` is retired because there's no longer a pending action to skip at this point in the flow — recharge already happened upstream). `FastrrJourneyPage` seeds `enabledMap`'s initial state from `useJourneySelectionStore2().selectedJourneys()` and calls `clear()` once consumed.

- [ ] **Step 1: Replace `WelcomeModal.test.jsx`**

Replace the full contents of `src/components/engage2/journey-dashboard/__tests__/WelcomeModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeModal from "../WelcomeModal";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneyWalletStore.setState({ balance: 0 });
});

describe("WelcomeModal", () => {
  it("renders nothing when closed", () => {
    render(<WelcomeModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("renders the congratulations header, the 3 enabled channels by default, disabled channels hidden, and a funded/live recap", () => {
    useJourneyWalletStore.setState({ balance: 18000 });
    render(<WelcomeModal open={true} onClose={() => {}} activatedCount={2} />);
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Your WhatsApp Channel Is Live! 🎉")).toBeInTheDocument();

    expect(screen.getByTestId("welcome-rate-row-wa-utility")).toHaveTextContent("₹0.40 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-marketing")).toHaveTextContent("₹1.50 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-session")).toHaveTextContent("₹0.40 / message");

    expect(screen.queryByTestId("welcome-rate-row-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-rcs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-sms")).not.toBeInTheDocument();

    expect(screen.getByTestId("welcome-recap")).toHaveTextContent("₹18,000 funded, 2 journeys live");
    expect(screen.queryByTestId("wallet-recharge-card")).not.toBeInTheDocument();
  });

  it("singularizes the recap when exactly 1 journey is live", () => {
    render(<WelcomeModal open={true} onClose={() => {}} activatedCount={1} />);
    expect(screen.getByTestId("welcome-recap")).toHaveTextContent("1 journey live");
  });

  it("expanding the rate card reveals the 3 disabled channels", () => {
    render(<WelcomeModal open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("welcome-rate-card-expand-toggle"));

    expect(screen.getByTestId("welcome-rate-row-email")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
    expect(screen.getByTestId("welcome-rate-row-rcs")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
    expect(screen.getByTestId("welcome-rate-row-sms")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
  });

  it("clicking Got it closes the modal", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-modal-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WelcomeModal" --watchAll=false`
Expected: FAIL — the current modal still renders `WalletRechargeCard` and has no `welcome-recap`/`welcome-modal-done` testids.

- [ ] **Step 3: Replace `WelcomeModal.jsx`**

Replace the full contents of `src/components/engage2/journey-dashboard/WelcomeModal.jsx`:

```jsx
import React, { useState } from "react";
import { PartyPopper, CheckCircle2, Lock, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";
import { RATE_CARD } from "./data";

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function WelcomeModal({ open, onClose, activatedCount = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const balance = useJourneyWalletStore((s) => s.balance);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid="welcome-modal">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-2">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-lg">Your WhatsApp Channel Is Live! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            You're all set to turn window-shoppers into customers — automatically, on the
            channel they already use.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-surface p-4" data-testid="welcome-rate-card">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Your Messaging Rates
            </div>
            <div className="text-sm text-text-secondary">
              No setup fees. Pay only for what you send.
            </div>
          </div>

          <div className="space-y-2">
            {RATE_CARD.enabled.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between"
                data-testid={`welcome-rate-row-${channel.id}`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-text-primary">{channel.name}</span>
                </div>
                <span className="text-sm text-text-secondary tabular-nums">{channel.price}</span>
              </div>
            ))}
          </div>

          {expanded && (
            <div className="space-y-2 mt-2 pt-2 border-t border-border">
              {RATE_CARD.disabled.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between"
                  data-testid={`welcome-rate-row-${channel.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted">{channel.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">Connect with your KAM to activate</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            data-testid="welcome-rate-card-expand-toggle"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors mt-3"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide channels" : `+ ${RATE_CARD.disabled.length} more channels`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div
          className="rounded-lg bg-success-bg text-center py-4 px-4 mb-2"
          data-testid="welcome-recap"
        >
          <p className="text-sm font-semibold text-text-primary">
            {`✓ ${formatINR(balance)} funded, ${activatedCount} journey${
              activatedCount === 1 ? "" : "s"
            } live`}
          </p>
        </div>

        <Button type="button" className="w-full" onClick={onClose} data-testid="welcome-modal-done">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="WelcomeModal" --watchAll=false`
Expected: PASS (5 tests).

- [ ] **Step 5: Replace `FastrrJourney2.test.jsx`**

Replace the full contents of `src/pages/__tests__/FastrrJourney2.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FastrrJourneyPage from "../FastrrJourney2";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.sessionStorage.clear();
  useJourneySelectionStore2.getState().clear();
});

describe("FastrrJourneyPage", () => {
  it("does not show the welcome modal on a normal visit", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("shows the welcome modal when arriving fresh from signup, and consumes the flag so it won't reappear", () => {
    window.sessionStorage.setItem("fastrrJourney2Welcome", "1");
    const { unmount } = render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("fastrrJourney2Welcome")).toBeNull();
    unmount();

    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("seeds enabledMap from journeySelectionStore2's selections on mount, and clears the store after", () => {
    useJourneySelectionStore2.getState().toggle(JOURNEYS[2].id); // abandoned-cart-known
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("1 / 6");
    expect(useJourneySelectionStore2.getState().selectedJourneys()).toEqual([]);
  });

  it("renders the header, stats row, and journeys table together", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-fastrr-journey-2")).toBeInTheDocument();
    expect(screen.getByTestId("journey-header")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stats-row")).toBeInTheDocument();
    expect(screen.getByTestId("journeys-table")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("0 / 6");
  });

  it("toggling a row via the table updates the stats row's active count", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId(`journey-toggle-${JOURNEYS[0].id}`));
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("1 / 6");
  });

  it("opening the preview modal and clicking Activate Now activates the journey and updates the stats row", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId(`journey-preview-${JOURNEYS[1].id}`));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("1 / 6");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrJourney2" --watchAll=false`
Expected: FAIL — only the new "seeds enabledMap..." test fails (the page doesn't read `journeySelectionStore2` yet); every other test still passes since `enabledMap` still starts `{}` when nothing is selected.

- [ ] **Step 7: Replace `FastrrJourney2.jsx`**

Replace the full contents of `src/pages/FastrrJourney2.jsx`:

```jsx
import React, { useState } from "react";
import JourneyHeader from "@/components/engage2/journey-dashboard/JourneyHeader";
import JourneyStatsRow from "@/components/engage2/journey-dashboard/JourneyStatsRow";
import JourneysTable from "@/components/engage2/journey-dashboard/JourneysTable";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";
import WelcomeModal from "@/components/engage2/journey-dashboard/WelcomeModal";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

function consumeWelcomeFlag() {
  const shouldShow = window.sessionStorage.getItem("fastrrJourney2Welcome") === "1";
  if (shouldShow) window.sessionStorage.removeItem("fastrrJourney2Welcome");
  return shouldShow;
}

function seedEnabledMapFromSelection() {
  const { selectedJourneys, clear } = useJourneySelectionStore2.getState();
  const picked = selectedJourneys();
  if (picked.length === 0) return {};
  const seeded = {};
  picked.forEach((j) => {
    seeded[j.id] = true;
  });
  clear();
  return seeded;
}

export default function FastrrJourneyPage() {
  const [enabledMap, setEnabledMap] = useState(seedEnabledMapFromSelection);
  const [previewId, setPreviewId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(consumeWelcomeFlag);

  const activeCount = Object.values(enabledMap).filter(Boolean).length;
  const previewJourney = JOURNEYS.find((j) => j.id === previewId) || null;

  function handleToggle(id) {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handlePreview(id) {
    setPreviewId(id);
  }

  function handleActivate(id) {
    setEnabledMap((prev) => ({ ...prev, [id]: true }));
    setPreviewId(null);
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-fastrr-journey-2">
      <JourneyHeader />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <JourneyStatsRow activeCount={activeCount} />
        <JourneysTable
          journeys={JOURNEYS}
          enabledMap={enabledMap}
          onToggle={handleToggle}
          onPreview={handlePreview}
        />
      </div>
      <JourneyPreviewModal
        journey={previewJourney}
        onClose={() => setPreviewId(null)}
        onActivate={handleActivate}
      />
      <WelcomeModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        activatedCount={activeCount}
      />
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrJourney2" --watchAll=false`
Expected: PASS (6 tests).

- [ ] **Step 9: Run the full test suite and the CI-mode build**

Run: `npx craco test --watchAll=false`
Expected: every suite from before this plan started still passes exactly as before (including the 3 known pre-existing, unrelated failures — `campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx` — nothing new fails), plus every new/modified test from Tasks 1-11 passes.

Run: `CI=true npm run build`
Expected: `Compiled successfully.`

- [ ] **Step 10: Commit**

```bash
git add src/components/engage2/journey-dashboard/WelcomeModal.jsx src/components/engage2/journey-dashboard/__tests__/WelcomeModal.test.jsx src/pages/FastrrJourney2.jsx src/pages/__tests__/FastrrJourney2.test.jsx
git commit -m "feat(fastrr-journey-2): seed dashboard from the cart on arrival; simplify WelcomeModal's recap

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** New sequence (Home listing -> Recharge -> Account Setup -> Signup -> Dashboard) ✅ Tasks 8-11; Home page rebuild (trimmed Hero, personalized stat strip, journey listing, testimonials kept) ✅ Tasks 5-7, 9; Known/Fastrr Identified pill toggle with independent selection + inline resolved-message preview ✅ Tasks 1, 3; cart rail with cart-derived funding estimate ✅ Task 4; Recharge step reusing `WalletRechargeCard` with a cart-seeded amount + soft-gate Skip ✅ Task 8; Account Setup repositioned + in-tab signup launch (Technical Decision) ✅ Task 10; Dashboard auto-activation + simplified `WelcomeModal` recap ✅ Task 11; `FastrrEngagePanel2` no longer auto-opened ✅ Task 9 (its file and store are untouched, per the spec's explicit non-goal — no task modifies or deletes them). `JOURNEY_TYPES`/`previewSample`/`estimatedDailyVolume` additive data model ✅ Task 1.
- **Placeholder scan:** every task's implementation and test code is shown in full, exact, runnable form — no "TBD", no "similarly for the rest", no unshown diffs. Task 8's Step 10 (App.js wiring) has no dedicated automated test (none exists for `App.js`'s route table in this codebase) — this is flagged explicitly as a manual-verification step rather than silently skipped.
- **Type/name consistency:** `useJourneySelectionStore2`'s shape (`selected`, `toggle`, `isSelected`, `selectedJourneys`, `clear`) is defined once in Task 2 and used identically (same method names) in Tasks 3, 4, 8, 9, 11 — cross-checked. `JOURNEY_TYPES` entries' fields (`id`, `journeyType`, `icon`, `description`) defined in Task 1 match exactly what Task 3's `JourneyListingCard` destructures. `previewSample`/`estimatedDailyVolume` field names defined in Task 1 match exactly what Tasks 3 and 4 read. `WalletRechargeCard`'s new `initialAmount` prop (Task 8) doesn't collide with or rename any of its existing props (`eyebrow`, `subtitle`, `onDone`), confirmed backward compatible for its other two existing consumers (`WelcomeModal`, `RechargeWalletModal`), neither of which is modified by this plan to pass it. Route strings (`/engage-2/recharge`, `/engage-2/account-setup`, `/engage-2/meta-embedded-signup`) are used byte-identically everywhere they appear across Tasks 4, 8, 9, 10.
