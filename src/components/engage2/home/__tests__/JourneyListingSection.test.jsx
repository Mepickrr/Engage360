import React from "react";
import { render, screen } from "@testing-library/react";
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

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingSection", () => {
  it("renders the heading and all 3 journey type cards", () => {
    render(<JourneyListingSection />);
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByText("Pick the moments worth messaging")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-product")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-checkout")).toBeInTheDocument();
  });

  it("does not render the cart rail when nothing is selected", () => {
    render(<JourneyListingSection />);
    expect(screen.queryByTestId("cart-rail")).not.toBeInTheDocument();
  });
});
