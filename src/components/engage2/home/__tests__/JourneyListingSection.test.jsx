import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyListingSection from "../JourneyListingSection";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  mockNavigate.mockClear();
});

describe("JourneyListingSection", () => {
  it("renders the heading and all 3 journey type cards", () => {
    render(<JourneyListingSection />);
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByText("Select your recovery journeys")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-product")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-checkout")).toBeInTheDocument();
  });

  it("pre-selects all 3 journey types by default, showing the cart rail immediately", () => {
    render(<JourneyListingSection />);
    // (1,200 + 4,000 + 1,600)/day * ₹1.50 * 3 days = ₹30,600
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("3 journeys selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹30,600");
    expect(screen.getByTestId("journey-listing-card-abandoned-product")).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByTestId("journey-listing-card-abandoned-checkout")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("does not stomp an existing selection made before this section re-mounts", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<JourneyListingSection />);
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("1 journey selected");
  });

  it("clicking a pre-selected card deselects it and shrinks the cart total", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("2 journeys selected");
  });

  it("clicking Continue to Recharge navigates to /engage-2/setup, without opening any local modal", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("cart-rail-continue"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
    expect(screen.queryByTestId("fund-wallet-modal")).not.toBeInTheDocument();
  });
});
