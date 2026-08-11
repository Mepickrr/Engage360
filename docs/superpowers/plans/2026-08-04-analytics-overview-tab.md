# Analytics Page Shell + Overview Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/analytics` into a 4-tab dashboard shell (Overview / Campaign / Journey / Reports) with a working, fully-built Overview tab backed by mock data; the other 3 tabs render a "Coming soon" placeholder.

**Architecture:** `src/pages/Analytics.jsx` renders a persistent header (title, Radix `Tabs` tab bar, `TimeRangeFilter`) whose active tab is driven by a `:tab` URL param (`/analytics/:tab`), and a body that switches between `OverviewTab`, and three `ComingSoonPanel` instances. `OverviewTab` composes reusable presentational components (`MetricCard`, `RoiCard`, `SplitBarChart`, `ComparisonLineChart`) fed by a new mock data module keyed by time-range preset.

**Tech Stack:** React 19, react-router-dom v7, Recharts v3 (already a dependency), Radix `Tabs`/`Popover`/`Tooltip` via existing `src/components/ui/*` wrappers, react-day-picker `Calendar` (already present), Tailwind design tokens (`bg-surface`, `border-border`, `text-text-primary`, `text-text-muted`, `text-primary`).

## Global Constraints

- Every "Bik" in wireframe copy → **"Fastrr"** (Fastrr Revenue, Fastrr Orders, Fastrr Customers Acquired, Fastrr Revenue split by, Fastrr Orders split by).
- No "Avimee" anywhere — mock identifiers are generic placeholders.
- All data is mock/dummy — no backend integration in this phase.
- Visual style follows the existing design system (`bg-surface border border-border rounded-lg` cards, `text-text-primary`/`text-text-muted` typography, `#6C3AE8` primary/purple for "Fastrr" series, neutral grey/slate for "Overall" series) — NOT the wireframe's raw grey/purple mockup look.
- Time filter default: **Last 7 Days**. Options: `Today, Yesterday, Last 7 Days, This Month, Last Month, Custom Range`.
- Custom Range approximates to the `last_7_days` mock dataset (no real date-math in this phase).
- Campaign/Journey/Reports tabs are out of scope for content — placeholder only.
- Currency formatting: Indian-style compact (`₹2.1C`, `₹36.1L`, `₹95,518`). Count formatting: `K` suffix (`24.55K`, `3.75K`).

---

### Task 1: Number formatting helpers

**Files:**
- Create: `src/lib/analyticsFormat.js`
- Test: `src/lib/__tests__/analyticsFormat.test.js`

**Interfaces:**
- Produces: `formatCompactCurrency(value: number): string` — e.g. `formatCompactCurrency(210000000) === "₹2.1C"`, `formatCompactCurrency(3610000) === "₹36.1L"`, `formatCompactCurrency(95518) === "₹95.5K"`.
- Produces: `formatCompactNumber(value: number): string` — e.g. `formatCompactNumber(24550) === "24.55K"`, `formatCompactNumber(155) === "155"`.
- Produces: `formatDelta(deltaPct: number, deltaAbs: number, formatter: (n:number)=>string): { text: string, tone: "positive"|"negative" }` — e.g. `formatDelta(8, 1535000, formatCompactCurrency)` → `{ text: "↑ 8% (+₹15.35L)", tone: "positive" }`; negative `deltaPct` → `↓` and `tone: "negative"`.

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/__tests__/analyticsFormat.test.js
import { formatCompactCurrency, formatCompactNumber, formatDelta } from "../analyticsFormat";

describe("formatCompactCurrency", () => {
  test("formats crores", () => {
    expect(formatCompactCurrency(210000000)).toBe("₹2.1C");
  });
  test("formats lakhs", () => {
    expect(formatCompactCurrency(3610000)).toBe("₹36.1L");
  });
  test("formats thousands", () => {
    expect(formatCompactCurrency(95518)).toBe("₹95.5K");
  });
  test("formats small values with no suffix", () => {
    expect(formatCompactCurrency(449)).toBe("₹449");
  });
});

describe("formatCompactNumber", () => {
  test("formats thousands with K suffix", () => {
    expect(formatCompactNumber(24550)).toBe("24.55K");
  });
  test("formats sub-thousand values as-is", () => {
    expect(formatCompactNumber(155)).toBe("155");
  });
});

describe("formatDelta", () => {
  test("positive delta uses up arrow and positive tone", () => {
    const result = formatDelta(8, 1535000, formatCompactCurrency);
    expect(result.text).toBe("↑ 8% (+₹15.35L)");
    expect(result.tone).toBe("positive");
  });
  test("negative delta uses down arrow and negative tone", () => {
    const result = formatDelta(-5, -900, formatCompactNumber);
    expect(result.text).toBe("↓ 5% (-900)");
    expect(result.tone).toBe("negative");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test src/lib/__tests__/analyticsFormat.test.js --watchAll=false`
Expected: FAIL with "Cannot find module '../analyticsFormat'"

- [ ] **Step 3: Implement the formatters**

```js
// src/lib/analyticsFormat.js
export function formatCompactCurrency(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}C`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatCompactNumber(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e3) {
    const scaled = abs / 1e3;
    const rounded = Math.round(scaled * 100) / 100;
    return `${sign}${rounded}K`;
  }
  return `${sign}${abs}`;
}

export function formatDelta(deltaPct, deltaAbs, formatter) {
  const tone = deltaPct < 0 ? "negative" : "positive";
  const arrow = deltaPct < 0 ? "↓" : "↑";
  const pctText = Math.abs(deltaPct);
  const absSign = deltaAbs < 0 ? "-" : "+";
  const absText = formatter(Math.abs(deltaAbs));
  return {
    text: `${arrow} ${pctText}% (${absSign}${absText})`,
    tone,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test src/lib/__tests__/analyticsFormat.test.js --watchAll=false`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/analyticsFormat.js src/lib/__tests__/analyticsFormat.test.js
git commit -m "feat: add compact currency/number formatters for analytics"
```

---

### Task 2: Mock data module

**Files:**
- Create: `src/data/mockOverviewAnalytics.js`
- Test: `src/data/__tests__/mockOverviewAnalytics.test.js`

**Interfaces:**
- Consumes: nothing (pure data module).
- Produces: `getOverviewAnalytics(timeRange: string): OverviewAnalyticsEntry`, falling back to the `last_7_days` entry for unknown/`custom` keys.
- Produces: `OverviewAnalyticsEntry` shape (consumed by Task 4+):
  ```
  {
    revenue: {
      overall: { value: number, deltaPct: number, deltaAbs: number },
      fastrr:  { value: number, deltaPct: number, deltaAbs: number, pctOfOverall: number },
    },
    orders: {
      overall: { value: number, deltaPct: number, deltaAbs: number },
      fastrr:  { value: number, deltaPct: number, deltaAbs: number, pctOfOverall: number },
    },
    roi: {
      value: number,
      totalRevenue: number,
      totalCost: number,
      byChannel: { whatsapp, email, instagram, sms, rcs, aiCalling, aiChatbot }, // numbers
    },
    revenueSplit: {
      byService: [{ label: string, value: number }],
      byChannel: [{ label: string, value: number }],
    },
    ordersSplit: {
      byService: [{ label: string, value: number }],
      byChannel: [{ label: string, value: number }],
    },
    revenueTrend: [{ date: string, overall: number, fastrr: number }],
    ordersTrend:  [{ date: string, overall: number, fastrr: number }],
    customersAcquired: {
      overall: { value: number, deltaPct: number, deltaAbs: number },
      fastrr:  { value: number, deltaPct: number, deltaAbs: number },
      bySource: [{ source: string, count: number }],
    },
    customersTrend: [{ date: string, overall: number, fastrr: number }],
  }
  ```

- [ ] **Step 1: Write the failing test**

```js
// src/data/__tests__/mockOverviewAnalytics.test.js
import { getOverviewAnalytics } from "../mockOverviewAnalytics";

describe("getOverviewAnalytics", () => {
  test("returns the last_7_days entry with wireframe-matching top-line numbers", () => {
    const data = getOverviewAnalytics("last_7_days");
    expect(data.revenue.overall.value).toBe(210000000);
    expect(data.revenue.fastrr.value).toBe(3610000);
    expect(data.revenue.fastrr.pctOfOverall).toBeCloseTo(17.0, 1);
    expect(data.orders.overall.value).toBe(24550);
    expect(data.orders.fastrr.value).toBe(3750);
    expect(data.roi.value).toBeCloseTo(10.85, 2);
  });

  test("has an entry for every preset", () => {
    ["today", "yesterday", "last_7_days", "this_month", "last_month"].forEach((key) => {
      const data = getOverviewAnalytics(key);
      expect(data.revenue.overall.value).toBeGreaterThan(0);
      expect(data.revenueTrend.length).toBeGreaterThan(0);
    });
  });

  test("falls back to last_7_days for an unknown key", () => {
    expect(getOverviewAnalytics("bogus")).toEqual(getOverviewAnalytics("last_7_days"));
    expect(getOverviewAnalytics("custom")).toEqual(getOverviewAnalytics("last_7_days"));
  });

  test("contains no BIK or Avimee strings anywhere in the dataset", () => {
    const serialized = JSON.stringify(getOverviewAnalytics("last_7_days"));
    expect(serialized).not.toMatch(/\bBIK\b/i);
    expect(serialized).not.toMatch(/Avimee/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/data/__tests__/mockOverviewAnalytics.test.js --watchAll=false`
Expected: FAIL with "Cannot find module '../mockOverviewAnalytics'"

- [ ] **Step 3: Implement the mock data module**

```js
// src/data/mockOverviewAnalytics.js
// Mock analytics for the Analytics > Overview tab. All numbers are dummy data.

const DAY_LABELS_7 = ["28 Jul", "29 Jul", "30 Jul", "31 Jul", "01 Aug", "02 Aug", "03 Aug", "04 Aug"];

function trend(labels, overallSeries, fastrrSeries) {
  return labels.map((date, i) => ({ date, overall: overallSeries[i], fastrr: fastrrSeries[i] }));
}

const CHANNEL_LABELS = ["WhatsApp", "SMS", "RCS", "Email", "Instagram", "AI Calling", "AI Chatbot"];
const SERVICE_LABELS = ["Broadcast", "Journey"];

const OVERVIEW_ANALYTICS = {
  last_7_days: {
    revenue: {
      overall: { value: 210000000, deltaPct: 8, deltaAbs: 1535000 },
      fastrr: { value: 3610000, deltaPct: 3, deltaAbs: 89150, pctOfOverall: 17.0 },
    },
    orders: {
      overall: { value: 24550, deltaPct: 9, deltaAbs: 2050 },
      fastrr: { value: 3750, deltaPct: 5, deltaAbs: 162, pctOfOverall: 15.2 },
    },
    roi: {
      value: 10.85,
      totalRevenue: 3460000,
      totalCost: 320000,
      byChannel: {
        whatsapp: 10.85,
        email: 0,
        instagram: 0,
        sms: 0,
        rcs: 0,
        aiCalling: 0,
        aiChatbot: 0,
      },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 2060000 },
        { label: "Journey", value: 1545000 },
      ],
      byChannel: [
        { label: "WhatsApp", value: 3350000 },
        { label: "SMS", value: 120000 },
        { label: "RCS", value: 60000 },
        { label: "Email", value: 40000 },
        { label: "Instagram", value: 25000 },
        { label: "AI Calling", value: 10000 },
        { label: "AI Chatbot", value: 5000 },
      ],
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 2050 },
        { label: "Journey", value: 1650 },
      ],
      byChannel: [
        { label: "WhatsApp", value: 3400 },
        { label: "SMS", value: 180 },
        { label: "RCS", value: 90 },
        { label: "Email", value: 50 },
        { label: "Instagram", value: 20 },
        { label: "AI Calling", value: 6 },
        { label: "AI Chatbot", value: 4 },
      ],
    },
    revenueTrend: trend(
      DAY_LABELS_7,
      [0, 3000000, 3050000, 3080000, 3200000, 4000000, 3800000, 1500000],
      [10000, 155000, 130000, 145000, 190000, 380000, 250000, 195000]
    ),
    ordersTrend: trend(
      DAY_LABELS_7,
      [0, 3480, 3520, 3550, 3620, 4520, 3480, 1520],
      [120, 480, 470, 380, 490, 850, 520, 460]
    ),
    customersAcquired: {
      overall: { value: 32600, deltaPct: 3, deltaAbs: 1050 },
      fastrr: { value: 32600, deltaPct: 3, deltaAbs: 1050 },
      bySource: [
        { source: "Campaigns", count: 30600 },
        { source: "Journeys", count: 2000 },
        { source: "Data upload", count: 3 },
      ],
    },
    customersTrend: trend(
      DAY_LABELS_7,
      [0, 4600, 4900, 5350, 4950, 5150, 5100, 2600],
      [0, 4600, 4900, 5350, 4950, 5150, 5100, 2600]
    ),
  },

  today: {
    revenue: {
      overall: { value: 3200000, deltaPct: 6, deltaAbs: 181000 },
      fastrr: { value: 520000, deltaPct: 4, deltaAbs: 20000, pctOfOverall: 16.3 },
    },
    orders: {
      overall: { value: 3500, deltaPct: 7, deltaAbs: 230 },
      fastrr: { value: 540, deltaPct: 4, deltaAbs: 20, pctOfOverall: 15.4 },
    },
    roi: {
      value: 9.6,
      totalRevenue: 500000,
      totalCost: 52000,
      byChannel: { whatsapp: 9.6, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 300000 },
        { label: "Journey", value: 220000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [480000, 18000, 9000, 6000, 4000, 2000, 1000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 300 },
        { label: "Journey", value: 240 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [490, 26, 13, 7, 3, 1, 0][i] })),
    },
    revenueTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [200000, 600000, 900000, 700000, 500000, 300000], [12000, 90000, 140000, 110000, 100000, 68000]),
    ordersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [220, 640, 980, 760, 540, 360], [30, 110, 160, 120, 100, 40]),
    customersAcquired: {
      overall: { value: 4600, deltaPct: 2, deltaAbs: 90 },
      fastrr: { value: 4600, deltaPct: 2, deltaAbs: 90 },
      bySource: [
        { source: "Campaigns", count: 4300 },
        { source: "Journeys", count: 290 },
        { source: "Data upload", count: 1 },
      ],
    },
    customersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [400, 900, 1200, 1000, 700, 400], [400, 900, 1200, 1000, 700, 400]),
  },

  yesterday: {
    revenue: {
      overall: { value: 2950000, deltaPct: -3, deltaAbs: -91000 },
      fastrr: { value: 480000, deltaPct: -2, deltaAbs: -9800, pctOfOverall: 16.3 },
    },
    orders: {
      overall: { value: 3250, deltaPct: -4, deltaAbs: -135 },
      fastrr: { value: 495, deltaPct: -3, deltaAbs: -15, pctOfOverall: 15.2 },
    },
    roi: {
      value: 9.1,
      totalRevenue: 470000,
      totalCost: 51600,
      byChannel: { whatsapp: 9.1, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 280000 },
        { label: "Journey", value: 200000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [440000, 17000, 8000, 5500, 3500, 1800, 900][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 280 },
        { label: "Journey", value: 215 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [450, 24, 11, 6, 3, 1, 0][i] })),
    },
    revenueTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [190000, 560000, 850000, 660000, 470000, 280000], [10000, 82000, 130000, 100000, 92000, 62000]),
    ordersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [200, 600, 920, 710, 500, 320], [28, 100, 150, 112, 92, 38]),
    customersAcquired: {
      overall: { value: 4300, deltaPct: -1, deltaAbs: -40 },
      fastrr: { value: 4300, deltaPct: -1, deltaAbs: -40 },
      bySource: [
        { source: "Campaigns", count: 4000 },
        { source: "Journeys", count: 299 },
        { source: "Data upload", count: 1 },
      ],
    },
    customersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [380, 850, 1150, 950, 660, 380], [380, 850, 1150, 950, 660, 380]),
  },

  this_month: {
    revenue: {
      overall: { value: 900000000, deltaPct: 12, deltaAbs: 96000000 },
      fastrr: { value: 15400000, deltaPct: 6, deltaAbs: 870000, pctOfOverall: 17.1 },
    },
    orders: {
      overall: { value: 105200, deltaPct: 11, deltaAbs: 10400 },
      fastrr: { value: 16100, deltaPct: 7, deltaAbs: 1050, pctOfOverall: 15.3 },
    },
    roi: {
      value: 11.4,
      totalRevenue: 14800000,
      totalCost: 1300000,
      byChannel: { whatsapp: 11.4, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 8800000 },
        { label: "Journey", value: 6600000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [14300000, 500000, 260000, 170000, 110000, 45000, 15000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 8800 },
        { label: "Journey", value: 7300 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [14600, 780, 380, 210, 90, 25, 15][i] })),
    },
    revenueTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [210000000, 230000000, 245000000, 215000000],
      [3400000, 3900000, 4200000, 3900000]
    ),
    ordersTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [24500, 26800, 28200, 25700],
      [3700, 4100, 4400, 3900]
    ),
    customersAcquired: {
      overall: { value: 140000, deltaPct: 9, deltaAbs: 11600 },
      fastrr: { value: 140000, deltaPct: 9, deltaAbs: 11600 },
      bySource: [
        { source: "Campaigns", count: 131000 },
        { source: "Journeys", count: 8900 },
        { source: "Data upload", count: 100 },
      ],
    },
    customersTrend: trend(["Wk 1", "Wk 2", "Wk 3", "Wk 4"], [32000, 35500, 38200, 34300], [32000, 35500, 38200, 34300]),
  },

  last_month: {
    revenue: {
      overall: { value: 804000000, deltaPct: 4, deltaAbs: 31000000 },
      fastrr: { value: 14530000, deltaPct: 2, deltaAbs: 285000, pctOfOverall: 18.1 },
    },
    orders: {
      overall: { value: 94800, deltaPct: 3, deltaAbs: 2760 },
      fastrr: { value: 15050, deltaPct: 2, deltaAbs: 295, pctOfOverall: 15.9 },
    },
    roi: {
      value: 10.9,
      totalRevenue: 13900000,
      totalCost: 1275000,
      byChannel: { whatsapp: 10.9, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 8300000 },
        { label: "Journey", value: 6230000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [13500000, 470000, 240000, 160000, 100000, 40000, 12000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 8250 },
        { label: "Journey", value: 6800 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [13800, 720, 350, 190, 80, 22, 13][i] })),
    },
    revenueTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [198000000, 205000000, 210000000, 191000000],
      [3500000, 3650000, 3800000, 3580000]
    ),
    ordersTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [23100, 24200, 24800, 22700],
      [3600, 3800, 3950, 3700]
    ),
    customersAcquired: {
      overall: { value: 128400, deltaPct: 5, deltaAbs: 6100 },
      fastrr: { value: 128400, deltaPct: 5, deltaAbs: 6100 },
      bySource: [
        { source: "Campaigns", count: 120000 },
        { source: "Journeys", count: 8300 },
        { source: "Data upload", count: 100 },
      ],
    },
    customersTrend: trend(["Wk 1", "Wk 2", "Wk 3", "Wk 4"], [29800, 31200, 32100, 30800], [29800, 31200, 32100, 30800]),
  },
};

export function getOverviewAnalytics(timeRange) {
  return OVERVIEW_ANALYTICS[timeRange] ?? OVERVIEW_ANALYTICS.last_7_days;
}

export const OVERVIEW_SERVICE_LABELS = SERVICE_LABELS;
export const OVERVIEW_CHANNEL_LABELS = CHANNEL_LABELS;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/data/__tests__/mockOverviewAnalytics.test.js --watchAll=false`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/mockOverviewAnalytics.js src/data/__tests__/mockOverviewAnalytics.test.js
git commit -m "feat: add mock data for the Analytics Overview tab"
```

---

### Task 3: `TimeRangeFilter` component

**Files:**
- Create: `src/components/analytics/TimeRangeFilter.jsx`
- Test: `src/components/analytics/__tests__/TimeRangeFilter.test.jsx`

**Interfaces:**
- Consumes: nothing external (self-contained; uses `src/components/ui/popover.jsx` and `src/components/ui/calendar.jsx`, both already in the repo).
- Produces: `<TimeRangeFilter value={string} onChange={(nextValue: string) => void} />`. `value` is one of `today | yesterday | last_7_days | this_month | last_month`. Renders a button showing the current label (`data-testid="time-range-trigger"`) that opens a menu (`data-testid="time-range-menu"`) with one item per option (`data-testid="time-range-option-<value>"`) plus a `data-testid="time-range-option-custom"` item that opens a `Calendar` popover (`data-testid="time-range-calendar"`); confirming a custom pick (`data-testid="time-range-custom-apply"`) calls `onChange("last_7_days")`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/analytics/__tests__/TimeRangeFilter.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TimeRangeFilter from "../TimeRangeFilter";

describe("TimeRangeFilter", () => {
  test("shows the label for the current value", () => {
    render(<TimeRangeFilter value="last_7_days" onChange={() => {}} />);
    expect(screen.getByTestId("time-range-trigger")).toHaveTextContent("Last 7 Days");
  });

  test("opens the menu and selects a preset", () => {
    const onChange = jest.fn();
    render(<TimeRangeFilter value="last_7_days" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    expect(screen.getByTestId("time-range-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("time-range-option-this_month"));
    expect(onChange).toHaveBeenCalledWith("this_month");
  });

  test("choosing Custom Range opens a calendar and applying falls back to last_7_days", () => {
    const onChange = jest.fn();
    render(<TimeRangeFilter value="last_7_days" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    fireEvent.click(screen.getByTestId("time-range-option-custom"));
    expect(screen.getByTestId("time-range-calendar")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("time-range-custom-apply"));
    expect(onChange).toHaveBeenCalledWith("last_7_days");
  });

  test("renders no BIK or Avimee strings", () => {
    const { container } = render(<TimeRangeFilter value="last_7_days" onChange={() => {}} />);
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/analytics/__tests__/TimeRangeFilter.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../TimeRangeFilter'"

- [ ] **Step 3: Implement `TimeRangeFilter`**

```jsx
// src/components/analytics/TimeRangeFilter.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function TimeRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [range, setRange] = useState(undefined);

  const selectedLabel = OPTIONS.find((o) => o.value === value)?.label ?? "Last 7 Days";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowCustom(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="time-range-trigger"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] font-medium text-text-primary hover:bg-slate-50 transition-colors"
        >
          {selectedLabel}
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1" data-testid="time-range-menu">
        {!showCustom ? (
          OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid={`time-range-option-${opt.value}`}
              onClick={() => {
                if (opt.value === "custom") {
                  setShowCustom(true);
                  return;
                }
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-slate-50 transition-colors ${
                opt.value === value ? "text-primary font-medium" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <div data-testid="time-range-calendar" className="p-1">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} />
            <button
              type="button"
              data-testid="time-range-custom-apply"
              onClick={() => {
                onChange("last_7_days");
                setOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 rounded-md bg-primary text-white text-[13px] font-medium"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/analytics/__tests__/TimeRangeFilter.test.jsx --watchAll=false`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/TimeRangeFilter.jsx src/components/analytics/__tests__/TimeRangeFilter.test.jsx
git commit -m "feat: add TimeRangeFilter component for the Analytics page"
```

---

### Task 4: `MetricCard` and `RoiCard` components

**Files:**
- Create: `src/components/analytics/overview/MetricCard.jsx`
- Create: `src/components/analytics/overview/RoiCard.jsx`
- Test: `src/components/analytics/overview/__tests__/MetricCard.test.jsx`
- Test: `src/components/analytics/overview/__tests__/RoiCard.test.jsx`

**Interfaces:**
- Consumes: `formatCompactCurrency`, `formatCompactNumber`, `formatDelta` from `src/lib/analyticsFormat.js` (Task 1).
- Produces: `<MetricCard testId label value delta={{ text, tone }} subBadge? />` — renders `label`, `value`, the delta text with tone-based color, and an optional `subBadge` string pill (e.g. `"17.0 %"`). Root has `data-testid={testId}`.
- Produces: `<RoiCard testId value totalRevenue totalCost byChannel={{whatsapp, email, instagram, sms, rcs, aiCalling, aiChatbot}} />` — renders the big `"{value}X"` figure, `Total Revenue Generated` / `Total Cost` lines (formatted via `formatCompactCurrency`), and one mini-tile per channel showing `"{channelValue}X"`. Root has `data-testid={testId}`; each channel tile has `data-testid="roi-channel-<key>"`.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/analytics/overview/__tests__/MetricCard.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import MetricCard from "../MetricCard";

describe("MetricCard", () => {
  test("renders label, value, delta, and optional sub-badge", () => {
    render(
      <MetricCard
        testId="metric-revenue-fastrr"
        label="Fastrr Revenue"
        value="₹36.1L"
        delta={{ text: "↑ 3% (+₹89.15K)", tone: "positive" }}
        subBadge="17.0 %"
      />
    );
    const card = screen.getByTestId("metric-revenue-fastrr");
    expect(card).toHaveTextContent("Fastrr Revenue");
    expect(card).toHaveTextContent("₹36.1L");
    expect(card).toHaveTextContent("↑ 3% (+₹89.15K)");
    expect(card).toHaveTextContent("17.0 %");
  });

  test("omits sub-badge when not provided", () => {
    render(
      <MetricCard
        testId="metric-revenue-overall"
        label="Overall Revenue"
        value="₹2.1C"
        delta={{ text: "↑ 8% (+₹15.35L)", tone: "positive" }}
      />
    );
    expect(screen.queryByTestId("metric-revenue-overall-badge")).not.toBeInTheDocument();
  });
});
```

```jsx
// src/components/analytics/overview/__tests__/RoiCard.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import RoiCard from "../RoiCard";

describe("RoiCard", () => {
  test("renders the headline ROI figure, revenue/cost, and per-channel tiles", () => {
    render(
      <RoiCard
        testId="roi-card"
        value={10.85}
        totalRevenue={3460000}
        totalCost={320000}
        byChannel={{ whatsapp: 10.85, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 }}
      />
    );
    const card = screen.getByTestId("roi-card");
    expect(card).toHaveTextContent("10.85X");
    expect(card).toHaveTextContent("₹34.6L");
    expect(card).toHaveTextContent("₹3.2L");
    expect(screen.getByTestId("roi-channel-whatsapp")).toHaveTextContent("10.85X");
    expect(screen.getByTestId("roi-channel-aiChatbot")).toHaveTextContent("0.00X");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test src/components/analytics/overview/__tests__/MetricCard.test.jsx src/components/analytics/overview/__tests__/RoiCard.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../MetricCard'" / "'../RoiCard'"

- [ ] **Step 3: Implement `MetricCard`**

```jsx
// src/components/analytics/overview/MetricCard.jsx
import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MetricCard({ testId, label, value, delta, subBadge, infoText }) {
  const toneClass = delta?.tone === "negative" ? "text-rose-700" : "text-emerald-700";
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{label}</span>
        {infoText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-text-muted" />
              </TooltipTrigger>
              <TooltipContent>{infoText}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {subBadge && (
          <span
            data-testid={`${testId}-badge`}
            className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-tint text-primary"
          >
            {subBadge}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-1 text-[12px] font-medium ${toneClass}`}>{delta.text} vs last period</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement `RoiCard`**

```jsx
// src/components/analytics/overview/RoiCard.jsx
import React from "react";
import { TrendingUp } from "lucide-react";
import { formatCompactCurrency } from "@/lib/analyticsFormat";

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "instagram", label: "Instagram" },
  { key: "sms", label: "SMS" },
  { key: "rcs", label: "RCS" },
  { key: "aiCalling", label: "AI Calling" },
  { key: "aiChatbot", label: "AI Chatbot" },
];

export default function RoiCard({ testId, value, totalRevenue, totalCost, byChannel }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-tint text-primary">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Return on Investment</div>
            <div className="text-2xl font-semibold text-text-primary tabular-nums">{value.toFixed(2)}X</div>
          </div>
        </div>
        <div className="text-right text-[11px] text-text-muted leading-5">
          <div>Total Revenue Generated: {formatCompactCurrency(totalRevenue)}</div>
          <div>Total Cost: {formatCompactCurrency(totalCost)}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {CHANNELS.map(({ key, label }) => (
          <div key={key} className="bg-slate-50 rounded-md p-2 text-center" data-testid={`roi-channel-${key}`}>
            <div className="text-[10px] text-text-muted font-medium">{label}</div>
            <div className="text-[14px] font-semibold text-text-primary tabular-nums">{(byChannel[key] ?? 0).toFixed(2)}X</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx craco test src/components/analytics/overview/__tests__/MetricCard.test.jsx src/components/analytics/overview/__tests__/RoiCard.test.jsx --watchAll=false`
Expected: PASS (all 3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/analytics/overview/MetricCard.jsx src/components/analytics/overview/RoiCard.jsx src/components/analytics/overview/__tests__/MetricCard.test.jsx src/components/analytics/overview/__tests__/RoiCard.test.jsx
git commit -m "feat: add MetricCard and RoiCard components for Analytics Overview"
```

---

### Task 5: `SplitBarChart` and `ComparisonLineChart` components

**Files:**
- Create: `src/components/analytics/overview/SplitBarChart.jsx`
- Create: `src/components/analytics/overview/ComparisonLineChart.jsx`
- Test: `src/components/analytics/overview/__tests__/SplitBarChart.test.jsx`
- Test: `src/components/analytics/overview/__tests__/ComparisonLineChart.test.jsx`

**Interfaces:**
- Consumes: Recharts (`recharts`, already a dependency).
- Produces: `<SplitBarChart testId title byService byChannel valueFormatter={(n:number)=>string} />` — renders `title`, a "Service"/"Channel" segmented toggle (`data-testid="<testId>-toggle-service"` / `"<testId>-toggle-channel"`, Service selected by default), and a horizontal Recharts `BarChart` of whichever dataset is active. Root `data-testid={testId}`.
- Produces: `<ComparisonLineChart testId data seriesLabels={{ overall: string, fastrr: string }} valueFormatter />` — renders a Recharts `LineChart` with two lines (`fastrr` in `#6C3AE8`, `overall` in slate grey), legend using `seriesLabels`. Root `data-testid={testId}`.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/analytics/overview/__tests__/SplitBarChart.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SplitBarChart from "../SplitBarChart";

const byService = [
  { label: "Broadcast", value: 2060000 },
  { label: "Journey", value: 1545000 },
];
const byChannel = [
  { label: "WhatsApp", value: 3350000 },
  { label: "SMS", value: 120000 },
];

describe("SplitBarChart", () => {
  test("renders title and defaults to the Service view", () => {
    render(
      <SplitBarChart
        testId="split-revenue"
        title="Fastrr Revenue split by"
        byService={byService}
        byChannel={byChannel}
        valueFormatter={(n) => `₹${n}`}
      />
    );
    const chart = screen.getByTestId("split-revenue");
    expect(chart).toHaveTextContent("Fastrr Revenue split by");
    expect(chart).toHaveTextContent("Broadcast");
    expect(chart).not.toHaveTextContent("WhatsApp");
  });

  test("toggling to Channel swaps the dataset shown", () => {
    render(
      <SplitBarChart
        testId="split-revenue"
        title="Fastrr Revenue split by"
        byService={byService}
        byChannel={byChannel}
        valueFormatter={(n) => `₹${n}`}
      />
    );
    fireEvent.click(screen.getByTestId("split-revenue-toggle-channel"));
    expect(screen.getByTestId("split-revenue")).toHaveTextContent("WhatsApp");
    expect(screen.getByTestId("split-revenue")).not.toHaveTextContent("Broadcast");
  });

  test("renders no BIK strings, uses Fastrr copy", () => {
    render(
      <SplitBarChart
        testId="split-revenue"
        title="Fastrr Revenue split by"
        byService={byService}
        byChannel={byChannel}
        valueFormatter={(n) => `₹${n}`}
      />
    );
    expect(screen.getByTestId("split-revenue").textContent).not.toMatch(/\bBIK\b/i);
  });
});
```

```jsx
// src/components/analytics/overview/__tests__/ComparisonLineChart.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import ComparisonLineChart from "../ComparisonLineChart";

const data = [
  { date: "28 Jul", overall: 0, fastrr: 10000 },
  { date: "29 Jul", overall: 3000000, fastrr: 155000 },
];

describe("ComparisonLineChart", () => {
  test("renders with the given series labels", () => {
    render(
      <ComparisonLineChart
        testId="trend-revenue"
        data={data}
        seriesLabels={{ overall: "Overall Revenue", fastrr: "Fastrr Revenue" }}
        valueFormatter={(n) => `₹${n}`}
      />
    );
    const chart = screen.getByTestId("trend-revenue");
    expect(chart).toHaveTextContent("Overall Revenue");
    expect(chart).toHaveTextContent("Fastrr Revenue");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test src/components/analytics/overview/__tests__/SplitBarChart.test.jsx src/components/analytics/overview/__tests__/ComparisonLineChart.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../SplitBarChart'" / "'../ComparisonLineChart'"

- [ ] **Step 3: Implement `SplitBarChart`**

```jsx
// src/components/analytics/overview/SplitBarChart.jsx
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };

export default function SplitBarChart({ testId, title, byService, byChannel, valueFormatter }) {
  const [view, setView] = useState("service");
  const data = view === "service" ? byService : byChannel;

  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            data-testid={`${testId}-toggle-service`}
            onClick={() => setView("service")}
            className={`px-3 py-1 text-[11px] font-medium ${view === "service" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
          >
            Service
          </button>
          <button
            type="button"
            data-testid={`${testId}-toggle-channel`}
            onClick={() => setView("channel")}
            className={`px-3 py-1 text-[11px] font-medium ${view === "channel" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
          >
            Channel
          </button>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <YAxis type="category" dataKey="label" tick={TICK} stroke="#94A3B8" width={80} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `ComparisonLineChart`**

```jsx
// src/components/analytics/overview/ComparisonLineChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };

export default function ComparisonLineChart({ testId, data, seriesLabels, valueFormatter }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis dataKey="date" tick={TICK} stroke="#94A3B8" />
            <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} labelStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="overall" name={seriesLabels.overall} stroke="#94A3B8" strokeDasharray="4 3" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="fastrr" name={seriesLabels.fastrr} stroke="#6C3AE8" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx craco test src/components/analytics/overview/__tests__/SplitBarChart.test.jsx src/components/analytics/overview/__tests__/ComparisonLineChart.test.jsx --watchAll=false`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/analytics/overview/SplitBarChart.jsx src/components/analytics/overview/ComparisonLineChart.jsx src/components/analytics/overview/__tests__/SplitBarChart.test.jsx src/components/analytics/overview/__tests__/ComparisonLineChart.test.jsx
git commit -m "feat: add SplitBarChart and ComparisonLineChart components for Analytics Overview"
```

---

### Task 6: `CustomersAcquiredSection` and `OverviewTab`

**Files:**
- Create: `src/components/analytics/overview/CustomersAcquiredSection.jsx`
- Create: `src/components/analytics/overview/OverviewTab.jsx`
- Test: `src/components/analytics/overview/__tests__/OverviewTab.test.jsx`

**Interfaces:**
- Consumes: `getOverviewAnalytics` (Task 2), `formatCompactCurrency`/`formatCompactNumber`/`formatDelta` (Task 1), `MetricCard`/`RoiCard` (Task 4), `SplitBarChart`/`ComparisonLineChart` (Task 5).
- Produces: `<CustomersAcquiredSection testId data={customersAcquiredEntry} trend={customersTrendEntry} />` where `customersAcquiredEntry` matches `OverviewAnalyticsEntry.customersAcquired` and `trend` matches `OverviewAnalyticsEntry.customersTrend`. Renders two `MetricCard`s, a horizontal bar breakdown of `bySource` (own small Recharts `BarChart`, reusing the same visual style as `SplitBarChart` without the toggle), and a `ComparisonLineChart`.
- Produces: `<OverviewTab timeRange={string} />` — the only prop is `timeRange` (one of the preset keys); it calls `getOverviewAnalytics(timeRange)` itself and lays out all sections. Root `data-testid="overview-tab"`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/analytics/overview/__tests__/OverviewTab.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import OverviewTab from "../OverviewTab";

describe("OverviewTab", () => {
  test("renders all sections with last_7_days data", () => {
    render(<OverviewTab timeRange="last_7_days" />);
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByTestId("metric-revenue-overall")).toHaveTextContent("₹2.1C");
    expect(screen.getByTestId("metric-revenue-fastrr")).toHaveTextContent("₹36.1L");
    expect(screen.getByTestId("metric-orders-overall")).toHaveTextContent("24.55K");
    expect(screen.getByTestId("metric-orders-fastrr")).toHaveTextContent("3.75K");
    expect(screen.getByTestId("roi-card")).toHaveTextContent("10.85X");
    expect(screen.getByTestId("split-revenue")).toBeInTheDocument();
    expect(screen.getByTestId("split-orders")).toBeInTheDocument();
    expect(screen.getByTestId("trend-revenue")).toBeInTheDocument();
    expect(screen.getByTestId("trend-orders")).toBeInTheDocument();
    expect(screen.getByTestId("customers-acquired-section")).toBeInTheDocument();
    expect(screen.getByTestId("metric-customers-overall")).toHaveTextContent("32.6K");
    expect(screen.getByTestId("metric-customers-fastrr")).toHaveTextContent("32.6K");
  });

  test("re-renders with different numbers when timeRange changes", () => {
    const { rerender } = render(<OverviewTab timeRange="last_7_days" />);
    expect(screen.getByTestId("metric-revenue-overall")).toHaveTextContent("₹2.1C");
    rerender(<OverviewTab timeRange="this_month" />);
    expect(screen.getByTestId("metric-revenue-overall")).not.toHaveTextContent("₹2.1C");
  });

  test("renders no BIK or Avimee strings", () => {
    const { container } = render(<OverviewTab timeRange="last_7_days" />);
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
    expect(container.textContent).toMatch(/Fastrr/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/analytics/overview/__tests__/OverviewTab.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../OverviewTab'"

- [ ] **Step 3: Implement `CustomersAcquiredSection`**

```jsx
// src/components/analytics/overview/CustomersAcquiredSection.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./MetricCard";
import ComparisonLineChart from "./ComparisonLineChart";
import { formatCompactNumber, formatDelta } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function CustomersAcquiredSection({ testId, data, trend }) {
  const overallDelta = formatDelta(data.overall.deltaPct, data.overall.deltaAbs, formatCompactNumber);
  const fastrrDelta = formatDelta(data.fastrr.deltaPct, data.fastrr.deltaAbs, formatCompactNumber);

  return (
    <div data-testid={testId} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          testId="metric-customers-overall"
          label="Overall Customers Acquired"
          value={formatCompactNumber(data.overall.value)}
          delta={overallDelta}
        />
        <MetricCard
          testId="metric-customers-fastrr"
          label="Fastrr Customers Acquired"
          value={formatCompactNumber(data.fastrr.value)}
          delta={fastrrDelta}
        />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="customers-by-source">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Customers Acquired</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.bySource} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={formatCompactNumber} />
              <YAxis type="category" dataKey="source" tick={TICK} stroke="#94A3B8" width={90} />
              <Tooltip formatter={(v) => formatCompactNumber(v)} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ComparisonLineChart
        testId="trend-customers"
        data={trend}
        seriesLabels={{ overall: "Overall Customers Acquired", fastrr: "Fastrr Customers Acquired" }}
        valueFormatter={formatCompactNumber}
      />
    </div>
  );
}
```

- [ ] **Step 4: Implement `OverviewTab`**

```jsx
// src/components/analytics/overview/OverviewTab.jsx
import React from "react";
import { getOverviewAnalytics } from "@/data/mockOverviewAnalytics";
import { formatCompactCurrency, formatCompactNumber, formatDelta } from "@/lib/analyticsFormat";
import MetricCard from "./MetricCard";
import RoiCard from "./RoiCard";
import SplitBarChart from "./SplitBarChart";
import ComparisonLineChart from "./ComparisonLineChart";
import CustomersAcquiredSection from "./CustomersAcquiredSection";

export default function OverviewTab({ timeRange }) {
  const data = getOverviewAnalytics(timeRange);

  const revenueOverallDelta = formatDelta(data.revenue.overall.deltaPct, data.revenue.overall.deltaAbs, formatCompactCurrency);
  const revenueFastrrDelta = formatDelta(data.revenue.fastrr.deltaPct, data.revenue.fastrr.deltaAbs, formatCompactCurrency);
  const ordersOverallDelta = formatDelta(data.orders.overall.deltaPct, data.orders.overall.deltaAbs, formatCompactNumber);
  const ordersFastrrDelta = formatDelta(data.orders.fastrr.deltaPct, data.orders.fastrr.deltaAbs, formatCompactNumber);

  return (
    <div data-testid="overview-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-2">Revenue</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              testId="metric-revenue-overall"
              label="Overall Revenue"
              value={formatCompactCurrency(data.revenue.overall.value)}
              delta={revenueOverallDelta}
            />
            <MetricCard
              testId="metric-revenue-fastrr"
              label="Fastrr Revenue"
              value={formatCompactCurrency(data.revenue.fastrr.value)}
              delta={revenueFastrrDelta}
              subBadge={`${data.revenue.fastrr.pctOfOverall.toFixed(1)} %`}
            />
          </div>
        </div>

        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-2">Orders</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              testId="metric-orders-overall"
              label="Overall Orders"
              value={formatCompactNumber(data.orders.overall.value)}
              delta={ordersOverallDelta}
            />
            <MetricCard
              testId="metric-orders-fastrr"
              label="Fastrr Orders"
              value={formatCompactNumber(data.orders.fastrr.value)}
              delta={ordersFastrrDelta}
              subBadge={`${data.orders.fastrr.pctOfOverall.toFixed(1)} %`}
            />
          </div>
        </div>

        <SplitBarChart
          testId="split-revenue"
          title="Fastrr Revenue split by"
          byService={data.revenueSplit.byService}
          byChannel={data.revenueSplit.byChannel}
          valueFormatter={formatCompactCurrency}
        />

        <ComparisonLineChart
          testId="trend-revenue"
          data={data.revenueTrend}
          seriesLabels={{ overall: "Overall Revenue", fastrr: "Fastrr Revenue" }}
          valueFormatter={formatCompactCurrency}
        />

        <h2 className="text-[13px] font-semibold text-text-primary">Customers Acquired</h2>
        <CustomersAcquiredSection testId="customers-acquired-section" data={data.customersAcquired} trend={data.customersTrend} />
      </div>

      <div className="space-y-4">
        <RoiCard
          testId="roi-card"
          value={data.roi.value}
          totalRevenue={data.roi.totalRevenue}
          totalCost={data.roi.totalCost}
          byChannel={data.roi.byChannel}
        />

        <SplitBarChart
          testId="split-orders"
          title="Fastrr Orders split by"
          byService={data.ordersSplit.byService}
          byChannel={data.ordersSplit.byChannel}
          valueFormatter={formatCompactNumber}
        />

        <ComparisonLineChart
          testId="trend-orders"
          data={data.ordersTrend}
          seriesLabels={{ overall: "Overall Orders", fastrr: "Fastrr Orders" }}
          valueFormatter={formatCompactNumber}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/components/analytics/overview/__tests__/OverviewTab.test.jsx --watchAll=false`
Expected: PASS (all 3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/analytics/overview/CustomersAcquiredSection.jsx src/components/analytics/overview/OverviewTab.jsx src/components/analytics/overview/__tests__/OverviewTab.test.jsx
git commit -m "feat: add CustomersAcquiredSection and OverviewTab for Analytics"
```

---

### Task 7: `ComingSoonPanel` component

**Files:**
- Create: `src/components/analytics/ComingSoonPanel.jsx`
- Test: `src/components/analytics/__tests__/ComingSoonPanel.test.jsx`

**Interfaces:**
- Consumes: `PreviewHeader`, `previewToast` from `src/components/common/PreviewHeader.jsx` (already exists).
- Produces: `<ComingSoonPanel tabName={string} testId={string} />` — renders a `PreviewHeader` with a title like `"{tabName} — coming soon"` and a disabled-looking button that calls `previewToast()` on click. Root `data-testid={testId}`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/analytics/__tests__/ComingSoonPanel.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import ComingSoonPanel from "../ComingSoonPanel";

jest.mock("sonner", () => ({ toast: jest.fn() }));

describe("ComingSoonPanel", () => {
  test("renders the tab name and a preview-toast button", () => {
    render(<ComingSoonPanel tabName="Campaign" testId="campaign-tab" />);
    const panel = screen.getByTestId("campaign-tab");
    expect(panel).toHaveTextContent("Campaign");
    fireEvent.click(screen.getByTestId("coming-soon-notify-btn"));
    expect(toast).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/components/analytics/__tests__/ComingSoonPanel.test.jsx --watchAll=false`
Expected: FAIL with "Cannot find module '../ComingSoonPanel'"

- [ ] **Step 3: Implement `ComingSoonPanel`**

```jsx
// src/components/analytics/ComingSoonPanel.jsx
import React from "react";
import { Clock } from "lucide-react";
import PreviewHeader, { previewToast } from "@/components/common/PreviewHeader";

export default function ComingSoonPanel({ tabName, testId }) {
  return (
    <div data-testid={testId}>
      <PreviewHeader
        title={`${tabName} — coming soon`}
        subtitle={`We're still building out the ${tabName} tab. Check back shortly.`}
        testIdPrefix={testId}
      />
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted bg-surface border border-border rounded-lg">
        <Clock className="w-8 h-8" />
        <p className="text-sm">This section isn't ready yet.</p>
        <button
          type="button"
          data-testid="coming-soon-notify-btn"
          onClick={() => previewToast()}
          className="text-[12px] text-primary hover:underline"
        >
          Notify me when it's ready
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test src/components/analytics/__tests__/ComingSoonPanel.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/ComingSoonPanel.jsx src/components/analytics/__tests__/ComingSoonPanel.test.jsx
git commit -m "feat: add ComingSoonPanel for unbuilt Analytics tabs"
```

---

### Task 8: Rebuild `Analytics.jsx` shell and wire up routing

**Files:**
- Modify: `src/pages/Analytics.jsx` (full rewrite)
- Modify: `src/App.js:29` (import) and the `/analytics` route block (~line 80)
- Test: `src/pages/__tests__/Analytics.test.jsx` (new; delete/replace any prior analytics page test if one exists — none does today)

**Interfaces:**
- Consumes: `TimeRangeFilter` (Task 3), `OverviewTab` (Task 6), `ComingSoonPanel` (Task 7), `src/components/ui/tabs.jsx` (`Tabs`, `TabsList`, `TabsTrigger`).
- Produces: `Analytics.jsx` default export, a page component reading `:tab` from `useParams()` (values: `overview | campaign | journey | reports`, defaulting/redirecting unknown values to `overview`), rendering the tab bar + `TimeRangeFilter`, and the matching body. Tab switches call `useNavigate()` to push `/analytics/<tab>`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/__tests__/Analytics.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AnalyticsPage from "../Analytics";

function renderAtTab(tab) {
  return render(
    <MemoryRouter initialEntries={[`/analytics/${tab}`]}>
      <Routes>
        <Route path="/analytics/:tab" element={<AnalyticsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AnalyticsPage", () => {
  test("defaults to the Overview tab content and shows the time filter", () => {
    renderAtTab("overview");
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByTestId("time-range-trigger")).toBeInTheDocument();
  });

  test("switching to Campaign, Journey, Reports renders their coming-soon panels", () => {
    renderAtTab("overview");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Campaign" }));
    expect(screen.getByTestId("analytics-tab-campaign")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Journey" }));
    expect(screen.getByTestId("analytics-tab-journey")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Reports" }));
    expect(screen.getByTestId("analytics-tab-reports")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Overview" }));
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
  });

  test("changing the time range re-renders Overview with different numbers", () => {
    renderAtTab("overview");
    const before = screen.getByTestId("metric-revenue-overall").textContent;
    fireEvent.click(screen.getByTestId("time-range-trigger"));
    fireEvent.click(screen.getByTestId("time-range-option-this_month"));
    expect(screen.getByTestId("metric-revenue-overall").textContent).not.toBe(before);
  });

  test("page contains no BIK or Avimee strings", () => {
    const { container } = renderAtTab("overview");
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test src/pages/__tests__/Analytics.test.jsx --watchAll=false`
Expected: FAIL (old `Analytics.jsx` doesn't render `overview-tab`/tab nav/time filter)

- [ ] **Step 3: Rewrite `Analytics.jsx`**

```jsx
// src/pages/Analytics.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeRangeFilter from "@/components/analytics/TimeRangeFilter";
import ComingSoonPanel from "@/components/analytics/ComingSoonPanel";
import OverviewTab from "@/components/analytics/overview/OverviewTab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "campaign", label: "Campaign" },
  { value: "journey", label: "Journey" },
  { value: "reports", label: "Reports" },
];

export default function AnalyticsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("last_7_days");

  const activeTab = TABS.some((t) => t.value === tab) ? tab : "overview";

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-analytics">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">Analytics</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <Tabs value={activeTab} onValueChange={(next) => navigate(`/analytics/${next}`)} className="mb-4">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" && <OverviewTab timeRange={timeRange} />}
      {activeTab === "campaign" && <ComingSoonPanel tabName="Campaign" testId="analytics-tab-campaign" />}
      {activeTab === "journey" && <ComingSoonPanel tabName="Journey" testId="analytics-tab-journey" />}
      {activeTab === "reports" && <ComingSoonPanel tabName="Reports" testId="analytics-tab-reports" />}
    </div>
  );
}
```

- [ ] **Step 4: Wire up routing in `App.js`**

Replace the single `/analytics` route with a redirect plus a `:tab` route. Add `Navigate` to the `react-router-dom` import at the top of the file:

```jsx
// src/App.js — change this import line:
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
```

Replace this line:
```jsx
            <Route path="/analytics" element={<AnalyticsPage />} />
```
with:
```jsx
            <Route path="/analytics" element={<Navigate to="/analytics/overview" replace />} />
            <Route path="/analytics/:tab" element={<AnalyticsPage />} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx craco test src/pages/__tests__/Analytics.test.jsx --watchAll=false`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Manually verify in the browser**

Run: `npm start`, navigate to `http://localhost:3000/analytics`, confirm it redirects to `/analytics/overview`, the Overview tab renders all wireframe sections with the existing app's visual style, switching tabs updates the URL and shows the "coming soon" panels, and the time-range dropdown (including Custom Range → Calendar → Apply) works.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Analytics.jsx src/App.js src/pages/__tests__/Analytics.test.jsx
git commit -m "feat: rebuild /analytics as a 4-tab dashboard shell with a working Overview tab"
```

---

### Task 9: Full-suite regression check

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx craco test --watchAll=false`
Expected: all tests pass, including the new Analytics/Overview suites and pre-existing suites (no regressions from the `App.js` route change or shared-component reuse).

- [ ] **Step 2: If anything fails, fix and re-run**

Investigate failures with `git diff` against Task 8's `App.js` change first (most likely source of any regression, since it's the only shared file touched) before touching new files.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address regressions from Analytics Overview rollout"
```
