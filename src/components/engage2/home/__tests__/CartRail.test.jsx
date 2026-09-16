import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CartRail from "../CartRail";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  mockNavigate.mockClear();
});

describe("CartRail", () => {
  it("renders nothing when nothing is selected", () => {
    render(<CartRail />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });

  it("shows the selected count and a funding estimate once a journey is selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<CartRail />);
    // 4,000/day * ₹1.50/message * 3-day runway = ₹18,000
    expect(screen.getByTestId("cart-rail")).toBeInTheDocument();
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("1 journey selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹18,000");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("3 days");
  });

  it("pluralizes and sums the estimate across multiple selections", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    useJourneySelectionStore2.getState().toggle("abandoned-checkout-known");
    render(<CartRail />);
    // (4,000 + 1,600)/day * ₹1.50 * 3 days = ₹25,200
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("2 journeys selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹25,200");
  });

  it("clicking Continue to Recharge navigates to /engage-2/recharge", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<CartRail />);
    fireEvent.click(screen.getByTestId("cart-rail-continue"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/recharge");
  });

  it("counts a journey type's daily volume once even when both audience variants are selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    useJourneySelectionStore2.getState().toggle("abandoned-cart-identified");
    render(<CartRail />);
    // Both variants share the same 4,000/day Abandoned Cart volume — selecting
    // both doesn't double it: 4,000 * ₹1.50 * 3 days = ₹18,000, same as
    // selecting just one.
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("2 journeys selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹18,000");
  });
});
