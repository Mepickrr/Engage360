import { getOverviewAnalytics } from "../mockOverviewAnalytics";

describe("getOverviewAnalytics", () => {
  test("returns the last_7_days entry with wireframe-matching top-line numbers", () => {
    const data = getOverviewAnalytics("last_7_days");
    expect(data.revenue.overall.value).toBe(21000000);
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
