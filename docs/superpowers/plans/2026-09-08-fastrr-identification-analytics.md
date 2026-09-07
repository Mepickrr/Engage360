# Fastrr Identification Analytics Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Fastrr Identification" tab to `src/pages/Analytics.jsx` (between Journey and Reports) that reports on Fastrr shopper-identification, backed entirely by deterministic mock data, covering the 8 PRD sections plus 2 approved extras (Top Identified Users, Repeat-purchase cohort).

**Architecture:** One new directory, `src/components/analytics/fastrr/`, holding a tab shell (owns filter state), a section-local filter bar, a scroll-spy anchor nav, one mock-data generator, a handful of new shared chart/table primitives, and one component per PRD section. Reuses `MetricCard`/`SplitBarChart`/`ComparisonLineChart` from `src/components/analytics/overview/` and extends `src/lib/analyticsFormat.js`. No new routes — `/analytics/:tab` already resolves any tab value.

**Tech Stack:** React (JS, not TS — this repo is JS/JSX throughout; the PRD's "React + TypeScript" assumption doesn't match and is not adopted here), Tailwind CSS with this repo's existing CSS-variable tokens (`bg-surface`, `border-border`, `text-text-primary/secondary/muted`, `bg-primary`/`bg-primary-tint`/`text-primary`) — not the PRD's raw hex codes, Recharts (already a dependency), Jest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-08-fastrr-identification-analytics-design.md` (and the pasted PRD it implements, `fastrr-identification-analytics-claude-code-prompt.md`)

## Global Constraints

- Desktop-only, no mobile breakpoint (PRD §8 / §3).
- Single continuous scroll inside the tab — no tabs/sub-tabs inside this tab's content; navigation is the sticky `AnchorNav` only (PRD §4).
- Every section shows a visible "Powered by [source]" label, muted, bottom-right of its header, each `TODO: confirm source system` at its definition site (PRD §4).
- Every KPI number's delta chip is gated by the `compare` toggle — hidden (not zero) when compare is off.
- Attribution (Last-Click / First-Click-Open) is always shown side by side via `AttributionPair` — never a toggle (PRD §4).
- Loading = per-section skeleton shimmer (`SectionSkeleton`), never a full-page spinner. Empty = per-section centered message (`SectionEmptyState`) with the exact copy "No data for this range/channel yet — try widening the date range or switching channels." (PRD §4).
- §2 funnel stages are all computed against the same denominator (Total Sessions) — connected funnel visual only, with a `TODO: confirm all funnel stages share a common denominator before enabling connected funnel visual` comment left for real-data wiring (PRD §2).
- §8 identification source list is fixed and exact: `Smart Card, Checkout, Pop-up, Cookie, Signup`, sorted descending by %.
- §3 AI Calling has no Read/Click concept — rendered as its own small `Calls Placed → Connected → Completed → Action Taken` funnel card, never forced into the Sent/Delivered/Read/Clicked grouped bar.
- All channel comparisons use grouped bars, never stacked.
- §5 segment cards lead with rates (repeat rate, engagement rate); raw counts are shown small/secondary underneath, never as the primary number.
- **Scoping decision (this plan, not a PRD gap):** the channel filter narrows only communication-centric sections — Engagement (§3), Conversion & ROI (§4, including its Top Journeys table and Trigger split), and the "Sent/Delivered/Read/Clicked" trend chart in §7. It does **not** alter identification-only sections (Hero §1, Funnel §2, Segment Comparison §5, Smart Card §6, Source Breakdown §8) — those describe on-site identification/segment behavior, not messaging channel, so channel-conditioning them would fabricate a relationship that doesn't exist.
- **Simplification (documented, not silent):** `FastrrFilterBar`'s date presets are `Today / Yesterday / Last 7 Days / This Month / Last Month` — no "Custom Range" in v1 (the calendar-based custom-range flow already exists on `TimeRangeFilter`/`LogsFilterBar`; adding it here later is the same pattern, just not built now).
- ROI channel costs are estimates, labeled `(estimated)`, each `TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message)`.
- One specific, documented filter combo — `channel: "AI Calling"` + `datePreset: "today"` — deterministically returns empty data for the Engagement and Conversion & ROI sections only, so `SectionEmptyState` is actually reachable in the running prototype.
- Mock data generation is deterministic: no `Math.random`, no `Date.now` inside the generator (an FNV-1a string hash of `datePreset|channel` seeds every number), so the same filters always produce the same output — required for the cross-section consistency tests in Task 2.

---

## Task 1: `analyticsFormat.js` — add `formatPercent` and `formatSeconds`

**Files:**
- Modify: `src/lib/analyticsFormat.js`
- Test: `src/lib/__tests__/analyticsFormat.test.js` (append to existing file)

**Interfaces:**
- Produces: `formatPercent(value: number, digits = 1): string` → `"26.3%"`. `formatSeconds(value: number): string` → `"2m 5s"` (or `"45s"` when under a minute).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/analyticsFormat.test.js`:

```js
import { formatCompactCurrency, formatCompactNumber, formatDelta, formatPercent, formatSeconds } from "../analyticsFormat";

describe("formatPercent", () => {
  test("formats with one decimal by default", () => {
    expect(formatPercent(26.345)).toBe("26.3%");
  });
  test("respects a custom digit count", () => {
    expect(formatPercent(26.345, 0)).toBe("26%");
  });
});

describe("formatSeconds", () => {
  test("formats sub-minute durations as seconds only", () => {
    expect(formatSeconds(45)).toBe("45s");
  });
  test("formats minutes and seconds", () => {
    expect(formatSeconds(125)).toBe("2m 5s");
  });
  test("rounds fractional seconds before formatting", () => {
    expect(formatSeconds(59.6)).toBe("1m 0s");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="analyticsFormat" --watchAll=false`
Expected: FAIL — `formatPercent`/`formatSeconds` are not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/analyticsFormat.js`:

```js
export function formatPercent(value, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatSeconds(value) {
  const totalSeconds = Math.round(value);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="analyticsFormat" --watchAll=false`
Expected: PASS, all tests in the file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyticsFormat.js src/lib/__tests__/analyticsFormat.test.js
git commit -m "feat(analytics): add formatPercent and formatSeconds helpers"
```

---

## Task 2: Mock data generator — foundation, Hero + Funnel

**Files:**
- Create: `src/components/analytics/fastrr/data/mockFastrrIdentification.js`
- Test: `src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js`

**Interfaces:**
- Produces:
  - `FASTRR_CHANNELS = ["All", "WhatsApp", "Email", "SMS", "RCS", "AI Calling"]`
  - `FASTRR_DATE_PRESETS = ["today", "yesterday", "last_7_days", "this_month", "last_month"]`
  - `getFastrrIdentificationAnalytics({ datePreset, channel, compare }): FastrrAnalytics` — this task establishes the `hero` and `funnel` keys of the returned object (later tasks add the rest to the same object, in the same file).
  - `hero: { totalSessions: {value, deltaPct, deltaAbs}, identifiedSessions: {value, deltaPct, deltaAbs}, identificationRate: {value, deltaPct, deltaAbs}, benchmark: {yourStore, allFastrrStores, categoryAvg}, gmv: {lastClick, firstClick}, freshness: {intervalMinutes, lastRefreshed} }`
  - `funnel: { stages: [{key, label, count}] (5 entries: totalSessions, identifiedSessions, checkoutInitiated, checkoutSso, orderPlaced), dropoffByPage: [{page, count}] (Homepage/PDP/Cart/Checkout) }`
  - Invariant (depended on by Task 12's Hero test and Task 13's Funnel test): `funnel.stages[0].count === hero.totalSessions.value` and `funnel.stages[1].count === hero.identifiedSessions.value`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js`:

```js
import { getFastrrIdentificationAnalytics, FASTRR_CHANNELS, FASTRR_DATE_PRESETS } from "../mockFastrrIdentification";

function everyCombo(fn) {
  for (const datePreset of FASTRR_DATE_PRESETS) {
    for (const channel of FASTRR_CHANNELS) {
      fn(getFastrrIdentificationAnalytics({ datePreset, channel, compare: true }), datePreset, channel);
    }
  }
}

describe("getFastrrIdentificationAnalytics — hero + funnel", () => {
  test("is deterministic for the same filters", () => {
    const a = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const b = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(a.hero.totalSessions.value).toBe(b.hero.totalSessions.value);
    expect(a.funnel.stages).toEqual(b.funnel.stages);
  });

  test("hero identified sessions always matches the funnel's identified stage", () => {
    everyCombo((data) => {
      expect(data.funnel.stages[1].count).toBe(data.hero.identifiedSessions.value);
      expect(data.funnel.stages[0].count).toBe(data.hero.totalSessions.value);
    });
  });

  test("identification rate is consistent with total/identified sessions", () => {
    everyCombo((data) => {
      const expected = (data.hero.identifiedSessions.value / data.hero.totalSessions.value) * 100;
      expect(data.hero.identificationRate.value).toBeCloseTo(expected, 5);
    });
  });

  test("benchmark yourStore always equals the identification rate", () => {
    everyCombo((data) => {
      expect(data.hero.benchmark.yourStore).toBeCloseTo(data.hero.identificationRate.value, 5);
    });
  });

  test("funnel stage counts never increase down the funnel", () => {
    everyCombo((data) => {
      const counts = data.funnel.stages.map((s) => s.count);
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
      }
    });
  });

  test("funnel has exactly 5 stages in the documented order", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.funnel.stages.map((s) => s.key)).toEqual([
      "totalSessions", "identifiedSessions", "checkoutInitiated", "checkoutSso", "orderPlaced",
    ]);
  });

  test("dropoffByPage covers exactly Homepage, PDP, Cart, Checkout", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.funnel.dropoffByPage.map((d) => d.page)).toEqual(["Homepage", "PDP", "Cart", "Checkout"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/data/mockFastrrIdentification.js`:

```js
// Deterministic mock data for the Analytics > Fastrr Identification tab.
// No live data — every number is derived from an FNV-1a hash of the
// (datePreset, channel) pair, so output is stable across renders and
// re-imports. No Math.random / Date.now anywhere in this file.
//
// Scoping decision: the `channel` filter only narrows communication-centric
// sections (engagement, conversionRoi, and the trends.messagingFunnel
// chart added in later tasks). It intentionally does not alter
// identification-only sections (hero, funnel, segmentComparison,
// smartCard, sourceBreakdown) — those describe on-site identification
// behavior, not messaging channel.

export const FASTRR_CHANNELS = ["All", "WhatsApp", "Email", "SMS", "RCS", "AI Calling"];
export const FASTRR_DATE_PRESETS = ["today", "yesterday", "last_7_days", "this_month", "last_month"];

function hashKey(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function baseSeed(datePreset, channel) {
  return hashKey(`${datePreset}|${channel}`);
}

function buildHeroAndFunnel(datePreset, channel) {
  const seed = baseSeed(datePreset, channel);

  const totalSessions = 40000 + (seed % 60000);
  const identificationRateFraction = 0.15 + ((seed >> 3) % 15) / 100; // 15%-30%
  const identifiedSessions = Math.round(totalSessions * identificationRateFraction);
  const checkoutInitiated = Math.round(identifiedSessions * 0.42);
  const checkoutSso = Math.round(checkoutInitiated * 0.68);
  const orderPlaced = Math.round(checkoutSso * 0.71);

  const deltaPct = ((seed >> 5) % 20) - 4; // -4 .. +15
  const identificationRateValue = identificationRateFraction * 100;

  const hero = {
    totalSessions: { value: totalSessions, deltaPct, deltaAbs: Math.round(totalSessions * (deltaPct / 100)) },
    identifiedSessions: {
      value: identifiedSessions,
      deltaPct: deltaPct + 1,
      deltaAbs: Math.round(identifiedSessions * ((deltaPct + 1) / 100)),
    },
    identificationRate: {
      value: identificationRateValue,
      deltaPct: (seed >> 7) % 10 - 3,
      deltaAbs: 0,
    },
    benchmark: {
      yourStore: identificationRateValue,
      allFastrrStores: 19.2,
      categoryAvg: 17.3,
    },
    gmv: {
      lastClick: 2000000 + (seed % 4000000),
      firstClick: 2600000 + (seed % 5200000),
    },
    freshness: {
      intervalMinutes: 15,
      lastRefreshed: new Date(Date.UTC(2026, 8, 8, 6, 0, 0)).toISOString(),
    },
  };

  const funnel = {
    stages: [
      { key: "totalSessions", label: "Total Sessions", count: totalSessions },
      { key: "identifiedSessions", label: "Identified Sessions", count: identifiedSessions },
      { key: "checkoutInitiated", label: "Checkout Initiated", count: checkoutInitiated },
      { key: "checkoutSso", label: "Checkout (Smart Card / SSO)", count: checkoutSso },
      { key: "orderPlaced", label: "Order Placed", count: orderPlaced },
    ],
    dropoffByPage: [
      { page: "Homepage", count: Math.round((identifiedSessions - checkoutInitiated) * 0.45) },
      { page: "PDP", count: Math.round((identifiedSessions - checkoutInitiated) * 0.3) },
      { page: "Cart", count: Math.round((identifiedSessions - checkoutInitiated) * 0.15) },
      { page: "Checkout", count: Math.round((identifiedSessions - checkoutInitiated) * 0.1) },
    ],
  };

  return { hero, funnel, seed };
}

export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel } = buildHeroAndFunnel(datePreset, channel);
  return { hero, funnel };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/data/mockFastrrIdentification.js src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js
git commit -m "feat(analytics): add Fastrr Identification mock data — hero + funnel"
```

---

## Task 3: Mock data generator — Engagement + Conversion & ROI

**Files:**
- Modify: `src/components/analytics/fastrr/data/mockFastrrIdentification.js`
- Modify: `src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js`

**Interfaces:**
- Consumes: `baseSeed(datePreset, channel)`, `hashKey` (from Task 2, same file).
- Produces (added to the same returned object):
  - `engagement: { isEmpty, funnel: {sent, delivered, read, clicked}, readRate, clickRate, byChannel: [{label, sent, delivered, read, clicked}] (WhatsApp/Email/SMS/RCS — never "AI Calling"), aiCalling: {callsPlaced, callsConnected, callsCompleted, actionTaken} }`
  - `conversionRoi: { isEmpty, byChannel: [{label, orders, revenue, aov, roi}] (WhatsApp/Email/SMS/RCS/AI Calling), roiFormulaNote, attribution: {lastClick, firstClick}, topJourneys: [{id, name, channels, triggerEvent, sent, delivered, orders, revenue, roi, aov, uniqueCustomers}] (12 rows), triggerSplit: [{trigger, revenue}] (Product View/Add-to-Cart/Cart Abandon/Other) }`
  - Invariant: when `channel === "AI Calling" && datePreset === "today"`, `engagement.isEmpty === true` and `conversionRoi.isEmpty === true`, and both sections' numeric fields are zero/empty arrays.

- [ ] **Step 1: Write the failing tests**

Append to `mockFastrrIdentification.test.js`:

```js
describe("getFastrrIdentificationAnalytics — engagement + conversionRoi", () => {
  test("engagement byChannel never includes AI Calling", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.engagement.byChannel.map((c) => c.label)).not.toContain("AI Calling");
    expect(data.engagement.byChannel).toHaveLength(4);
  });

  test("read rate and click rate are derived from delivered", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const { sent, delivered, read, clicked } = data.engagement.funnel;
    expect(data.engagement.readRate).toBeCloseTo((read / delivered) * 100, 5);
    expect(data.engagement.clickRate).toBeCloseTo((clicked / delivered) * 100, 5);
    expect(delivered).toBeLessThanOrEqual(sent);
    expect(read).toBeLessThanOrEqual(delivered);
    expect(clicked).toBeLessThanOrEqual(read);
  });

  test("conversionRoi.byChannel includes all 5 channels", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.byChannel.map((c) => c.label).sort()).toEqual(
      ["AI Calling", "Email", "RCS", "SMS", "WhatsApp"]
    );
  });

  test("topJourneys has 12 rows with unique ids", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.topJourneys).toHaveLength(12);
    expect(new Set(data.conversionRoi.topJourneys.map((j) => j.id)).size).toBe(12);
  });

  test("triggerSplit covers exactly Product View, Add-to-Cart, Cart Abandon, Other", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.triggerSplit.map((t) => t.trigger)).toEqual([
      "Product View", "Add-to-Cart", "Cart Abandon", "Other",
    ]);
  });

  test("AI Calling + today is empty for engagement and conversionRoi only", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "today", channel: "AI Calling", compare: true });
    expect(data.engagement.isEmpty).toBe(true);
    expect(data.engagement.funnel).toEqual({ sent: 0, delivered: 0, read: 0, clicked: 0 });
    expect(data.engagement.byChannel).toEqual([]);
    expect(data.conversionRoi.isEmpty).toBe(true);
    expect(data.conversionRoi.byChannel).toEqual([]);
    expect(data.conversionRoi.topJourneys).toEqual([]);
    // hero/funnel are unaffected by channel — documented scoping decision
    expect(data.hero.totalSessions.value).toBeGreaterThan(0);
  });

  test("other datePreset+channel combos are never empty", () => {
    expect(getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true }).engagement.isEmpty).toBe(false);
    expect(getFastrrIdentificationAnalytics({ datePreset: "today", channel: "WhatsApp", compare: true }).engagement.isEmpty).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: FAIL — `engagement`/`conversionRoi` are undefined.

- [ ] **Step 3: Implement**

In `mockFastrrIdentification.js`, add above `getFastrrIdentificationAnalytics`:

```js
const MESSAGING_CHANNELS = ["WhatsApp", "Email", "SMS", "RCS"];
const CHANNEL_SHARE = { WhatsApp: 0.46, Email: 0.19, SMS: 0.14, RCS: 0.09, "AI Calling": 0.12 };
const CHANNEL_COST_PER_MSG = { WhatsApp: 0.35, Email: 0.05, SMS: 0.12, RCS: 0.28 }; // (estimated)
const AI_CALLING_COST_PER_MIN = 1.5; // (estimated)

const JOURNEY_NAMES = [
  "Abandoned Cart Recovery", "Post-Purchase Upsell", "Welcome Series", "COD Confirmation",
  "Win-Back 30d", "Price Drop Alert", "Back in Stock", "Review Request",
  "Delivery Update", "Cashback Reminder", "Browse Abandonment", "VIP Early Access",
];
const TRIGGER_EVENTS = ["Product View", "Add-to-Cart", "Cart Abandon", "Order Placed"];

function isEmptyCombo(datePreset, channel) {
  return channel === "AI Calling" && datePreset === "today";
}

function buildEngagement(datePreset, channel, seed) {
  if (isEmptyCombo(datePreset, channel)) {
    return {
      isEmpty: true,
      funnel: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      readRate: 0,
      clickRate: 0,
      byChannel: [],
      aiCalling: { callsPlaced: 0, callsConnected: 0, callsCompleted: 0, actionTaken: 0 },
    };
  }

  const totalSent = 80000 + (seed % 120000);
  const scaledSent = channel === "All" ? totalSent : Math.round(totalSent * (CHANNEL_SHARE[channel] ?? 1));
  const delivered = Math.round(scaledSent * 0.94);
  const read = Math.round(delivered * (0.4 + ((seed >> 2) % 20) / 100));
  const clicked = Math.round(read * (0.18 + ((seed >> 4) % 12) / 100));

  const byChannel = channel === "All" || channel === "AI Calling"
    ? MESSAGING_CHANNELS.map((label, i) => {
        const chSent = Math.round(totalSent * CHANNEL_SHARE[label]);
        const chDelivered = Math.round(chSent * 0.94);
        const chRead = Math.round(chDelivered * (0.35 + i * 0.05));
        const chClicked = Math.round(chRead * (0.15 + i * 0.02));
        return { label, sent: chSent, delivered: chDelivered, read: chRead, clicked: chClicked };
      })
    : [{
        label: channel,
        sent: scaledSent,
        delivered,
        read,
        clicked,
      }];

  const callsPlaced = 5000 + (seed % 8000);
  const callsConnected = Math.round(callsPlaced * 0.62);
  const callsCompleted = Math.round(callsConnected * 0.81);
  const actionTaken = Math.round(callsCompleted * 0.44);

  return {
    isEmpty: false,
    funnel: { sent: scaledSent, delivered, read, clicked },
    readRate: (read / delivered) * 100,
    clickRate: (clicked / delivered) * 100,
    byChannel,
    aiCalling: { callsPlaced, callsConnected, callsCompleted, actionTaken },
  };
}

function roiFor(revenue, cost) {
  return cost > 0 ? (revenue - cost) / cost * 100 / 100 : 0; // expressed as an X multiplier
}

function buildConversionRoi(datePreset, channel, seed) {
  if (isEmptyCombo(datePreset, channel)) {
    return {
      isEmpty: true,
      byChannel: [],
      roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated). TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message).",
      attribution: { lastClick: 0, firstClick: 0 },
      topJourneys: [],
      triggerSplit: [],
    };
  }

  const allChannels = [...MESSAGING_CHANNELS, "AI Calling"];
  const byChannel = allChannels.map((label, i) => {
    const share = CHANNEL_SHARE[label];
    const orders = Math.round((1200 + (seed % 3000)) * share * 3);
    const revenue = orders * (900 + ((seed >> i) % 700));
    const aov = Math.round(revenue / orders);
    const cost = label === "AI Calling"
      ? (500 + (seed % 900)) * AI_CALLING_COST_PER_MIN
      : orders * 8 * CHANNEL_COST_PER_MSG[label];
    const roi = cost > 0 ? (revenue - cost) / cost : 0;
    return { label, orders, revenue, aov, roi };
  });

  const topJourneys = JOURNEY_NAMES.map((name, i) => {
    const sent = 4000 + ((seed + i * 977) % 20000);
    const delivered = Math.round(sent * 0.93);
    const orders = Math.round(delivered * (0.02 + (i % 5) * 0.01));
    const revenue = orders * (700 + (i * 137) % 1200);
    const cost = delivered * 0.3;
    const aov = orders > 0 ? Math.round(revenue / orders) : 0;
    return {
      id: `journey-${i + 1}`,
      name,
      channels: [MESSAGING_CHANNELS[i % MESSAGING_CHANNELS.length]],
      triggerEvent: TRIGGER_EVENTS[i % TRIGGER_EVENTS.length],
      sent, delivered, orders, revenue, aov,
      roi: cost > 0 ? (revenue - cost) / cost : 0,
      uniqueCustomers: Math.round(orders * 0.86),
    };
  });

  const triggerSplit = [
    { trigger: "Product View", revenue: 800000 + (seed % 400000) },
    { trigger: "Add-to-Cart", revenue: 1200000 + (seed % 600000) },
    { trigger: "Cart Abandon", revenue: 1500000 + (seed % 900000) },
    { trigger: "Other", revenue: 300000 + (seed % 150000) },
  ];

  return {
    isEmpty: false,
    byChannel,
    roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated). TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message).",
    attribution: { lastClick: 3200000 + (seed % 2000000), firstClick: 4100000 + (seed % 2600000) },
    topJourneys,
    triggerSplit,
  };
}
```

Then update `getFastrrIdentificationAnalytics`:

```js
export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel, seed } = buildHeroAndFunnel(datePreset, channel);
  const engagement = buildEngagement(datePreset, channel, seed);
  const conversionRoi = buildConversionRoi(datePreset, channel, seed);
  return { hero, funnel, engagement, conversionRoi };
}
```

(Note: `buildHeroAndFunnel` must return `seed` alongside `hero`/`funnel` — it already does from Task 2.)

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/data/mockFastrrIdentification.js src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js
git commit -m "feat(analytics): add Fastrr Identification mock data — engagement + conversion/ROI"
```

---

## Task 4: Mock data generator — Segment Comparison (+ extras)

**Files:**
- Modify: `src/components/analytics/fastrr/data/mockFastrrIdentification.js`
- Modify: `src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js`

**Interfaces:**
- Produces: `segmentComparison: { segments: [{key, label, orders, revenue, aov, repeatRate, engagementRate}] (known/fastrrIdentified/anonymous, in that order), growthTrend: [{period, conversionRate}] (6 points), topIdentifiedUsers: [{id, name, identifiedOn, ltv}] (5 rows), repeatCohort: [{week, fastrrIdentified, known}] (5 points, W0-W4) }`

- [ ] **Step 1: Write the failing tests**

Append to `mockFastrrIdentification.test.js`:

```js
describe("getFastrrIdentificationAnalytics — segmentComparison", () => {
  test("segments are known, fastrrIdentified, anonymous in that order", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.segments.map((s) => s.key)).toEqual(["known", "fastrrIdentified", "anonymous"]);
  });

  test("every segment has a repeat rate and engagement rate under 100", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    data.segmentComparison.segments.forEach((s) => {
      expect(s.repeatRate).toBeGreaterThan(0);
      expect(s.repeatRate).toBeLessThanOrEqual(100);
      expect(s.engagementRate).toBeGreaterThan(0);
      expect(s.engagementRate).toBeLessThanOrEqual(100);
    });
  });

  test("growthTrend has 6 points and topIdentifiedUsers has 5 unique rows", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.growthTrend).toHaveLength(6);
    expect(data.segmentComparison.topIdentifiedUsers).toHaveLength(5);
    expect(new Set(data.segmentComparison.topIdentifiedUsers.map((u) => u.id)).size).toBe(5);
  });

  test("repeatCohort covers W0 through W4", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.repeatCohort.map((c) => c.week)).toEqual(["W0", "W1", "W2", "W3", "W4"]);
  });

  test("segmentComparison is unaffected by channel — identification-only section", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withWa = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "WhatsApp", compare: true });
    expect(withAll.segmentComparison).toEqual(withWa.segmentComparison);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: FAIL — `segmentComparison` undefined.

- [ ] **Step 3: Implement**

In `mockFastrrIdentification.js`, add:

```js
const IDENTIFIED_USER_NAMES = ["Ritika Desai", "Manav Shah", "Ishaan Kapoor", "Simran Kaur", "Aarav Joshi"];

function buildSegmentComparison(seed) {
  const segments = [
    { key: "known", label: "Known", orders: 9200 + (seed % 3000), revenue: 0, aov: 0, repeatRate: 38 + (seed % 10), engagementRate: 61 + (seed % 8) },
    { key: "fastrrIdentified", label: "Fastrr-Identified", orders: 4100 + (seed % 2000), revenue: 0, aov: 0, repeatRate: 29 + (seed % 10), engagementRate: 54 + (seed % 8) },
    { key: "anonymous", label: "Anonymous", orders: 1200 + (seed % 800), revenue: 0, aov: 0, repeatRate: 6 + (seed % 4), engagementRate: 11 + (seed % 5) },
  ].map((seg, i) => {
    const aov = 850 + ((seed >> i) % 900);
    return { ...seg, aov, revenue: seg.orders * aov };
  });

  const growthTrend = Array.from({ length: 6 }, (_, i) => ({
    period: `Wk ${i + 1}`,
    conversionRate: 4 + i * 0.6 + ((seed >> i) % 3) * 0.2,
  }));

  const topIdentifiedUsers = IDENTIFIED_USER_NAMES.map((name, i) => ({
    id: `top-user-${i + 1}`,
    name,
    identifiedOn: `0${(i % 9) + 1} Sep 2026`,
    ltv: 8000 + ((seed + i * 613) % 40000),
  }));

  const repeatCohort = ["W0", "W1", "W2", "W3", "W4"].map((week, i) => ({
    week,
    fastrrIdentified: Math.max(0, 22 - i * 4 + ((seed >> i) % 3)),
    known: Math.max(0, 30 - i * 4 + ((seed >> i) % 3)),
  }));

  return { segments, growthTrend, topIdentifiedUsers, repeatCohort };
}
```

Update `getFastrrIdentificationAnalytics` (channel-agnostic — uses `seed` from Hero, ignores `channel` per the documented scoping decision):

```js
export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel, seed } = buildHeroAndFunnel(datePreset, channel);
  const engagement = buildEngagement(datePreset, channel, seed);
  const conversionRoi = buildConversionRoi(datePreset, channel, seed);
  const segmentComparison = buildSegmentComparison(seed);
  return { hero, funnel, engagement, conversionRoi, segmentComparison };
}
```

Wait — `seed` must be identical regardless of `channel` for `segmentComparison`'s test ("unaffected by channel") to pass, but `buildHeroAndFunnel`'s `seed` is `baseSeed(datePreset, channel)`, which **does** vary by channel. Fix: derive a second, channel-independent seed for identification-only sections.

Add near the top of the file:

```js
function identificationSeed(datePreset) {
  return hashKey(`identification|${datePreset}`);
}
```

And change the call site:

```js
const segmentComparison = buildSegmentComparison(identificationSeed(datePreset));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: PASS, all tests including the channel-independence one.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/data/mockFastrrIdentification.js src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js
git commit -m "feat(analytics): add Fastrr Identification mock data — segment comparison + extras"
```

---

## Task 5: Mock data generator — Smart Card + Trends + Source Breakdown (completes the generator)

**Files:**
- Modify: `src/components/analytics/fastrr/data/mockFastrrIdentification.js`
- Modify: `src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js`

**Interfaces:**
- Consumes: `identificationSeed(datePreset)` (Task 4), `baseSeed`/`hashKey`, `CHANNEL_SHARE`, `MESSAGING_CHANNELS`, `isEmptyCombo` (Task 3).
- Produces:
  - `smartCard: { autofillTriggerRate, acceptanceRate, fieldEditRates: [{field, editRate}] (Name/Phone/Address/Pincode), checkoutTimeSeconds: {smartCard, manual}, conversionRate: {smartCard, standard}, dropoffByStep: [{step, withSmartCard, withoutSmartCard}] }` — channel-agnostic (uses `identificationSeed`).
  - `trends: { identificationRate: TrendSeries, messagingFunnel: TrendSeries, ordersRevenue: TrendSeries, repeatOrders: TrendSeries }` where `TrendSeries = { day: [...], week: [...], deltaPct }`. `identificationRate`/`repeatOrders` points are `{period, value}`; `messagingFunnel` points are `{period, sent, delivered, read, clicked}`; `ordersRevenue` points are `{period, orders, revenue}`. `messagingFunnel` and `ordersRevenue` are the two channel-affected trend series (per the Global Constraints scoping decision); `identificationRate`/`repeatOrders` are channel-agnostic.
  - `sourceBreakdown: { sources: [{source, pct}] (exactly Smart Card/Checkout/Pop-up/Cookie/Signup, sorted desc by pct), deviceSplit: [{device, pct}] (Web (Desktop)/Web (Mobile)/App) }` — channel-agnostic.

- [ ] **Step 1: Write the failing tests**

Append to `mockFastrrIdentification.test.js`:

```js
describe("getFastrrIdentificationAnalytics — smartCard + trends + sourceBreakdown", () => {
  test("smartCard rates are within 0-100 and channel-agnostic", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withSms = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "SMS", compare: true });
    expect(withAll.smartCard).toEqual(withSms.smartCard);
    expect(withAll.smartCard.autofillTriggerRate).toBeGreaterThan(0);
    expect(withAll.smartCard.autofillTriggerRate).toBeLessThanOrEqual(100);
    expect(withAll.smartCard.conversionRate.smartCard).toBeGreaterThan(withAll.smartCard.conversionRate.standard);
  });

  test("smartCard field edit rates cover exactly Name, Phone, Address, Pincode", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.smartCard.fieldEditRates.map((f) => f.field)).toEqual(["Name", "Phone", "Address", "Pincode"]);
  });

  test("trends each carry day + week arrays and a deltaPct", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    for (const key of ["identificationRate", "messagingFunnel", "ordersRevenue", "repeatOrders"]) {
      expect(Array.isArray(data.trends[key].day)).toBe(true);
      expect(Array.isArray(data.trends[key].week)).toBe(true);
      expect(data.trends[key].day.length).toBeGreaterThan(data.trends[key].week.length);
      expect(typeof data.trends[key].deltaPct).toBe("number");
    }
  });

  test("messagingFunnel and ordersRevenue react to channel, identificationRate and repeatOrders do not", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withRcs = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "RCS", compare: true });
    expect(withAll.trends.identificationRate).toEqual(withRcs.trends.identificationRate);
    expect(withAll.trends.repeatOrders).toEqual(withRcs.trends.repeatOrders);
    expect(withAll.trends.messagingFunnel).not.toEqual(withRcs.trends.messagingFunnel);
  });

  test("sourceBreakdown uses exactly the 5 fixed sources, sorted descending by pct", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const sources = data.sourceBreakdown.sources;
    expect(new Set(sources.map((s) => s.source))).toEqual(
      new Set(["Smart Card", "Checkout", "Pop-up", "Cookie", "Signup"])
    );
    const pcts = sources.map((s) => s.pct);
    expect(pcts).toEqual([...pcts].sort((a, b) => b - a));
  });

  test("deviceSplit covers Web (Desktop), Web (Mobile), App and sums close to 100", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.sourceBreakdown.deviceSplit.map((d) => d.device)).toEqual(["Web (Desktop)", "Web (Mobile)", "App"]);
    const sum = data.sourceBreakdown.deviceSplit.reduce((acc, d) => acc + d.pct, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: FAIL — `smartCard`/`trends`/`sourceBreakdown` undefined.

- [ ] **Step 3: Implement**

In `mockFastrrIdentification.js`, add:

```js
function buildSmartCard(idSeed) {
  return {
    autofillTriggerRate: 58 + (idSeed % 20),
    acceptanceRate: 71 + (idSeed % 15),
    fieldEditRates: [
      { field: "Name", editRate: 3 + (idSeed % 5) },
      { field: "Phone", editRate: 5 + (idSeed % 6) },
      { field: "Address", editRate: 14 + (idSeed % 10) },
      { field: "Pincode", editRate: 8 + (idSeed % 7) },
    ],
    checkoutTimeSeconds: { smartCard: 28 + (idSeed % 12), manual: 95 + (idSeed % 40) },
    conversionRate: { smartCard: 34 + (idSeed % 8), standard: 19 + (idSeed % 5) },
    dropoffByStep: ["Cart", "Address", "Payment", "Confirmation"].map((step, i) => ({
      step,
      withSmartCard: Math.max(1, 12 - i * 3 + (idSeed % 3)),
      withoutSmartCard: Math.max(2, 24 - i * 4 + (idSeed % 4)),
    })),
  };
}

function trendPoints(labels, seed, base, spread) {
  return labels.map((period, i) => ({ period, value: base + ((seed >> i) % spread) + i * 2 }));
}

const DAY_LABELS = ["01 Sep", "02 Sep", "03 Sep", "04 Sep", "05 Sep", "06 Sep", "07 Sep"];
const WEEK_LABELS = ["Wk 27", "Wk 28", "Wk 29", "Wk 30"];

function buildTrendSeries(dayLabels, weekLabels, seed, buildPoint) {
  return {
    day: dayLabels.map((period, i) => buildPoint(period, i, seed)),
    week: weekLabels.map((period, i) => buildPoint(period, i, seed + 17)),
    deltaPct: ((seed >> 6) % 20) - 5,
  };
}

function buildTrends(idSeed, commSeed) {
  const identificationRate = buildTrendSeries(DAY_LABELS, WEEK_LABELS, idSeed, (period, i, s) => ({
    period, value: 18 + ((s >> i) % 10) + i * 0.4,
  }));

  const messagingFunnel = buildTrendSeries(DAY_LABELS, WEEK_LABELS, commSeed, (period, i, s) => {
    const sent = 9000 + ((s >> i) % 6000);
    const delivered = Math.round(sent * 0.93);
    const read = Math.round(delivered * 0.5);
    const clicked = Math.round(read * 0.22);
    return { period, sent, delivered, read, clicked };
  });

  const ordersRevenue = buildTrendSeries(DAY_LABELS, WEEK_LABELS, commSeed, (period, i, s) => {
    const orders = 300 + ((s >> i) % 400);
    return { period, orders, revenue: orders * (900 + (s % 500)) };
  });

  const repeatOrders = buildTrendSeries(DAY_LABELS, WEEK_LABELS, idSeed, (period, i, s) => ({
    period, value: 400 + ((s >> i) % 300) + i * 5,
  }));

  return { identificationRate, messagingFunnel, ordersRevenue, repeatOrders };
}

function buildSourceBreakdown(idSeed) {
  const rawSources = [
    { source: "Smart Card", weight: 34 + (idSeed % 10) },
    { source: "Checkout", weight: 27 + (idSeed % 8) },
    { source: "Pop-up", weight: 18 + (idSeed % 6) },
    { source: "Cookie", weight: 12 + (idSeed % 5) },
    { source: "Signup", weight: 9 + (idSeed % 4) },
  ];
  const total = rawSources.reduce((acc, s) => acc + s.weight, 0);
  const sources = rawSources
    .map((s) => ({ source: s.source, pct: (s.weight / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  const deviceRaw = [
    { device: "Web (Desktop)", weight: 38 + (idSeed % 10) },
    { device: "Web (Mobile)", weight: 44 + (idSeed % 10) },
    { device: "App", weight: 18 + (idSeed % 6) },
  ];
  const deviceTotal = deviceRaw.reduce((acc, d) => acc + d.weight, 0);
  const deviceSplit = deviceRaw.map((d) => ({ device: d.device, pct: (d.weight / deviceTotal) * 100 }));

  return { sources, deviceSplit };
}
```

Update `getFastrrIdentificationAnalytics` to its final form:

```js
export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel, seed } = buildHeroAndFunnel(datePreset, channel);
  const idSeed = identificationSeed(datePreset);
  const engagement = buildEngagement(datePreset, channel, seed);
  const conversionRoi = buildConversionRoi(datePreset, channel, seed);
  const segmentComparison = buildSegmentComparison(idSeed);
  const smartCard = buildSmartCard(idSeed);
  const trends = buildTrends(idSeed, seed);
  const sourceBreakdown = buildSourceBreakdown(idSeed);
  return { hero, funnel, engagement, conversionRoi, segmentComparison, smartCard, trends, sourceBreakdown };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="mockFastrrIdentification" --watchAll=false`
Expected: PASS — full generator test suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/data/mockFastrrIdentification.js src/components/analytics/fastrr/data/__tests__/mockFastrrIdentification.test.js
git commit -m "feat(analytics): complete Fastrr Identification mock data generator"
```

---

## Task 6: Shared presentational primitives

**Files:**
- Create: `src/components/analytics/fastrr/shared/PoweredByLabel.jsx`
- Create: `src/components/analytics/fastrr/shared/MetricTooltip.jsx`
- Create: `src/components/analytics/fastrr/shared/AttributionPair.jsx`
- Create: `src/components/analytics/fastrr/shared/SectionSkeleton.jsx`
- Create: `src/components/analytics/fastrr/shared/SectionEmptyState.jsx`
- Test: `src/components/analytics/fastrr/shared/__tests__/sharedPrimitives.test.jsx`

**Interfaces:**
- Produces:
  - `PoweredByLabel({ source: string })`
  - `MetricTooltip({ name, formula, description })` — an `Info` icon that shows `name`/`formula`/`description` on hover, using this repo's `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` from `@/components/ui/tooltip`.
  - `AttributionPair({ testId, lastClick, firstClick, formatter })`
  - `SectionSkeleton({ testId, rows? })`
  - `SectionEmptyState({ testId })`

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/shared/__tests__/sharedPrimitives.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PoweredByLabel from "../PoweredByLabel";
import MetricTooltip from "../MetricTooltip";
import AttributionPair from "../AttributionPair";
import SectionSkeleton from "../SectionSkeleton";
import SectionEmptyState from "../SectionEmptyState";

describe("PoweredByLabel", () => {
  test("renders the source name", () => {
    render(<PoweredByLabel source="Fastrr SDK" />);
    expect(screen.getByText("Powered by Fastrr SDK")).toBeInTheDocument();
  });
});

describe("MetricTooltip", () => {
  test("shows name, formula and description on hover", async () => {
    render(<MetricTooltip name="Read Rate" formula="Read ÷ Delivered × 100" description="Share of delivered messages that were opened." />);
    fireEvent.mouseOver(screen.getByTestId("metric-tooltip-trigger"));
    expect(await screen.findByText("Read Rate")).toBeInTheDocument();
    expect(await screen.findByText("Read ÷ Delivered × 100")).toBeInTheDocument();
    expect(await screen.findByText("Share of delivered messages that were opened.")).toBeInTheDocument();
  });
});

describe("AttributionPair", () => {
  test("renders both attribution numbers side by side, never as a toggle", () => {
    render(<AttributionPair testId="attr" lastClick={100} firstClick={200} formatter={(v) => `₹${v}`} />);
    const wrapper = screen.getByTestId("attr");
    expect(wrapper).toHaveTextContent("Last-Click");
    expect(wrapper).toHaveTextContent("₹100");
    expect(wrapper).toHaveTextContent("First-Click/Open");
    expect(wrapper).toHaveTextContent("₹200");
    expect(wrapper.querySelectorAll("button")).toHaveLength(0);
  });
});

describe("SectionSkeleton", () => {
  test("renders the requested number of shimmer rows", () => {
    render(<SectionSkeleton testId="skel" rows={3} />);
    expect(screen.getByTestId("skel").children).toHaveLength(3);
  });
});

describe("SectionEmptyState", () => {
  test("shows the exact empty-state copy", () => {
    render(<SectionEmptyState testId="empty" />);
    expect(screen.getByTestId("empty")).toHaveTextContent(
      "No data for this range/channel yet — try widening the date range or switching channels."
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="sharedPrimitives" --watchAll=false`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

`src/components/analytics/fastrr/shared/PoweredByLabel.jsx`:

```jsx
import React from "react";

// TODO: confirm source system for every section that uses this label.
export default function PoweredByLabel({ source }) {
  return <span className="text-[10px] text-text-muted italic">Powered by {source}</span>;
}
```

`src/components/analytics/fastrr/shared/MetricTooltip.jsx`:

```jsx
import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MetricTooltip({ name, formula, description }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3 h-3 text-text-muted" data-testid="metric-tooltip-trigger" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5">
            <div className="font-semibold">{name}</div>
            <div>{formula}</div>
            <div className="text-primary-foreground/80">{description}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

`src/components/analytics/fastrr/shared/AttributionPair.jsx`:

```jsx
import React from "react";

export default function AttributionPair({ testId, lastClick, firstClick, formatter }) {
  return (
    <div className="flex items-center gap-4" data-testid={testId}>
      <div>
        <div className="text-[10px] text-text-muted">Last-Click</div>
        <div className="text-[15px] font-semibold text-text-primary">{formatter(lastClick)}</div>
      </div>
      <div>
        <div className="text-[10px] text-text-muted">First-Click/Open</div>
        <div className="text-[15px] font-semibold text-text-primary">{formatter(firstClick)}</div>
      </div>
    </div>
  );
}
```

`src/components/analytics/fastrr/shared/SectionSkeleton.jsx`:

```jsx
import React from "react";

export default function SectionSkeleton({ testId, rows = 3 }) {
  return (
    <div data-testid={testId} className="bg-surface border border-border rounded-lg p-4 space-y-3 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}
```

`src/components/analytics/fastrr/shared/SectionEmptyState.jsx`:

```jsx
import React from "react";

export default function SectionEmptyState({ testId }) {
  return (
    <div data-testid={testId} className="flex items-center justify-center py-12 text-center text-text-muted bg-surface border border-border rounded-lg">
      <p className="text-sm">No data for this range/channel yet — try widening the date range or switching channels.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="sharedPrimitives" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/shared/PoweredByLabel.jsx src/components/analytics/fastrr/shared/MetricTooltip.jsx src/components/analytics/fastrr/shared/AttributionPair.jsx src/components/analytics/fastrr/shared/SectionSkeleton.jsx src/components/analytics/fastrr/shared/SectionEmptyState.jsx src/components/analytics/fastrr/shared/__tests__/sharedPrimitives.test.jsx
git commit -m "feat(analytics): add Fastrr Identification shared presentational primitives"
```

---

## Task 7: `GroupedBarChart` shared component

**Files:**
- Create: `src/components/analytics/fastrr/shared/GroupedBarChart.jsx`
- Test: `src/components/analytics/fastrr/shared/__tests__/GroupedBarChart.test.jsx`

**Interfaces:**
- Produces: `GroupedBarChart({ testId, title?, data, series: [{key, label, color?}], xKey, valueFormatter })` — a Recharts grouped (never stacked) bar chart.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/shared/__tests__/GroupedBarChart.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import GroupedBarChart from "../GroupedBarChart";

describe("GroupedBarChart", () => {
  test("renders with a title and testid for a multi-series dataset", () => {
    render(
      <GroupedBarChart
        testId="chart"
        title="Engagement by channel"
        data={[{ label: "WhatsApp", sent: 100, delivered: 90 }, { label: "Email", sent: 50, delivered: 40 }]}
        xKey="label"
        series={[{ key: "sent", label: "Sent" }, { key: "delivered", label: "Delivered" }]}
        valueFormatter={(v) => String(v)}
      />
    );
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toHaveTextContent("Engagement by channel");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="GroupedBarChart" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/shared/GroupedBarChart.jsx`:

```jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };
const DEFAULT_COLORS = ["#6C3AE8", "#94A3B8", "#22C55E", "#F59E0B"];

export default function GroupedBarChart({ testId, title, data, series, xKey, valueFormatter }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      {title && <h3 className="text-[13px] font-semibold text-text-primary mb-3">{title}</h3>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey={xKey} tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="GroupedBarChart" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/shared/GroupedBarChart.jsx src/components/analytics/fastrr/shared/__tests__/GroupedBarChart.test.jsx
git commit -m "feat(analytics): add GroupedBarChart shared component"
```

---

## Task 8: `FunnelChart` shared component (+ pure `funnelMath`)

**Files:**
- Create: `src/components/analytics/fastrr/shared/funnelMath.js`
- Create: `src/components/analytics/fastrr/shared/FunnelChart.jsx`
- Test: `src/components/analytics/fastrr/shared/__tests__/funnelMath.test.js`
- Test: `src/components/analytics/fastrr/shared/__tests__/FunnelChart.test.jsx`

**Interfaces:**
- Produces: `computeFunnelStagePercents(stages: [{key,label,count}]): [{key,label,count,pctOfTotal,pctOfPrevious}]`. `FunnelChart({ testId, stages })`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/shared/__tests__/funnelMath.test.js`:

```js
import { computeFunnelStagePercents } from "../funnelMath";

describe("computeFunnelStagePercents", () => {
  test("first stage is 100% of both total and previous", () => {
    const result = computeFunnelStagePercents([{ key: "a", label: "A", count: 1000 }]);
    expect(result[0].pctOfTotal).toBe(100);
    expect(result[0].pctOfPrevious).toBe(100);
  });

  test("computes pctOfTotal against the first stage's count", () => {
    const result = computeFunnelStagePercents([
      { key: "a", label: "A", count: 1000 },
      { key: "b", label: "B", count: 250 },
    ]);
    expect(result[1].pctOfTotal).toBe(25);
  });

  test("computes pctOfPrevious against the immediately preceding stage", () => {
    const result = computeFunnelStagePercents([
      { key: "a", label: "A", count: 1000 },
      { key: "b", label: "B", count: 500 },
      { key: "c", label: "C", count: 100 },
    ]);
    expect(result[1].pctOfPrevious).toBe(50);
    expect(result[2].pctOfPrevious).toBe(20);
  });

  test("guards against a zero denominator", () => {
    const result = computeFunnelStagePercents([{ key: "a", label: "A", count: 0 }, { key: "b", label: "B", count: 0 }]);
    expect(result[1].pctOfTotal).toBe(0);
    expect(result[1].pctOfPrevious).toBe(0);
  });
});
```

Create `src/components/analytics/fastrr/shared/__tests__/FunnelChart.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import FunnelChart from "../FunnelChart";

describe("FunnelChart", () => {
  test("renders one row per stage with its count", () => {
    render(
      <FunnelChart
        testId="funnel"
        stages={[
          { key: "a", label: "Total Sessions", count: 1000 },
          { key: "b", label: "Identified Sessions", count: 250 },
        ]}
      />
    );
    expect(screen.getByTestId("funnel-stage-a")).toHaveTextContent("Total Sessions");
    expect(screen.getByTestId("funnel-stage-b")).toHaveTextContent("Identified Sessions");
    expect(screen.getByTestId("funnel-stage-b")).toHaveTextContent("25.0%");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="funnelMath|FunnelChart" --watchAll=false`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/shared/funnelMath.js`:

```js
export function computeFunnelStagePercents(stages) {
  const denom = stages[0]?.count || 0;
  return stages.map((stage, i) => ({
    ...stage,
    pctOfTotal: denom > 0 ? (stage.count / denom) * 100 : 0,
    pctOfPrevious: i === 0 ? 100 : (stages[i - 1].count > 0 ? (stage.count / stages[i - 1].count) * 100 : 0),
  }));
}
```

Create `src/components/analytics/fastrr/shared/FunnelChart.jsx`:

```jsx
import React from "react";
import { computeFunnelStagePercents } from "./funnelMath";

export default function FunnelChart({ testId, stages }) {
  const computed = computeFunnelStagePercents(stages);
  return (
    <div data-testid={testId} className="space-y-2">
      {computed.map((s) => (
        <div key={s.key} data-testid={`${testId}-stage-${s.key}`}>
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="font-medium text-text-primary">{s.label}</span>
            <span className="text-text-muted tabular-nums">
              {s.count.toLocaleString("en-IN")} · {s.pctOfTotal.toFixed(1)}% of total · {s.pctOfPrevious.toFixed(1)}% of prev
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(s.pctOfTotal, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="funnelMath|FunnelChart" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/shared/funnelMath.js src/components/analytics/fastrr/shared/FunnelChart.jsx src/components/analytics/fastrr/shared/__tests__/funnelMath.test.js src/components/analytics/fastrr/shared/__tests__/FunnelChart.test.jsx
git commit -m "feat(analytics): add FunnelChart shared component"
```

---

## Task 9: `SortableTable` shared component (+ pure `sortMath`)

**Files:**
- Create: `src/components/analytics/fastrr/shared/sortMath.js`
- Create: `src/components/analytics/fastrr/shared/SortableTable.jsx`
- Test: `src/components/analytics/fastrr/shared/__tests__/sortMath.test.js`
- Test: `src/components/analytics/fastrr/shared/__tests__/SortableTable.test.jsx`

**Interfaces:**
- Produces: `nextSort(current: {field,dir}, field: string): {field,dir}`. `sortRows(rows, sort, secondaryField?): rows` (stable, ascending on `field` then `secondaryField`, reversed when `dir === "desc"`). `SortableTable({ testId, columns: [{key,label,formatter?}], rows, defaultSort, secondarySortField?, rowKey, maxRows? })`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/shared/__tests__/sortMath.test.js`:

```js
import { nextSort, sortRows } from "../sortMath";

describe("nextSort", () => {
  test("clicking a new field sorts it descending first", () => {
    expect(nextSort({ field: "a", dir: "asc" }, "b")).toEqual({ field: "b", dir: "desc" });
  });
  test("clicking the active field toggles direction", () => {
    expect(nextSort({ field: "a", dir: "desc" }, "a")).toEqual({ field: "a", dir: "asc" });
  });
});

describe("sortRows", () => {
  const rows = [
    { id: 1, revenue: 100, sent: 50 },
    { id: 2, revenue: 300, sent: 10 },
    { id: 3, revenue: 100, sent: 90 },
  ];

  test("sorts ascending by the primary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "asc" });
    expect(sorted.map((r) => r.id)).toEqual([1, 3, 2]);
  });

  test("sorts descending by the primary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "desc" });
    expect(sorted.map((r) => r.id)).toEqual([2, 1, 3]);
  });

  test("breaks ties with the secondary field", () => {
    const sorted = sortRows(rows, { field: "revenue", dir: "desc" }, "sent");
    expect(sorted.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  test("does not mutate the input array", () => {
    const original = [...rows];
    sortRows(rows, { field: "revenue", dir: "desc" });
    expect(rows).toEqual(original);
  });
});
```

Create `src/components/analytics/fastrr/shared/__tests__/SortableTable.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SortableTable from "../SortableTable";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "revenue", label: "Revenue", formatter: (v) => `₹${v}` },
];
const ROWS = [
  { id: "a", name: "Journey A", revenue: 100 },
  { id: "b", name: "Journey B", revenue: 300 },
  { id: "c", name: "Journey C", revenue: 200 },
];

describe("SortableTable", () => {
  test("renders rows sorted by the default sort, applying column formatters", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" />);
    const rows = screen.getAllByTestId(/^tbl-row-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["tbl-row-b", "tbl-row-c", "tbl-row-a"]);
    expect(screen.getByTestId("tbl-row-b")).toHaveTextContent("₹300");
  });

  test("clicking a column header re-sorts", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" />);
    fireEvent.click(screen.getByTestId("tbl-sort-revenue"));
    const rows = screen.getAllByTestId(/^tbl-row-/);
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["tbl-row-a", "tbl-row-c", "tbl-row-b"]);
  });

  test("caps displayed rows at maxRows and shows a disabled view-all stub", () => {
    render(<SortableTable testId="tbl" columns={COLUMNS} rows={ROWS} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" maxRows={2} />);
    expect(screen.getAllByTestId(/^tbl-row-/)).toHaveLength(2);
    expect(screen.getByTestId("tbl-view-all")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="sortMath|SortableTable" --watchAll=false`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/shared/sortMath.js`:

```js
export function nextSort(current, field) {
  return current.field === field
    ? { field, dir: current.dir === "asc" ? "desc" : "asc" }
    : { field, dir: "desc" };
}

export function sortRows(rows, sort, secondaryField) {
  const { field, dir } = sort;
  const sorted = [...rows].sort((a, b) => {
    if (a[field] !== b[field]) return a[field] < b[field] ? -1 : 1;
    if (secondaryField && a[secondaryField] !== b[secondaryField]) {
      return a[secondaryField] < b[secondaryField] ? -1 : 1;
    }
    return 0;
  });
  if (dir === "desc") sorted.reverse();
  return sorted;
}
```

Create `src/components/analytics/fastrr/shared/SortableTable.jsx`:

```jsx
import React, { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { sortRows, nextSort } from "./sortMath";

export default function SortableTable({ testId, columns, rows, defaultSort, secondarySortField, rowKey, maxRows = 10 }) {
  const [sort, setSort] = useState(defaultSort);
  const sorted = sortRows(rows, sort, secondarySortField).slice(0, maxRows);

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid={testId}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <button
                  type="button"
                  data-testid={`${testId}-sort-${col.key}`}
                  onClick={() => setSort((prev) => nextSort(prev, col.key))}
                  className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                >
                  {col.label}
                  {sort.field === col.key
                    ? (sort.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                    : <ArrowUpDown className="w-3 h-3" />}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row[rowKey]} data-testid={`${testId}-row-${row[rowKey]}`}>
              {columns.map((col) => (
                <TableCell key={col.key} className="text-[13px]">
                  {col.formatter ? col.formatter(row[col.key]) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2 border-t border-border">
        <button type="button" data-testid={`${testId}-view-all`} disabled className="text-[12px] text-text-muted cursor-not-allowed">
          View all
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="sortMath|SortableTable" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/shared/sortMath.js src/components/analytics/fastrr/shared/SortableTable.jsx src/components/analytics/fastrr/shared/__tests__/sortMath.test.js src/components/analytics/fastrr/shared/__tests__/SortableTable.test.jsx
git commit -m "feat(analytics): add SortableTable shared component"
```

---

## Task 10: `FastrrFilterBar`

**Files:**
- Create: `src/components/analytics/fastrr/FastrrFilterBar.jsx`
- Test: `src/components/analytics/fastrr/__tests__/FastrrFilterBar.test.jsx`

**Interfaces:**
- Produces: `FastrrFilterBar({ datePreset, onDatePresetChange, compare, onCompareChange, channel, onChannelChange })`. Date presets: `today, yesterday, last_7_days, this_month, last_month` (no custom range — see Global Constraints). Channels: `FASTRR_CHANNELS` from Task 2 (`All, WhatsApp, Email, SMS, RCS, AI Calling`).

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/__tests__/FastrrFilterBar.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrFilterBar from "../FastrrFilterBar";

function baseProps(overrides = {}) {
  return {
    datePreset: "last_7_days",
    onDatePresetChange: jest.fn(),
    compare: true,
    onCompareChange: jest.fn(),
    channel: "All",
    onChannelChange: jest.fn(),
    ...overrides,
  };
}

describe("FastrrFilterBar", () => {
  test("clicking a date preset calls onDatePresetChange", () => {
    const props = baseProps();
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-date-this_month"));
    expect(props.onDatePresetChange).toHaveBeenCalledWith("this_month");
  });

  test("clicking the compare toggle calls onCompareChange with the opposite value", () => {
    const props = baseProps({ compare: true });
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-compare-toggle"));
    expect(props.onCompareChange).toHaveBeenCalledWith(false);
  });

  test("clicking a channel chip calls onChannelChange", () => {
    const props = baseProps();
    render(<FastrrFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("fastrr-channel-ai-calling"));
    expect(props.onChannelChange).toHaveBeenCalledWith("AI Calling");
  });

  test("the active date preset and channel are visually marked", () => {
    render(<FastrrFilterBar {...baseProps({ datePreset: "today", channel: "SMS" })} />);
    expect(screen.getByTestId("fastrr-date-today")).toHaveClass("border-primary");
    expect(screen.getByTestId("fastrr-channel-sms")).toHaveClass("border-primary");
    expect(screen.getByTestId("fastrr-date-this_month")).not.toHaveClass("border-primary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="FastrrFilterBar" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/FastrrFilterBar.jsx`:

```jsx
import React from "react";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];
const CHANNELS = ["All", "WhatsApp", "Email", "SMS", "RCS", "AI Calling"];

function chipClass(active) {
  return `px-2.5 py-1 text-[11px] font-medium rounded-full border whitespace-nowrap transition-colors ${
    active ? "border-primary text-primary bg-primary-tint" : "border-border text-text-secondary hover:border-text-muted/60"
  }`;
}

export default function FastrrFilterBar({ datePreset, onDatePresetChange, compare, onCompareChange, channel, onChannelChange }) {
  return (
    <div data-testid="fastrr-filter-bar" className="sticky top-0 z-10 bg-surface border-b border-border py-2 flex items-center gap-2 flex-wrap">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          data-testid={`fastrr-date-${p.value}`}
          onClick={() => onDatePresetChange(p.value)}
          className={chipClass(datePreset === p.value)}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        data-testid="fastrr-compare-toggle"
        aria-pressed={compare}
        onClick={() => onCompareChange(!compare)}
        className={chipClass(compare)}
      >
        Compare to previous period
      </button>
      <span className="w-px h-4 bg-border mx-1" />
      {CHANNELS.map((c) => (
        <button
          key={c}
          type="button"
          data-testid={`fastrr-channel-${c.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => onChannelChange(c)}
          className={chipClass(channel === c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="FastrrFilterBar" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/FastrrFilterBar.jsx src/components/analytics/fastrr/__tests__/FastrrFilterBar.test.jsx
git commit -m "feat(analytics): add FastrrFilterBar"
```

---

## Task 11: `AnchorNav` (+ pure `scrollSpy`)

**Files:**
- Create: `src/components/analytics/fastrr/scrollSpy.js`
- Create: `src/components/analytics/fastrr/AnchorNav.jsx`
- Test: `src/components/analytics/fastrr/__tests__/scrollSpy.test.js`
- Test: `src/components/analytics/fastrr/__tests__/AnchorNav.test.jsx`

**Interfaces:**
- Produces: `findActiveSectionId(sections: [{id, top}], scrollY, offset = 96): string | null`. `AnchorNav({ sections: [{id, label}] })` — reads each section's DOM position via `document.getElementById`, so callers must render `<section id="...">` wrappers matching the `id`s passed in (established as the contract Task 19 relies on).

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/__tests__/scrollSpy.test.js`:

```js
import { findActiveSectionId } from "../scrollSpy";

describe("findActiveSectionId", () => {
  const sections = [
    { id: "hero", top: 0 },
    { id: "funnel", top: 800 },
    { id: "engagement", top: 1600 },
  ];

  test("defaults to the first section at the top of the page", () => {
    expect(findActiveSectionId(sections, 0)).toBe("hero");
  });

  test("switches to the next section once scrolled past its offset top", () => {
    expect(findActiveSectionId(sections, 750, 96)).toBe("hero");
    expect(findActiveSectionId(sections, 705, 96)).toBe("funnel");
  });

  test("picks the last section whose top has been reached", () => {
    expect(findActiveSectionId(sections, 5000, 96)).toBe("engagement");
  });
});
```

Create `src/components/analytics/fastrr/__tests__/AnchorNav.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AnchorNav from "../AnchorNav";

const SECTIONS = [
  { id: "fastrr-hero", label: "Overview" },
  { id: "fastrr-funnel", label: "Funnel" },
];

describe("AnchorNav", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    document.body.innerHTML = '<div id="fastrr-hero"></div><div id="fastrr-funnel"></div>';
  });

  test("renders one button per section", () => {
    render(<AnchorNav sections={SECTIONS} />);
    expect(screen.getByTestId("fastrr-anchor-fastrr-hero")).toHaveTextContent("Overview");
    expect(screen.getByTestId("fastrr-anchor-fastrr-funnel")).toHaveTextContent("Funnel");
  });

  test("clicking a section button smooth-scrolls to it", () => {
    render(<AnchorNav sections={SECTIONS} />);
    fireEvent.click(screen.getByTestId("fastrr-anchor-fastrr-funnel"));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="scrollSpy|AnchorNav" --watchAll=false`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/scrollSpy.js`:

```js
export function findActiveSectionId(sections, scrollY, offset = 96) {
  let activeId = sections[0]?.id ?? null;
  for (const s of sections) {
    if (s.top - offset <= scrollY) activeId = s.id;
  }
  return activeId;
}
```

Create `src/components/analytics/fastrr/AnchorNav.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { findActiveSectionId } from "./scrollSpy";

export default function AnchorNav({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);

  useEffect(() => {
    function handleScroll() {
      const tops = sections.map((s) => {
        const el = document.getElementById(s.id);
        return { id: s.id, top: el ? el.getBoundingClientRect().top + window.scrollY : 0 };
      });
      setActiveId(findActiveSectionId(tops, window.scrollY));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <nav data-testid="fastrr-anchor-nav" className="sticky top-[41px] z-10 bg-surface border-b border-border overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 px-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            data-testid={`fastrr-anchor-${s.id}`}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`px-3 py-2 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeId === s.id ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="scrollSpy|AnchorNav" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/scrollSpy.js src/components/analytics/fastrr/AnchorNav.jsx src/components/analytics/fastrr/__tests__/scrollSpy.test.js src/components/analytics/fastrr/__tests__/AnchorNav.test.jsx
git commit -m "feat(analytics): add AnchorNav with scroll-spy"
```

---

## Task 12: `HeroBandSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/HeroBandSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/HeroBandSection.test.jsx`

**Interfaces:**
- Consumes: `MetricCard` (`src/components/analytics/overview/MetricCard.jsx`), `AttributionPair`/`PoweredByLabel`/`SectionSkeleton` (Task 6), `formatCompactNumber`/`formatCompactCurrency`/`formatPercent`/`formatDelta` (`@/lib/analyticsFormat`), the `hero` shape from Task 2.
- Produces: `HeroBandSection({ data: HeroData, compare: boolean, isLoading: boolean })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/HeroBandSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import HeroBandSection from "../HeroBandSection";

function fixture(overrides = {}) {
  return {
    totalSessions: { value: 100000, deltaPct: 8, deltaAbs: 8000 },
    identifiedSessions: { value: 26300, deltaPct: 9, deltaAbs: 2200 },
    identificationRate: { value: 26.3, deltaPct: 2, deltaAbs: 0 },
    benchmark: { yourStore: 26.3, allFastrrStores: 19.2, categoryAvg: 17.3 },
    gmv: { lastClick: 3000000, firstClick: 3900000 },
    freshness: { intervalMinutes: 15, lastRefreshed: "2026-09-08T06:00:00.000Z" },
    ...overrides,
  };
}

describe("HeroBandSection", () => {
  test("shows the loading skeleton when isLoading", () => {
    render(<HeroBandSection data={fixture()} compare isLoading />);
    expect(screen.getByTestId("fastrr-hero-skeleton")).toBeInTheDocument();
  });

  test("shows the benchmark callout when ahead of both comparisons", () => {
    render(<HeroBandSection data={fixture()} compare isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-benchmark-callout")).toHaveTextContent(
      "You're identifying 7.1 pts more traffic than the average Fastrr store."
    );
  });

  test("hides the benchmark callout when behind either comparison", () => {
    const data = fixture({ benchmark: { yourStore: 15.0, allFastrrStores: 19.2, categoryAvg: 17.3 } });
    render(<HeroBandSection data={data} compare isLoading={false} />);
    expect(screen.queryByTestId("fastrr-hero-benchmark-callout")).not.toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-benchmark")).toHaveTextContent("Your Store: 15.0%");
  });

  test("hides delta chips when compare is off", () => {
    render(<HeroBandSection data={fixture()} compare={false} isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-total-sessions")).not.toHaveTextContent("vs last period");
  });

  test("shows GMV as a Last-Click / First-Click pair, never a toggle", () => {
    render(<HeroBandSection data={fixture()} compare isLoading={false} />);
    expect(screen.getByTestId("fastrr-hero-gmv-pair")).toHaveTextContent("Last-Click");
    expect(screen.getByTestId("fastrr-hero-gmv-pair")).toHaveTextContent("First-Click/Open");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="HeroBandSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/HeroBandSection.jsx`:

```jsx
import React from "react";
import MetricCard from "../../overview/MetricCard";
import AttributionPair from "../shared/AttributionPair";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent, formatDelta } from "@/lib/analyticsFormat";

export default function HeroBandSection({ data, compare, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-hero-skeleton" rows={4} />;

  const aheadOfBoth = data.benchmark.yourStore > data.benchmark.allFastrrStores && data.benchmark.yourStore > data.benchmark.categoryAvg;
  const pointsAhead = (data.benchmark.yourStore - data.benchmark.allFastrrStores).toFixed(1);

  return (
    <div data-testid="fastrr-hero-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Identification snapshot</h2>
        <PoweredByLabel source="Fastrr SDK" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard
          testId="fastrr-hero-total-sessions"
          label="Total Sessions"
          value={formatCompactNumber(data.totalSessions.value)}
          delta={compare ? formatDelta(data.totalSessions.deltaPct, data.totalSessions.deltaAbs, formatCompactNumber) : null}
        />
        <MetricCard
          testId="fastrr-hero-identified-sessions"
          label="Identified Sessions"
          value={formatCompactNumber(data.identifiedSessions.value)}
          delta={compare ? formatDelta(data.identifiedSessions.deltaPct, data.identifiedSessions.deltaAbs, formatCompactNumber) : null}
        />
        <MetricCard
          testId="fastrr-hero-identification-rate"
          label="Identification Rate"
          value={formatPercent(data.identificationRate.value)}
          delta={compare ? formatDelta(data.identificationRate.deltaPct, data.identificationRate.deltaAbs, (v) => formatPercent(v)) : null}
        />
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-hero-gmv">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">GMV Impacted</span>
          <div className="mt-2">
            <AttributionPair testId="fastrr-hero-gmv-pair" lastClick={data.gmv.lastClick} firstClick={data.gmv.firstClick} formatter={formatCompactCurrency} />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-primary/30 rounded-lg p-4" data-testid="fastrr-hero-benchmark">
        {aheadOfBoth && (
          <p className="text-[13px] font-medium text-primary mb-2" data-testid="fastrr-hero-benchmark-callout">
            You're identifying {pointsAhead} pts more traffic than the average Fastrr store.
          </p>
        )}
        <div className="flex items-center gap-6 text-[13px]">
          <span>Your Store: <strong className="tabular-nums">{formatPercent(data.benchmark.yourStore)}</strong></span>
          <span className="text-text-muted">|</span>
          <span>All Fastrr Stores: <strong className="tabular-nums">{formatPercent(data.benchmark.allFastrrStores)}</strong></span>
          <span className="text-text-muted">|</span>
          <span>Category Avg: <strong className="tabular-nums">{formatPercent(data.benchmark.categoryAvg)}</strong></span>
        </div>
      </div>

      <p className="text-[11px] text-text-muted">
        Updated every {data.freshness.intervalMinutes} min · Last refreshed {new Date(data.freshness.lastRefreshed).toLocaleString("en-IN")}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="HeroBandSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/HeroBandSection.jsx src/components/analytics/fastrr/sections/__tests__/HeroBandSection.test.jsx
git commit -m "feat(analytics): add HeroBandSection"
```

---

## Task 13: `IdentificationFunnelSection` + `EngagementSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/IdentificationFunnelSection.jsx`
- Create: `src/components/analytics/fastrr/sections/EngagementSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/IdentificationFunnelSection.test.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/EngagementSection.test.jsx`

**Interfaces:**
- Consumes: `FunnelChart`, `GroupedBarChart`, `PoweredByLabel`, `SectionSkeleton`, `SectionEmptyState` (Tasks 6-8), the `funnel`/`engagement` shapes from Tasks 2-3.
- Produces: `IdentificationFunnelSection({ data: FunnelData, isLoading })`. `EngagementSection({ data: EngagementData, isLoading })`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/sections/__tests__/IdentificationFunnelSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import IdentificationFunnelSection from "../IdentificationFunnelSection";

const FIXTURE = {
  stages: [
    { key: "totalSessions", label: "Total Sessions", count: 100000 },
    { key: "identifiedSessions", label: "Identified Sessions", count: 26000 },
    { key: "checkoutInitiated", label: "Checkout Initiated", count: 10000 },
    { key: "checkoutSso", label: "Checkout (Smart Card / SSO)", count: 6800 },
    { key: "orderPlaced", label: "Order Placed", count: 4800 },
  ],
  dropoffByPage: [
    { page: "Homepage", count: 7000 }, { page: "PDP", count: 4600 }, { page: "Cart", count: 2400 }, { page: "Checkout", count: 1600 },
  ],
};

describe("IdentificationFunnelSection", () => {
  test("shows skeleton while loading", () => {
    render(<IdentificationFunnelSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-funnel-skeleton")).toBeInTheDocument();
  });

  test("renders the connected funnel and drop-off chart", () => {
    render(<IdentificationFunnelSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-funnel-chart")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-funnel-dropoff")).toBeInTheDocument();
  });
});
```

Create `src/components/analytics/fastrr/sections/__tests__/EngagementSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import EngagementSection from "../EngagementSection";

const FIXTURE = {
  isEmpty: false,
  funnel: { sent: 90000, delivered: 84000, read: 42000, clicked: 9000 },
  readRate: 50,
  clickRate: 10.7,
  byChannel: [
    { label: "WhatsApp", sent: 40000, delivered: 38000, read: 20000, clicked: 5000 },
    { label: "Email", sent: 20000, delivered: 19000, read: 6000, clicked: 900 },
  ],
  aiCalling: { callsPlaced: 6000, callsConnected: 3700, callsCompleted: 3000, actionTaken: 1300 },
};

describe("EngagementSection", () => {
  test("shows skeleton while loading", () => {
    render(<EngagementSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-engagement-skeleton")).toBeInTheDocument();
  });

  test("AI Calling never appears in the channel-wise grouped bar", () => {
    render(<EngagementSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-engagement-by-channel")).not.toHaveTextContent("AI Calling");
    expect(screen.getByTestId("fastrr-engagement-ai-calling")).toHaveTextContent("Calls Placed");
  });

  test("shows the empty state instead of charts when data.isEmpty", () => {
    render(<EngagementSection data={{ ...FIXTURE, isEmpty: true }} isLoading={false} />);
    expect(screen.getByTestId("fastrr-engagement-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("fastrr-engagement-by-channel")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="IdentificationFunnelSection|EngagementSection" --watchAll=false`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/IdentificationFunnelSection.jsx`:

```jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import FunnelChart from "../shared/FunnelChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function IdentificationFunnelSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-funnel-skeleton" rows={5} />;

  return (
    <div data-testid="fastrr-funnel-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Identification → Checkout → Order funnel</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      {/* TODO: confirm all funnel stages share a common denominator before enabling connected funnel visual */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <FunnelChart testId="fastrr-funnel-chart" stages={data.stages} />
      </div>
      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-funnel-dropoff">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Where identified-but-unconverted sessions leave</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dropoffByPage} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
              <YAxis type="category" dataKey="page" tick={TICK} stroke="#94A3B8" width={80} />
              <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/analytics/fastrr/sections/EngagementSection.jsx`:

```jsx
import React from "react";
import GroupedBarChart from "../shared/GroupedBarChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import SectionEmptyState from "../shared/SectionEmptyState";
import { formatCompactNumber, formatPercent } from "@/lib/analyticsFormat";

export default function EngagementSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-engagement-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-engagement-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Communication: Engagement</h2>
        <PoweredByLabel source="WhatsApp delivery webhook" />
      </div>

      {data.isEmpty ? (
        <SectionEmptyState testId="fastrr-engagement-empty" />
      ) : (
        <>
          <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-6" data-testid="fastrr-engagement-summary">
            <div><div className="text-[11px] text-text-muted">Sent</div><div className="text-lg font-semibold tabular-nums">{formatCompactNumber(data.funnel.sent)}</div></div>
            <div><div className="text-[11px] text-text-muted">Delivered</div><div className="text-lg font-semibold tabular-nums">{formatCompactNumber(data.funnel.delivered)}</div></div>
            <div><div className="text-[11px] text-text-muted">Read Rate</div><div className="text-lg font-semibold tabular-nums">{formatPercent(data.readRate)}</div></div>
            <div><div className="text-[11px] text-text-muted">Click Rate (CTR)</div><div className="text-lg font-semibold tabular-nums">{formatPercent(data.clickRate)}</div></div>
          </div>

          <GroupedBarChart
            testId="fastrr-engagement-by-channel"
            title="Engagement by channel"
            data={data.byChannel}
            xKey="label"
            series={[
              { key: "sent", label: "Sent", color: "#94A3B8" },
              { key: "delivered", label: "Delivered", color: "#6C3AE8" },
              { key: "read", label: "Read", color: "#22C55E" },
              { key: "clicked", label: "Clicked", color: "#F59E0B" },
            ]}
            valueFormatter={formatCompactNumber}
          />

          <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-engagement-ai-calling">
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">AI Calling</h3>
            <div className="flex items-center gap-6 text-[12px]">
              <span>Calls Placed: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsPlaced)}</strong></span>
              <span>Connected: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsConnected)}</strong></span>
              <span>Completed: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.callsCompleted)}</strong></span>
              <span>Action Taken: <strong className="tabular-nums">{formatCompactNumber(data.aiCalling.actionTaken)}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="IdentificationFunnelSection|EngagementSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/IdentificationFunnelSection.jsx src/components/analytics/fastrr/sections/EngagementSection.jsx src/components/analytics/fastrr/sections/__tests__/IdentificationFunnelSection.test.jsx src/components/analytics/fastrr/sections/__tests__/EngagementSection.test.jsx
git commit -m "feat(analytics): add IdentificationFunnelSection and EngagementSection"
```

---

## Task 14: `ConversionRoiSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/ConversionRoiSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/ConversionRoiSection.test.jsx`

**Interfaces:**
- Consumes: `GroupedBarChart`, `AttributionPair`, `SortableTable`, `PoweredByLabel`, `SectionSkeleton`, `SectionEmptyState`, the `conversionRoi` shape from Task 3.
- Produces: `ConversionRoiSection({ data: ConversionRoiData, isLoading })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/ConversionRoiSection.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConversionRoiSection from "../ConversionRoiSection";

const FIXTURE = {
  isEmpty: false,
  byChannel: [
    { label: "WhatsApp", orders: 900, revenue: 810000, aov: 900, roi: 10.5 },
    { label: "Email", orders: 300, revenue: 240000, aov: 800, roi: 6.2 },
  ],
  roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated).",
  attribution: { lastClick: 3200000, firstClick: 4100000 },
  topJourneys: Array.from({ length: 12 }, (_, i) => ({
    id: `journey-${i + 1}`, name: `Journey ${i + 1}`, channels: ["WhatsApp"], triggerEvent: "Cart Abandon",
    sent: 1000 + i, delivered: 900 + i, orders: 20 + i, revenue: (20 + i) * 900, roi: 5 + i * 0.1, aov: 900, uniqueCustomers: 18 + i,
  })),
  triggerSplit: [{ trigger: "Product View", revenue: 800000 }],
};

describe("ConversionRoiSection", () => {
  test("shows skeleton while loading", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-conversion-skeleton")).toBeInTheDocument();
  });

  test("shows the ROI formula visibly, not only on hover", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-roi-formula")).toHaveTextContent("ROI = (Revenue − Cost) / Cost × 100");
  });

  test("caps the top journeys table at 10 rows and it is sortable", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getAllByTestId(/^fastrr-top-journeys-table-row-/)).toHaveLength(10);
    fireEvent.click(screen.getByTestId("fastrr-top-journeys-table-sort-orders"));
    expect(screen.getAllByTestId(/^fastrr-top-journeys-table-row-/)[0]).toHaveTextContent("Journey 12");
  });

  test("shows attribution as Last-Click/First-Click, never a toggle", () => {
    render(<ConversionRoiSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-attribution")).toHaveTextContent("Last-Click");
    expect(screen.getByTestId("fastrr-conversion-attribution")).toHaveTextContent("First-Click/Open");
  });

  test("shows the empty state when data.isEmpty", () => {
    render(<ConversionRoiSection data={{ ...FIXTURE, isEmpty: true }} isLoading={false} />);
    expect(screen.getByTestId("fastrr-conversion-empty")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="ConversionRoiSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/ConversionRoiSection.jsx`:

```jsx
import React from "react";
import GroupedBarChart from "../shared/GroupedBarChart";
import AttributionPair from "../shared/AttributionPair";
import SortableTable from "../shared/SortableTable";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import SectionEmptyState from "../shared/SectionEmptyState";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const JOURNEY_COLUMNS = [
  { key: "name", label: "Journey Name" },
  { key: "channels", label: "Channel(s)", formatter: (v) => v.join(", ") },
  { key: "triggerEvent", label: "Trigger Event" },
  { key: "sent", label: "Sent", formatter: formatCompactNumber },
  { key: "delivered", label: "Delivered", formatter: formatCompactNumber },
  { key: "orders", label: "Orders", formatter: formatCompactNumber },
  { key: "revenue", label: "Revenue", formatter: formatCompactCurrency },
  { key: "roi", label: "ROI", formatter: (v) => `${v.toFixed(2)}X` },
  { key: "aov", label: "AOV", formatter: formatCompactCurrency },
  { key: "uniqueCustomers", label: "Unique Customers", formatter: formatCompactNumber },
];

export default function ConversionRoiSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-conversion-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-conversion-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Communication: Conversion &amp; ROI</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>

      {data.isEmpty ? (
        <SectionEmptyState testId="fastrr-conversion-empty" />
      ) : (
        <>
          <div>
            <GroupedBarChart
              testId="fastrr-conversion-by-channel"
              title="Orders & Revenue by channel"
              data={data.byChannel}
              xKey="label"
              series={[
                { key: "orders", label: "Orders", color: "#94A3B8" },
                { key: "revenue", label: "Revenue", color: "#6C3AE8" },
              ]}
              valueFormatter={formatCompactNumber}
            />
            {/* AOV and ROI are shown per-channel below, not in the chart above — mixing
                order counts/revenue with an X-multiplier and a rupee average in one
                grouped bar would compare incompatible units. */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3" data-testid="fastrr-conversion-channel-stats">
              {data.byChannel.map((c) => (
                <div key={c.label} className="bg-slate-50 rounded-md p-2 text-center">
                  <div className="text-[10px] text-text-muted font-medium">{c.label}</div>
                  <div className="text-[12px] font-semibold tabular-nums">{c.roi.toFixed(2)}X</div>
                  <div className="text-[10px] text-text-muted">AOV {formatCompactCurrency(c.aov)}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-2" data-testid="fastrr-conversion-roi-formula">
              ROI = (Revenue − Cost) / Cost × 100. {data.roiFormulaNote}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4">
            <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Attributed Revenue</span>
            <div className="mt-2">
              <AttributionPair testId="fastrr-conversion-attribution" lastClick={data.attribution.lastClick} firstClick={data.attribution.firstClick} formatter={formatCompactCurrency} />
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">Top Journeys / Campaigns</h3>
            <SortableTable
              testId="fastrr-top-journeys-table"
              columns={JOURNEY_COLUMNS}
              rows={data.topJourneys}
              defaultSort={{ field: "revenue", dir: "desc" }}
              secondarySortField="sent"
              rowKey="id"
              maxRows={10}
            />
          </div>

          <GroupedBarChart
            testId="fastrr-trigger-split"
            title="Revenue by trigger event"
            data={data.triggerSplit}
            xKey="trigger"
            series={[{ key: "revenue", label: "Revenue", color: "#6C3AE8" }]}
            valueFormatter={formatCompactNumber}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="ConversionRoiSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/ConversionRoiSection.jsx src/components/analytics/fastrr/sections/__tests__/ConversionRoiSection.test.jsx
git commit -m "feat(analytics): add ConversionRoiSection"
```

---

## Task 15: `SegmentComparisonSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/SegmentComparisonSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/SegmentComparisonSection.test.jsx`

**Interfaces:**
- Consumes: `ComparisonLineChart` (`src/components/analytics/overview/ComparisonLineChart.jsx`, whose data points use `date`/`overall`/`fastrr` keys), `PoweredByLabel`/`SectionSkeleton` (Task 6), the `segmentComparison` shape from Task 4.
- Produces: `SegmentComparisonSection({ data: SegmentComparisonData, isLoading })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/SegmentComparisonSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import SegmentComparisonSection from "../SegmentComparisonSection";

const FIXTURE = {
  segments: [
    { key: "known", label: "Known", orders: 9000, revenue: 8000000, aov: 900, repeatRate: 40, engagementRate: 62 },
    { key: "fastrrIdentified", label: "Fastrr-Identified", orders: 4000, revenue: 3600000, aov: 900, repeatRate: 31, engagementRate: 55 },
    { key: "anonymous", label: "Anonymous", orders: 1200, revenue: 1000000, aov: 830, repeatRate: 7, engagementRate: 12 },
  ],
  growthTrend: [{ period: "Wk 1", conversionRate: 4 }, { period: "Wk 2", conversionRate: 4.8 }],
  topIdentifiedUsers: [{ id: "u1", name: "Ritika Desai", identifiedOn: "01 Sep 2026", ltv: 24000 }],
  repeatCohort: [{ week: "W0", fastrrIdentified: 22, known: 30 }, { week: "W1", fastrrIdentified: 18, known: 26 }],
};

describe("SegmentComparisonSection", () => {
  test("shows skeleton while loading", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-segments-skeleton")).toBeInTheDocument();
  });

  test("each segment card shows rates before raw counts", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    const card = screen.getByTestId("fastrr-segment-known");
    const rateIndex = card.innerHTML.indexOf("fastrr-segment-known-repeat-rate");
    const countIndex = card.innerHTML.indexOf("Orders:");
    expect(rateIndex).toBeGreaterThan(-1);
    expect(rateIndex).toBeLessThan(countIndex);
  });

  test("renders the Top Identified Users extra with a disabled stub link", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-top-identified-users")).toHaveTextContent("Ritika Desai");
    expect(screen.getByTestId("fastrr-top-identified-user-u1-view-in-audience")).toBeDisabled();
  });

  test("renders the repeat-purchase cohort curve extra", () => {
    render(<SegmentComparisonSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-repeat-cohort")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="SegmentComparisonSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/SegmentComparisonSection.jsx`:

```jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ComparisonLineChart from "../../overview/ComparisonLineChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency, formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SegmentComparisonSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-segments-skeleton" rows={5} />;

  return (
    <div data-testid="fastrr-segments-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Known vs Fastrr-Identified vs Anonymous</h2>
        <PoweredByLabel source="Shiprocket customer profile" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.segments.map((seg) => (
          <div key={seg.key} className="bg-surface border border-border rounded-lg p-4" data-testid={`fastrr-segment-${seg.key}`}>
            <h3 className="text-[13px] font-semibold text-text-primary mb-3">{seg.label}</h3>
            <div>
              <div className="text-[11px] text-text-muted">Repeat Rate</div>
              <div className="text-lg font-semibold tabular-nums" data-testid={`fastrr-segment-${seg.key}-repeat-rate`}>{formatPercent(seg.repeatRate)}</div>
            </div>
            <div className="mt-2">
              <div className="text-[11px] text-text-muted">Engagement Rate</div>
              <div className="text-lg font-semibold tabular-nums" data-testid={`fastrr-segment-${seg.key}-engagement-rate`}>{formatPercent(seg.engagementRate)}</div>
            </div>
            <div className="mt-3 pt-2 border-t border-border text-[11px] text-text-muted space-y-0.5">
              <div>Orders: {formatCompactNumber(seg.orders)}</div>
              <div>Revenue: {formatCompactCurrency(seg.revenue)}</div>
              <div>AOV: {formatCompactCurrency(seg.aov)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-segments-growth-trend">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Anonymous → Identified conversion trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.growthTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis dataKey="period" tick={TICK} stroke="#94A3B8" />
              <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="conversionRate" stroke="#6C3AE8" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-top-identified-users">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Top Identified Users</h3>
        <table className="w-full text-left text-[12px]">
          <thead className="text-text-muted uppercase text-[10px]">
            <tr><th className="py-1">Name</th><th className="py-1">Identified On</th><th className="py-1">LTV</th><th className="py-1"></th></tr>
          </thead>
          <tbody>
            {data.topIdentifiedUsers.map((u) => (
              <tr key={u.id} className="border-t border-border" data-testid={`fastrr-top-identified-user-${u.id}`}>
                <td className="py-1.5">{u.name}</td>
                <td className="py-1.5 text-text-muted">{u.identifiedOn}</td>
                <td className="py-1.5 tabular-nums">{formatCompactCurrency(u.ltv)}</td>
                <td className="py-1.5 text-right">
                  <button type="button" disabled data-testid={`fastrr-top-identified-user-${u.id}-view-in-audience`} className="text-text-muted cursor-not-allowed">
                    View in Audience
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ComparisonLineChart
        testId="fastrr-repeat-cohort"
        title="Repeat-purchase cohort: Fastrr-Identified vs Known"
        data={data.repeatCohort.map((p) => ({ date: p.week, overall: p.known, fastrr: p.fastrrIdentified }))}
        seriesLabels={{ overall: "Known", fastrr: "Fastrr-Identified" }}
        valueFormatter={(v) => formatPercent(v)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="SegmentComparisonSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/SegmentComparisonSection.jsx src/components/analytics/fastrr/sections/__tests__/SegmentComparisonSection.test.jsx
git commit -m "feat(analytics): add SegmentComparisonSection"
```

---

## Task 16: `SmartCardSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/SmartCardSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/SmartCardSection.test.jsx`

**Interfaces:**
- Consumes: `PoweredByLabel`/`SectionSkeleton`, `formatPercent`/`formatSeconds` (Task 1), the `smartCard` shape from Task 5.
- Produces: `SmartCardSection({ data: SmartCardData, isLoading })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/SmartCardSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import SmartCardSection from "../SmartCardSection";

const FIXTURE = {
  autofillTriggerRate: 62,
  acceptanceRate: 78,
  fieldEditRates: [
    { field: "Name", editRate: 4 }, { field: "Phone", editRate: 6 }, { field: "Address", editRate: 17 }, { field: "Pincode", editRate: 9 },
  ],
  checkoutTimeSeconds: { smartCard: 32, manual: 118 },
  conversionRate: { smartCard: 38, standard: 21 },
  dropoffByStep: [{ step: "Cart", withSmartCard: 8, withoutSmartCard: 20 }],
};

describe("SmartCardSection", () => {
  test("shows skeleton while loading", () => {
    render(<SmartCardSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-smart-card-skeleton")).toBeInTheDocument();
  });

  test("the conversion-rate comparison is given visual priority (rendered first)", () => {
    const { container } = render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    const conversionIndex = container.innerHTML.indexOf("fastrr-smart-card-conversion");
    const ratesIndex = container.innerHTML.indexOf("fastrr-smart-card-rates");
    expect(conversionIndex).toBeGreaterThan(-1);
    expect(conversionIndex).toBeLessThan(ratesIndex);
  });

  test("renders checkout time using formatSeconds", () => {
    render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-smart-card-checkout-time")).toHaveTextContent("32s");
    expect(screen.getByTestId("fastrr-smart-card-checkout-time")).toHaveTextContent("1m 58s");
  });

  test("field edit rates cover Name, Phone, Address, Pincode", () => {
    render(<SmartCardSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-field-edit-rate-name")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-phone")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-address")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-field-edit-rate-pincode")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="SmartCardSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/SmartCardSection.jsx`:

```jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatPercent, formatSeconds } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SmartCardSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-smart-card-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-smart-card-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Smart Card deep-dive</h2>
        <PoweredByLabel source="Fastrr checkout SDK" />
      </div>

      <div className="bg-primary-tint border border-primary/40 rounded-lg p-5" data-testid="fastrr-smart-card-conversion">
        <span className="text-[11px] uppercase tracking-wide text-primary font-medium">Conversion Rate: Smart Card vs Standard</span>
        <div className="mt-2 flex items-center gap-8">
          <div><div className="text-[11px] text-text-muted">Smart-Card-assisted</div><div className="text-2xl font-semibold text-primary tabular-nums">{formatPercent(data.conversionRate.smartCard)}</div></div>
          <div><div className="text-[11px] text-text-muted">Standard checkout</div><div className="text-2xl font-semibold text-text-primary tabular-nums">{formatPercent(data.conversionRate.standard)}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-rates">
          <div className="text-[11px] text-text-muted">Autofill Trigger Rate</div>
          <div className="text-lg font-semibold tabular-nums">{formatPercent(data.autofillTriggerRate)}</div>
          <div className="text-[11px] text-text-muted mt-2">Acceptance Rate</div>
          <div className="text-lg font-semibold tabular-nums">{formatPercent(data.acceptanceRate)}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-checkout-time">
          <div className="text-[11px] text-text-muted">Checkout time — Smart Card</div>
          <div className="text-lg font-semibold tabular-nums">{formatSeconds(data.checkoutTimeSeconds.smartCard)}</div>
          <div className="text-[11px] text-text-muted mt-2">Checkout time — Manual</div>
          <div className="text-lg font-semibold tabular-nums">{formatSeconds(data.checkoutTimeSeconds.manual)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-field-edit-rates">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Per-field edit rate after autofill</h3>
        <div className="grid grid-cols-4 gap-2">
          {data.fieldEditRates.map((f) => (
            <div key={f.field} className="text-center" data-testid={`fastrr-field-edit-rate-${f.field.toLowerCase()}`}>
              <div className="text-[11px] text-text-muted">{f.field}</div>
              <div className="text-[13px] font-semibold tabular-nums">{formatPercent(f.editRate)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-dropoff">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Drop-off per checkout step, with vs without Smart Card</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dropoffByStep} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis dataKey="step" tick={TICK} stroke="#94A3B8" />
              <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="withSmartCard" name="With Smart Card" fill="#6C3AE8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withoutSmartCard" name="Without Smart Card" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="SmartCardSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/SmartCardSection.jsx src/components/analytics/fastrr/sections/__tests__/SmartCardSection.test.jsx
git commit -m "feat(analytics): add SmartCardSection"
```

---

## Task 17: `TrendsSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/TrendsSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/TrendsSection.test.jsx`

**Interfaces:**
- Consumes: `PoweredByLabel`/`SectionSkeleton`, `formatCompactNumber`/`formatPercent`, the `trends` shape from Task 5 (`{identificationRate, messagingFunnel, ordersRevenue, repeatOrders}`, each `{day, week, deltaPct}`).
- Produces: `TrendsSection({ data: TrendsData, isLoading })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/TrendsSection.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TrendsSection from "../TrendsSection";

function series(base) {
  return {
    day: [{ period: "01 Sep", value: base, sent: base, delivered: base, read: base, clicked: base, orders: base, revenue: base }],
    week: [{ period: "Wk 27", value: base + 5, sent: base + 5, delivered: base + 5, read: base + 5, clicked: base + 5, orders: base + 5, revenue: base + 5 }],
    deltaPct: 8,
  };
}

const FIXTURE = {
  identificationRate: series(20),
  messagingFunnel: series(9000),
  ordersRevenue: series(300),
  repeatOrders: series(400),
};

describe("TrendsSection", () => {
  test("shows skeleton while loading", () => {
    render(<TrendsSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-trends-skeleton")).toBeInTheDocument();
  });

  test("renders all 4 charts in a 2x2 grid with a %-change chip each", () => {
    render(<TrendsSection data={FIXTURE} isLoading={false} />);
    ["fastrr-trend-identification-rate", "fastrr-trend-messaging-funnel", "fastrr-trend-orders-revenue", "fastrr-trend-repeat-orders"].forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
      expect(screen.getByTestId(`${id}-delta-chip`)).toHaveTextContent("8%");
    });
  });

  test("granularity toggle switches the active button per chart", () => {
    render(<TrendsSection data={FIXTURE} isLoading={false} />);
    const dayBtn = screen.getByTestId("fastrr-trend-identification-rate-granularity-day");
    const weekBtn = screen.getByTestId("fastrr-trend-identification-rate-granularity-week");
    expect(dayBtn).toHaveClass("bg-primary");
    fireEvent.click(weekBtn);
    expect(weekBtn).toHaveClass("bg-primary");
    expect(dayBtn).not.toHaveClass("bg-primary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="TrendsSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/TrendsSection.jsx`:

```jsx
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatCompactNumber, formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };
const LINE_COLORS = ["#6C3AE8", "#94A3B8", "#22C55E", "#F59E0B"];

function pctChip(deltaPct) {
  const tone = deltaPct < 0 ? "negative" : "positive";
  const arrow = deltaPct < 0 ? "↓" : "↑";
  return { text: `${arrow} ${Math.abs(deltaPct)}%`, tone };
}

function TrendChartCard({ testId, title, series, lines, valueFormatter }) {
  const [granularity, setGranularity] = useState("day");
  const data = series[granularity];
  const chip = pctChip(series.deltaPct);

  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <span
            data-testid={`${testId}-delta-chip`}
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              chip.tone === "negative" ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50"
            }`}
          >
            {chip.text}
          </span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              data-testid={`${testId}-granularity-day`}
              onClick={() => setGranularity("day")}
              className={`px-2 py-0.5 text-[10px] font-medium ${granularity === "day" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
            >
              Day
            </button>
            <button
              type="button"
              data-testid={`${testId}-granularity-week`}
              onClick={() => setGranularity("week")}
              className={`px-2 py-0.5 text-[10px] font-medium ${granularity === "week" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey="period" tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {lines.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrendsSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-trends-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-trends-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Trends / Lifecycle</h2>
        <PoweredByLabel source="Engage360 analytics warehouse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TrendChartCard testId="fastrr-trend-identification-rate" title="Identification Rate" series={data.identificationRate} lines={["value"]} valueFormatter={(v) => formatPercent(v)} />
        <TrendChartCard testId="fastrr-trend-messaging-funnel" title="Sent / Delivered / Read / Clicked" series={data.messagingFunnel} lines={["sent", "delivered", "read", "clicked"]} valueFormatter={formatCompactNumber} />
        <TrendChartCard testId="fastrr-trend-orders-revenue" title="Orders & Revenue" series={data.ordersRevenue} lines={["orders", "revenue"]} valueFormatter={formatCompactNumber} />
        <TrendChartCard testId="fastrr-trend-repeat-orders" title="Repeat Orders" series={data.repeatOrders} lines={["value"]} valueFormatter={formatCompactNumber} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="TrendsSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/TrendsSection.jsx src/components/analytics/fastrr/sections/__tests__/TrendsSection.test.jsx
git commit -m "feat(analytics): add TrendsSection"
```

---

## Task 18: `SourceBreakdownSection`

**Files:**
- Create: `src/components/analytics/fastrr/sections/SourceBreakdownSection.jsx`
- Test: `src/components/analytics/fastrr/sections/__tests__/SourceBreakdownSection.test.jsx`

**Interfaces:**
- Consumes: `GroupedBarChart` (Task 7), `PoweredByLabel`/`SectionSkeleton`, `formatPercent`, the `sourceBreakdown` shape from Task 5.
- Produces: `SourceBreakdownSection({ data: SourceBreakdownData, isLoading })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/fastrr/sections/__tests__/SourceBreakdownSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import SourceBreakdownSection from "../SourceBreakdownSection";

const FIXTURE = {
  sources: [
    { source: "Smart Card", pct: 34 }, { source: "Checkout", pct: 27 }, { source: "Pop-up", pct: 18 }, { source: "Cookie", pct: 12 }, { source: "Signup", pct: 9 },
  ],
  deviceSplit: [{ device: "Web (Desktop)", pct: 38 }, { device: "Web (Mobile)", pct: 44 }, { device: "App", pct: 18 }],
};

describe("SourceBreakdownSection", () => {
  test("shows skeleton while loading", () => {
    render(<SourceBreakdownSection data={FIXTURE} isLoading />);
    expect(screen.getByTestId("fastrr-source-skeleton")).toBeInTheDocument();
  });

  test("renders the source breakdown and device split", () => {
    render(<SourceBreakdownSection data={FIXTURE} isLoading={false} />);
    expect(screen.getByTestId("fastrr-source-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-device-split")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="SourceBreakdownSection" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/sections/SourceBreakdownSection.jsx`:

```jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GroupedBarChart from "../shared/GroupedBarChart";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import { formatPercent } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SourceBreakdownSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-source-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-source-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Segmentation / Source breakdown</h2>
        <PoweredByLabel source="Fastrr SDK" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-source-breakdown">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Identification source</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sources} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <YAxis type="category" dataKey="source" tick={TICK} stroke="#94A3B8" width={80} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="pct" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <GroupedBarChart
        testId="fastrr-device-split"
        title="Device / platform split"
        data={data.deviceSplit}
        xKey="device"
        series={[{ key: "pct", label: "% of sessions", color: "#6C3AE8" }]}
        valueFormatter={(v) => formatPercent(v)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="SourceBreakdownSection" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/sections/SourceBreakdownSection.jsx src/components/analytics/fastrr/sections/__tests__/SourceBreakdownSection.test.jsx
git commit -m "feat(analytics): add SourceBreakdownSection"
```

---

## Task 19: `FastrrIdentificationTab` — wire everything together

**Files:**
- Create: `src/components/analytics/fastrr/FastrrIdentificationTab.jsx`
- Test: `src/components/analytics/fastrr/__tests__/FastrrIdentificationTab.test.jsx`

**Interfaces:**
- Consumes: `FastrrFilterBar` (Task 10), `AnchorNav` (Task 11), all 8 section components (Tasks 12-18), `getFastrrIdentificationAnalytics` (Task 5).
- Produces: `FastrrIdentificationTab()` — no props; renders `data-testid="fastrr-identification-tab"`. Section wrapper ids (`fastrr-hero`, `fastrr-funnel`, `fastrr-engagement`, `fastrr-conversion`, `fastrr-segments`, `fastrr-smart-card`, `fastrr-trends`, `fastrr-source`) are the contract `AnchorNav` depends on (Task 11).

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/fastrr/__tests__/FastrrIdentificationTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FastrrIdentificationTab from "../FastrrIdentificationTab";

beforeEach(() => {
  jest.useFakeTimers();
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("FastrrIdentificationTab", () => {
  test("renders all 8 sections after the initial loading delay resolves", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    [
      "fastrr-hero-section", "fastrr-funnel-section", "fastrr-engagement-section",
      "fastrr-conversion-section", "fastrr-segments-section", "fastrr-smart-card-section",
      "fastrr-trends-section", "fastrr-source-section",
    ].forEach((id) => expect(screen.getByTestId(id)).toBeInTheDocument());
  });

  test("changing a filter shows the Hero skeleton, then resolves back to content", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-date-this_month"));
    expect(screen.getByTestId("fastrr-hero-skeleton")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.queryByTestId("fastrr-hero-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-section")).toBeInTheDocument();
  });

  test("AI Calling + Today shows the per-section empty state for engagement and conversion only", () => {
    render(<FastrrIdentificationTab />);
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-date-today"));
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.click(screen.getByTestId("fastrr-channel-ai-calling"));
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByTestId("fastrr-engagement-empty")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-conversion-empty")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-hero-section")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="FastrrIdentificationTab" --watchAll=false`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

Create `src/components/analytics/fastrr/FastrrIdentificationTab.jsx`:

```jsx
import React, { useEffect, useMemo, useState } from "react";
import FastrrFilterBar from "./FastrrFilterBar";
import AnchorNav from "./AnchorNav";
import HeroBandSection from "./sections/HeroBandSection";
import IdentificationFunnelSection from "./sections/IdentificationFunnelSection";
import EngagementSection from "./sections/EngagementSection";
import ConversionRoiSection from "./sections/ConversionRoiSection";
import SegmentComparisonSection from "./sections/SegmentComparisonSection";
import SmartCardSection from "./sections/SmartCardSection";
import TrendsSection from "./sections/TrendsSection";
import SourceBreakdownSection from "./sections/SourceBreakdownSection";
import { getFastrrIdentificationAnalytics } from "./data/mockFastrrIdentification";

const SECTIONS = [
  { id: "fastrr-hero", label: "Overview" },
  { id: "fastrr-funnel", label: "Funnel" },
  { id: "fastrr-engagement", label: "Engagement" },
  { id: "fastrr-conversion", label: "Conversion & ROI" },
  { id: "fastrr-segments", label: "Segments" },
  { id: "fastrr-smart-card", label: "Smart Card" },
  { id: "fastrr-trends", label: "Trends" },
  { id: "fastrr-source", label: "Source Breakdown" },
];

const LOADING_DELAY_MS = 400;

export default function FastrrIdentificationTab() {
  const [datePreset, setDatePreset] = useState("last_7_days");
  const [compare, setCompare] = useState(true);
  const [channel, setChannel] = useState("All");
  const [isLoading, setIsLoading] = useState(false);

  const filters = useMemo(() => ({ datePreset, compare, channel }), [datePreset, compare, channel]);
  const data = useMemo(() => getFastrrIdentificationAnalytics(filters), [filters]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div data-testid="fastrr-identification-tab" className="space-y-6">
      <FastrrFilterBar
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        compare={compare}
        onCompareChange={setCompare}
        channel={channel}
        onChannelChange={setChannel}
      />
      <AnchorNav sections={SECTIONS} />

      <section id="fastrr-hero"><HeroBandSection data={data.hero} compare={compare} isLoading={isLoading} /></section>
      <section id="fastrr-funnel"><IdentificationFunnelSection data={data.funnel} isLoading={isLoading} /></section>
      <section id="fastrr-engagement"><EngagementSection data={data.engagement} isLoading={isLoading} /></section>
      <section id="fastrr-conversion"><ConversionRoiSection data={data.conversionRoi} isLoading={isLoading} /></section>
      <section id="fastrr-segments"><SegmentComparisonSection data={data.segmentComparison} isLoading={isLoading} /></section>
      <section id="fastrr-smart-card"><SmartCardSection data={data.smartCard} isLoading={isLoading} /></section>
      <section id="fastrr-trends"><TrendsSection data={data.trends} isLoading={isLoading} /></section>
      <section id="fastrr-source"><SourceBreakdownSection data={data.sourceBreakdown} isLoading={isLoading} /></section>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="FastrrIdentificationTab" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/fastrr/FastrrIdentificationTab.jsx src/components/analytics/fastrr/__tests__/FastrrIdentificationTab.test.jsx
git commit -m "feat(analytics): wire up FastrrIdentificationTab"
```

---

## Task 20: Wire the new tab into `Analytics.jsx`

**Files:**
- Modify: `src/pages/Analytics.jsx`
- Modify: `src/pages/__tests__/Analytics.test.jsx`

**Interfaces:**
- Consumes: `FastrrIdentificationTab` (Task 19).

- [ ] **Step 1: Write the failing test**

Append to `src/pages/__tests__/Analytics.test.jsx`, inside the `describe("AnalyticsPage", ...)` block:

```jsx
  test("Fastrr Identification tab sits between Journey and Reports and renders its content", () => {
    const tabNames = TABS_ORDER_FOR_TEST;
    expect(tabNames.indexOf("Journey")).toBeLessThan(tabNames.indexOf("Fastrr Identification"));
    expect(tabNames.indexOf("Fastrr Identification")).toBeLessThan(tabNames.indexOf("Reports"));

    jest.useFakeTimers();
    renderAtTab("overview");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Fastrr Identification" }));
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByTestId("fastrr-identification-tab")).toBeInTheDocument();
    jest.useRealTimers();
  });
```

This references `act` and a `TABS_ORDER_FOR_TEST` helper — add both near the top of the file (below the existing imports, above `renderAtTab`):

```jsx
import { act } from "@testing-library/react"; // add "act" to the existing @testing-library/react import instead of a second import line

const TABS_ORDER_FOR_TEST = ["Overview", "Campaign", "Journey", "Fastrr Identification", "Reports", "Communication Logs"];
```

(Merge the `act` import into the existing `import { render, screen, fireEvent } from "@testing-library/react";` line rather than adding a duplicate import statement.)

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern="^src/pages/__tests__/Analytics.test.jsx$" --watchAll=false`
Expected: FAIL — no tab named "Fastrr Identification" exists yet.

- [ ] **Step 3: Implement**

In `src/pages/Analytics.jsx`, add the import and update `TABS` and the render branch:

```jsx
import FastrrIdentificationTab from "@/components/analytics/fastrr/FastrrIdentificationTab";
```

```jsx
const TABS = [
  { value: "overview", label: "Overview" },
  { value: "campaign", label: "Campaign" },
  { value: "journey", label: "Journey" },
  { value: "fastrr-identification", label: "Fastrr Identification" },
  { value: "reports", label: "Reports" },
  { value: "logs", label: "Communication Logs" },
];
```

```jsx
      {activeTab === "overview" && <OverviewTab timeRange={timeRange} />}
      {activeTab === "campaign" && <ComingSoonPanel tabName="Campaign" testId="analytics-tab-campaign" />}
      {activeTab === "journey" && <ComingSoonPanel tabName="Journey" testId="analytics-tab-journey" />}
      {activeTab === "fastrr-identification" && <FastrrIdentificationTab />}
      {activeTab === "reports" && <ComingSoonPanel tabName="Reports" testId="analytics-tab-reports" />}
      {activeTab === "logs" && <CommunicationLogsTab />}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `CI=true npx craco test --testPathPattern="^src/pages/__tests__/Analytics.test.jsx$" --watchAll=false`
Expected: PASS, all tests in the file (including the pre-existing ones — the new tab must not shift or break the Campaign/Journey/Reports/Communication Logs switch tests).

- [ ] **Step 5: Run the full Fastrr + Analytics test surface**

Run: `CI=true npx craco test --testPathPattern="fastrr|Analytics|analyticsFormat" --watchAll=false`
Expected: PASS — every test file created or touched across Tasks 1-20.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Analytics.jsx src/pages/__tests__/Analytics.test.jsx
git commit -m "feat(analytics): add Fastrr Identification tab between Journey and Reports"
```

---

## Self-Review Notes (already applied above)

- **Spec coverage:** §1 Hero (Task 12), §2 Funnel (Task 13), §3 Engagement (Task 13), §4 Conversion/ROI (Task 14), §5 Segment Comparison + both approved extras (Task 15), §6 Smart Card (Task 16), §7 Trends (Task 17), §8 Source Breakdown (Task 18) — all covered. Global rules (anchor nav, filter bar, Powered-by, delta chips, attribution pairs, loading/empty states) covered by Tasks 6, 10, 11 and threaded through every section task.
- **Type consistency verified:** `hero`/`funnel`/`engagement`/`conversionRoi`/`segmentComparison`/`smartCard`/`trends`/`sourceBreakdown` field names are identical between their producing task (2-5) and every consuming section task (12-18) — cross-checked field-by-field while writing Tasks 12-19.
- **Fixed the seed-independence bug** for `segmentComparison`/`smartCard`/`trends.identificationRate`/`trends.repeatOrders`/`sourceBreakdown` while drafting Task 4 (introduced `identificationSeed(datePreset)`, channel-independent) — this is already reflected in Tasks 4-5's code, not a follow-up item.
- **No placeholders:** every step above has literal code, not a description of code.
