# Fastrr Engage Page + Fastrr Journey Pitch Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Fastrr Engage" sidebar destination that opens a page which auto-shows a right-side pitch panel ("Fastrr Journey") for WhatsApp Marketing Journeys, styled after the supplied "Conversion Booster" reference screenshot.

**Architecture:** A tiny zustand store (`isOpen`/`open`/`close`) controls a globally-mounted `Sheet`-based panel component, mirroring the existing `ConversationPanel` pattern. A new page opens the panel on mount and can reopen it after close. A new sidebar entry routes to the page.

**Tech Stack:** React 18, react-router-dom v7, zustand v5, Radix UI (`@radix-ui/react-dialog` via the existing `Sheet` wrapper), Tailwind CSS + shadcn/ui tokens, lucide-react icons, Jest + React Testing Library (via `craco test`).

**Spec:** `docs/superpowers/specs/2026-08-31-fastrr-engage-page-design.md`

## Global Constraints

- No backend/API calls — this is a static prototype.
- All CTA buttons (`Enable Fastrr Journey` x2, `See how it works`) are no-ops, each marked `// TODO: wire up once enablement flow is defined`.
- All stat/benchmark numbers are illustrative placeholders, each marked `// TODO: replace with real benchmark` (or `// TODO: replace with real trust stat` / `// TODO: confirm onboarding time` as applicable).
- Panel auto-opens on every page visit (no dismissal memory / localStorage).
- Nav label: "Fastrr Engage". Panel title: "Fastrr Journey", subtitle "Powered by Fastrr Engage".
- Use only existing Tailwind/shadcn tokens (`bg-primary`, `bg-primary-tint`, `text-text-primary/secondary/muted`, `bg-surface`, `bg-app-bg`, `border-border`, `bg-success`/`bg-success-bg`/`text-success`) — no new tokens.
- Reuse existing UI primitives (`Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle` from `src/components/ui/sheet.jsx`, `Button` from `src/components/ui/button.jsx`) — do not fork or modify them.
- Do not touch any file under `src/components/flows/builder/` or `store/flowBuilderStore.js`/`lib/flowMeta.js` (unrelated to this feature; CLAUDE.md's shared-code boundary rules apply there, not here).

---

### Task 1: `fastrrEngagePanelStore`

**Files:**
- Create: `src/store/fastrrEngagePanelStore.js`
- Test: `src/store/__tests__/fastrrEngagePanelStore.test.js`

**Interfaces:**
- Produces: `useFastrrEngagePanelStore` — a zustand hook exposing `{ isOpen: boolean, open: () => void, close: () => void }`. Later tasks import this from `@/store/fastrrEngagePanelStore`.

- [ ] **Step 1: Write the failing test**

Create `src/store/__tests__/fastrrEngagePanelStore.test.js`:

```js
import { useFastrrEngagePanelStore } from "../fastrrEngagePanelStore";

const getState = () => useFastrrEngagePanelStore.getState();

describe("fastrrEngagePanelStore", () => {
  beforeEach(() => {
    getState().close();
  });

  it("starts closed", () => {
    expect(getState().isOpen).toBe(false);
  });

  it("open() sets isOpen to true", () => {
    getState().open();
    expect(getState().isOpen).toBe(true);
  });

  it("close() sets isOpen to false", () => {
    getState().open();
    getState().close();
    expect(getState().isOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="fastrrEngagePanelStore" --watchAll=false`
Expected: FAIL — cannot find module `../fastrrEngagePanelStore`.

- [ ] **Step 3: Write minimal implementation**

Create `src/store/fastrrEngagePanelStore.js`:

```js
// Global state for the Fastrr Journey pitch panel (right-side Sheet).
// Mirrors the minimal shape of the conversation panel's isOpen/open/close.

import { create } from "zustand";

export const useFastrrEngagePanelStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="fastrrEngagePanelStore" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/fastrrEngagePanelStore.js src/store/__tests__/fastrrEngagePanelStore.test.js
git commit -m "feat(fastrr-engage): add panel visibility store

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `FastrrEngagePanel` component

**Files:**
- Create: `src/components/engage/FastrrEngagePanel.jsx`
- Test: `src/components/engage/__tests__/FastrrEngagePanel.test.jsx`

**Interfaces:**
- Consumes: `useFastrrEngagePanelStore` (`{ isOpen, close }`) from Task 1 — exact import path `@/store/fastrrEngagePanelStore`.
- Consumes: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` from `@/components/ui/sheet`; `Button` from `@/components/ui/button`.
- Produces: default export `FastrrEngagePanel` (no props) — later mounted globally in `App.js` (Task 4).

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/__tests__/FastrrEngagePanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePanel from "../FastrrEngagePanel";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

describe("FastrrEngagePanel", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
  });

  it("renders nothing when closed", () => {
    render(<FastrrEngagePanel />);
    expect(screen.queryByTestId("fastrr-engage-panel")).not.toBeInTheDocument();
  });

  it("renders the pitch content when open", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    expect(screen.getByTestId("fastrr-engage-panel")).toBeInTheDocument();
    expect(screen.getByText("Fastrr Journey")).toBeInTheDocument();
    expect(screen.getByText("Powered by Fastrr Engage")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-stat-grid")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-journey-list")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Product")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Checkout")).toBeInTheDocument();
  });

  it("closing via the Sheet's close control updates the store", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
  });

  it("CTA buttons render and are clickable no-ops", () => {
    useFastrrEngagePanelStore.getState().open();
    render(<FastrrEngagePanel />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-primary-cta"));
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-secondary-cta"));
    fireEvent.click(screen.getByTestId("fastrr-engage-footer-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FastrrEngagePanel" --watchAll=false`
Expected: FAIL — cannot find module `../FastrrEngagePanel`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/FastrrEngagePanel.jsx`:

```jsx
import React from "react";
import { Eye, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

const STATS = [
  // TODO: replace with real benchmark
  { value: "Upto 3.2x", label: "ROI on automated WhatsApp journeys" },
  // TODO: replace with real benchmark
  { value: "Upto 25%", label: "Cart recovery rate" },
  // TODO: replace with real benchmark
  { value: "Upto 40%", label: "Unknown visitors re-identified & re-engaged" },
];

const JOURNEYS = [
  {
    icon: Eye,
    name: "Abandoned Product",
    desc: "Visitor viewed a product but didn't add to cart — send a timely nudge with the exact product.",
  },
  {
    icon: ShoppingCart,
    name: "Abandoned Cart",
    desc: "Items sitting in cart — recover with a reminder + incentive before they leave.",
  },
  {
    icon: AlertTriangle,
    name: "Abandoned Checkout",
    desc: "Checkout started but not completed — the highest-intent recovery moment.",
  },
];

const WHY_POINTS = [
  "Identifies unknown/anonymous visitors for retargeting",
  "No manual campaign setup — journeys run automatically",
  "Ease of onboarding: live in under 15 minutes",
];

function HeroSection() {
  return (
    <div
      className="rounded-lg p-5 mb-6 text-white"
      style={{ background: "linear-gradient(135deg, #6C3AE8 0%, #22C55E 100%)" }}
      data-testid="fastrr-engage-panel-hero"
    >
      {/* Simple CSS chat-bubble mockup standing in for a product screenshot */}
      <div className="flex flex-col gap-1.5 mb-4 max-w-[220px]">
        <div className="bg-white/90 text-slate-900 text-[11px] rounded-lg rounded-bl-none px-2.5 py-1.5 self-start shadow-sm">
          Cart reminder sent
        </div>
        <div className="bg-white/60 text-slate-900 text-[11px] rounded-lg rounded-br-none px-2.5 py-1.5 self-end shadow-sm">
          "Yes, still interested!"
        </div>
        <div className="bg-white text-slate-900 text-[11px] rounded-lg rounded-bl-none px-2.5 py-1.5 self-start shadow-sm font-medium">
          ✅ Order confirmed
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-1">
        Recover Revenue From Every Missed Visit
      </h3>
      <p className="text-[13px] text-white/90 mb-4">
        Automated WhatsApp journeys that turn drop-offs into orders — no manual follow-up needed.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-white text-primary hover:bg-white/90"
          data-testid="fastrr-engage-hero-primary-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Enable Fastrr Journey
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/60 text-white hover:bg-white/10"
          data-testid="fastrr-engage-hero-secondary-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          See how it works
        </Button>
      </div>
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4" data-testid="fastrr-engage-stat-grid">
      {STATS.map((stat) => (
        <div key={stat.label} className="bg-primary-tint rounded-lg p-3 text-center">
          <div className="text-base font-bold text-primary">{stat.value}</div>
          <div className="text-[10px] text-text-secondary mt-1 leading-tight">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function TrustLine() {
  return (
    <div className="bg-app-bg border border-border rounded-lg px-4 py-3 text-[13px] text-text-secondary mb-6">
      {/* TODO: replace with real trust stat */}
      Trusted by <strong className="text-text-primary">150+ sellers</strong> recovering{" "}
      <strong className="text-text-primary">₹50L+</strong> in monthly revenue.
    </div>
  );
}

function JourneyList() {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Journeys Supported</h4>
      <div className="flex flex-col gap-3" data-testid="fastrr-engage-journey-list">
        {JOURNEYS.map((j) => (
          <div key={j.name} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
              <j.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{j.name}</div>
              <div className="text-[12px] text-text-secondary mt-0.5">{j.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhySection() {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Why Sellers Enable It</h4>
      <ul className="flex flex-col gap-2 mb-3">
        {WHY_POINTS.map((point) => (
          <li key={point} className="flex gap-2 items-start text-[13px] text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            {point}
          </li>
        ))}
      </ul>
      <div className="bg-success-bg border border-success/30 rounded-lg px-3 py-2 text-[13px] font-medium text-success">
        {/* TODO: confirm onboarding time */}
        Get started in as little as 15 minutes
      </div>
    </div>
  );
}

export default function FastrrEngagePanel() {
  const isOpen = useFastrrEngagePanelStore((s) => s.isOpen);
  const close = useFastrrEngagePanelStore((s) => s.close);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] overflow-y-auto"
        data-testid="fastrr-engage-panel"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Fastrr Journey</SheetTitle>
          <p className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
            Powered by Fastrr Engage
          </p>
        </SheetHeader>

        <HeroSection />

        <h4 className="text-sm font-semibold text-text-primary mb-1">
          WhatsApp Marketing Journeys
        </h4>
        <p className="text-[13px] text-text-secondary mb-4">
          Turn anonymous website visitors and drop-offs into recovered revenue — automatically.
        </p>

        <StatGrid />
        <TrustLine />
        <JourneyList />
        <WhySection />

        <Button
          type="button"
          className="w-full"
          data-testid="fastrr-engage-footer-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Enable Fastrr Journey
        </Button>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FastrrEngagePanel" --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/FastrrEngagePanel.jsx src/components/engage/__tests__/FastrrEngagePanel.test.jsx
git commit -m "feat(fastrr-engage): add Fastrr Journey pitch panel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `FastrrEngage` page

**Files:**
- Create: `src/pages/FastrrEngage.jsx`
- Test: `src/pages/__tests__/FastrrEngage.test.jsx`

**Interfaces:**
- Consumes: `useFastrrEngagePanelStore` (`{ open }`) from Task 1.
- Consumes: `PreviewHeader` from `@/components/common/PreviewHeader`; `Button` from `@/components/ui/button`.
- Produces: default export `FastrrEngagePage` (no props) — registered as a route in Task 4.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/FastrrEngage.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

describe("FastrrEngagePage", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
  });

  it("opens the panel automatically on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("renders the page title and reopen button", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-view-journey-btn")).toBeInTheDocument();
  });

  it("clicking 'View Fastrr Journey' opens the panel", () => {
    render(<FastrrEngagePage />);
    useFastrrEngagePanelStore.getState().close();
    fireEvent.click(screen.getByTestId("fastrr-engage-view-journey-btn"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage" --watchAll=false`
Expected: FAIL — cannot find module `../FastrrEngage`.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/FastrrEngage.jsx`:

```jsx
import React, { useEffect } from "react";
import { Sparkles } from "lucide-react";
import PreviewHeader from "@/components/common/PreviewHeader";
import { Button } from "@/components/ui/button";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-fastrr-engage">
      <PreviewHeader
        title="Fastrr Engage"
        subtitle="Customer engagement journeys, bridging Fastrr Checkout and Fastrr Engage."
        testIdPrefix="fastrr-engage"
      />
      <div className="flex flex-col items-center justify-center text-center py-20 bg-surface border border-border rounded-lg">
        <div className="w-14 h-14 rounded-full bg-primary-tint flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Bring conversations into every checkout drop-off
        </h2>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          Fastrr Journey connects Fastrr Checkout with WhatsApp marketing automation, recovering
          revenue from abandoned products, carts, and checkouts.
        </p>
        <Button type="button" data-testid="fastrr-engage-view-journey-btn" onClick={open}>
          View Fastrr Journey
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/FastrrEngage.jsx src/pages/__tests__/FastrrEngage.test.jsx
git commit -m "feat(fastrr-engage): add Fastrr Engage placeholder page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Wire up nav, routing, and global panel mount

**Files:**
- Modify: `src/components/layout/Sidebar.jsx` (icon import + `SIDEBAR_ITEMS` array)
- Modify: `src/App.js` (page import, route, global panel mount)

**Interfaces:**
- Consumes: `FastrrEngagePage` (default export, Task 3) and `FastrrEngagePanel` (default export, Task 2).
- Produces: route `/fastrr-engage` reachable from the sidebar; `FastrrEngagePanel` always mounted so any future `open()` call (from anywhere in the app) can show it.

There is no existing automated test for `Sidebar.jsx` or `App.js` route wiring (confirmed: no `Sidebar.test.*` or `App.test.*` files exist), so this task is verified manually rather than via a new test file — consistent with how other route/nav additions in this codebase are done.

- [ ] **Step 1: Add the sidebar entry**

In `src/components/layout/Sidebar.jsx`, add `Sparkles` to the `lucide-react` import list (after `Home`):

```js
import {
  Home,
  Sparkles,
  LayoutDashboard,
  ...
```

Then add a new entry to `SIDEBAR_ITEMS` immediately after the "Home V6" entry (after line 81's closing `},`):

```js
  { label: "Fastrr Engage", icon: Sparkles, route: "/fastrr-engage", testId: "nav-fastrr-engage" },
```

- [ ] **Step 2: Register the route and mount the panel**

In `src/App.js`, add the page import near the other page imports (alphabetically close to other simple pages, e.g. near the `PushPage` import):

```js
import FastrrEngagePage from "@/pages/FastrrEngage";
import FastrrEngagePanel from "@/components/engage/FastrrEngagePanel";
```

Add the route inside the `<Route element={<AppShell />}>` block, before the `path="*"` catch-all:

```jsx
<Route path="/fastrr-engage" element={<FastrrEngagePage />} />
```

Mount the panel as a global sibling next to `<ConversationPanel />`:

```jsx
<ConversationPanel />
<FastrrEngagePanel />
<Toaster richColors position="top-right" />
```

- [ ] **Step 3: Manual verification**

Run: `npm start` (or the project's existing dev-server command)

1. Confirm a new "Fastrr Engage" icon appears in the sidebar, right after "Home V6", using the sparkle icon, with a working tooltip on hover.
2. Click it — confirm the URL becomes `/fastrr-engage` and the placeholder page renders behind a right-side panel that has auto-opened.
3. Confirm the panel shows: title "Fastrr Journey", subtitle "Powered by Fastrr Engage", the gradient hero with two buttons, the 3-stat grid, the trust line, the three "Journeys Supported" rows (Abandoned Product / Cart / Checkout), the "Why Sellers Enable It" bullets + green pill, and the footer CTA.
4. Click the panel's close (X) — confirm it closes and the placeholder page (title, one-liner, "View Fastrr Journey" button) is visible underneath.
5. Click "View Fastrr Journey" — confirm the panel reopens.
6. Click each CTA button (hero primary, hero secondary, footer) — confirm no console errors, no navigation, no crash (they are no-ops by design).
7. Reload the page at `/fastrr-engage` — confirm the panel auto-opens again (no dismissal memory).

- [ ] **Step 4: Run the full test suite to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All existing tests still pass, plus the 10 new tests from Tasks 1–3 (3 store + 4 panel + 3 page).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.jsx src/App.js
git commit -m "feat(fastrr-engage): wire up nav entry, route, and global panel mount

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Files & routing ✅ (Task 4); page content ✅ (Task 3); panel content structure (hero, stat grid, trust line, journeys, why-section, footer CTA) ✅ (Task 2, all 8 sub-sections present); naming/positioning ("Fastrr Engage" nav, "Fastrr Journey" panel title, "Powered by Fastrr Engage" tag) ✅ (Tasks 2–4); state management (isOpen/open/close store) ✅ (Task 1); styling using only existing tokens ✅ (all tasks); testing (data-testids, manual verification, no new automated suite requirement) ✅ (Task 4, Step 3).
- **Placeholder scan:** No "TBD"/"implement later" — every `// TODO` marks an intentionally deferred value per the spec's "Open items" section, with real code around it, not a stand-in for missing logic.
- **Type/name consistency:** `useFastrrEngagePanelStore` exposes `{ isOpen, open, close }` in Task 1 and is consumed with those exact names in Tasks 2 and 3. `data-testid` values (`fastrr-engage-panel`, `fastrr-engage-stat-grid`, `fastrr-engage-journey-list`, `fastrr-engage-hero-primary-cta`, `fastrr-engage-hero-secondary-cta`, `fastrr-engage-footer-cta`, `page-fastrr-engage`, `fastrr-engage-view-journey-btn`, `nav-fastrr-engage`) are defined once and referenced identically across component and test code.
