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
