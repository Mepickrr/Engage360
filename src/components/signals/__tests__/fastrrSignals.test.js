import { audienceUsesSignals, enhanceAudience, nextRecommendedSegment, usesFastrrSegments, nodesUseSignals } from "../fastrrSignals";
import { emptySegmentAudience, estimateAudience } from "@/data/segmentsData";

const withCondition = (cond) => {
  const a = emptySegmentAudience();
  a.include.blocks = [{ id: "b1", type: "property", combinator: "AND", conditions: [cond], segments: [] }];
  return a;
};

describe("fastrrSignals", () => {
  it("detects signal attributes in include, and in exclude only when enabled", () => {
    expect(audienceUsesSignals(withCondition({ property: "City", operator: "is", value: "Pune" }))).toBe(false);
    expect(audienceUsesSignals(withCondition({ property: "RTO_RISK", operator: "is equal to", value: "0" }))).toBe(true);

    const a = withCondition({ property: "City", operator: "is", value: "Pune" });
    a.exclude.blocks = [{ id: "b2", type: "property", conditions: [{ property: "LIFETIME_AOV" }], segments: [] }];
    expect(audienceUsesSignals(a)).toBe(false);
    expect(audienceUsesSignals({ ...a, exclude_enabled: true })).toBe(true);
  });

  it("rotates through the presets as OR conditions and raises the count", () => {
    let a = withCondition({ property: "Last Known City", operator: "is", value: "Pune" });
    const added = [];
    for (let i = 0; i < 3; i += 1) {
      const before = estimateAudience(a).userCount;
      const r = enhanceAudience(a);
      added.push(r.added.property);
      a = r.audience;
      expect(estimateAudience(a).userCount).toBeGreaterThanOrEqual(before);
    }
    expect(added).toEqual(["LIFETIME_AOV", "THREE_MONTHS_ORDERS", "RTO_RISK"]);
    expect(a.include.blocksCombinator).toBe("OR");
    const block = a.include.blocks.find((b) => b.fastrrEnhance);
    expect(block.combinator).toBe("OR");
    expect(block.conditions).toHaveLength(3);
    expect(enhanceAudience(a)).toBeNull();
  });

  it("recommends one Fastrr segment per click, keeping the seller's own", () => {
    const own = { id: "bseg_001", name: "VIP Customers", userCount: 5430 };
    let selected = [own];
    const names = [];
    for (let next = nextRecommendedSegment(selected); next; next = nextRecommendedSegment(selected)) {
      names.push(next.name);
      selected = [...selected, next];
    }
    expect(names).toEqual([
      "Fastrr Signals High AOV", "Fastrr Signals Low RTO Risk", "Fastrr Signals Purchase Affinity", "Fastrr Signals High RTO Risk",
    ]);
    expect(usesFastrrSegments([own])).toBe(false);
    expect(usesFastrrSegments(selected)).toBe(true);
  });

  it("finds Fastrr Signals anywhere in a flow's node data", () => {
    const start = { id: "start", data: { audience: withCondition({ property: "Last Known City", operator: "is", value: "Pune" }) } };
    expect(nodesUseSignals([start])).toBe(false);
    const enhanced = { ...start, data: { audience: enhanceAudience(start.data.audience).audience } };
    expect(nodesUseSignals([enhanced])).toBe(true);
  });

  it("starts an empty filter with LIFETIME_AOV alone, then ORs the rest", () => {
    const first = enhanceAudience(emptySegmentAudience());
    expect(first.started).toBe(true);
    expect(first.audience.include.blocks).toHaveLength(1);
    expect(first.audience.include.blocks[0].conditions).toEqual([{ property: "LIFETIME_AOV", operator: "is greater than", value: "2000" }]);
    const second = enhanceAudience(first.audience);
    expect(second.started).toBeUndefined();
    expect(second.added.property).toBe("THREE_MONTHS_ORDERS");
    expect(second.audience.include.blocks[0].conditions).toHaveLength(2);
  });
});
