# Fastrr Engage 2 Prototype Home Page & Stepped Setup Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `fastrr-engage-2` home page (`/fastrr-engage-2`) to strictly follow the "Recovery Activation v4" prototype (store selector, funnel stats, animated hero, single-checkbox journey cards, sticky continue bar), and replace the post-selection flow with a single page (`/engage-2/setup`) containing a 3-step progress-bar flow: Select (recap) → Fund Wallet (reusing the existing recharge card) → WhatsApp Account Setup (reusing the existing WhatsApp-style profile form, pre-filled with defaults, two identically-wired CTAs).

**Architecture:** The home page becomes 4 presentational pieces (store selector, funnel stats, an animated hero phone mockup, and journey cards collapsed to one checkbox per journey type instead of per audience) composed by `FastrrEngage2.jsx`. The 3-step flow is one new page (`EngageSetup2.jsx`) owning `step`/`furthestStep` state, rendering one of three step components and a shared progress bar — not three separate routes, so the progress bar can jump between steps without remounting the page. `/engage-2/account-setup` and its page are deleted; `FundWalletModal` is deleted and its content becomes the wallet step's content (no longer a Dialog). No changes to `journeySelectionStore2`, `journeyWalletStore2`, `computeCartFunding`, or the dashboard's per-audience data.

**Tech Stack:** React 19, react-router-dom v7, zustand v5, Tailwind + shadcn/ui, Jest + React Testing Library, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-09-24-fastrr-engage-2-prototype-homepage-design.md`

## Global Constraints

- **Scope:** every file touched lives under `src/components/engage2/`, `src/pages/*2.jsx`, or is a `/engage-2/*`/`/fastrr-engage-2`/`/fastrr-journey-2` route registration in `src/App.js`. Never touch `src/components/engage/`, `src/pages/FastrrEngage.jsx`, `src/pages/FastrrJourney.jsx`, or any `/engage/*`/`/fastrr-engage`/`/fastrr-journey` route.
- **No real second store, no functional store-switching** — the store selector shows one real store ("Mystore1") and is cosmetic.
- **No real behavioral difference** between the "Manually" and "with AI" WhatsApp setup CTAs — both call the same confirm handler.
- **`journeySelectionStore2`'s public shape is unchanged**: `{ selected, toggle(id), isSelected(id), selectedJourneys(), clear() }`. Every card-level "select a journey type" interaction is implemented by calling `toggle()` on the type's two underlying `JOURNEYS` ids (Known + Fastrr Identified) — never by adding new store methods.
- **`computeCartFunding` (`src/components/engage2/home/cartFunding.js`) is unchanged** — its existing per-`journeyType` dedup already produces the correct total when both audience variants of a type are selected together.
- **Design tokens actually defined in `tailwind.config.js`** (verified for this plan): `primary` (+ `.tint`, `.hover`, `.foreground`), `success` (+ `.bg`), `warning` (+ `.bg`), `destructive` (DEFAULT + `.foreground`, **no** `.bg` sub-token — use `bg-destructive/10` for a tinted background), `border`, `surface`, `app.bg` (as `bg-app-bg`), `text.primary`/`.secondary`/`.muted`. Do not invent `danger`/`danger-bg`/`info-700` — they don't exist in this codebase.
- **`formatCompactNumber`/`formatCompactCurrency`** (`src/lib/analyticsFormat.js`): `formatCompactNumber(10000)` = `"10K"`, `formatCompactNumber(3400)` = `"3.4K"`. `formatCompactCurrency(12000000)` = `"₹1.2C"`, `formatCompactCurrency(400000)` = `"₹4L"`. Verified against the existing `RevenueOpportunityCard2.test.jsx`.
- **`MOCK_STORE_ACTIVITY`** (`src/components/engage2/RevenueOpportunityCard2.jsx`): currently `{ visitorsPerDay: 10000, abandonedCheckoutPerDay: 4000, aov: 100 }`. Task 1 adds `identifiedPerDay: 3400` — purely additive, existing destructures elsewhere are unaffected.
- **`JOURNEYS`** (`src/components/engage2/journey-dashboard/data.js`) has 6 entries (one per journeyType × audience). Every entry has `id`, `journeyType`, `audience`, `tooltip`, `triggerLabel`, `waDraft` (`{ body, buttons }`), `previewSample`, `estimatedDailyVolume`. Both audience variants of a type share the same `estimatedDailyVolume` (Abandoned Product: 1200, Abandoned Cart: 4000, Abandoned Checkout: 1600). `JOURNEY_TYPES` has 3 entries (`id`, `journeyType`, `icon`, `description`) — Task 6 adds a 4th field, `recommended`.
- **React-portal event bubbling**: Radix `Dialog`/`DialogContent` portals to `document.body`, but React's synthetic event system bubbles clicks through the *React tree*, not the DOM tree — a click inside a portaled dialog still reaches an ancestor React component's `onClick`. Any task that renders a `Dialog`-based modal *inside* an element that itself has an `onClick` (Task 6's card) must wrap the modal's render in a `<div onClick={(e) => e.stopPropagation()}>` to prevent the modal's clicks from also triggering the card's handler — this is called out explicitly in Task 6.
- **Test infra**: `react-router-dom` is mocked with `jest.mock("react-router-dom", () => ({...}), { virtual: true })` in every test that renders something using `useNavigate`/`Link`. Radix `Tooltip`/`Select` components need `window.HTMLElement.prototype.hasPointerCapture = jest.fn()`, `.releasePointerCapture = jest.fn()`, `.scrollIntoView = jest.fn()` stubbed in `beforeAll`.
- **Full suite baseline**: 3 known pre-existing failures unrelated to this plan — `campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`. Never treat these as caused by this plan's work.
- **Build check**: `CI=true npm run build` must show `Compiled successfully.` after every task — it turns ESLint warnings (including unused imports) into hard errors.

---

### Task 1: Add `identifiedPerDay` to the store-activity mock

**Files:**
- Modify: `src/components/engage2/RevenueOpportunityCard2.jsx`
- Test: `src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `computeRevenueOpportunity()`'s return object gains `identifiedPerDay: 3400`. `MOCK_STORE_ACTIVITY.identifiedPerDay = 3400`. Task 3 (`FunnelStats`) consumes this field by name.

- [ ] **Step 1: Write the failing test**

Add this assertion inside the existing `it("computes abandonment rate and revenue at risk from the mock activity", ...)` test in `src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx`, right after the existing `expect(result.visitorsPerDay).toBe(10000);` line:

```javascript
    expect(result.identifiedPerDay).toBe(3400);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="RevenueOpportunityCard2" --watchAll=false`
Expected: FAIL — `expect(result.identifiedPerDay).toBe(3400)` receives `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `src/components/engage2/RevenueOpportunityCard2.jsx`, change:

```javascript
export const MOCK_STORE_ACTIVITY = {
  visitorsPerDay: 10000,
  abandonedCheckoutPerDay: 4000,
  aov: 100,
};
```

to:

```javascript
export const MOCK_STORE_ACTIVITY = {
  visitorsPerDay: 10000,
  identifiedPerDay: 3400,
  abandonedCheckoutPerDay: 4000,
  aov: 100,
};
```

and change:

```javascript
export function computeRevenueOpportunity(activity = MOCK_STORE_ACTIVITY) {
  const { visitorsPerDay, abandonedCheckoutPerDay, aov } = activity;
  const abandonmentRate = Math.round((abandonedCheckoutPerDay / visitorsPerDay) * 100);
  const dailyRevenueAtRisk = abandonedCheckoutPerDay * aov;
  const monthlyRevenueAtRisk = dailyRevenueAtRisk * DAYS_PER_MONTH;
  return {
    visitorsPerDay,
    abandonedCheckoutPerDay,
    abandonmentRate,
    dailyRevenueAtRisk,
    monthlyRevenueAtRisk,
  };
}
```

to:

```javascript
export function computeRevenueOpportunity(activity = MOCK_STORE_ACTIVITY) {
  const { visitorsPerDay, identifiedPerDay, abandonedCheckoutPerDay, aov } = activity;
  const abandonmentRate = Math.round((abandonedCheckoutPerDay / visitorsPerDay) * 100);
  const dailyRevenueAtRisk = abandonedCheckoutPerDay * aov;
  const monthlyRevenueAtRisk = dailyRevenueAtRisk * DAYS_PER_MONTH;
  return {
    visitorsPerDay,
    identifiedPerDay,
    abandonedCheckoutPerDay,
    abandonmentRate,
    dailyRevenueAtRisk,
    monthlyRevenueAtRisk,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="RevenueOpportunityCard2" --watchAll=false`
Expected: PASS, all 4 tests in the file green (the 3 pre-existing `RevenueOpportunityCard` tests are unaffected — they don't reference `identifiedPerDay`).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/RevenueOpportunityCard2.jsx src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx
git commit -m "feat(fastrr-engage-2): add identifiedPerDay to the store-activity mock"
```

---

### Task 2: `StoreSelector` component

**Files:**
- Create: `src/components/engage2/home/StoreSelector.jsx`
- Test: `src/components/engage2/home/__tests__/StoreSelector.test.jsx`

**Interfaces:**
- Consumes: nothing (no props, no store).
- Produces: default export `StoreSelector()`, no props. Task 8 renders `<StoreSelector />` on the home page.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StoreSelector from "../StoreSelector";

describe("StoreSelector", () => {
  it("shows the store name and no menu initially", () => {
    render(<StoreSelector />);
    expect(screen.getByTestId("store-selector-trigger")).toHaveTextContent("Mystore1");
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
  });

  it("clicking the trigger opens a menu with the store checked", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    expect(screen.getByTestId("store-selector-menu")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector-option")).toHaveTextContent("Mystore1");
  });

  it("clicking the option closes the menu", () => {
    render(<StoreSelector />);
    fireEvent.click(screen.getByTestId("store-selector-trigger"));
    fireEvent.click(screen.getByTestId("store-selector-option"));
    expect(screen.queryByTestId("store-selector-menu")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="StoreSelector" --watchAll=false`
Expected: FAIL — `Cannot find module '../StoreSelector'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Cosmetic only — this app has always been single-store (see
// MOCK_STORE_ACTIVITY), so there is exactly one real option here. Matches
// the prototype's store-selector chrome without a functional second store.
const STORE_NAME = "Mystore1";

export default function StoreSelector() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block" data-testid="store-selector">
      <button
        type="button"
        data-testid="store-selector-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-md border border-border bg-surface text-sm font-semibold text-text-primary hover:border-primary/50 transition-colors"
      >
        <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
          {STORE_NAME.charAt(0).toUpperCase()}
        </span>
        {STORE_NAME}
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>
      {open && (
        <div
          className="absolute top-11 left-0 w-56 bg-surface border border-border rounded-lg shadow-lg p-1.5 z-10"
          data-testid="store-selector-menu"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted px-2.5 py-1.5">
            Select store
          </div>
          <button
            type="button"
            data-testid="store-selector-option"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-app-bg text-left"
          >
            <span>
              <span className="block text-sm font-medium text-text-primary">{STORE_NAME}</span>
              <span className="block text-xs text-text-secondary">mystore1.in</span>
            </span>
            <Check className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="StoreSelector" --watchAll=false`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/StoreSelector.jsx src/components/engage2/home/__tests__/StoreSelector.test.jsx
git commit -m "feat(fastrr-engage-2): add cosmetic store-selector dropdown"
```

---

### Task 3: `FunnelStats` component (replaces `PersonalizedStatStrip`)

**Files:**
- Create: `src/components/engage2/home/FunnelStats.jsx`
- Test: `src/components/engage2/home/__tests__/FunnelStats.test.jsx`
- Delete: `src/components/engage2/home/PersonalizedStatStrip.jsx`, `src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx` (Task 8 stops importing it; verify with `grep -rln "PersonalizedStatStrip" src` before deleting that nothing else references it)

**Interfaces:**
- Consumes: `computeRevenueOpportunity()` from Task 1 (needs `visitorsPerDay`, `identifiedPerDay`); `JOURNEYS` from `src/components/engage2/journey-dashboard/data.js` (needs `estimatedDailyVolume` for `journeyType === "Abandoned Cart"` and `"Abandoned Checkout"`, `audience === "Known"`).
- Produces: default export `FunnelStats()`, no props. Task 8 renders `<FunnelStats />`.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import FunnelStats from "../FunnelStats";

describe("FunnelStats", () => {
  it("shows total visitors, identified shoppers, abandoned carts+checkouts, and missed opportunity", () => {
    render(<FunnelStats />);
    expect(screen.getByTestId("funnel-stats")).toBeInTheDocument();
    // visitorsPerDay = 10,000
    expect(screen.getByTestId("funnel-stat-total-visitors")).toHaveTextContent("10K");
    // identifiedPerDay = 3,400 -> 34% of visitors
    expect(screen.getByTestId("funnel-stat-identified-shoppers")).toHaveTextContent("3.4K");
    expect(screen.getByTestId("funnel-stat-identified-shoppers")).toHaveTextContent("34% reachable");
    // Abandoned Cart (4,000) + Abandoned Checkout (1,600) = 5,600
    expect(screen.getByTestId("funnel-stat-abandoned-carts-checkouts")).toHaveTextContent("5.6K");
    // 5,600 * aov(100) = 560,000/day -> formatCompactCurrency -> ₹5.6L
    expect(screen.getByTestId("funnel-stat-missed-opportunity")).toHaveTextContent("₹5.6L");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FunnelStats" --watchAll=false`
Expected: FAIL — `Cannot find module '../FunnelStats'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React from "react";
import { Users, Fingerprint, ShoppingCart, TrendingDown } from "lucide-react";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/analyticsFormat";

// aov mirrors MOCK_STORE_ACTIVITY.aov (100) — computeRevenueOpportunity()
// doesn't return aov directly, and this funnel needs it for a
// cart+checkout-specific (not checkout-only) missed-opportunity figure.
const AOV = 100;

function volumeFor(journeyType) {
  return JOURNEYS.find((j) => j.journeyType === journeyType && j.audience === "Known")
    .estimatedDailyVolume;
}

export default function FunnelStats() {
  const { visitorsPerDay, identifiedPerDay } = computeRevenueOpportunity();
  const cartCheckoutPerDay = volumeFor("Abandoned Cart") + volumeFor("Abandoned Checkout");
  const missedOpportunityPerDay = cartCheckoutPerDay * AOV;
  const identifiedPct = Math.round((identifiedPerDay / visitorsPerDay) * 100);
  const cartCheckoutPct = Math.round((cartCheckoutPerDay / visitorsPerDay) * 100);

  const stats = [
    {
      key: "total-visitors",
      icon: Users,
      iconClass: "bg-primary-tint text-primary",
      value: formatCompactNumber(visitorsPerDay),
      label: "Total visitors",
      note: "Unique sessions on your store",
      barPct: 100,
    },
    {
      key: "identified-shoppers",
      icon: Fingerprint,
      iconClass: "bg-primary-tint text-primary",
      value: formatCompactNumber(identifiedPerDay),
      label: "Identified shoppers",
      note: `${identifiedPct}% reachable on WhatsApp via Fastrr`,
      barPct: identifiedPct,
    },
    {
      key: "abandoned-carts-checkouts",
      icon: ShoppingCart,
      iconClass: "bg-warning-bg text-warning",
      value: formatCompactNumber(cartCheckoutPerDay),
      label: "Abandoned carts & checkouts",
      note: "Left with items, without paying",
      barPct: cartCheckoutPct,
    },
    {
      key: "missed-opportunity",
      icon: TrendingDown,
      iconClass: "bg-destructive/10 text-destructive",
      value: formatCompactCurrency(missedOpportunityPerDay),
      label: "Missed opportunity",
      note: "Value of carts not converted, per day",
      barPct: 100,
      danger: true,
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden mb-10"
      data-testid="funnel-stats"
    >
      {stats.map((s) => (
        <div
          key={s.key}
          className={`p-5 ${s.danger ? "bg-destructive/10" : "bg-surface"}`}
          data-testid={`funnel-stat-${s.key}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${s.iconClass}`}
            >
              <s.icon className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-text-secondary">{s.label}</span>
          </div>
          <div className={`text-2xl font-bold ${s.danger ? "text-destructive" : "text-text-primary"}`}>
            {s.value}
          </div>
          <div className="h-1.5 rounded-full bg-border mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${s.danger ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${Math.min(100, s.barPct)}%` }}
            />
          </div>
          <div className="text-xs text-text-secondary mt-2">{s.note}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FunnelStats" --watchAll=false`
Expected: PASS, 1/1 test.

- [ ] **Step 5: Delete `PersonalizedStatStrip` and confirm nothing else references it**

Run: `grep -rln "PersonalizedStatStrip" src`
Expected: only `src/components/engage2/home/PersonalizedStatStrip.jsx` and its test (Task 8 hasn't run yet, so `FastrrEngage2.jsx` still imports it at this point — **do not delete yet**; instead mark this step complete and actually remove the two files as part of Task 8's own step list, once `FastrrEngage2.jsx` no longer imports it). Skip deleting in this task; proceed to commit.

- [ ] **Step 6: Commit**

```bash
git add src/components/engage2/home/FunnelStats.jsx src/components/engage2/home/__tests__/FunnelStats.test.jsx
git commit -m "feat(fastrr-engage-2): add FunnelStats (replaces PersonalizedStatStrip on the home page)"
```

---

### Task 4: `AnimatedPhoneMockup` component (hero animation)

**Files:**
- Create: `src/components/engage2/home/AnimatedPhoneMockup.jsx`
- Test: `src/components/engage2/home/__tests__/AnimatedPhoneMockup.test.jsx`

**Interfaces:**
- Consumes: `PhoneMockup` (default export, takes `children`) from `src/components/engage2/account-setup/PhoneMockup.jsx` — already exists, no changes.
- Produces: default export `AnimatedPhoneMockup({ phase })` — **pure presentational, takes `phase` as a required prop, owns no timer itself**. Named export `usePhonePhase()` (the hook that owns the timer) and phase constants `PHASE_CHECKOUT`, `PHASE_LOCKSCREEN`, `PHASE_WHATSAPP`, `PHASE_RESTORING`, `PHASE_PAYMENT`, `PHASE_DONE` (integers 0–5). Task 5 (`HeroSection`) calls `usePhonePhase()` **once**, passes the result to `<AnimatedPhoneMockup phase={...} />`, and separately uses it to highlight the matching story step — two independent calls to the hook would run two un-synced timers, so the hook must have exactly one call site per page.

- [ ] **Step 1: Write the failing tests**

```javascript
import React from "react";
import { render, screen, act, renderHook } from "@testing-library/react";
import AnimatedPhoneMockup, {
  usePhonePhase,
  PHASE_CHECKOUT,
  PHASE_LOCKSCREEN,
  PHASE_WHATSAPP,
} from "../AnimatedPhoneMockup";

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

describe("AnimatedPhoneMockup (presentational)", () => {
  it("renders the phone frame with the screen matching the given phase", () => {
    render(<AnimatedPhoneMockup phase={PHASE_CHECKOUT} />);
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("phone-phase-checkout")).toBeInTheDocument();
  });

  it("renders the WhatsApp screen when phase is PHASE_WHATSAPP", () => {
    render(<AnimatedPhoneMockup phase={PHASE_WHATSAPP} />);
    expect(screen.getByTestId("phone-phase-whatsapp")).toBeInTheDocument();
  });
});

describe("usePhonePhase", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("starts at PHASE_CHECKOUT and advances to PHASE_LOCKSCREEN after the first phase's duration", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePhonePhase());
    expect(result.current).toBe(PHASE_CHECKOUT);
    act(() => {
      jest.advanceTimersByTime(2800);
    });
    expect(result.current).toBe(PHASE_LOCKSCREEN);
    jest.useRealTimers();
  });

  it("freezes on PHASE_WHATSAPP and starts no timer when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    jest.useFakeTimers();
    const { result } = renderHook(() => usePhonePhase());
    expect(result.current).toBe(PHASE_WHATSAPP);
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current).toBe(PHASE_WHATSAPP);
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="AnimatedPhoneMockup" --watchAll=false`
Expected: FAIL — `Cannot find module '../AnimatedPhoneMockup'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";

// 6 phases telling the same "checkout -> reminder -> recovered" story as
// the story-steps list HeroSection renders beside this component.
// Durations (ms) are how long each phase holds before advancing.
export const PHASE_CHECKOUT = 0;
export const PHASE_LOCKSCREEN = 1;
export const PHASE_WHATSAPP = 2;
export const PHASE_RESTORING = 3;
export const PHASE_PAYMENT = 4;
export const PHASE_DONE = 5;
const DURATIONS_MS = [2800, 2600, 2600, 1500, 2400, 2800];
const PHASE_COUNT = DURATIONS_MS.length;

// Exported (not private to this file) so HeroSection can own a single
// phase timeline and pass it both to this phone and to its own
// story-steps highlighting — two independent calls to this hook would
// run two un-synced timers that drift apart.
export function usePhonePhase() {
  const [phase, setPhase] = useState(PHASE_CHECKOUT);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Freeze on the frame that most directly shows the product's value —
      // the WhatsApp reminder — instead of cycling through the story.
      setPhase(PHASE_WHATSAPP);
      return undefined;
    }
    let timer;
    let current = PHASE_CHECKOUT;
    function tick() {
      timer = setTimeout(() => {
        current = (current + 1) % PHASE_COUNT;
        setPhase(current);
        tick();
      }, DURATIONS_MS[current]);
    }
    tick();
    return () => clearTimeout(timer);
  }, []);

  return phase;
}

function CheckoutScreen() {
  return (
    <div className="flex flex-col h-full p-4" data-testid="phone-phase-checkout">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-900">Juniper Cotton Throw</div>
          <div className="text-[11px] text-slate-500">Qty 1 · Ivory</div>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-900">₹1,240</span>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        <div className="border border-border rounded-md px-2.5 py-2 text-[11px] text-slate-600">
          Aanya Sharma
        </div>
        <div className="border border-border rounded-md px-2.5 py-2 text-[11px] text-slate-600">
          +91 98••• ••210
        </div>
      </div>
      <div className="mt-auto h-10 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-semibold">
        Continue to payment
      </div>
    </div>
  );
}

function LockScreen() {
  return (
    <div
      className="flex flex-col items-center h-full pt-14 text-white relative"
      style={{ background: "linear-gradient(180deg, #3b3550, #221f30)" }}
      data-testid="phone-phase-lockscreen"
    >
      <div className="text-xs opacity-70">Tuesday, 24 September</div>
      <div className="text-4xl font-medium mt-1 tabular-nums">7:42</div>
      <div className="absolute left-3 right-3 top-44 bg-white text-slate-900 rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-xl">
        <span className="w-8 h-8 rounded-lg bg-success flex items-center justify-center flex-shrink-0 text-white text-sm">
          ✓
        </span>
        <span className="min-w-0">
          <span className="flex justify-between gap-1.5 text-[11px] font-semibold">
            <span>Mystore1</span>
            <span className="text-slate-400 font-normal">now</span>
          </span>
          <span className="block text-[11px] leading-tight text-slate-600 mt-0.5">
            Hi Aanya, your Juniper throw is reserved for you…
          </span>
        </span>
      </div>
    </div>
  );
}

function WhatsAppScreen() {
  return (
    <div className="flex flex-col h-full bg-[#efe9e1]" data-testid="phone-phase-whatsapp">
      <div className="bg-[#0b6157] text-white px-3 py-3 flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
          M
        </span>
        <span className="text-xs font-semibold">Mystore1</span>
      </div>
      <div className="p-3">
        <div className="bg-white rounded-2xl rounded-tl-sm p-2 shadow-sm max-w-[85%]">
          <div className="h-20 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400" />
          <p className="text-xs leading-snug mt-2 text-slate-800">
            Hi Aanya, your Juniper throw is reserved for you. Complete your order in one tap.
          </p>
          <div className="text-center text-xs font-semibold text-primary border-t border-border mt-2 pt-2">
            Complete my order
          </div>
        </div>
      </div>
    </div>
  );
}

function RestoringScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-2 text-xs text-slate-500"
      data-testid="phone-phase-restoring"
    >
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      Restoring your cart
    </div>
  );
}

function PaymentScreen() {
  return (
    <div className="flex flex-col h-full p-4" data-testid="phone-phase-payment">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-900">Juniper Cotton Throw</div>
          <div className="text-[11px] text-success font-medium">Welcome back</div>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-900">₹1,240</span>
      </div>
      <div className="mt-auto h-10 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
        Buy now · ₹1,240
      </div>
    </div>
  );
}

function DoneScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
      data-testid="phone-phase-done"
    >
      <span className="w-14 h-14 rounded-full bg-success-bg text-success flex items-center justify-center text-2xl">
        ✓
      </span>
      <div className="text-sm font-semibold text-slate-900">Order placed</div>
      <div className="text-[11px] text-slate-500">Thanks, Aanya. We'll share tracking on WhatsApp.</div>
    </div>
  );
}

const SCREENS = {
  [PHASE_CHECKOUT]: CheckoutScreen,
  [PHASE_LOCKSCREEN]: LockScreen,
  [PHASE_WHATSAPP]: WhatsAppScreen,
  [PHASE_RESTORING]: RestoringScreen,
  [PHASE_PAYMENT]: PaymentScreen,
  [PHASE_DONE]: DoneScreen,
};

export default function AnimatedPhoneMockup({ phase }) {
  const Screen = SCREENS[phase];

  return (
    <div data-phone-phase={phase}>
      <PhoneMockup>
        <Screen />
      </PhoneMockup>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="AnimatedPhoneMockup" --watchAll=false`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/home/AnimatedPhoneMockup.jsx src/components/engage2/home/__tests__/AnimatedPhoneMockup.test.jsx
git commit -m "feat(fastrr-engage-2): add animated phone-mockup hero component"
```

---

### Task 5: Rebuild `HeroSection`; delete `ChatPreviewMockup` (v2 only)

**Files:**
- Modify: `src/components/engage2/home/HeroSection.jsx`
- Modify: `src/components/engage2/home/__tests__/HeroSection.test.jsx`
- Delete: `src/components/engage2/home/ChatPreviewMockup.jsx` (only after confirming it has no other consumer — see Step 5)

**Interfaces:**
- Consumes: `AnimatedPhoneMockup`, `usePhonePhase`, and the phase constants from Task 4.
- Produces: default export `HeroSection()`, no props (unchanged signature). Task 8 renders `<HeroSection />`.

- [ ] **Step 1: Write the failing test**

Replace the entire content of `src/components/engage2/home/__tests__/HeroSection.test.jsx` with:

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import HeroSection from "../HeroSection";

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

beforeEach(() => {
  mockMatchMedia(false);
});

describe("HeroSection", () => {
  it("renders the headline, the animated phone mockup, and the 4-step story list", () => {
    render(<HeroSection />);
    expect(screen.getByTestId("hero-headline")).toHaveTextContent(
      "Recover abandoned revenue on WhatsApp"
    );
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("hero-story-steps").children).toHaveLength(4);
    expect(screen.getByText("Shopper drops off")).toBeInTheDocument();
    expect(screen.getByText("One tap back to purchase")).toBeInTheDocument();
  });

  it("marks the story step matching the phone's current phase as active, and the rest as inactive", () => {
    // With matchMedia mocked to non-reduced-motion, usePhonePhase starts at
    // PHASE_CHECKOUT (0) on first render, before any timer has fired.
    render(<HeroSection />);
    expect(screen.getByTestId("hero-story-step-0")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hero-story-step-1")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-2")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-3")).toHaveAttribute("data-active", "false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/HeroSection" --watchAll=false`
Expected: FAIL — `hero-story-steps`/`hero-story-step-0` testids don't exist yet (current `HeroSection` still has the old copy/`ChatPreviewMockup`).

- [ ] **Step 3: Write minimal implementation**

Replace the entire content of `src/components/engage2/home/HeroSection.jsx` with:

```jsx
import React from "react";
import AnimatedPhoneMockup, {
  usePhonePhase,
  PHASE_CHECKOUT,
  PHASE_LOCKSCREEN,
  PHASE_WHATSAPP,
  PHASE_RESTORING,
  PHASE_PAYMENT,
  PHASE_DONE,
} from "./AnimatedPhoneMockup";

const STORY_STEPS = [
  { title: "Shopper drops off", sub: "Leaves checkout before completing payment.", phases: [PHASE_CHECKOUT] },
  {
    title: "Engage waits, then reminds on WhatsApp",
    sub: "A short, configurable delay — never intrusive.",
    phases: [PHASE_LOCKSCREEN, PHASE_WHATSAPP],
  },
  {
    title: "One tap back to purchase",
    sub: "Cart restored, details pre-filled, order placed.",
    phases: [PHASE_RESTORING, PHASE_PAYMENT],
  },
  { title: "Order recovered", sub: "Revenue that would otherwise have been lost.", phases: [PHASE_DONE] },
];

export default function HeroSection() {
  // Owned here (not inside AnimatedPhoneMockup) so this one phase value can
  // drive both the phone's screen AND which story step is highlighted,
  // without running two independent, un-synced timers.
  const phase = usePhonePhase();

  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Fastrr Engage · WhatsApp recovery
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
            data-testid="hero-headline"
          >
            Recover abandoned revenue on WhatsApp — automatically.
          </h1>
          <p className="text-base text-text-secondary mb-6" data-testid="hero-subhead">
            Engage detects shoppers who drop off at product, cart or checkout, and re-engages
            them with a personalised WhatsApp message from your brand — one tap takes them
            straight back to purchase.
          </p>
          <div className="flex flex-col gap-3" data-testid="hero-story-steps">
            {STORY_STEPS.map((s, i) => {
              const isActive = s.phases.includes(phase);
              return (
                <div
                  key={s.title}
                  data-testid={`hero-story-step-${i}`}
                  data-active={isActive}
                  className={`flex gap-3 items-start transition-opacity ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-text-primary border-text-primary text-white"
                        : "bg-surface border-border text-text-secondary"
                    }`}
                  >
                    ✓
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{s.title}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center">
          <AnimatedPhoneMockup phase={phase} />
        </div>
      </div>
    </div>
  );
}
```

Note: `computeRevenueOpportunity` is intentionally not imported here — the prior revenue-callout copy moved into `FunnelStats` (Task 3); this component is purely the story/animation half of the prototype's hero, matching the prototype's own section split (funnel stats section, then hero section).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/HeroSection" --watchAll=false`
Expected: PASS, 2/2 tests.

- [ ] **Step 5: Delete `ChatPreviewMockup` (v2 only) if it's now unused**

Run: `grep -rln "ChatPreviewMockup" src/components/engage2`
Expected: no results (the new `HeroSection.jsx` above doesn't import it, and nothing else in `engage2/` did per the pre-flight scan). If the grep is empty, delete:

```bash
rm src/components/engage2/home/ChatPreviewMockup.jsx
```

(`src/components/engage/home/ChatPreviewMockup.jsx` is v1's own separate copy — never touch it.)

- [ ] **Step 6: Run the build to confirm no dangling import**

Run: `CI=true npm run build`
Expected: `Compiled successfully.`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fastrr-engage-2): rebuild HeroSection around the animated phone mockup; remove unused ChatPreviewMockup"
```

---

### Task 6: Collapse `JourneyListingCard` to one checkbox per journey type

**Files:**
- Modify: `src/components/engage2/journey-dashboard/data.js` (add `recommended: true` to the `"abandoned-checkout"` entry in `JOURNEY_TYPES`)
- Modify: `src/components/engage2/home/JourneyListingCard.jsx`
- Modify: `src/components/engage2/home/__tests__/JourneyListingCard.test.jsx`

**Interfaces:**
- Consumes: `JOURNEYS`, `JOURNEY_TYPES` (now with `recommended`), `RATE_CARD`, `WAIT_LABEL` from `data.js`; `useJourneySelectionStore2` (`toggle`, `selected`) — unchanged store shape; `JourneyPreviewModal` (default export, props `journey`/`onClose`/`onActivate`, **no** `otherAudienceJourney` this time — single-flow layout).
- Produces: default export `JourneyListingCard({ journeyTypeConfig })` — same prop name/shape as before. Testids change: `journey-listing-pill-*`/`journey-listing-tab-*`/`journey-listing-activate-*` (removed — no more per-audience UI) become `journey-listing-checkbox-{typeId}` and `journey-listing-preview-trigger-{typeId}` (keyed by the journey **type** id, e.g. `abandoned-cart`, not by a `-known`/`-identified` id). Task 7 (`JourneyListingSection`) and its test, and Task 8's `FastrrEngage2` composition, are unaffected by this internal testid change since neither references these ids directly — only `JourneyListingCard`'s own test does.

- [ ] **Step 1: Add `recommended` to the Abandoned Checkout journey type**

In `src/components/engage2/journey-dashboard/data.js`, change:

```javascript
  {
    id: "abandoned-checkout",
    journeyType: "Abandoned Checkout",
    icon: "CreditCard",
    description: "Starts checkout but doesn't complete payment.",
  },
```

to:

```javascript
  {
    id: "abandoned-checkout",
    journeyType: "Abandoned Checkout",
    icon: "CreditCard",
    description: "Starts checkout but doesn't complete payment.",
    recommended: true,
  },
```

- [ ] **Step 2: Write the failing tests**

Replace the entire content of `src/components/engage2/home/__tests__/JourneyListingCard.test.jsx` with:

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyListingCard from "../JourneyListingCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

const cartConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Cart");
const checkoutConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Checkout");

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingCard", () => {
  it("renders the journey type name, description, and an unchecked checkbox", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Adds to cart but doesn't check out.")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("shows a Recommended chip only on the journey type marked recommended", () => {
    render(<JourneyListingCard journeyTypeConfig={checkoutConfig} />);
    expect(screen.getByTestId("journey-listing-recommended-abandoned-checkout")).toBeInTheDocument();
  });

  it("does not show a Recommended chip on a non-recommended journey type", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(
      screen.queryByTestId("journey-listing-recommended-abandoned-cart")
    ).not.toBeInTheDocument();
  });

  it("clicking the card selects BOTH the Known and Fastrr Identified variants of that journey type", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("clicking an already-selected card deselects BOTH variants", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    const card = screen.getByTestId("journey-listing-card-abandoned-cart");
    fireEvent.click(card);
    fireEvent.click(card);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking a card that has only ONE of its two variants selected (a partial pre-existing state) ends with BOTH selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    // The card already reads as selected (either true counts) — the spec's
    // truth table says clicking it should end with BOTH deselected.
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking the preview trigger opens the flow-chart preview for the Known variant, without selecting anything", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByText("Known buyer adds product to cart")).toBeInTheDocument();
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("you left");
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking the preview trigger does not also toggle the card (event does not bubble into the card's onClick)", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("clicking 'Activate Now' inside the preview modal selects both variants and closes the modal, without also re-triggering the card's own toggle", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
    // If the portaled modal's click had bubbled into the card's own onClick
    // too, this second click would have flipped the card back off.
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/JourneyListingCard" --watchAll=false`
Expected: FAIL — old testids (`journey-listing-pill-*`, `journey-listing-tab-*`, `journey-listing-activate-*`) don't match; the whole-card `data-testid` and `aria-checked` don't exist in the current component.

- [ ] **Step 4: Write minimal implementation**

Replace the entire content of `src/components/engage2/home/JourneyListingCard.jsx` with:

```jsx
import React, { useState } from "react";
import { Eye, ShoppingCart, CreditCard, Check } from "lucide-react";
import { JOURNEYS, RATE_CARD, WAIT_LABEL } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";

const ICONS = { Eye, ShoppingCart, CreditCard };
const MARKETING_RATE = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").price;

export default function JourneyListingCard({ journeyTypeConfig }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const toggle = useJourneySelectionStore2((s) => s.toggle);
  const selected = useJourneySelectionStore2((s) => s.selected);

  const known = JOURNEYS.find(
    (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Known"
  );
  const identified = JOURNEYS.find(
    (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Fastrr Identified"
  );
  // The card no longer distinguishes audiences (see spec decision #5) — its
  // checked state is "either variant selected", and clicking it is a clean
  // boolean flip: reads selected -> ends with BOTH off; reads unselected ->
  // ends with BOTH on. Never leaves a mixed state from card interaction.
  const isSelected = !!selected[known.id] || !!selected[identified.id];
  const Icon = ICONS[journeyTypeConfig.icon];

  function handleToggleCard() {
    if (isSelected) {
      if (selected[known.id]) toggle(known.id);
      if (selected[identified.id]) toggle(identified.id);
    } else {
      if (!selected[known.id]) toggle(known.id);
      if (!selected[identified.id]) toggle(identified.id);
    }
  }

  return (
    <div
      onClick={handleToggleCard}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      data-testid={`journey-listing-card-${journeyTypeConfig.id}`}
      className={`flex flex-col p-5 rounded-lg bg-surface cursor-pointer transition-shadow ${
        isSelected
          ? "border-2 border-text-primary shadow-md"
          : "border border-border hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-10 h-10 rounded-md bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <span className="flex-1" />
        {journeyTypeConfig.recommended && (
          <span
            className="text-[10px] font-semibold text-primary bg-primary-tint px-2 py-0.5 rounded-full self-start"
            data-testid={`journey-listing-recommended-${journeyTypeConfig.id}`}
          >
            Recommended
          </span>
        )}
        <span
          data-testid={`journey-listing-checkbox-${journeyTypeConfig.id}`}
          className={`w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? "bg-text-primary border-text-primary text-white"
              : "border-border text-transparent"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="text-lg font-semibold text-text-primary mt-4">
        {journeyTypeConfig.journeyType}
      </div>
      <p className="text-sm text-text-secondary mt-1.5">{journeyTypeConfig.description}</p>

      <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Shoppers/day</span>
          <span className="font-semibold text-text-primary tabular-nums">
            {`~${known.estimatedDailyVolume.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Message sent</span>
          <span className="font-semibold text-text-primary">{`${WAIT_LABEL} after drop-off`}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen(true);
        }}
        data-testid={`journey-listing-preview-trigger-${journeyTypeConfig.id}`}
        className="flex items-center gap-2.5 w-full mt-4 p-2.5 rounded-md border border-border bg-app-bg hover:border-primary/40 hover:bg-primary-tint/20 transition-colors text-left"
      >
        <span className="w-14 h-9 rounded-md bg-slate-800 flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-text-primary">Preview journey</span>
          <span className="block text-[11px] text-text-secondary">See the flow and the message</span>
        </span>
      </button>

      <div className="text-xs text-text-muted mt-3 text-right tabular-nums">{MARKETING_RATE}</div>

      {/* Radix Dialog portals to document.body, but React's synthetic event
          system still bubbles clicks through the REACT tree, not the DOM
          tree — without this wrapper, a click on "Activate Now" inside the
          modal would also reach handleToggleCard above and immediately
          re-toggle the card. stopPropagation here only blocks that upward
          bubble; it doesn't affect the modal's own internal handlers
          (overlay-click-to-close etc.), which fire on their own elements
          first. */}
      <div onClick={(e) => e.stopPropagation()}>
        <JourneyPreviewModal
          journey={previewOpen ? known : null}
          onClose={() => setPreviewOpen(false)}
          onActivate={() => {
            if (!selected[known.id]) toggle(known.id);
            if (!selected[identified.id]) toggle(identified.id);
            setPreviewOpen(false);
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/JourneyListingCard" --watchAll=false`
Expected: PASS, 9/9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/engage2/journey-dashboard/data.js src/components/engage2/home/JourneyListingCard.jsx src/components/engage2/home/__tests__/JourneyListingCard.test.jsx
git commit -m "feat(fastrr-engage-2): collapse listing cards to one checkbox per journey type (drop audience split)"
```

---

### Task 7: Update `JourneyListingSection` — `CartRail` navigates to `/engage-2/setup`

**Files:**
- Modify: `src/components/engage2/home/JourneyListingSection.jsx`
- Modify: `src/components/engage2/home/__tests__/JourneyListingSection.test.jsx`
- Delete: `src/components/engage2/home/FundWalletModal.jsx`, `src/components/engage2/home/__tests__/FundWalletModal.test.jsx` (its content moves to Task 11's `FundWalletStep`)

**Interfaces:**
- Consumes: `JourneyListingCard` (Task 6), `CartRail` (unchanged — already accepts an `onContinue` callback prop from a prior segment), `useNavigate` from `react-router-dom`.
- Produces: default export `JourneyListingSection()`, no props (unchanged). Task 8 renders `<JourneyListingSection />`.

- [ ] **Step 1: Write the failing test**

Replace the entire content of `src/components/engage2/home/__tests__/JourneyListingSection.test.jsx` with:

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  mockNavigate.mockClear();
});

describe("JourneyListingSection", () => {
  it("renders the heading and all 3 journey type cards", () => {
    render(<JourneyListingSection />);
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByText("Select your recovery journeys")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-product")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-checkout")).toBeInTheDocument();
  });

  it("does not render the cart rail when nothing is selected", () => {
    render(<JourneyListingSection />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });

  it("shows the cart rail with the cart total once a journey type is selected", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("2 journeys selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹18,000");
  });

  it("clicking Continue to Recharge navigates to /engage-2/setup, without opening any local modal", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    fireEvent.click(screen.getByTestId("cart-rail-continue"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
    expect(screen.queryByTestId("fund-wallet-modal")).not.toBeInTheDocument();
  });
});
```

Note: "2 journeys selected" (not "1") because Task 6 made card selection toggle both the Known and Fastrr Identified `JOURNEYS` entries together — `computeCartFunding`'s existing dedup still totals them to ₹18,000 (Abandoned Cart's 4,000/day, not doubled), matching the existing `cartFunding.js` behavior verified in `CartRail.test.jsx`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/JourneyListingSection" --watchAll=false`
Expected: FAIL — current component still imports `FundWalletModal` and manages `fundWalletOpen` state instead of navigating.

- [ ] **Step 3: Write minimal implementation**

Replace the entire content of `src/components/engage2/home/JourneyListingSection.jsx` with:

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

export default function JourneyListingSection() {
  const navigate = useNavigate();

  return (
    <div className="mb-10" data-testid="journey-listing-section">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Select your recovery journeys
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Each journey is triggered by a specific drop-off point. Most brands start with
          Abandoned Checkout — the highest-intent audience — and expand from there.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {JOURNEY_TYPES.map((type) => (
          <JourneyListingCard key={type.id} journeyTypeConfig={type} />
        ))}
      </div>
      <CartRail onContinue={() => navigate("/engage-2/setup")} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="engage2/home/__tests__/JourneyListingSection" --watchAll=false`
Expected: PASS, 4/4 tests.

- [ ] **Step 5: Delete `FundWalletModal` and its test**

```bash
rm src/components/engage2/home/FundWalletModal.jsx src/components/engage2/home/__tests__/FundWalletModal.test.jsx
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(fastrr-engage-2): CartRail now navigates to /engage-2/setup; remove FundWalletModal (content moves to the setup flow in Task 11)"
```

---

### Task 8: Rebuild `FastrrEngage2.jsx` page composition

**Files:**
- Modify: `src/pages/FastrrEngage2.jsx`
- Modify: `src/pages/__tests__/FastrrEngage2.test.jsx`
- Delete: `src/components/engage2/home/PersonalizedStatStrip.jsx`, `src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx`
- Delete: `src/components/engage2/home/TestimonialSection.jsx`, `src/components/engage2/home/__tests__/TestimonialSection.test.jsx` (dropped per spec decision #4 — verify with `grep -rln "engage2/home/TestimonialSection" src` that only `FastrrEngage2.jsx` imports it before deleting; `engage/home/TestimonialSection.jsx` is v1's own separate copy, never touch it)

**Interfaces:**
- Consumes: `StoreSelector` (Task 2), `FunnelStats` (Task 3), `HeroSection` (Task 5), `JourneyListingSection` (Task 7).
- Produces: default export `FastrrEngagePage()`, no props (unchanged — this is what `/fastrr-engage-2`'s route renders).

- [ ] **Step 1: Write the failing test**

Replace the entire content of `src/pages/__tests__/FastrrEngage2.test.jsx` with:

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

beforeAll(() => {
  mockMatchMedia(false);
});

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("FastrrEngagePage (v2 prototype home page)", () => {
  it("renders the page wrapper, store selector, funnel stats, hero, and journey listing section", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector")).toBeInTheDocument();
    expect(screen.getByTestId("funnel-stats")).toBeInTheDocument();
    expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
  });

  it("adds bottom padding to the page root once a journey is selected, so the floating cart rail can't cover the last section", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage").className).toContain("pb-28");
  });

  it("has no bottom padding on the page root when nothing is selected", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage").className).not.toContain("pb-28");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage2" --watchAll=false`
Expected: FAIL — `store-selector`/`funnel-stats` testids don't exist in the current composition.

- [ ] **Step 3: Write minimal implementation**

Replace the entire content of `src/pages/FastrrEngage2.jsx` with:

```jsx
import React from "react";
import StoreSelector from "@/components/engage2/home/StoreSelector";
import FunnelStats from "@/components/engage2/home/FunnelStats";
import HeroSection from "@/components/engage2/home/HeroSection";
import JourneyListingSection from "@/components/engage2/home/JourneyListingSection";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function FastrrEngagePage() {
  // The cart rail portals to document.body and floats fixed-to-viewport
  // while any journey is selected. Padding lives on the page root (always
  // after whatever section renders last) so the rail never overlaps
  // trailing content, however the sections above get reordered.
  const hasSelection = useJourneySelectionStore2((s) => Object.keys(s.selected).length > 0);

  return (
    <div
      className={`max-w-[1100px] mx-auto ${hasSelection ? "pb-28" : ""}`}
      data-testid="page-fastrr-engage"
    >
      <div className="flex justify-end mb-6">
        <StoreSelector />
      </div>
      <FunnelStats />
      <HeroSection />
      <JourneyListingSection />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage2" --watchAll=false`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Delete the now-unused `PersonalizedStatStrip` and `TestimonialSection` (v2 only)**

```bash
grep -rln "PersonalizedStatStrip" src
# Expected: only the component file and its test — delete both:
rm src/components/engage2/home/PersonalizedStatStrip.jsx src/components/engage2/home/__tests__/PersonalizedStatStrip.test.jsx

grep -rln "engage2/home/TestimonialSection" src
# Expected: only the component file and its test — delete both:
rm src/components/engage2/home/TestimonialSection.jsx src/components/engage2/home/__tests__/TestimonialSection.test.jsx
```

If either grep shows an unexpected consumer, stop and re-examine before deleting — do not delete a file another part of the app still imports.

- [ ] **Step 6: Run the build to confirm no dangling imports**

Run: `CI=true npm run build`
Expected: `Compiled successfully.`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fastrr-engage-2): rebuild home page composition to match the prototype; remove PersonalizedStatStrip and TestimonialSection"
```

---

### Task 9: `SetupProgressBar` component

**Files:**
- Create: `src/components/engage2/setup/SetupProgressBar.jsx`
- Test: `src/components/engage2/setup/__tests__/SetupProgressBar.test.jsx`

**Interfaces:**
- Consumes: nothing external.
- Produces: default export `SetupProgressBar({ currentStep, furthestStep, onStepClick })` — `currentStep`/`furthestStep` are integers 0–2, `onStepClick(stepIndex)` is called only when `stepIndex <= furthestStep`. Task 14 (`EngageSetup2` page) owns and passes this state.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SetupProgressBar from "../SetupProgressBar";

describe("SetupProgressBar", () => {
  it("renders all 3 step labels", () => {
    render(<SetupProgressBar currentStep={0} furthestStep={0} onStepClick={() => {}} />);
    expect(screen.getByText("Select journeys")).toBeInTheDocument();
    expect(screen.getByText("Fund wallet")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Account Setup")).toBeInTheDocument();
  });

  it("clicking a step within furthestStep calls onStepClick with that index", () => {
    const onStepClick = jest.fn();
    render(<SetupProgressBar currentStep={1} furthestStep={1} onStepClick={onStepClick} />);
    fireEvent.click(screen.getByTestId("setup-progress-step-0"));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("clicking a step beyond furthestStep does nothing (button is disabled)", () => {
    const onStepClick = jest.fn();
    render(<SetupProgressBar currentStep={0} furthestStep={0} onStepClick={onStepClick} />);
    expect(screen.getByTestId("setup-progress-step-2")).toBeDisabled();
    fireEvent.click(screen.getByTestId("setup-progress-step-2"));
    expect(onStepClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SetupProgressBar" --watchAll=false`
Expected: FAIL — `Cannot find module '../SetupProgressBar'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React from "react";

const STEPS = ["Select journeys", "Fund wallet", "WhatsApp Account Setup"];

export default function SetupProgressBar({ currentStep, furthestStep, onStepClick }) {
  return (
    <div className="flex items-center gap-2.5 mb-10" data-testid="setup-progress-bar">
      {STEPS.map((label, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        const canJump = i <= furthestStep;
        return (
          <button
            key={label}
            type="button"
            data-testid={`setup-progress-step-${i}`}
            onClick={() => canJump && onStepClick(i)}
            disabled={!canJump}
            className="flex-1 flex flex-col gap-2 text-left bg-transparent border-0 p-0 disabled:cursor-not-allowed"
          >
            <span
              className={`h-1 rounded-full transition-colors ${
                isDone ? "bg-success" : isCurrent ? "bg-text-primary" : "bg-border"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                isCurrent ? "text-text-primary" : isDone ? "text-success" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SetupProgressBar" --watchAll=false`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/setup/SetupProgressBar.jsx src/components/engage2/setup/__tests__/SetupProgressBar.test.jsx
git commit -m "feat(fastrr-engage-2): add SetupProgressBar for the 3-step setup flow"
```

---

### Task 10: `SelectRecapStep` component

**Files:**
- Create: `src/components/engage2/setup/SelectRecapStep.jsx`
- Test: `src/components/engage2/setup/__tests__/SelectRecapStep.test.jsx`

**Interfaces:**
- Consumes: `useJourneySelectionStore2` (`selectedJourneys()`).
- Produces: default export `SelectRecapStep()`, no props. Task 14 renders it when `step === 0`.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen } from "@testing-library/react";
import SelectRecapStep from "../SelectRecapStep";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("SelectRecapStep", () => {
  it("lists each distinct selected journey type once, even when both audience variants are selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    useJourneySelectionStore2.getState().toggle("abandoned-cart-identified");
    render(<SelectRecapStep />);
    const types = screen.getByTestId("select-recap-types");
    expect(types.children).toHaveLength(1);
    expect(types).toHaveTextContent("Abandoned Cart");
  });

  it("has a link back to the home page to change the selection", () => {
    render(<SelectRecapStep />);
    expect(screen.getByTestId("select-recap-change-link")).toHaveAttribute(
      "href",
      "/fastrr-engage-2"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SelectRecapStep" --watchAll=false`
Expected: FAIL — `Cannot find module '../SelectRecapStep'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function SelectRecapStep() {
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());
  const types = [...new Set(selectedJourneys.map((j) => j.journeyType))];

  return (
    <div className="mb-10" data-testid="select-recap-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 1 of 3
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-3">Your selected journeys</h2>
      <div className="flex flex-wrap gap-2 mb-3" data-testid="select-recap-types">
        {types.map((t) => (
          <span
            key={t}
            className="text-xs font-semibold text-text-primary bg-primary-tint px-3 py-1.5 rounded-full"
          >
            {t}
          </span>
        ))}
      </div>
      <Link
        to="/fastrr-engage-2"
        data-testid="select-recap-change-link"
        className="text-xs font-medium text-primary hover:text-primary-hover"
      >
        Change selection
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SelectRecapStep" --watchAll=false`
Expected: PASS, 2/2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/setup/SelectRecapStep.jsx src/components/engage2/setup/__tests__/SelectRecapStep.test.jsx
git commit -m "feat(fastrr-engage-2): add SelectRecapStep for step 1 of the setup flow"
```

---

### Task 11: `FundWalletStep` component (converted from `FundWalletModal`)

**Files:**
- Create: `src/components/engage2/setup/FundWalletStep.jsx`
- Test: `src/components/engage2/setup/__tests__/FundWalletStep.test.jsx`

**Interfaces:**
- Consumes: `WalletRechargeCard` (unchanged, `eyebrow`/`subtitle`/`initialAmount`/`hideSubtitleOnChange`/`onDone` props), `useJourneySelectionStore2` (`selectedJourneys()`), `computeCartFunding` from `src/components/engage2/home/cartFunding.js` (unchanged), `WALLET_TOPUP` from `data.js`.
- Produces: default export `FundWalletStep({ onDone, onSkip })`. Task 14 renders it when `step === 1`, passing `onDone`/`onSkip` both wired to advance to step 2.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FundWalletStep from "../FundWalletStep";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

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
});

describe("FundWalletStep", () => {
  it("seeds the amount from the cart total and shows the runway-days subtitle while unchanged", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FundWalletStep onDone={() => {}} onSkip={() => {}} />);
    // 4,000/day * ₹1.50 * 3 days = ₹18,000
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
    expect(
      screen.getByText("This covers the journeys you just picked for their first 3 days.")
    ).toBeInTheDocument();
  });

  it("clicking 'Skip and Continue Meta (WhatsApp) Setup' calls onSkip", () => {
    const onSkip = jest.fn();
    render(<FundWalletStep onDone={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("clicking Add to Wallet credits the cart-derived amount and calls onDone", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    const onDone = jest.fn();
    render(<FundWalletStep onDone={onDone} onSkip={() => {}} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(useJourneyWalletStore.getState().balance).toBe(18000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FundWalletStep" --watchAll=false`
Expected: FAIL — `Cannot find module '../FundWalletStep'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React from "react";
import { Wallet } from "lucide-react";
import WalletRechargeCard from "@/components/engage2/journey-dashboard/WalletRechargeCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { computeCartFunding } from "@/components/engage2/home/cartFunding";
import { WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

export default function FundWalletStep({ onDone, onSkip }) {
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());
  const { total, runwayDays } = computeCartFunding(selectedJourneys);
  const cartAmount = total || WALLET_TOPUP.defaultAmount;

  return (
    <div data-testid="fund-wallet-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 2 of 3
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Fund your messaging wallet</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            One step before setup — add balance so your selected journeys can start sending the
            moment they go live.
          </p>
        </div>
      </div>

      <WalletRechargeCard
        eyebrow="Recharge for Your Selected Journeys"
        subtitle={`This covers the journeys you just picked for their first ${runwayDays} days.`}
        initialAmount={cartAmount}
        hideSubtitleOnChange
        onDone={onDone}
      />

      <button
        type="button"
        className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto block mt-4"
        onClick={onSkip}
        data-testid="fund-wallet-skip"
      >
        Skip and Continue Meta (WhatsApp) Setup
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FundWalletStep" --watchAll=false`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/setup/FundWalletStep.jsx src/components/engage2/setup/__tests__/FundWalletStep.test.jsx
git commit -m "feat(fastrr-engage-2): add FundWalletStep (converted from FundWalletModal) for step 2 of the setup flow"
```

---

### Task 12: `SetupInstructions` copy — dual CTA labels + prerequisites panel

**Files:**
- Modify: `src/components/engage2/account-setup/SetupInstructions.jsx`
- Modify: `src/components/engage2/account-setup/__tests__/SetupInstructions.test.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: default export `SetupInstructions({ onStart })` — **unchanged signature**, both CTAs still call `onStart`. Task 13 (`WhatsAppSetupStep`) is the only consumer, passing its own confirm handler as `onStart`.

- [ ] **Step 1: Write the failing test**

Add these assertions to `src/components/engage2/account-setup/__tests__/SetupInstructions.test.jsx`, inside the existing `it("renders the heading, both tips, all 3 steps, and both CTAs", ...)` test, after the existing `setup-cta-ai` assertion:

```javascript
    expect(screen.getByTestId("setup-cta-manual")).toHaveTextContent(
      "Confirm & Start WhatsApp Setup Manually"
    );
    expect(screen.getByTestId("setup-cta-ai")).toHaveTextContent(
      "Confirm & Start WhatsApp Setup with AI"
    );
    expect(screen.getByTestId("setup-prerequisites")).toBeInTheDocument();
    expect(screen.getByTestId("setup-prerequisites")).toHaveTextContent("WhatsApp");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="engage2/account-setup/__tests__/SetupInstructions" --watchAll=false`
Expected: FAIL — current CTA text is "Start Meta Embedded Signup"/"Set Up With AI Instead"; `setup-prerequisites` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

In `src/components/engage2/account-setup/SetupInstructions.jsx`, add a new constant after `TIPS`:

```javascript
const PREREQUISITES = [
  "A phone number that can receive WhatsApp — not already active on the WhatsApp app or Business app.",
  "Your business name, category, and a support email or phone number.",
];
```

Change the two CTA `Button`s from:

```jsx
        <Button
          type="button"
          size="lg"
          data-testid="setup-cta-manual"
          onClick={onStart}
        >
          Start Meta Embedded Signup
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          data-testid="setup-cta-ai"
          onClick={onStart}
        >
          Set Up With AI Instead
        </Button>
      </div>
```

to:

```jsx
        <Button
          type="button"
          size="lg"
          data-testid="setup-cta-manual"
          onClick={onStart}
        >
          Confirm & Start WhatsApp Setup Manually
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          data-testid="setup-cta-ai"
          onClick={onStart}
        >
          Confirm & Start WhatsApp Setup with AI
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-3 text-center">
        Meta verification opens right after — it only takes a few seconds, and you'll land back
        here automatically once it's done.
      </p>
```

And insert a new prerequisites block between the `setup-tips` block and the `setup-steps` block:

```jsx
      <div className="mb-8" data-testid="setup-prerequisites">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          Before you start
        </div>
        <ul className="flex flex-col gap-1.5">
          {PREREQUISITES.map((p) => (
            <li key={p} className="text-[13px] text-text-secondary flex gap-2">
              <span className="text-primary">•</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="engage2/account-setup/__tests__/SetupInstructions" --watchAll=false`
Expected: PASS, 2/2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/account-setup/SetupInstructions.jsx src/components/engage2/account-setup/__tests__/SetupInstructions.test.jsx
git commit -m "feat(fastrr-engage-2): rename WhatsApp setup CTAs, add prerequisites panel and post-CTA reassurance copy"
```

---

### Task 13: `WhatsAppSetupStep` component (pre-filled defaults) + delete `EngageAccountSetup2`

**Files:**
- Create: `src/components/engage2/setup/WhatsAppSetupStep.jsx`
- Test: `src/components/engage2/setup/__tests__/WhatsAppSetupStep.test.jsx`
- Delete: `src/pages/EngageAccountSetup2.jsx`, `src/pages/__tests__/EngageAccountSetup2.test.jsx` (Task 14 removes the last route reference; delete these files as part of Task 14's step list, since `App.js` still imports the page until then — see Task 14 Step 5)

**Interfaces:**
- Consumes: `SetupInstructions` (Task 12), `PhoneMockup`, `WhatsAppProfilePreview`, `DEFAULT_BUSINESS_CATEGORY` from `src/components/engage2/account-setup/` (all unchanged), `buildSignupPayload`/`writeSignupPayload` from `src/lib/metaSignupMock2.js` (unchanged).
- Produces: default export `WhatsAppSetupStep({ onConfirm })`. Task 14 renders it when `step === 2`, passing a handler that navigates to `/engage-2/meta-embedded-signup`.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WhatsAppSetupStep from "../WhatsAppSetupStep";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("WhatsAppSetupStep", () => {
  it("pre-fills Mystore1 and other sample business details, editable", () => {
    render(<WhatsAppSetupStep onConfirm={() => {}} />);
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Mystore1");
    expect(screen.getByTestId("field-website")).toHaveValue("mystore1.in");
    expect(screen.getByTestId("field-email")).toHaveValue("hello@mystore1.in");
    expect(screen.getByTestId("field-support-number")).toHaveValue("+91 98765 43210");
    expect(screen.getByTestId("number-setup-phone-input")).toHaveValue("98765 43210");

    fireEvent.change(screen.getByTestId("field-brand-name"), { target: { value: "Avimee" } });
    expect(screen.getByTestId("field-brand-name")).toHaveValue("Avimee");
  });

  it("clicking either signup CTA writes the current form snapshot to localStorage and calls onConfirm", () => {
    const onConfirm = jest.fn();
    render(<WhatsAppSetupStep onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId("setup-cta-manual"));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored.brandName).toBe("Mystore1");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="WhatsAppSetupStep" --watchAll=false`
Expected: FAIL — `Cannot find module '../WhatsAppSetupStep'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React, { useState } from "react";
import SetupInstructions from "@/components/engage2/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { buildSignupPayload, writeSignupPayload } from "@/lib/metaSignupMock2";

export default function WhatsAppSetupStep({ onConfirm }) {
  const [numberMode, setNumberMode] = useState("has_number");
  const [numberValue, setNumberValue] = useState("98765 43210");
  const [virtualNumberValue, setVirtualNumberValue] = useState("");
  const [appId, setAppId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  // WhatsAppProfilePreview already renders a gradient-circle initial-letter
  // placeholder ("M") from brandName when logoUrl is empty — that IS this
  // step's "default image", no separate asset needed.
  const [logoUrl, setLogoUrl] = useState(null);
  const [brandName, setBrandName] = useState("Mystore1");
  const [description, setDescription] = useState(
    "Curated home & lifestyle essentials, shipped fast across India."
  );
  const [website, setWebsite] = useState("mystore1.in");
  const [category, setCategory] = useState(DEFAULT_BUSINESS_CATEGORY);
  const [email, setEmail] = useState("hello@mystore1.in");
  const [supportNumber, setSupportNumber] = useState("+91 98765 43210");
  const [address, setAddress] = useState("12, MG Road, Bengaluru, Karnataka 560001");

  function handleLogoFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  }

  function handleConfirmSignup() {
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
    onConfirm();
  }

  return (
    <div data-testid="whatsapp-setup-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 3 of 3
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <SetupInstructions onStart={handleConfirmSignup} />
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

Run: `npx craco test --testPathPattern="WhatsAppSetupStep" --watchAll=false`
Expected: PASS, 2/2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/setup/WhatsAppSetupStep.jsx src/components/engage2/setup/__tests__/WhatsAppSetupStep.test.jsx
git commit -m "feat(fastrr-engage-2): add WhatsAppSetupStep with pre-filled Mystore1 sample details for step 3 of the setup flow"
```

---

### Task 14: `EngageSetup2.jsx` page + `App.js` route updates

**Files:**
- Create: `src/pages/EngageSetup2.jsx`
- Test: `src/pages/__tests__/EngageSetup2.test.jsx`
- Modify: `src/App.js`
- Delete: `src/pages/EngageAccountSetup2.jsx`, `src/pages/__tests__/EngageAccountSetup2.test.jsx`

**Interfaces:**
- Consumes: `SetupProgressBar` (Task 9), `SelectRecapStep` (Task 10), `FundWalletStep` (Task 11), `WhatsAppSetupStep` (Task 13), `useNavigate`.
- Produces: default export `EngageSetupPage()`, rendered at route `/engage-2/setup`.

- [ ] **Step 1: Write the failing test**

```javascript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EngageSetupPage from "../EngageSetup2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

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

describe("EngageSetupPage", () => {
  it("lands on step 2 (Fund wallet) by default, with step 3 not yet reachable", () => {
    render(<EngageSetupPage />);
    expect(screen.getByTestId("fund-wallet-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-2")).toBeDisabled();
  });

  it("clicking step 1 on the progress bar shows the select recap, and it remains reachable", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("setup-progress-step-0"));
    expect(screen.getByTestId("select-recap-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-0")).not.toBeDisabled();
  });

  it("skipping the wallet step advances to WhatsApp Account Setup and unlocks that progress step", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    expect(screen.getByTestId("whatsapp-setup-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-2")).not.toBeDisabled();
  });

  it("funding the wallet also advances to WhatsApp Account Setup", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(screen.getByTestId("whatsapp-setup-step")).toBeInTheDocument();
  });

  it("confirming WhatsApp setup navigates to Meta Embedded Signup", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageSetup2" --watchAll=false`
Expected: FAIL — `Cannot find module '../EngageSetup2'`.

- [ ] **Step 3: Write minimal implementation**

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SetupProgressBar from "@/components/engage2/setup/SetupProgressBar";
import SelectRecapStep from "@/components/engage2/setup/SelectRecapStep";
import FundWalletStep from "@/components/engage2/setup/FundWalletStep";
import WhatsAppSetupStep from "@/components/engage2/setup/WhatsAppSetupStep";

const STEP_SELECT = 0;
const STEP_WALLET = 1;
const STEP_WHATSAPP = 2;

export default function EngageSetupPage() {
  const navigate = useNavigate();
  // Arriving here means Continue was already clicked on the listing page —
  // step 0 (select) is "done" the moment you land here, so start on the
  // wallet step; step 0 stays reachable via the progress bar as a recap.
  const [step, setStep] = useState(STEP_WALLET);
  const [furthestStep, setFurthestStep] = useState(STEP_WALLET);

  function goToStep(next) {
    setStep(next);
    setFurthestStep((f) => Math.max(f, next));
  }

  function handleWhatsAppConfirm() {
    navigate("/engage-2/meta-embedded-signup");
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-setup">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <SetupProgressBar currentStep={step} furthestStep={furthestStep} onStepClick={goToStep} />
        {step === STEP_SELECT && <SelectRecapStep />}
        {step === STEP_WALLET && (
          <FundWalletStep onDone={() => goToStep(STEP_WHATSAPP)} onSkip={() => goToStep(STEP_WHATSAPP)} />
        )}
        {step === STEP_WHATSAPP && <WhatsAppSetupStep onConfirm={handleWhatsAppConfirm} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/EngageSetup2" --watchAll=false`
Expected: PASS, 5/5 tests.

- [ ] **Step 5: Update `App.js` routes; delete `EngageAccountSetup2`**

In `src/App.js`, change the import:

```javascript
import EngageAccountSetupPage2 from "@/pages/EngageAccountSetup2";
```

to:

```javascript
import EngageSetupPage2 from "@/pages/EngageSetup2";
```

and change the route:

```jsx
          <Route path="/engage-2/account-setup" element={<EngageAccountSetupPage2 />} />
```

to:

```jsx
          <Route path="/engage-2/setup" element={<EngageSetupPage2 />} />
```

Then:

```bash
grep -rln "EngageAccountSetup2" src
```

Expected: only `src/pages/EngageAccountSetup2.jsx` and `src/pages/__tests__/EngageAccountSetup2.test.jsx` remain (App.js no longer references it). Delete both:

```bash
rm src/pages/EngageAccountSetup2.jsx src/pages/__tests__/EngageAccountSetup2.test.jsx
```

- [ ] **Step 6: Run the build to confirm no dangling import/route**

Run: `CI=true npm run build`
Expected: `Compiled successfully.`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fastrr-engage-2): add EngageSetup2 page at /engage-2/setup; remove /engage-2/account-setup and EngageAccountSetup2.jsx"
```

---

### Task 15: Dashboard — fix "Open Engage" link target; light visual polish on `JourneysTable`

**Files:**
- Modify: `src/components/engage2/journey-dashboard/JourneyHeader.jsx`
- Modify: `src/components/engage2/journey-dashboard/__tests__/header-and-stats.test.jsx` (or wherever `journey-open-engage-link` is currently asserted — locate with `grep -rn "journey-open-engage-link" src/components/engage2/journey-dashboard/__tests__`)
- Modify: `src/components/engage2/journey-dashboard/JourneysTable.jsx`
- Modify: `src/components/engage2/journey-dashboard/__tests__/JourneysTable.test.jsx`

**Interfaces:**
- No prop/interface changes to either component — this task is copy/styling only.

- [ ] **Step 1: Update the existing "Open Engage" link assertion**

In `src/components/engage2/journey-dashboard/__tests__/header-and-stats.test.jsx`, change:

```javascript
    expect(screen.getByTestId("journey-open-engage-link")).toHaveAttribute("href", "/");
```

to:

```javascript
    expect(screen.getByTestId("journey-open-engage-link")).toHaveAttribute("href", "/flows-v2");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="header-and-stats" --watchAll=false`
Expected: FAIL — current link still targets `/`.

- [ ] **Step 3: Fix the link target**

In `src/components/engage2/journey-dashboard/JourneyHeader.jsx`, change:

```jsx
        <Link
          to="/"
          data-testid="journey-open-engage-link"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Open Engage
        </Link>
```

to:

```jsx
        <Link
          to="/flows-v2"
          data-testid="journey-open-engage-link"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Open Engage
        </Link>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="header-and-stats" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Write the failing visual-polish test**

`src/components/engage2/journey-dashboard/__tests__/JourneysTable.test.jsx` already has a `renderTable(overrides = {})` helper (defaults: `journeys: JOURNEYS, enabledMap: {}, onToggle: jest.fn(), onPreview: jest.fn()`) — use it, don't add a second differently-shaped render call. Add this test inside the existing `describe("JourneysTable", ...)` block, after the last `it(...)`:

```javascript
  it("gives each journey row a hover affordance", () => {
    renderTable();
    expect(screen.getByTestId(`journey-row-${JOURNEYS[0].id}`).className).toContain(
      "hover:bg-app-bg"
    );
  });
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx craco test --testPathPattern="JourneysTable" --watchAll=false`
Expected: FAIL — no hover class on the row yet.

- [ ] **Step 7: Add the polish**

In `src/components/engage2/journey-dashboard/JourneysTable.jsx`, change:

```jsx
    <TableRow data-testid={`journey-row-${j.id}`}>
```

to:

```jsx
    <TableRow
      data-testid={`journey-row-${j.id}`}
      className="hover:bg-app-bg/60 transition-colors"
    >
```

and give the audience `Badge` a quick visual differentiator so Known vs Fastrr Identified rows scan faster — change:

```jsx
        <div className="mt-1">
          <Badge variant="outline" className="text-[10px]">
            {j.audience}
          </Badge>
        </div>
```

to:

```jsx
        <div className="mt-1">
          <Badge
            variant="outline"
            className={`text-[10px] ${
              j.audience === "Known"
                ? "border-primary/30 text-primary"
                : "border-warning/40 text-warning"
            }`}
          >
            {j.audience}
          </Badge>
        </div>
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx craco test --testPathPattern="JourneysTable" --watchAll=false`
Expected: PASS, all tests including the new one.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix(fastrr-journey-2): Open Engage link now targets /flows-v2; add row hover state and audience color coding to JourneysTable"
```

---

## Final Verification (after all 15 tasks)

- [ ] Run the full suite: `npx craco test --watchAll=false` — expect only the 3 known pre-existing failures (`campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`), nothing else newly failing.
- [ ] Run `CI=true npm run build` — expect `Compiled successfully.`
- [ ] Confirm zero diff against `main` for v1: `git diff main...HEAD -- src/pages/FastrrEngage.jsx src/pages/FastrrJourney.jsx src/components/engage/` — expect empty output.
