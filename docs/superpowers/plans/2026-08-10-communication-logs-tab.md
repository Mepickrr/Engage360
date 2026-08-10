# Communication Logs Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Communication Logs" tab to the Analytics page (`/analytics/logs`) showing a filterable, sortable, searchable table of 150 dummy communication-log rows, with a detail drawer for the full record.

**Architecture:** A new self-contained folder `src/components/analytics/logs/` holds a deterministic mock dataset, pure filter/sort/facet-count helper functions (unit-tested independently of any rendering), and four presentational/container React components (`LogsTable`, `LogDetailDrawer`, `LogsFilterBar`, `CommunicationLogsTab`). `CommunicationLogsTab` owns all UI state and wires the pure helpers to the components. `Analytics.jsx` gets one new tab entry pointing at `CommunicationLogsTab`. Client-side filtering/sorting/pagination over the static 150-row array — no backend calls, matching every other page in this app (Campaigns, Audience) and this Analytics page's existing Overview tab.

**Tech Stack:** React (CRA + craco), Tailwind CSS, shadcn/ui primitives (`table`, `pagination`, `popover`, `checkbox`, `sheet`, `badge`, `input`, `calendar`), `lucide-react` icons, Jest + React Testing Library (`craco test`).

## Global Constraints

- Reference date "today" for all mock data and date-range math: **2026-08-10** (spec's anchor date). Use the fixed anchor `new Date("2026-08-10T12:00:00Z")` everywhere instead of `new Date()`/`Date.now()`, so rendered output and tests are stable.
- Tab label is exactly **"Communication Logs"** (not "Logs") — confirmed during brainstorming.
- Dataset size: **150 rows**, paginated **25/page**.
- Delivery status set: **Sent, Delivered, Read, Failed, Bounced, Pending**.
- `errorResponse` populated **only** when `deliveryStatus` is `Failed` or `Bounced`.
- `aiCallDurationSec` populated **only** when `channel === "AI Calling"`.
- Sortable columns: **Sent Timestamp and Last Update Time only**. No other column is sortable.
- Search matches: **Engage ID, phone number, email, template name** (any one matching includes the row).
- Error Response filter is a **faceted checklist of distinct error strings present in the currently-filtered data**, with counts — not a fixed category list, not free text.
- Facet counts (Type/Channel/Status/Error) are computed off the dataset filtered by every *other* active filter, excluding the facet's own selection — standard faceted-search behavior.
- No new generic/reusable `DataTable` abstraction — this is a scoped, single-purpose folder.
- All date-range math must use UTC-based date component accessors (`getUTCFullYear`/`getUTCMonth`/`getUTCDate`/`Date.UTC`), never local-timezone accessors — the test suite runs in whatever timezone CI happens to use, and mixing UTC-constructed timestamps with local-timezone day-boundary math is a real source of off-by-one-day flakiness.

---

### Task 1: Mock dataset

**Files:**
- Create: `src/components/analytics/logs/data/mockCommunicationLogs.js`
- Test: `src/components/analytics/logs/data/__tests__/mockCommunicationLogs.test.js`

**Interfaces:**
- Produces: `COMMUNICATION_LOGS` (array of 150 `LogRow` objects, shape below), `LOG_TYPES` (`["Campaign", "Journey"]`), `LOG_CHANNELS` (`["WhatsApp", "Email", "SMS", "RCS", "AI Calling"]`), `LOG_STATUSES` (`["Sent", "Delivered", "Read", "Failed", "Bounced", "Pending"]`), `LOG_DATA_ANCHOR` (`Date`, the `2026-08-10T12:00:00Z` anchor used to generate the dataset — later tasks reuse this same anchor for date-range math so "last 30 days" always covers the full dataset).
- `LogRow` shape: `{ id, sentAt, engageId, phone, email, type, templateName, channel, senderPhone, senderEmail, deliveryStatus, aiCallDurationSec, errorResponse, updatedAt }`. `sentAt`/`updatedAt` are ISO strings. `phone`/`email` are mutually exclusive (exactly one is non-null). `senderPhone`/`senderEmail` are mutually exclusive per channel.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/data/__tests__/mockCommunicationLogs.test.js`:

```js
import { COMMUNICATION_LOGS, LOG_TYPES, LOG_CHANNELS, LOG_STATUSES } from "../mockCommunicationLogs";

describe("mockCommunicationLogs", () => {
  test("generates exactly 150 rows with unique ids", () => {
    expect(COMMUNICATION_LOGS).toHaveLength(150);
    const ids = new Set(COMMUNICATION_LOGS.map((r) => r.id));
    expect(ids.size).toBe(150);
  });

  test("every row has exactly one of phone/email populated", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect([row.phone, row.email].filter((v) => v != null)).toHaveLength(1);
    });
  });

  test("errorResponse is populated only for Failed/Bounced rows", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      const shouldHaveError = row.deliveryStatus === "Failed" || row.deliveryStatus === "Bounced";
      expect(row.errorResponse != null).toBe(shouldHaveError);
    });
  });

  test("aiCallDurationSec is populated only for terminal AI Calling rows", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      if (row.channel !== "AI Calling") {
        expect(row.aiCallDurationSec).toBeNull();
      } else {
        const isTerminal = ["Delivered", "Read", "Sent"].includes(row.deliveryStatus);
        if (isTerminal) {
          expect(row.aiCallDurationSec).toBeGreaterThan(0);
        } else {
          expect(row.aiCallDurationSec).toBeNull();
        }
      }
    });
  });

  test("uses only the documented channels, types, and statuses", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect(LOG_TYPES).toContain(row.type);
      expect(LOG_CHANNELS).toContain(row.channel);
      expect(LOG_STATUSES).toContain(row.deliveryStatus);
    });
  });

  test("updatedAt is never before sentAt", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect(new Date(row.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(row.sentAt).getTime());
    });
  });

  test("all sentAt timestamps fall within the last 30 days of the anchor date", () => {
    const anchor = new Date("2026-08-10T12:00:00Z").getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    COMMUNICATION_LOGS.forEach((row) => {
      const sentMs = new Date(row.sentAt).getTime();
      expect(sentMs).toBeLessThanOrEqual(anchor);
      expect(anchor - sentMs).toBeLessThan(thirtyDaysMs);
    });
  });

  test("is deterministic across re-imports", () => {
    const snapshot = COMMUNICATION_LOGS.map((r) => `${r.id}|${r.sentAt}|${r.deliveryStatus}`).join(",");
    jest.resetModules();
    const { COMMUNICATION_LOGS: regenerated } = require("../mockCommunicationLogs");
    const snapshot2 = regenerated.map((r) => `${r.id}|${r.sentAt}|${r.deliveryStatus}`).join(",");
    expect(snapshot2).toBe(snapshot);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="mockCommunicationLogs" --watchAll=false`
Expected: FAIL — `Cannot find module '../mockCommunicationLogs'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/data/mockCommunicationLogs.js`:

```js
// Deterministic dummy dataset for the Analytics > Communication Logs tab.
// No live data — every value is derived by cycling fixed pools off the row
// index, so the output (and any test/snapshot built on it) is stable across
// renders and re-imports. No Math.random / Date.now anywhere in this file.

const ANCHOR_MS = new Date("2026-08-10T12:00:00Z").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_COUNT = 150;

const CHANNELS = ["WhatsApp", "Email", "SMS", "RCS", "AI Calling"];
const TYPES = ["Campaign", "Journey"];

// 12-slot weighted cycle: 8 successful, 1 pending, 3 failure states.
const STATUS_CYCLE = [
  "Delivered", "Delivered", "Read", "Sent", "Delivered", "Pending",
  "Failed", "Delivered", "Read", "Bounced", "Delivered", "Sent",
];

const TEMPLATES_BY_CHANNEL = {
  WhatsApp: ["order_confirmation_v2", "cod_reminder_evening", "abandoned_cart_recovery", "cashback_offer_diwali", "delivery_update_final"],
  Email: ["welcome_series_01", "invoice_receipt", "win_back_30d", "product_review_request"],
  SMS: ["otp_verification", "order_shipped_alert", "flash_sale_today"],
  RCS: ["rich_card_new_arrival", "carousel_offer_weekend"],
  "AI Calling": ["cod_confirmation_call", "feedback_survey_call", "delivery_reminder_call"],
};

const ERRORS_BY_CHANNEL = {
  WhatsApp: ["Rate limit hit", "Health Ecosystem issue", "Template not approved", "User opted out"],
  Email: ["Mailbox full", "Spam block"],
  SMS: ["DND Provider level block", "Invalid number"],
  RCS: ["Device not RCS-capable", "Agent not verified"],
  "AI Calling": ["No answer", "Call declined", "Number unreachable"],
};

const SENDER_BY_CHANNEL = {
  WhatsApp: { senderPhone: "+91 79771 12200", senderEmail: null },
  Email: { senderPhone: null, senderEmail: "orders@sellerbrand.com" },
  SMS: { senderPhone: "SELLRR", senderEmail: null },
  RCS: { senderPhone: "+91 79771 12200", senderEmail: null },
  "AI Calling": { senderPhone: "+91 79771 12200", senderEmail: null },
};

const NAME_POOL = [
  "priya.sharma", "rahul.verma", "ananya.iyer", "vikram.singh", "neha.gupta",
  "arjun.mehta", "sneha.reddy", "karan.malhotra", "divya.nair", "aditya.rao",
];

function contactForIndex(i, channel) {
  if (channel !== "Email") {
    const digits = String(9800000000 + i * 37).slice(0, 10);
    return { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, email: null };
  }
  const name = NAME_POOL[i % NAME_POOL.length];
  return { phone: null, email: `${name}${i}@gmail.com` };
}

function buildRow(i) {
  const channel = CHANNELS[i % CHANNELS.length];
  const type = TYPES[i % TYPES.length];
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
  const templates = TEMPLATES_BY_CHANNEL[channel];
  const templateName = templates[i % templates.length];
  const { phone, email } = contactForIndex(i, channel);
  const { senderPhone, senderEmail } = SENDER_BY_CHANNEL[channel];

  const isFailure = status === "Failed" || status === "Bounced";
  const errors = ERRORS_BY_CHANNEL[channel];
  const errorResponse = isFailure ? errors[i % errors.length] : null;

  // Stay within a single calendar day (0-29 days back) — never cross a day
  // boundary here, so date-range filtering (which compares whole UTC days)
  // always sees a row from the day it was assigned to.
  // Hour is always 06:00-11:59 UTC, strictly before the anchor's 12:00 UTC —
  // this keeps every row's sentAt at or before the anchor even when
  // dayOffset is 0 ("today"), so no row is ever a "future" timestamp.
  const dayOffset = i % 30;
  const sentAt = new Date(ANCHOR_MS - dayOffset * DAY_MS);
  sentAt.setUTCHours(6 + (i % 6), (i * 7) % 60, 0, 0);

  const updateOffsetMs = 60 * 1000 + (i % 180) * 60 * 1000; // 1 min to 3h later
  const updatedAt = new Date(sentAt.getTime() + updateOffsetMs);

  const isTerminalState = status === "Delivered" || status === "Read" || status === "Sent";
  const aiCallDurationSec = channel === "AI Calling" && isTerminalState ? 30 + ((i * 47) % 570) : null;

  return {
    id: `log-${String(i + 1).padStart(4, "0")}`,
    sentAt: sentAt.toISOString(),
    engageId: `ENG-${48000 + i}`,
    phone,
    email,
    type,
    templateName,
    channel,
    senderPhone,
    senderEmail,
    deliveryStatus: status,
    aiCallDurationSec,
    errorResponse,
    updatedAt: updatedAt.toISOString(),
  };
}

export const COMMUNICATION_LOGS = Array.from({ length: ROW_COUNT }, (_, i) => buildRow(i));

export const LOG_CHANNELS = CHANNELS;
export const LOG_TYPES = TYPES;
export const LOG_STATUSES = ["Sent", "Delivered", "Read", "Failed", "Bounced", "Pending"];
export const LOG_DATA_ANCHOR = new Date(ANCHOR_MS);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="mockCommunicationLogs" --watchAll=false`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/data/mockCommunicationLogs.js src/components/analytics/logs/data/__tests__/mockCommunicationLogs.test.js
git commit -m "feat: add deterministic mock dataset for Communication Logs tab

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Filter/sort/facet pure helpers

**Files:**
- Create: `src/components/analytics/logs/logsFilterUtils.js`
- Test: `src/components/analytics/logs/__tests__/logsFilterUtils.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 directly (takes plain row arrays as input — decoupled from the mock data module so it's testable with hand-built fixtures).
- Produces (used by Tasks 3, 5, 6):
  - `resolveDateRange(preset, customRange, anchor)` → `{ from: Date, to: Date } | null`. `preset` is one of `"today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "last_month" | "custom"`. For `"custom"`, `customRange` is `{ from: Date, to?: Date }` (returns `null` if `customRange` or `customRange.from` is missing).
  - `filterLogs(logs, filters, options)` → filtered array. `filters = { dateRange, search, types: Set, channels: Set, statuses: Set, errors: Set }`. `options = { exclude: string[] }` (any of `"types" | "channels" | "statuses" | "errors"` — skips that facet's own filter, used for facet-count computation).
  - `computeFacetCounts(logs, facetKey)` → `Map<string, number>`. `facetKey` is one of `"types" | "channels" | "statuses" | "errors"`.
  - `sortLogs(logs, sort)` → sorted array (new array, does not mutate). `sort = { field: "sentAt" | "updatedAt", dir: "asc" | "desc" }`.
  - `formatLogTimestamp(isoString)` → display string, `"—"` for `null`/`undefined`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/__tests__/logsFilterUtils.test.js`:

```js
import { resolveDateRange, filterLogs, computeFacetCounts, sortLogs, formatLogTimestamp } from "../logsFilterUtils";

const ANCHOR = new Date("2026-08-10T12:00:00Z");

const ROWS = [
  { id: "1", sentAt: "2026-08-10T08:00:00Z", updatedAt: "2026-08-10T09:00:00Z", type: "Campaign", channel: "WhatsApp", deliveryStatus: "Delivered", errorResponse: null, engageId: "ENG-1", phone: "+91 90000 00001", email: null, templateName: "order_confirmation_v2" },
  { id: "2", sentAt: "2026-08-05T08:00:00Z", updatedAt: "2026-08-05T09:00:00Z", type: "Journey", channel: "SMS", deliveryStatus: "Failed", errorResponse: "DND Provider level block", engageId: "ENG-2", phone: "+91 90000 00002", email: null, templateName: "otp_verification" },
  { id: "3", sentAt: "2026-06-01T08:00:00Z", updatedAt: "2026-06-01T09:00:00Z", type: "Campaign", channel: "Email", deliveryStatus: "Bounced", errorResponse: "Mailbox full", engageId: "ENG-3", phone: null, email: "priya@x.com", templateName: "invoice_receipt" },
];

function emptyFilters(overrides = {}) {
  return { dateRange: null, search: "", types: new Set(), channels: new Set(), statuses: new Set(), errors: new Set(), ...overrides };
}

describe("resolveDateRange", () => {
  test("today resolves to the anchor's calendar day (UTC)", () => {
    const range = resolveDateRange("today", null, ANCHOR);
    expect(range.from.getUTCDate()).toBe(10);
    expect(range.to.getUTCDate()).toBe(10);
  });

  test("last_7_days spans 7 calendar days ending on the anchor", () => {
    const range = resolveDateRange("last_7_days", null, ANCHOR);
    const spanDays = Math.round((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000));
    expect(spanDays).toBe(6);
  });

  test("last_30_days covers a row from 29 days before the anchor", () => {
    const range = resolveDateRange("last_30_days", null, ANCHOR);
    const oldRow = new Date(ANCHOR.getTime() - 29 * 24 * 60 * 60 * 1000);
    expect(oldRow.getTime()).toBeGreaterThanOrEqual(range.from.getTime());
    expect(oldRow.getTime()).toBeLessThanOrEqual(range.to.getTime());
  });

  test("custom uses the provided from/to", () => {
    const range = resolveDateRange("custom", { from: new Date("2026-07-01T00:00:00Z"), to: new Date("2026-07-05T00:00:00Z") }, ANCHOR);
    expect(range.from.getUTCMonth()).toBe(6);
    expect(range.to.getUTCDate()).toBe(5);
  });

  test("custom with no from returns null", () => {
    expect(resolveDateRange("custom", null, ANCHOR)).toBeNull();
  });
});

describe("filterLogs", () => {
  test("filters by date range", () => {
    const range = resolveDateRange("last_7_days", null, ANCHOR);
    const result = filterLogs(ROWS, emptyFilters({ dateRange: range }));
    expect(result.map((r) => r.id)).toEqual(["1", "2"]);
  });

  test("filters by a facet set", () => {
    const result = filterLogs(ROWS, emptyFilters({ channels: new Set(["SMS"]) }));
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  test("search matches engageId, phone, email, or templateName (case-insensitive)", () => {
    const result = filterLogs(ROWS, emptyFilters({ search: "PRIYA" }));
    expect(result.map((r) => r.id)).toEqual(["3"]);
  });

  test("exclude option skips a facet's own filter", () => {
    const result = filterLogs(ROWS, emptyFilters({ channels: new Set(["SMS"]) }), { exclude: ["channels"] });
    expect(result.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});

describe("computeFacetCounts", () => {
  test("counts distinct values for a facet field, ignoring nulls", () => {
    const counts = computeFacetCounts(ROWS, "errors");
    expect(counts.get("DND Provider level block")).toBe(1);
    expect(counts.get("Mailbox full")).toBe(1);
    expect(counts.has(null)).toBe(false);
  });
});

describe("sortLogs", () => {
  test("sorts descending", () => {
    const sorted = sortLogs(ROWS, { field: "sentAt", dir: "desc" });
    expect(sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  test("sorts ascending and does not mutate the input", () => {
    const sorted = sortLogs(ROWS, { field: "sentAt", dir: "asc" });
    expect(sorted.map((r) => r.id)).toEqual(["3", "2", "1"]);
    expect(ROWS.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});

describe("formatLogTimestamp", () => {
  test("returns an em dash for null", () => {
    expect(formatLogTimestamp(null)).toBe("—");
  });

  test("formats an ISO string into a readable date/time", () => {
    expect(formatLogTimestamp("2026-08-10T08:00:00Z")).toMatch(/2026/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="logsFilterUtils" --watchAll=false`
Expected: FAIL — `Cannot find module '../logsFilterUtils'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/logsFilterUtils.js`:

```js
// Pure filter/sort/facet-count helpers for the Communication Logs table.
// Kept free of React and of the mock data module so they're unit-testable
// with plain fixtures. All date-range math is UTC-based on purpose — mixing
// UTC-built timestamps (mockCommunicationLogs.js) with local-timezone day
// boundaries here would make date filtering flaky depending on the runner's
// timezone.

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function addDaysUTC(date, delta) {
  return new Date(date.getTime() + delta * 24 * 60 * 60 * 1000);
}

const PRESET_RANGES = {
  today: (anchor) => ({ from: startOfDayUTC(anchor), to: endOfDayUTC(anchor) }),
  yesterday: (anchor) => {
    const y = addDaysUTC(anchor, -1);
    return { from: startOfDayUTC(y), to: endOfDayUTC(y) };
  },
  last_7_days: (anchor) => ({ from: startOfDayUTC(addDaysUTC(anchor, -6)), to: endOfDayUTC(anchor) }),
  last_30_days: (anchor) => ({ from: startOfDayUTC(addDaysUTC(anchor, -29)), to: endOfDayUTC(anchor) }),
  this_month: (anchor) => ({
    from: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)),
    to: endOfDayUTC(anchor),
  }),
  last_month: (anchor) => {
    const firstOfThisMonth = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
    const lastMonthEnd = new Date(firstOfThisMonth - 1);
    return {
      from: new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1)),
      to: endOfDayUTC(lastMonthEnd),
    };
  },
};

export function resolveDateRange(preset, customRange, anchor) {
  if (preset === "custom") {
    if (!customRange?.from) return null;
    return { from: startOfDayUTC(customRange.from), to: endOfDayUTC(customRange.to || customRange.from) };
  }
  const resolver = PRESET_RANGES[preset];
  return resolver ? resolver(anchor) : null;
}

const FACET_FIELD_MAP = { types: "type", channels: "channel", statuses: "deliveryStatus", errors: "errorResponse" };

export function filterLogs(logs, filters, options = {}) {
  const exclude = new Set(options.exclude || []);
  const range = filters.dateRange;
  const search = (filters.search || "").trim().toLowerCase();

  return logs.filter((log) => {
    if (range) {
      const sentMs = new Date(log.sentAt).getTime();
      if (sentMs < range.from.getTime() || sentMs > range.to.getTime()) return false;
    }
    for (const key of ["types", "channels", "statuses", "errors"]) {
      if (exclude.has(key)) continue;
      const set = filters[key];
      if (set && set.size > 0 && !set.has(log[FACET_FIELD_MAP[key]])) return false;
    }
    if (search) {
      const haystack = [log.engageId, log.phone, log.email, log.templateName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function computeFacetCounts(logs, facetKey) {
  const field = FACET_FIELD_MAP[facetKey];
  const counts = new Map();
  for (const log of logs) {
    const value = log[field];
    if (value == null) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

export function sortLogs(logs, sort) {
  const { field, dir } = sort;
  const sorted = [...logs].sort((a, b) => new Date(a[field]).getTime() - new Date(b[field]).getTime());
  if (dir === "desc") sorted.reverse();
  return sorted;
}

export function formatLogTimestamp(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="logsFilterUtils" --watchAll=false`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/logsFilterUtils.js src/components/analytics/logs/__tests__/logsFilterUtils.test.js
git commit -m "feat: add pure filter/sort/facet helpers for Communication Logs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `LogsTable` component

**Files:**
- Create: `src/components/analytics/logs/LogsTable.jsx`
- Test: `src/components/analytics/logs/__tests__/LogsTable.test.jsx`

**Interfaces:**
- Consumes: `formatLogTimestamp` from Task 2 (`./logsFilterUtils`); shadcn `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` (`@/components/ui/table`) and `Badge` (`@/components/ui/badge`).
- Produces: default export `LogsTable({ rows, sort, onSortChange, onRowClick })`. `rows`: array of `LogRow` (Task 1 shape). `sort`: `{ field: "sentAt" | "updatedAt", dir: "asc" | "desc" }`. `onSortChange(field)`: called with the clicked field's name — the caller (Task 6) owns toggling direction. `onRowClick(row)`: called with the full row object when a row is clicked. Renders `data-testid="logs-table"` (or `"logs-table-empty"` when `rows` is empty), and per-row `data-testid={\`logs-row-${row.id}\`}`. Sortable header buttons: `data-testid={\`logs-sort-${field}\`}` for `field` in `sentAt`/`updatedAt` only.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/__tests__/LogsTable.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogsTable from "../LogsTable";

const ROWS = [
  { id: "log-0001", sentAt: "2026-08-10T08:00:00Z", updatedAt: "2026-08-10T09:00:00Z", engageId: "ENG-1", phone: "+91 90000 00001", email: null, type: "Campaign", templateName: "order_confirmation_v2", channel: "WhatsApp", deliveryStatus: "Delivered", errorResponse: null },
  { id: "log-0002", sentAt: "2026-08-05T08:00:00Z", updatedAt: "2026-08-05T09:00:00Z", engageId: "ENG-2", phone: "+91 90000 00002", email: null, type: "Journey", templateName: "otp_verification", channel: "SMS", deliveryStatus: "Failed", errorResponse: "DND Provider level block" },
];

const SORT = { field: "sentAt", dir: "desc" };

describe("LogsTable", () => {
  test("renders one row per log", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0001")).toBeInTheDocument();
    expect(screen.getByTestId("logs-row-log-0002")).toBeInTheDocument();
  });

  test("shows an em dash when there is no error response", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0001").textContent).toContain("—");
  });

  test("shows the error text when present", () => {
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-row-log-0002").textContent).toContain("DND Provider level block");
  });

  test("clicking the Sent Timestamp header requests a sort on that field", () => {
    const onSortChange = jest.fn();
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={onSortChange} onRowClick={() => {}} />);
    fireEvent.click(screen.getByTestId("logs-sort-sentAt"));
    expect(onSortChange).toHaveBeenCalledWith("sentAt");
  });

  test("clicking a row invokes onRowClick with that row", () => {
    const onRowClick = jest.fn();
    render(<LogsTable rows={ROWS} sort={SORT} onSortChange={() => {}} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByTestId("logs-row-log-0001"));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  test("renders the empty state when there are no rows", () => {
    render(<LogsTable rows={[]} sort={SORT} onSortChange={() => {}} onRowClick={() => {}} />);
    expect(screen.getByTestId("logs-table-empty")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="LogsTable" --watchAll=false`
Expected: FAIL — `Cannot find module '../LogsTable'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/LogsTable.jsx`:

```jsx
import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, MessageCircle, Mail, MessageSquare, MessageCircleMore, PhoneCall } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatLogTimestamp } from "./logsFilterUtils";

const CHANNEL_ICON = {
  WhatsApp: MessageCircle,
  Email: Mail,
  SMS: MessageSquare,
  RCS: MessageCircleMore,
  "AI Calling": PhoneCall,
};

const STATUS_STYLE = {
  Delivered: "bg-emerald-50 text-emerald-700",
  Read: "bg-emerald-50 text-emerald-700",
  Sent: "bg-slate-100 text-slate-700",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-red-50 text-red-700",
  Bounced: "bg-red-50 text-red-700",
};

const SORTABLE_LABELS = { sentAt: "Sent Timestamp", updatedAt: "Last Update Time" };

function SortHeader({ field, sort, onSortChange }) {
  const isActive = sort.field === field;
  const Icon = !isActive ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      data-testid={`logs-sort-${field}`}
      onClick={() => onSortChange(field)}
      className={`inline-flex items-center gap-1 hover:text-text-primary transition-colors ${isActive ? "text-text-primary" : ""}`}
    >
      {SORTABLE_LABELS[field]}
      <Icon className="w-3 h-3" />
    </button>
  );
}

export default function LogsTable({ rows, sort, onSortChange, onRowClick }) {
  if (rows.length === 0) {
    return (
      <div
        data-testid="logs-table-empty"
        className="flex flex-col items-center justify-center gap-2 py-16 text-text-muted bg-surface border border-border rounded-lg"
      >
        <p className="text-sm">No logs match your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="logs-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader field="sentAt" sort={sort} onSortChange={onSortChange} /></TableHead>
            <TableHead>Engage ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Template Name</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Delivery Status</TableHead>
            <TableHead>Error Response</TableHead>
            <TableHead><SortHeader field="updatedAt" sort={sort} onSortChange={onSortChange} /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const ChannelIcon = CHANNEL_ICON[row.channel];
            return (
              <TableRow key={row.id} data-testid={`logs-row-${row.id}`} onClick={() => onRowClick(row)} className="cursor-pointer">
                <TableCell className="whitespace-nowrap text-[13px]">{formatLogTimestamp(row.sentAt)}</TableCell>
                <TableCell className="text-[13px]">{row.engageId}</TableCell>
                <TableCell className="text-[13px]">{row.phone || row.email}</TableCell>
                <TableCell><Badge variant="outline">{row.type}</Badge></TableCell>
                <TableCell className="text-[13px] max-w-[180px] truncate" title={row.templateName}>{row.templateName}</TableCell>
                <TableCell className="text-[13px]">
                  <span className="inline-flex items-center gap-1.5">
                    {ChannelIcon && <ChannelIcon className="w-3.5 h-3.5 text-text-muted" />}
                    {row.channel}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[row.deliveryStatus]}`}>
                    {row.deliveryStatus}
                  </span>
                </TableCell>
                <TableCell className="text-[13px] max-w-[200px] truncate text-text-muted" title={row.errorResponse || undefined}>
                  {row.errorResponse || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[13px]">{formatLogTimestamp(row.updatedAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="LogsTable" --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/LogsTable.jsx src/components/analytics/logs/__tests__/LogsTable.test.jsx
git commit -m "feat: add LogsTable component for Communication Logs tab

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `LogDetailDrawer` component

**Files:**
- Create: `src/components/analytics/logs/LogDetailDrawer.jsx`
- Test: `src/components/analytics/logs/__tests__/LogDetailDrawer.test.jsx`

**Interfaces:**
- Consumes: `formatLogTimestamp` from Task 2; shadcn `Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription` (`@/components/ui/sheet`).
- Produces: default export `LogDetailDrawer({ row, onClose })`. `row`: `LogRow | null` — `null` means closed. `onClose()`: called when the sheet is dismissed. Renders `data-testid="log-detail-drawer"` (only present when open) and one `data-testid={\`log-detail-field-${key}\`}` per visible field, where `key` matches the `LogRow` property name (`sentAt`, `engageId`, `phone`, `email`, `type`, `templateName`, `channel`, `senderPhone`, `senderEmail`, `deliveryStatus`, `aiCallDurationSec`, `errorResponse`, `updatedAt`). The `aiCallDurationSec` field row is omitted entirely (no test id rendered) unless `row.channel === "AI Calling"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/__tests__/LogDetailDrawer.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogDetailDrawer from "../LogDetailDrawer";

const WHATSAPP_ROW = {
  id: "log-0001", sentAt: "2026-08-10T08:00:00Z", engageId: "ENG-1", phone: "+91 90000 00001", email: null,
  type: "Campaign", templateName: "order_confirmation_v2", channel: "WhatsApp", senderPhone: "+91 79771 12200",
  senderEmail: null, deliveryStatus: "Delivered", aiCallDurationSec: null, errorResponse: null, updatedAt: "2026-08-10T09:00:00Z",
};

const AI_CALL_ROW = { ...WHATSAPP_ROW, channel: "AI Calling", aiCallDurationSec: 120 };

describe("LogDetailDrawer", () => {
  test("renders nothing when row is null", () => {
    render(<LogDetailDrawer row={null} onClose={() => {}} />);
    expect(screen.queryByTestId("log-detail-drawer")).not.toBeInTheDocument();
  });

  test("renders the row's fields when open", () => {
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={() => {}} />);
    expect(screen.getByTestId("log-detail-field-engageId").textContent).toContain("ENG-1");
    expect(screen.getByTestId("log-detail-field-templateName").textContent).toContain("order_confirmation_v2");
  });

  test("omits AI Call Duration for non-AI-Calling channels", () => {
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={() => {}} />);
    expect(screen.queryByTestId("log-detail-field-aiCallDurationSec")).not.toBeInTheDocument();
  });

  test("shows AI Call Duration for AI Calling rows", () => {
    render(<LogDetailDrawer row={AI_CALL_ROW} onClose={() => {}} />);
    expect(screen.getByTestId("log-detail-field-aiCallDurationSec").textContent).toContain("120s");
  });

  test("calls onClose when the sheet's close button is clicked", () => {
    const onClose = jest.fn();
    render(<LogDetailDrawer row={WHATSAPP_ROW} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="LogDetailDrawer" --watchAll=false`
Expected: FAIL — `Cannot find module '../LogDetailDrawer'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/LogDetailDrawer.jsx`:

```jsx
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatLogTimestamp } from "./logsFilterUtils";

const FIELD_ROWS = [
  { key: "sentAt", label: "Sent Timestamp", format: formatLogTimestamp },
  { key: "engageId", label: "Engage ID" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "type", label: "Type" },
  { key: "templateName", label: "Template Name" },
  { key: "channel", label: "Communication Channel" },
  { key: "senderPhone", label: "Sender Phone Number" },
  { key: "senderEmail", label: "Sender Email" },
  { key: "deliveryStatus", label: "Delivery Status" },
  { key: "aiCallDurationSec", label: "AI Call Duration", format: (s) => `${s}s`, showIf: (row) => row.channel === "AI Calling" },
  { key: "errorResponse", label: "Error Response" },
  { key: "updatedAt", label: "Last Update Time", format: formatLogTimestamp },
];

export default function LogDetailDrawer({ row, onClose }) {
  const open = row != null;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent data-testid="log-detail-drawer">
        <SheetHeader>
          <SheetTitle>{row?.engageId}</SheetTitle>
          <SheetDescription>{row?.templateName}</SheetDescription>
        </SheetHeader>
        <dl className="mt-4 space-y-3">
          {row &&
            FIELD_ROWS.filter((f) => !f.showIf || f.showIf(row)).map((f) => {
              const rawValue = row[f.key];
              const value = rawValue == null ? "—" : f.format ? f.format(rawValue) : String(rawValue);
              return (
                <div key={f.key} className="flex items-start justify-between gap-4" data-testid={`log-detail-field-${f.key}`}>
                  <dt className="text-[12px] text-text-muted">{f.label}</dt>
                  <dd className="text-[13px] text-text-primary text-right">{value}</dd>
                </div>
              );
            })}
        </dl>
      </SheetContent>
    </Sheet>
  );
}
```

Note: `SheetContent` only renders when `open` is true (Radix `Dialog.Root open={false}` unmounts its portal content), so `data-testid="log-detail-drawer"` naturally disappears when `row` is `null` — no extra guard needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="LogDetailDrawer" --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/LogDetailDrawer.jsx src/components/analytics/logs/__tests__/LogDetailDrawer.test.jsx
git commit -m "feat: add LogDetailDrawer component for Communication Logs tab

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `LogsFilterBar` component

**Files:**
- Create: `src/components/analytics/logs/LogsFilterBar.jsx`
- Test: `src/components/analytics/logs/__tests__/LogsFilterBar.test.jsx`

**Interfaces:**
- Consumes: `Input` (`@/components/ui/input`), `Popover/PopoverTrigger/PopoverContent` (`@/components/ui/popover`), `Checkbox` (`@/components/ui/checkbox`), `Calendar` (`@/components/ui/calendar`).
- Produces: default export `LogsFilterBar(props)` with props:
  - `search: string`, `onSearchChange(value: string)`
  - `dateFilter: { preset: string, customRange: {from,to}|null }`, `onDateFilterChange(next: { preset, customRange })`
  - `typeOptions: { value, count }[]`, `typeSelected: Set<string>`, `onTypeChange(nextSet: Set<string>)`
  - `channelOptions`, `channelSelected`, `onChannelChange` — same shape, for channel
  - `statusOptions`, `statusSelected`, `onStatusChange` — same shape, for status
  - `errorOptions`, `errorSelected`, `onErrorChange` — same shape, for error response (disabled when `errorOptions.length === 0`)
  - `onClearAll()`
  - Test ids: `logs-search`, `logs-date-trigger`/`logs-date-menu`/`logs-date-option-{preset}`/`logs-date-calendar`/`logs-date-custom-apply`, `logs-filter-{type|channel|status|error}-trigger`/`-menu`/`-option-{value}`, `logs-chip-{facet}-{value}`, `logs-clear-all`, `logs-active-chips`.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/__tests__/LogsFilterBar.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogsFilterBar from "../LogsFilterBar";

// Same workaround used by TimeRangeFilter.test.jsx and Analytics.test.jsx:
// react-day-picker/date-fns trip Jest's ESM handling, so the Calendar
// primitive is mocked wherever a component that renders it is tested.
jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar-mock" />,
}));

function baseProps(overrides = {}) {
  return {
    search: "",
    onSearchChange: jest.fn(),
    dateFilter: { preset: "last_30_days", customRange: null },
    onDateFilterChange: jest.fn(),
    typeOptions: [{ value: "Campaign", count: 3 }, { value: "Journey", count: 2 }],
    typeSelected: new Set(),
    onTypeChange: jest.fn(),
    channelOptions: [{ value: "WhatsApp", count: 4 }],
    channelSelected: new Set(),
    onChannelChange: jest.fn(),
    statusOptions: [{ value: "Delivered", count: 5 }],
    statusSelected: new Set(),
    onStatusChange: jest.fn(),
    errorOptions: [],
    errorSelected: new Set(),
    onErrorChange: jest.fn(),
    onClearAll: jest.fn(),
    ...overrides,
  };
}

describe("LogsFilterBar", () => {
  test("typing in the search box calls onSearchChange", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-1" } });
    expect(props.onSearchChange).toHaveBeenCalledWith("ENG-1");
  });

  test("selecting a Type facet option calls onTypeChange with the value added", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("logs-filter-type-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-type-option-Campaign"));
    expect(props.onTypeChange).toHaveBeenCalledWith(new Set(["Campaign"]));
  });

  test("shows a removable chip for each selected facet value", () => {
    const props = baseProps({ channelSelected: new Set(["WhatsApp"]) });
    render(<LogsFilterBar {...props} />);
    expect(screen.getByTestId("logs-chip-channel-WhatsApp")).toBeInTheDocument();
  });

  test("removing a chip calls the facet's onChange with the value removed", () => {
    const props = baseProps({ channelSelected: new Set(["WhatsApp"]) });
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByLabelText("Remove WhatsApp filter"));
    expect(props.onChannelChange).toHaveBeenCalledWith(new Set());
  });

  test("the Error Response facet is disabled when there are no error options", () => {
    const props = baseProps();
    render(<LogsFilterBar {...props} />);
    expect(screen.getByTestId("logs-filter-error-trigger")).toBeDisabled();
  });

  test("Clear all appears once a filter is active and invokes onClearAll", () => {
    const props = baseProps({ search: "abc" });
    render(<LogsFilterBar {...props} />);
    fireEvent.click(screen.getByTestId("logs-clear-all"));
    expect(props.onClearAll).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="LogsFilterBar" --watchAll=false`
Expected: FAIL — `Cannot find module '../LogsFilterBar'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/LogsFilterBar.jsx`:

```jsx
import React, { useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FacetPopover({ testId, label, options, selected, onChange, disabled, disabledReason }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={`${testId}-trigger`}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md border text-[12px] font-medium transition-colors ${
            disabled
              ? "border-border text-text-muted opacity-50 cursor-not-allowed"
              : selected.size > 0
              ? "border-primary text-primary bg-primary-tint"
              : "border-border text-text-primary hover:bg-slate-50"
          }`}
        >
          {label}{selected.size > 0 ? ` (${selected.size})` : ""}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" data-testid={`${testId}-menu`}>
        {options.length === 0 ? (
          <p className="text-[12px] text-text-muted px-1 py-2">No options in current results.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-auto">
            {options.map((opt) => (
              <label key={opt.value} data-testid={`${testId}-option-${opt.value}`} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-[13px]">
                <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => onChange(toggleInSet(selected, opt.value))} />
                <span className="flex-1">{opt.value}</span>
                <span className="text-text-muted text-[11px]">{opt.count}</span>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateRangeFilter({ dateFilter, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [draftRange, setDraftRange] = useState(dateFilter.customRange);
  const activeLabel = DATE_PRESETS.find((p) => p.value === dateFilter.preset)?.label || "Last 30 Days";

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setShowCustom(false); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="logs-date-trigger"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] font-medium text-text-primary hover:bg-slate-50 transition-colors"
        >
          {activeLabel}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1" data-testid="logs-date-menu">
        {!showCustom ? (
          DATE_PRESETS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid={`logs-date-option-${opt.value}`}
              onClick={() => {
                if (opt.value === "custom") { setShowCustom(true); return; }
                onChange({ preset: opt.value, customRange: null });
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-slate-50 transition-colors ${
                opt.value === dateFilter.preset ? "text-primary font-medium" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <div data-testid="logs-date-calendar" className="p-1">
            <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} numberOfMonths={1} />
            <button
              type="button"
              data-testid="logs-date-custom-apply"
              disabled={!draftRange?.from}
              onClick={() => {
                onChange({ preset: "custom", customRange: draftRange });
                setOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 rounded-md bg-primary text-white text-[13px] font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function LogsFilterBar({
  search, onSearchChange,
  dateFilter, onDateFilterChange,
  typeOptions, typeSelected, onTypeChange,
  channelOptions, channelSelected, onChannelChange,
  statusOptions, statusSelected, onStatusChange,
  errorOptions, errorSelected, onErrorChange,
  onClearAll,
}) {
  const chips = [
    ...[...typeSelected].map((v) => ({ facet: "type", value: v, onRemove: () => onTypeChange(toggleInSet(typeSelected, v)) })),
    ...[...channelSelected].map((v) => ({ facet: "channel", value: v, onRemove: () => onChannelChange(toggleInSet(channelSelected, v)) })),
    ...[...statusSelected].map((v) => ({ facet: "status", value: v, onRemove: () => onStatusChange(toggleInSet(statusSelected, v)) })),
    ...[...errorSelected].map((v) => ({ facet: "error", value: v, onRemove: () => onErrorChange(toggleInSet(errorSelected, v)) })),
  ];
  const hasActiveFilters = chips.length > 0 || dateFilter.preset !== "last_30_days" || search.trim() !== "";

  return (
    <div data-testid="logs-filter-bar" className="space-y-2 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            data-testid="logs-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Engage ID, phone, email, or template..."
            className="pl-9 w-[300px]"
          />
        </div>
        <DateRangeFilter dateFilter={dateFilter} onChange={onDateFilterChange} />
        <FacetPopover testId="logs-filter-type" label="Type" options={typeOptions} selected={typeSelected} onChange={onTypeChange} />
        <FacetPopover testId="logs-filter-channel" label="Channel" options={channelOptions} selected={channelSelected} onChange={onChannelChange} />
        <FacetPopover testId="logs-filter-status" label="Status" options={statusOptions} selected={statusSelected} onChange={onStatusChange} />
        <FacetPopover
          testId="logs-filter-error"
          label="Error Response"
          options={errorOptions}
          selected={errorSelected}
          onChange={onErrorChange}
          disabled={errorOptions.length === 0}
          disabledReason="No errors in current results"
        />
        {hasActiveFilters && (
          <button type="button" data-testid="logs-clear-all" onClick={onClearAll} className="text-[12px] text-primary hover:underline ml-1">
            Clear all
          </button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap" data-testid="logs-active-chips">
          {chips.map((chip) => (
            <span key={`${chip.facet}-${chip.value}`} data-testid={`logs-chip-${chip.facet}-${chip.value}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-text-secondary">
              {chip.value}
              <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.value} filter`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="LogsFilterBar" --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/LogsFilterBar.jsx src/components/analytics/logs/__tests__/LogsFilterBar.test.jsx
git commit -m "feat: add LogsFilterBar component for Communication Logs tab

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `CommunicationLogsTab` container

**Files:**
- Create: `src/components/analytics/logs/CommunicationLogsTab.jsx`
- Test: `src/components/analytics/logs/__tests__/CommunicationLogsTab.test.jsx`

**Interfaces:**
- Consumes: `COMMUNICATION_LOGS, LOG_TYPES, LOG_CHANNELS, LOG_STATUSES, LOG_DATA_ANCHOR` (Task 1, `./data/mockCommunicationLogs`); `filterLogs, sortLogs, computeFacetCounts, resolveDateRange` (Task 2, `./logsFilterUtils`); `LogsFilterBar` (Task 5); `LogsTable` (Task 3); `LogDetailDrawer` (Task 4); `Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext` (`@/components/ui/pagination`).
- Produces: default export `CommunicationLogsTab()` — no props (self-contained, same convention as `OverviewTab`, except it manages its own date filter independently of the page-level `TimeRangeFilter`). Renders `data-testid="communication-logs-tab"`, `data-testid="logs-result-count"` (text: `"{n} log"` / `"{n} logs"`), and pagination controls `data-testid="logs-page-{n}"` / `logs-page-prev` / `logs-page-next` when there is more than one page.

- [ ] **Step 1: Write the failing test**

Create `src/components/analytics/logs/__tests__/CommunicationLogsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CommunicationLogsTab from "../CommunicationLogsTab";

jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar-mock" />,
}));

describe("CommunicationLogsTab", () => {
  test("renders the full 150-row dataset within the default last-30-days window", () => {
    render(<CommunicationLogsTab />);
    expect(screen.getByTestId("logs-result-count").textContent).toBe("150 logs");
  });

  test("typing in search narrows the result count", () => {
    render(<CommunicationLogsTab />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-4800" } });
    expect(screen.getByTestId("logs-result-count").textContent).not.toBe("150 logs");
  });

  test("combining a channel filter and a status filter narrows results further than the channel filter alone", () => {
    render(<CommunicationLogsTab />);
    fireEvent.click(screen.getByTestId("logs-filter-channel-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-channel-option-WhatsApp"));
    const afterChannel = parseInt(screen.getByTestId("logs-result-count").textContent, 10);

    fireEvent.click(screen.getByTestId("logs-filter-status-trigger"));
    fireEvent.click(screen.getByTestId("logs-filter-status-option-Failed"));
    const afterBoth = parseInt(screen.getByTestId("logs-result-count").textContent, 10);

    expect(afterBoth).toBeLessThan(afterChannel);
  });

  test("shows pagination and moves to a different page of rows on click", () => {
    render(<CommunicationLogsTab />);
    expect(screen.getByTestId("logs-page-2")).toBeInTheDocument();
    const firstRowBefore = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    fireEvent.click(screen.getByTestId("logs-page-2"));
    const firstRowAfter = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    expect(firstRowAfter).not.toBe(firstRowBefore);
  });

  test("clicking a row opens the detail drawer", () => {
    render(<CommunicationLogsTab />);
    const firstRowTestId = screen.getAllByTestId(/^logs-row-/)[0].getAttribute("data-testid");
    fireEvent.click(screen.getByTestId(firstRowTestId));
    expect(screen.getByTestId("log-detail-drawer")).toBeInTheDocument();
  });

  test("Clear all resets search, filters, and pagination back to the full dataset", () => {
    render(<CommunicationLogsTab />);
    fireEvent.change(screen.getByTestId("logs-search"), { target: { value: "ENG-4800" } });
    fireEvent.click(screen.getByTestId("logs-clear-all"));
    expect(screen.getByTestId("logs-result-count").textContent).toBe("150 logs");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="CommunicationLogsTab" --watchAll=false`
Expected: FAIL — `Cannot find module '../CommunicationLogsTab'`

- [ ] **Step 3: Write the implementation**

Create `src/components/analytics/logs/CommunicationLogsTab.jsx`:

```jsx
import React, { useMemo, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import LogsFilterBar from "./LogsFilterBar";
import LogsTable from "./LogsTable";
import LogDetailDrawer from "./LogDetailDrawer";
import { COMMUNICATION_LOGS, LOG_TYPES, LOG_CHANNELS, LOG_STATUSES, LOG_DATA_ANCHOR } from "./data/mockCommunicationLogs";
import { filterLogs, sortLogs, computeFacetCounts, resolveDateRange } from "./logsFilterUtils";

const PAGE_SIZE = 25;
const DEFAULT_DATE_FILTER = { preset: "last_30_days", customRange: null };

function toOptions(countsMap, universe) {
  return universe.filter((value) => countsMap.has(value)).map((value) => ({ value, count: countsMap.get(value) }));
}

export default function CommunicationLogsTab() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(DEFAULT_DATE_FILTER);
  const [typeSelected, setTypeSelected] = useState(new Set());
  const [channelSelected, setChannelSelected] = useState(new Set());
  const [statusSelected, setStatusSelected] = useState(new Set());
  const [errorSelected, setErrorSelected] = useState(new Set());
  const [sort, setSort] = useState({ field: "sentAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  const dateRange = useMemo(
    () => resolveDateRange(dateFilter.preset, dateFilter.customRange, LOG_DATA_ANCHOR),
    [dateFilter]
  );

  const filters = {
    dateRange,
    search,
    types: typeSelected,
    channels: channelSelected,
    statuses: statusSelected,
    errors: errorSelected,
  };

  const filteredRows = useMemo(() => filterLogs(COMMUNICATION_LOGS, filters), [filters]);
  const sortedRows = useMemo(() => sortLogs(filteredRows, sort), [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const typeOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["types"] }), "types"), LOG_TYPES),
    [filters]
  );
  const channelOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["channels"] }), "channels"), LOG_CHANNELS),
    [filters]
  );
  const statusOptions = useMemo(
    () => toOptions(computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["statuses"] }), "statuses"), LOG_STATUSES),
    [filters]
  );
  const errorOptions = useMemo(() => {
    const counts = computeFacetCounts(filterLogs(COMMUNICATION_LOGS, filters, { exclude: ["errors"] }), "errors");
    return [...counts.entries()].map(([value, count]) => ({ value, count }));
  }, [filters]);

  function withPageReset(setter) {
    return (next) => {
      setter(next);
      setPage(1);
    };
  }

  function handleClearAll() {
    setSearch("");
    setDateFilter(DEFAULT_DATE_FILTER);
    setTypeSelected(new Set());
    setChannelSelected(new Set());
    setStatusSelected(new Set());
    setErrorSelected(new Set());
    setPage(1);
  }

  function handleSortChange(field) {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));
  }

  return (
    <div data-testid="communication-logs-tab" className="space-y-3">
      <p className="text-[13px] text-text-muted" data-testid="logs-result-count">
        {sortedRows.length} log{sortedRows.length === 1 ? "" : "s"}
      </p>
      <LogsFilterBar
        search={search}
        onSearchChange={withPageReset(setSearch)}
        dateFilter={dateFilter}
        onDateFilterChange={withPageReset(setDateFilter)}
        typeOptions={typeOptions}
        typeSelected={typeSelected}
        onTypeChange={withPageReset(setTypeSelected)}
        channelOptions={channelOptions}
        channelSelected={channelSelected}
        onChannelChange={withPageReset(setChannelSelected)}
        statusOptions={statusOptions}
        statusSelected={statusSelected}
        onStatusChange={withPageReset(setStatusSelected)}
        errorOptions={errorOptions}
        errorSelected={errorSelected}
        onErrorChange={withPageReset(setErrorSelected)}
        onClearAll={handleClearAll}
      />
      <LogsTable rows={pageRows} sort={sort} onSortChange={handleSortChange} onRowClick={setSelectedRow} />
      {totalPages > 1 && (
        <Pagination data-testid="logs-pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" data-testid="logs-page-prev" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink href="#" isActive={p === currentPage} data-testid={`logs-page-${p}`} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" data-testid="logs-page-next" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <LogDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="CommunicationLogsTab" --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/logs/CommunicationLogsTab.jsx src/components/analytics/logs/__tests__/CommunicationLogsTab.test.jsx
git commit -m "feat: wire CommunicationLogsTab container together

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Wire the tab into `Analytics.jsx`

**Files:**
- Modify: `src/pages/Analytics.jsx`
- Modify: `src/pages/__tests__/Analytics.test.jsx`

**Interfaces:**
- Consumes: `CommunicationLogsTab` (Task 6, `@/components/analytics/logs/CommunicationLogsTab`).
- Produces: nothing new for other tasks — this is the final integration point.

- [ ] **Step 1: Write the failing test**

Edit `src/pages/__tests__/Analytics.test.jsx` — add a new `test(...)` inside the existing `describe("AnalyticsPage", ...)` block, right after the `"switching to Campaign, Journey, Reports..."` test (the file already globally mocks `@/components/ui/calendar` at the top, which also covers the Calendar rendered inside `CommunicationLogsTab`'s date-range filter, so no additional mock is needed):

```jsx
  test("switching to Communication Logs renders the logs table", () => {
    renderAtTab("overview");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Communication Logs" }));
    expect(screen.getByTestId("communication-logs-tab")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/Analytics" --watchAll=false`
Expected: FAIL — `Unable to find role="tab" and name "Communication Logs"` (tab doesn't exist yet)

- [ ] **Step 3: Write the implementation**

Edit `src/pages/Analytics.jsx`:

```jsx
import CommunicationLogsTab from "@/components/analytics/logs/CommunicationLogsTab";
```
(add alongside the existing `import ComingSoonPanel from ...` / `import OverviewTab from ...` lines)

```jsx
const TABS = [
  { value: "overview", label: "Overview" },
  { value: "campaign", label: "Campaign" },
  { value: "journey", label: "Journey" },
  { value: "reports", label: "Reports" },
  { value: "logs", label: "Communication Logs" },
];
```

```jsx
      {activeTab === "reports" && <ComingSoonPanel tabName="Reports" testId="analytics-tab-reports" />}
      {activeTab === "logs" && <CommunicationLogsTab />}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/Analytics" --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Run the full suite for the whole feature area**

Run: `npx craco test --testPathPattern="analytics|Analytics" --watchAll=false`
Expected: PASS (all Task 1–7 suites plus the pre-existing `Analytics.test.jsx`, `analyticsFormat.test.js`, `mockOverviewAnalytics.test.js`)

- [ ] **Step 6: Commit**

```bash
git add src/pages/Analytics.jsx src/pages/__tests__/Analytics.test.jsx
git commit -m "feat: add Communication Logs tab to the Analytics page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
