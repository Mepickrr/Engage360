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

describe.each(["today", "yesterday", "last_7_days", "this_month", "last_month"])(
  "%s internal consistency",
  (key) => {
    test("pctOfOverall matches fastrr/overall ratio", () => {
      const data = getOverviewAnalytics(key);
      const revRatio = (data.revenue.fastrr.value / data.revenue.overall.value) * 100;
      expect(data.revenue.fastrr.pctOfOverall).toBeCloseTo(revRatio, 0);
      const ordRatio = (data.orders.fastrr.value / data.orders.overall.value) * 100;
      expect(data.orders.fastrr.pctOfOverall).toBeCloseTo(ordRatio, 0);
    });

    test("deltaAbs is consistent with value and deltaPct", () => {
      const data = getOverviewAnalytics(key);
      [data.revenue.overall, data.revenue.fastrr, data.orders.overall, data.orders.fastrr].forEach((m) => {
        const expectedDeltaAbs = m.value - m.value / (1 + m.deltaPct / 100);
        expect(Math.abs(m.deltaAbs - expectedDeltaAbs)).toBeLessThan(Math.abs(expectedDeltaAbs) * 0.15 + 5);
      });
    });

    test("revenueSplit and ordersSplit sum to their fastrr top-line value", () => {
      const data = getOverviewAnalytics(key);
      const sum = (arr) => arr.reduce((s, x) => s + x.value, 0);
      expect(sum(data.revenueSplit.byService)).toBe(data.revenue.fastrr.value);
      expect(sum(data.revenueSplit.byChannel)).toBe(data.revenue.fastrr.value);
      expect(sum(data.ordersSplit.byService)).toBe(data.orders.fastrr.value);
      expect(sum(data.ordersSplit.byChannel)).toBe(data.orders.fastrr.value);
    });

    test("fastrr never exceeds overall on any trend point", () => {
      const data = getOverviewAnalytics(key);
      [data.revenueTrend, data.ordersTrend, data.customersTrend].forEach((trend) => {
        trend.forEach((point) => {
          expect(point.fastrr).toBeLessThanOrEqual(point.overall);
        });
      });
    });

    test("revenueTrend and ordersTrend sum within 5% of their top-line values", () => {
      const data = getOverviewAnalytics(key);
      const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
      const within5pct = (actual, expected) => Math.abs(actual - expected) / expected <= 0.05;
      expect(within5pct(sum(data.revenueTrend, "overall"), data.revenue.overall.value)).toBe(true);
      expect(within5pct(sum(data.revenueTrend, "fastrr"), data.revenue.fastrr.value)).toBe(true);
      expect(within5pct(sum(data.ordersTrend, "overall"), data.orders.overall.value)).toBe(true);
      expect(within5pct(sum(data.ordersTrend, "fastrr"), data.orders.fastrr.value)).toBe(true);
    });
  }
);
