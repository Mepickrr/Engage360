# Fastrr Journey Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "Fastrr Journey" dashboard (`/fastrr-journey`) — 5 KPI cards with honest zero-state nudges, a 6-journey table with per-row toggle/preview/actions, and a redesigned single-view flow preview modal — and make it the destination after the Meta Embedded Signup mock's "Finish" instead of just closing the popup.

**Architecture:** A page (`FastrrJourney.jsx`) owns all client-side state (which journeys are enabled, which is being previewed) and composes four presentational components (`JourneyHeader`, `JourneyStatsRow`, `JourneysTable`, `JourneyPreviewModal`) driven by a static `data.js` config for the 6 journeys. The preview modal reuses the existing `WhatsAppBubblePreview` component verbatim and re-creates the Flow Builder's Start Trigger / Wait node visuals statically (no ReactFlow dependency). `MetaEmbeddedSignup.jsx`'s Finish handler changes to redirect the opener tab (or self, as a fallback) to the new page.

**Tech Stack:** React 19, react-router-dom v7, shadcn/ui primitives (`Table`, `DropdownMenu`, `Tooltip`, `Dialog`, `Badge`, `Button`), lucide-react icons, Jest + React Testing Library (via `craco test`), sonner (via the existing `previewToast()` helper).

**Spec:** `docs/superpowers/specs/2026-09-11-fastrr-journey-dashboard-design.md`

## Global Constraints

- No real backend/API calls anywhere — this is a client-side, session-only prototype.
- All "not wired yet" actions (kebab menu's 5 items, the preview modal's "Edit on Engage") call `previewToast()` from `@/components/common/PreviewHeader` — this repo's established convention for exactly this situation — not a bespoke `// TODO` comment.
- All 6 journeys start **disabled**. Metrics (Sent/Delivered/Opened/Clicked/Orders/Revenue) render `—` while disabled and `0` (never a fabricated number) the instant a row is enabled.
- Only "Active Journeys" in the KPI row is dynamic; the other 4 cards (Revenue Attribution, Deliverability, Users Targeted, ROI) always show `—` with their fixed micro-copy for this prototype.
- Route `/fastrr-journey` is a **sibling** of `<Route element={<AppShell />}>` in `src/App.js` (same pattern as `/engage/account-setup`/`/engage/meta-embedded-signup`) — no sidebar/topbar, no `Sidebar.jsx` entry.
- The Wait duration in the preview modal is fixed at **"30 Minutes"** for all 6 journeys.
- `MetaEmbeddedSignup.jsx`'s `handleFinish`: if `window.opener` exists, set `window.opener.location.href = "/fastrr-journey"` then `window.close()`; otherwise `navigate("/fastrr-journey")` on the current tab.
- Any JSX text a test asserts must either be a single template-literal string (not an expression adjacent to separate literal text) when using `getByText`, or use `toHaveTextContent` (which correctly aggregates nested/split text) when the content is genuinely split across multiple child nodes (e.g. `WhatsAppBubblePreview`'s merge-field rendering).
- Testing Radix `Select`/`Tooltip`/`DropdownMenu` interaction in jsdom requires this exact `beforeAll` polyfill: `window.HTMLElement.prototype.hasPointerCapture = jest.fn(); window.HTMLElement.prototype.releasePointerCapture = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();`
- Page-level tests that touch `react-router-dom` must use this repo's established `jest.mock("react-router-dom", () => ({...}), { virtual: true })` workaround (real `react-router-dom` cannot be resolved by Jest in this repo — ESM-only `exports` map).

---

### Task 1: `data.js` + `JourneyHeader` + `JourneyStatsRow`

**Files:**
- Create: `src/components/engage/journey-dashboard/data.js`
- Create: `src/components/engage/journey-dashboard/JourneyHeader.jsx`
- Create: `src/components/engage/journey-dashboard/JourneyStatsRow.jsx`
- Test: `src/components/engage/journey-dashboard/__tests__/header-and-stats.test.jsx`

**Interfaces:**
- Produces from `data.js`: `JOURNEYS` (array of 6 objects: `{ id, journeyType, audience, tooltip, triggerLabel, waDraft }`), `WAIT_LABEL` (string, `"30 Minutes"`). Tasks 2, 3, 4 import these.
- Produces `JourneyHeader` (default export, no props).
- Produces `JourneyStatsRow` (default export, prop: `activeCount` number). Task 4 renders both.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/journey-dashboard/__tests__/header-and-stats.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import JourneyHeader from "../JourneyHeader";
import JourneyStatsRow from "../JourneyStatsRow";

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

describe("JourneyHeader", () => {
  it("renders the wallet balance, recharge link, profile icon, and Open Engage link", () => {
    render(<JourneyHeader />);
    expect(screen.getByTestId("journey-header")).toBeInTheDocument();
    expect(screen.getByTestId("journey-wallet-balance")).toHaveTextContent("₹0.00");
    expect(screen.getByTestId("journey-recharge-link")).toBeInTheDocument();
    expect(screen.getByTestId("journey-profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("journey-open-engage-link")).toHaveAttribute("href", "/");
  });
});

describe("JourneyStatsRow", () => {
  it("renders all 5 cards with zero-state copy when activeCount is 0", () => {
    render(<JourneyStatsRow activeCount={0} />);
    expect(screen.getByTestId("journey-stats-row")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("0 / 6");
    expect(screen.getByText("Turn one on below to start recovering revenue")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-revenue")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-deliverability")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-users")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-roi")).toHaveTextContent("—");
  });

  it("reflects a non-zero activeCount", () => {
    render(<JourneyStatsRow activeCount={2} />);
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("2 / 6");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="header-and-stats" --watchAll=false`
Expected: FAIL — cannot find modules `../JourneyHeader`, `../JourneyStatsRow`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/journey-dashboard/data.js`:

```js
// Prototype config for the Fastrr Journey dashboard — the 6 predefined
// recovery journeys, their copy, and the fixed wait duration shown in
// the preview modal.

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

export const WAIT_LABEL = "30 Minutes";
```

Create `src/components/engage/journey-dashboard/JourneyHeader.jsx`:

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Wallet, User } from "lucide-react";

export default function JourneyHeader() {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface"
      data-testid="journey-header"
    >
      <span className="text-sm font-semibold text-text-primary">Fastrr Journey</span>

      <div className="flex items-center gap-4">
        <div
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full border border-border bg-app-bg"
          data-testid="journey-wallet-pill"
        >
          <Wallet className="w-3.5 h-3.5 text-text-secondary" />
          <span
            className="text-[12px] font-semibold tabular-nums text-text-primary"
            data-testid="journey-wallet-balance"
          >
            ₹0.00
          </span>
          <span className="h-3 w-px bg-border" />
          <button
            type="button"
            data-testid="journey-recharge-link"
            className="text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Recharge
          </button>
        </div>

        <div
          className="w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center"
          data-testid="journey-profile-icon"
        >
          <User className="w-4 h-4 text-primary" />
        </div>

        <Link
          to="/"
          data-testid="journey-open-engage-link"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Open Engage
        </Link>
      </div>
    </div>
  );
}
```

Create `src/components/engage/journey-dashboard/JourneyStatsRow.jsx`:

```jsx
import React from "react";

const CARDS = [
  { key: "active", label: "Active Journeys", hint: "Turn one on below to start recovering revenue" },
  { key: "revenue", label: "Revenue Attribution", hint: "Shows up once a journey is running" },
  { key: "deliverability", label: "Deliverability", hint: "Tracked from your first message send" },
  { key: "users", label: "Users Targeted", hint: "Counts anonymous + known visitors reached" },
  { key: "roi", label: "ROI", hint: "Compares message spend to recovered revenue" },
];

export default function JourneyStatsRow({ activeCount }) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-8" data-testid="journey-stats-row">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-surface border border-border rounded-lg p-5 text-center"
          data-testid={`journey-stat-${card.key}`}
        >
          <div className="text-2xl font-bold text-text-primary">
            {card.key === "active" ? `${activeCount} / 6` : "—"}
          </div>
          <div className="text-xs font-semibold text-text-secondary mt-1">{card.label}</div>
          <div className="text-[11px] text-text-muted mt-1">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="header-and-stats" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/journey-dashboard/data.js src/components/engage/journey-dashboard/JourneyHeader.jsx src/components/engage/journey-dashboard/JourneyStatsRow.jsx src/components/engage/journey-dashboard/__tests__/header-and-stats.test.jsx
git commit -m "feat(fastrr-journey): add journey data config, header, and KPI cards

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `JourneysTable`

**Files:**
- Create: `src/components/engage/journey-dashboard/JourneysTable.jsx`
- Test: `src/components/engage/journey-dashboard/__tests__/JourneysTable.test.jsx`

**Interfaces:**
- Consumes `JOURNEYS` from `./data` (Task 1) and `previewToast` from `@/components/common/PreviewHeader`.
- Produces `JourneysTable` (default export), props: `journeys` (array, same shape as `JOURNEYS`), `enabledMap` (object `{ [id]: boolean }`), `onToggle(id)`, `onPreview(id)`. Task 4 renders this with `journeys={JOURNEYS}`.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/journey-dashboard/__tests__/JourneysTable.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import JourneysTable from "../JourneysTable";
import { JOURNEYS } from "../data";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));
import { previewToast } from "@/components/common/PreviewHeader";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function renderTable(overrides = {}) {
  const props = {
    journeys: JOURNEYS,
    enabledMap: {},
    onToggle: jest.fn(),
    onPreview: jest.fn(),
    ...overrides,
  };
  render(<JourneysTable {...props} />);
  return props;
}

describe("JourneysTable", () => {
  it("renders all 6 journeys with their audience badges", () => {
    renderTable();
    JOURNEYS.forEach((j) => {
      expect(screen.getByTestId(`journey-row-${j.id}`)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Known").length).toBe(3);
    expect(screen.getAllByText("Fastrr Identified").length).toBe(3);
  });

  it("shows metrics as — when a journey is disabled and 0 when enabled", () => {
    const id = JOURNEYS[0].id;
    const { rerender } = render(
      <JourneysTable journeys={JOURNEYS} enabledMap={{}} onToggle={() => {}} onPreview={() => {}} />
    );
    const disabledRow = screen.getByTestId(`journey-row-${id}`);
    expect(within(disabledRow).getAllByText("—").length).toBeGreaterThan(0);

    rerender(
      <JourneysTable journeys={JOURNEYS} enabledMap={{ [id]: true }} onToggle={() => {}} onPreview={() => {}} />
    );
    const enabledRow = screen.getByTestId(`journey-row-${id}`);
    expect(within(enabledRow).getAllByText("0").length).toBe(6);
    expect(within(enabledRow).getByText("Active")).toBeInTheDocument();
  });

  it("clicking a row's toggle calls onToggle with its id", () => {
    const props = renderTable();
    fireEvent.click(screen.getByTestId(`journey-toggle-${JOURNEYS[0].id}`));
    expect(props.onToggle).toHaveBeenCalledWith(JOURNEYS[0].id);
  });

  it("clicking a row's preview icon calls onPreview with its id", () => {
    const props = renderTable();
    fireEvent.click(screen.getByTestId(`journey-preview-${JOURNEYS[0].id}`));
    expect(props.onPreview).toHaveBeenCalledWith(JOURNEYS[0].id);
  });
});

describe.each([
  "View Analytics",
  "Download Order Report",
  "Download Error Report",
  "Download Conversation Report",
  "View All Chat",
])("kebab menu item %s", (label) => {
  it("calls previewToast when clicked", () => {
    previewToast.mockClear();
    renderTable();
    fireEvent.click(screen.getByTestId(`journey-menu-${JOURNEYS[0].id}`));
    fireEvent.click(screen.getByText(label));
    expect(previewToast).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="JourneysTable" --watchAll=false`
Expected: FAIL — cannot find module `../JourneysTable`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/journey-dashboard/JourneysTable.jsx`:

```jsx
import React from "react";
import { Eye, MoreVertical } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { previewToast } from "@/components/common/PreviewHeader";

const PRIMARY = "#6C3AE8";

function MetricCell({ enabled }) {
  return (
    <TableCell className="text-right text-[12px] text-text-secondary tabular-nums">
      {enabled ? "0" : "—"}
    </TableCell>
  );
}

export default function JourneysTable({ journeys, enabledMap, onToggle, onPreview }) {
  return (
    <div data-testid="journeys-table">
      <TooltipProvider delayDuration={150}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Journey Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Opened</TableHead>
              <TableHead className="text-right">Clicked</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journeys.map((j) => {
              const enabled = !!enabledMap[j.id];
              return (
                <TableRow key={j.id} data-testid={`journey-row-${j.id}`}>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-semibold text-[13px] text-text-primary cursor-default">
                          {j.journeyType}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px]">
                        {j.tooltip}
                      </TooltipContent>
                    </Tooltip>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {j.audience}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: enabled ? "#22C55E" : "#94A3B8" }}
                      />
                      <span className="text-[11px] font-medium text-text-secondary">
                        {enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                  </TableCell>

                  <MetricCell enabled={enabled} />
                  <MetricCell enabled={enabled} />
                  <MetricCell enabled={enabled} />
                  <MetricCell enabled={enabled} />
                  <MetricCell enabled={enabled} />
                  <MetricCell enabled={enabled} />

                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        data-testid={`journey-toggle-${j.id}`}
                        onClick={() => onToggle(j.id)}
                        title={enabled ? "Active — click to pause" : "Click to activate"}
                        style={{
                          position: "relative",
                          width: 36,
                          height: 20,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: enabled ? PRIMARY : "#E2E8F0",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          padding: 2,
                          transition: "background 0.2s",
                        }}
                      >
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            transition: "transform 0.2s",
                            transform: enabled ? "translateX(16px)" : "translateX(0)",
                          }}
                        />
                      </button>

                      <button
                        type="button"
                        title="Preview"
                        data-testid={`journey-preview-${j.id}`}
                        onClick={() => onPreview(j.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary hover:text-primary transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="More"
                            data-testid={`journey-menu-${j.id}`}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-text-secondary"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => previewToast()}>
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => previewToast()}>
                            Download Order Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => previewToast()}>
                            Download Error Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => previewToast()}>
                            Download Conversation Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => previewToast()}>
                            View All Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="JourneysTable" --watchAll=false`
Expected: PASS (9 tests: 4 + 5 from `describe.each`).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/journey-dashboard/JourneysTable.jsx src/components/engage/journey-dashboard/__tests__/JourneysTable.test.jsx
git commit -m "feat(fastrr-journey): add journeys table with toggle, preview, and kebab actions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `JourneyPreviewModal`

**Files:**
- Create: `src/components/engage/journey-dashboard/JourneyPreviewModal.jsx`
- Test: `src/components/engage/journey-dashboard/__tests__/JourneyPreviewModal.test.jsx`

**Interfaces:**
- Consumes `WAIT_LABEL` from `./data` (Task 1), `previewToast` from `@/components/common/PreviewHeader`, and the existing `WhatsAppBubblePreview` (default export, prop `draft`) from `@/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview`.
- Produces `JourneyPreviewModal` (default export), props: `journey` (one journey object from `JOURNEYS`, or `null` when nothing is being previewed), `onClose()`, `onActivate(id)`. Task 4 renders this with the currently-previewed journey (or `null`).

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/journey-dashboard/__tests__/JourneyPreviewModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyPreviewModal from "../JourneyPreviewModal";
import { JOURNEYS } from "../data";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));
import { previewToast } from "@/components/common/PreviewHeader";

describe("JourneyPreviewModal", () => {
  it("renders nothing (dialog closed) when journey is null", () => {
    render(<JourneyPreviewModal journey={null} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("renders the trigger label, wait duration, and WhatsApp draft body for the given journey", () => {
    const journey = JOURNEYS.find((j) => j.id === "abandoned-cart-known");
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByText(journey.triggerLabel)).toBeInTheDocument();
    expect(screen.getByText("30 Minutes")).toBeInTheDocument();
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("you left");
  });

  it("clicking 'Edit on Engage' calls previewToast", () => {
    const journey = JOURNEYS[0];
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    fireEvent.click(screen.getByTestId("journey-preview-edit-on-engage"));
    expect(previewToast).toHaveBeenCalledTimes(1);
  });

  it("clicking 'Activate Now' calls onActivate with the journey's id", () => {
    const journey = JOURNEYS[0];
    const onActivate = jest.fn();
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={onActivate} />);
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(onActivate).toHaveBeenCalledWith(journey.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="JourneyPreviewModal" --watchAll=false`
Expected: FAIL — cannot find module `../JourneyPreviewModal`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/journey-dashboard/JourneyPreviewModal.jsx`:

```jsx
import React from "react";
import { Zap, Clock, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WhatsAppBubblePreview from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppBubblePreview";
import { previewToast } from "@/components/common/PreviewHeader";
import { WAIT_LABEL } from "./data";

export default function JourneyPreviewModal({ journey, onClose, onActivate }) {
  const open = !!journey;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="journey-preview-modal">
        {journey && (
          <>
            <DialogHeader>
              <DialogTitle>{journey.journeyType}</DialogTitle>
              <Badge variant="outline" className="w-fit">
                {journey.audience}
              </Badge>
            </DialogHeader>

            <div className="flex items-center gap-3 py-6 overflow-x-auto">
              <div
                className="w-[200px] flex-shrink-0 bg-white border-2 rounded-xl"
                style={{ borderColor: "#6C3AE8" }}
                data-testid="preview-trigger-block"
              >
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: "#6C3AE8" }}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                      Trigger
                    </div>
                    <div className="text-[12px] font-semibold text-text-primary leading-tight">
                      {journey.triggerLabel}
                    </div>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

              <div
                className="w-[140px] flex-shrink-0 bg-white border-2 rounded-lg"
                style={{ borderColor: "#64748B" }}
                data-testid="preview-wait-block"
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: "#64748B" }}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-wide font-semibold"
                      style={{ color: "#64748B" }}
                    >
                      Wait
                    </div>
                    <div className="text-[12px] font-semibold text-text-primary">{WAIT_LABEL}</div>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

              <div className="w-[240px] flex-shrink-0" data-testid="preview-whatsapp-block">
                <WhatsAppBubblePreview draft={journey.waDraft} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => previewToast()}
                data-testid="journey-preview-edit-on-engage"
              >
                Edit on Engage
              </Button>
              <Button
                type="button"
                onClick={() => onActivate(journey.id)}
                data-testid="journey-preview-activate"
              >
                Activate Now
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="JourneyPreviewModal" --watchAll=false`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/journey-dashboard/JourneyPreviewModal.jsx src/components/engage/journey-dashboard/__tests__/JourneyPreviewModal.test.jsx
git commit -m "feat(fastrr-journey): add single-view flow preview modal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `FastrrJourney` page

**Files:**
- Create: `src/pages/FastrrJourney.jsx`
- Test: `src/pages/__tests__/FastrrJourney.test.jsx`

**Interfaces:**
- Consumes `JourneyHeader` (Task 1, no props), `JourneyStatsRow` (Task 1, prop `activeCount`), `JourneysTable` (Task 2, props `journeys`/`enabledMap`/`onToggle`/`onPreview`), `JourneyPreviewModal` (Task 3, props `journey`/`onClose`/`onActivate`), and `JOURNEYS` from `@/components/engage/journey-dashboard/data`.
- Produces `FastrrJourneyPage` (default export, no props) — Task 5 registers it as the element for route `/fastrr-journey`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/FastrrJourney.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FastrrJourneyPage from "../FastrrJourney";
import { JOURNEYS } from "@/components/engage/journey-dashboard/data";

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

describe("FastrrJourneyPage", () => {
  it("renders the header, stats row, and journeys table together", () => {
    render(
      <MemoryRouter>
        <FastrrJourneyPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-fastrr-journey")).toBeInTheDocument();
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrJourney" --watchAll=false`
Expected: FAIL — cannot find module `../FastrrJourney`.

- [ ] **Step 3: Write minimal implementation**

Create `src/pages/FastrrJourney.jsx`:

```jsx
import React, { useState } from "react";
import JourneyHeader from "@/components/engage/journey-dashboard/JourneyHeader";
import JourneyStatsRow from "@/components/engage/journey-dashboard/JourneyStatsRow";
import JourneysTable from "@/components/engage/journey-dashboard/JourneysTable";
import JourneyPreviewModal from "@/components/engage/journey-dashboard/JourneyPreviewModal";
import { JOURNEYS } from "@/components/engage/journey-dashboard/data";

export default function FastrrJourneyPage() {
  const [enabledMap, setEnabledMap] = useState({});
  const [previewId, setPreviewId] = useState(null);

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
    <div className="min-h-screen bg-app-bg" data-testid="page-fastrr-journey">
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
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrJourney" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/FastrrJourney.jsx src/pages/__tests__/FastrrJourney.test.jsx
git commit -m "feat(fastrr-journey): add the dashboard page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Redirect Meta Embedded Signup's Finish + add the route

**Files:**
- Modify: `src/pages/MetaEmbeddedSignup.jsx`
- Modify: `src/pages/__tests__/MetaEmbeddedSignup.test.jsx`
- Modify: `src/App.js`

**Interfaces:**
- Consumes `FastrrJourneyPage` (Task 4, default export, no props).
- Modifies `MetaEmbeddedSignup.jsx`'s `handleFinish` per the Global Constraints' exact logic.

- [ ] **Step 1: Write the failing tests**

Modify `src/pages/__tests__/MetaEmbeddedSignup.test.jsx`: add the `react-router-dom` mock (this file currently has none — `MetaEmbeddedSignup.jsx` doesn't yet import `useNavigate`), replace the final assertion of the existing "reaches the success step..." test (it currently expects `window.close()`, which is no longer what happens when there is no `window.opener`), and add one new test for the with-opener path. Read the current file first, then apply this diff:

At the top, after the existing imports, add:

```jsx
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);
```

In the existing `beforeEach(() => { window.localStorage.clear(); });`, add a line to also clear the mock:

```jsx
beforeEach(() => {
  window.localStorage.clear();
  mockNavigate.mockClear();
});
```

Replace the existing test:

```jsx
  it("reaches the success step after email verify, back in the Meta top bar chrome, and Finish closes the window", () => {
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => {});
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(screen.getByTestId("success-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("success-finish"));
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();
    jest.useRealTimers();
  });
```

with:

```jsx
  it("reaches the success step after email verify, back in the Meta top bar chrome, and Finish (no opener) navigates to /fastrr-journey", () => {
    jest.useFakeTimers();
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-continue"));
    fireEvent.click(screen.getByTestId("phone-number-next"));
    fireEvent.click(screen.getByTestId("verify-phone-next"));
    fireEvent.click(screen.getByTestId("select-assets-next"));
    fireEvent.click(screen.getByTestId("business-info-next"));
    jest.advanceTimersByTime(1500);
    fireEvent.click(screen.getByTestId("email-verify-next"));
    expect(screen.getByTestId("success-step")).toBeInTheDocument();
    expect(screen.getByTestId("meta-top-bar-chrome")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("success-finish"));
    expect(mockNavigate).toHaveBeenCalledWith("/fastrr-journey");
    jest.useRealTimers();
  });

  it("Finish (with an opener) redirects the opener tab and closes this popup", () => {
    const closeSpy = jest.spyOn(window, "close").mockImplementation(() => {});
    const fakeOpener = { location: { href: "" } };
    jest.spyOn(window, "opener", "get").mockReturnValue(fakeOpener);
    render(<MetaEmbeddedSignup />);
    fireEvent.click(screen.getByTestId("intro-cancel"));
    expect(fakeOpener.location.href).toBe("/fastrr-journey");
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();
  });
```

(`intro-cancel` also calls `handleFinish` — using it here is a fast, direct path to exercise the with-opener branch without walking the whole wizard again.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="pages/__tests__/MetaEmbeddedSignup" --watchAll=false`
Expected: FAIL — `mockNavigate`/`window.opener` assertions fail against the current `handleFinish` (`window.close()` only, no `useNavigate` import).

- [ ] **Step 3: Write the implementation**

Modify `src/pages/MetaEmbeddedSignup.jsx`:

1. Add the import (after the `flushSync` import):

```js
import { useNavigate } from "react-router-dom";
```

2. Inside `export default function MetaEmbeddedSignup()`, add the navigate hook alongside the existing state:

```js
const navigate = useNavigate();
```

3. Replace:

```js
  const handleFinish = useCallback(() => {
    window.close();
  }, []);
```

with:

```js
  const handleFinish = useCallback(() => {
    if (window.opener) {
      window.opener.location.href = "/fastrr-journey";
      window.close();
    } else {
      navigate("/fastrr-journey");
    }
  }, [navigate]);
```

Modify `src/App.js`:

1. Add the import near the other Engage imports (after `import MetaEmbeddedSignup from "@/pages/MetaEmbeddedSignup";`):

```js
import FastrrJourneyPage from "@/pages/FastrrJourney";
```

2. Add the new route immediately after the existing `<Route path="/engage/meta-embedded-signup" .../>` sibling route, still before `</Routes>`:

```jsx
<Route path="/fastrr-journey" element={<FastrrJourneyPage />} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="pages/__tests__/MetaEmbeddedSignup" --watchAll=false`
Expected: PASS (all 7 tests: the 5 pre-existing + the 2 new/replaced).

- [ ] **Step 5: Run the full test suite and the CI-mode build to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All previously-passing tests still pass, plus every new test from Tasks 1-5. This repo has a known, pre-existing, unrelated baseline of exactly 3 failing suites (`campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`) — those are expected to still fail; nothing else should.

Run: `CI=true npm run build`
Expected: `Compiled successfully.` (Vercel's build runs with `CI=true`, which turns ESLint warnings into errors — this must be clean.)

- [ ] **Step 6: Commit**

```bash
git add src/pages/MetaEmbeddedSignup.jsx src/pages/__tests__/MetaEmbeddedSignup.test.jsx src/App.js
git commit -m "feat(fastrr-journey): redirect signup Finish to the journey dashboard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Files/routing (sibling route, no sidebar entry, own compact header) ✅ Tasks 1, 4, 5; KPI row with per-card zero-state micro-copy and dynamic active count ✅ Task 1, 4; 6-journey table with exact tooltip/audience copy, `—`/`0` metric behavior, toggle + preview + kebab actions ✅ Task 2; single-view preview modal (Start Trigger → Wait 30min → WhatsApp bubble, Edit on Engage + Activate Now) ✅ Task 3; popup hand-off (opener redirect + close, or self-navigate fallback) ✅ Task 5; `previewToast()` convention for not-wired actions ✅ Tasks 2, 3.
- **Placeholder scan:** No "TBD"/"implement later" — every deferred item is explicitly listed in the spec's Open Items and out of this plan's scope, not a gap within it.
- **Type/name consistency:** `JOURNEYS`' 6 objects' shape (`id`, `journeyType`, `audience`, `tooltip`, `triggerLabel`, `waDraft`) is defined once in Task 1 and consumed with those exact field names in Tasks 2, 3, 4. `JourneysTable`'s props (`journeys`, `enabledMap`, `onToggle`, `onPreview`) and `JourneyPreviewModal`'s props (`journey`, `onClose`, `onActivate`) are each defined once and passed with those exact names from `FastrrJourney.jsx` in Task 4. All `data-testid` values (`journey-header`, `journey-wallet-pill`, `journey-wallet-balance`, `journey-recharge-link`, `journey-profile-icon`, `journey-open-engage-link`, `journey-stats-row`, `journey-stat-{active,revenue,deliverability,users,roi}`, `journeys-table`, `journey-row-{id}`, `journey-toggle-{id}`, `journey-preview-{id}`, `journey-menu-{id}`, `journey-preview-modal`, `preview-trigger-block`, `preview-wait-block`, `preview-whatsapp-block`, `journey-preview-edit-on-engage`, `journey-preview-activate`, `page-fastrr-journey`) are each defined once and referenced identically wherever consumed across tasks.
