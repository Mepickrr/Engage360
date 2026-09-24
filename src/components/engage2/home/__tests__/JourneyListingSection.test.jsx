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

  it("does not render the cart rail when nothing is selected", () => {
    render(<JourneyListingSection />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });

  it("shows the cart rail with the cart total once a journey type is selected", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("1 journey selected");
    expect(screen.getByTestId("cart-rail-summary")).toHaveTextContent("₹18,000");
  });

  it("clicking Continue to Recharge navigates to /engage-2/setup, without opening any local modal", () => {
    render(<JourneyListingSection />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    fireEvent.click(screen.getByTestId("cart-rail-continue"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/setup");
    expect(screen.queryByTestId("fund-wallet-modal")).not.toBeInTheDocument();
  });
});
