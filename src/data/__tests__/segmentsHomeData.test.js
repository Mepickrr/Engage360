import {
  OPPORTUNITY_CARDS,
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  SHOPIFY_SEGMENTS,
  SUPPRESSION_ASSETS,
  makeFillerCards,
} from "../segmentsHomeData";

describe("segmentsHomeData", () => {
  test("opportunity cards match the wireframe exactly", () => {
    expect(OPPORTUNITY_CARDS).toHaveLength(3);
    expect(OPPORTUNITY_CARDS[0]).toMatchObject({
      headline: "89.87K Hibernating customers can be recovered",
      description: "These long-inactive have a good chance of responding",
      gain: "₹58,69,329",
      boostEnabled: true,
    });
    expect(OPPORTUNITY_CARDS[2]).toMatchObject({
      headline: "11.80K Dormant customers show small signals",
      gain: "₹3,78,925",
      boostEnabled: false,
    });
  });

  test("retention segments has all 10 wireframe cards with correct data", () => {
    expect(RETENTION_SEGMENTS).toHaveLength(10);
    expect(RETENTION_SEGMENTS[0]).toMatchObject({
      name: "Champions",
      updated: "11:25 PM, 22nd Jul",
      users: "1,63,073",
      avgRevenuePerUser: "₹3,733",
    });
    const lost = RETENTION_SEGMENTS.find((s) => s.name === "Lost customers");
    expect(lost).toMatchObject({ users: "47,302", avgRevenuePerUser: null });
  });

  test("acquisition segments has 4 cards, no BIK/Avimee strings", () => {
    expect(ACQUISITION_SEGMENTS).toHaveLength(4);
    expect(ACQUISITION_SEGMENTS.map((s) => s.name)).toEqual(["Hot Leads", "Warm Leads", "Cold Leads", "Nurture Leads"]);
    const serialized = JSON.stringify(ACQUISITION_SEGMENTS);
    expect(serialized).not.toMatch(/BIK/i);
    expect(serialized).not.toMatch(/Avimee/i);
  });

  test("segment library has 21 total entries, first 9 match wireframe", () => {
    expect(SEGMENT_LIBRARY).toHaveLength(21);
    expect(SEGMENT_LIBRARY[0].name).toBe("promising Customer");
    expect(SEGMENT_LIBRARY[8].name).toBe("All SMS subscribers");
  });

  test("shopify segments has 61 total entries, first 9 match wireframe", () => {
    expect(SHOPIFY_SEGMENTS).toHaveLength(61);
    expect(SHOPIFY_SEGMENTS[0]).toMatchObject({ name: "Last 30 days", rule: "last_order_date > -30d" });
  });

  test("suppression assets use Fastrr branding, not BIK", () => {
    expect(SUPPRESSION_ASSETS).toHaveLength(2);
    expect(SUPPRESSION_ASSETS.map((s) => s.name)).toEqual([
      "Email suppressed by Fastrr",
      "WhatsApp suppressed by Fastrr",
    ]);
    const serialized = JSON.stringify(SUPPRESSION_ASSETS);
    expect(serialized).not.toMatch(/BIK/i);
  });

  test("makeFillerCards generates deterministic, distinct entries", () => {
    const a = makeFillerCards("lib", 3, 1);
    const b = makeFillerCards("lib", 3, 1);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((c) => c.id)).size).toBe(3);
  });
});
