import { useJourneySelectionStore2 } from "../journeySelectionStore2";

const getState = () => useJourneySelectionStore2.getState();

beforeEach(() => {
  getState().clear();
});

describe("journeySelectionStore2", () => {
  it("starts with nothing selected", () => {
    expect(getState().selected).toEqual({});
    expect(getState().selectedJourneys()).toEqual([]);
  });

  it("toggle() selects an unselected journey id", () => {
    getState().toggle("abandoned-cart-known");
    expect(getState().isSelected("abandoned-cart-known")).toBe(true);
  });

  it("toggle() deselects an already-selected journey id", () => {
    getState().toggle("abandoned-cart-known");
    getState().toggle("abandoned-cart-known");
    expect(getState().isSelected("abandoned-cart-known")).toBe(false);
  });

  it("selectedJourneys() resolves selected ids against JOURNEYS, in JOURNEYS' own order regardless of click order", () => {
    getState().toggle("abandoned-checkout-known");
    getState().toggle("abandoned-product-known");
    const result = getState().selectedJourneys();
    expect(result.map((j) => j.id)).toEqual(["abandoned-product-known", "abandoned-checkout-known"]);
  });

  it("clear() resets all selections", () => {
    getState().toggle("abandoned-cart-known");
    getState().clear();
    expect(getState().selected).toEqual({});
    expect(getState().selectedJourneys()).toEqual([]);
  });
});
