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
    expect(spanDays).toBe(7);
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

  test("custom anchors to the LOCAL calendar day of from/to, regardless of the runner's timezone", () => {
    // new Date(year, month, day) is a local-time constructor: whatever timezone
    // the test runs in, reading its year/month/day back gives the same numbers
    // used to build it. So the expected UTC boundary below is a fixed instant
    // that does not depend on the runner's timezone — only a fix that re-derives
    // the day from LOCAL components (not UTC accessors) can match it.
    const from = new Date(2026, 6, 1); // local midnight, July 1st
    const to = new Date(2026, 6, 3); // local midnight, July 3rd
    const range = resolveDateRange("custom", { from, to }, ANCHOR);
    expect(range.from.getTime()).toBe(Date.UTC(2026, 6, 1, 0, 0, 0, 0));
    expect(range.to.getTime()).toBe(Date.UTC(2026, 6, 3, 23, 59, 59, 999));
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

  test("renders in UTC regardless of the runner's local timezone", () => {
    // 23:30 UTC on Aug 10th would roll over to Aug 11th in any UTC+ timezone
    // if the function used local time instead of an explicit UTC timeZone.
    expect(formatLogTimestamp("2026-08-10T23:30:00Z")).toMatch(/^10 Aug/);
  });
});
