import { summarizeFilterGroup } from "../filterSummary";

describe("filterSummary — event_property block", () => {
  it("summarizes a single attribute condition prefixed with the event name", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [
            { event: "Product Viewed", property: "Product Price", operator: ">", value: "100" },
          ],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe(
      "Product Viewed where Product Price > 100",
    );
  });

  it("joins multiple attribute conditions with the block combinator", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "OR",
          conditions: [
            { event: "Product Viewed", property: "Product Price", operator: ">", value: "100" },
            { event: "Product Viewed", property: "SKU ID", operator: "Is", value: "X123" },
          ],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe(
      "Product Viewed where Product Price > 100 OR SKU ID Is X123",
    );
  });

  it("falls back to just the event name when no attribute conditions are filled in", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [{ event: "Product Viewed", property: "", operator: "", value: "" }],
        },
      ],
    };
    expect(summarizeFilterGroup(group, { maxLength: 200 })).toBe("Product Viewed");
  });

  it("does not include frequency or time-window phrasing even if stale fields are present on old data", () => {
    const group = {
      id: "fg_1",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_1",
          type: "event_property",
          combinator: "AND",
          conditions: [
            {
              event: "Product Viewed",
              property: "Product Price",
              operator: ">",
              value: "100",
              qualifier: "has_executed",
              frequency: "at_least",
              count: 2,
              time_range: { op: "in_last", n: 7, unit: "days" },
            },
          ],
        },
      ],
    };
    const summary = summarizeFilterGroup(group, { maxLength: 200 });
    expect(summary).toBe("Product Viewed where Product Price > 100");
    expect(summary).not.toMatch(/times/i);
    expect(summary).not.toMatch(/in the last/i);
  });
});
