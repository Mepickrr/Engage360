import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyListingCard from "../JourneyListingCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

const cartConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Cart");

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingCard", () => {
  it("renders the journey type name, description, and both audience pills", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Adds to cart but doesn't check out.")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-pill-abandoned-cart-known")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-pill-abandoned-cart-identified")).toBeInTheDocument();
  });

  it("defaults to previewing the Known variant, showing its resolved sample message and daily volume", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-preview-abandoned-cart-known")).toHaveTextContent(
      "Juniper Throw"
    );
    expect(screen.getByText("~4,000/day")).toBeInTheDocument();
  });

  it("clicking the Fastrr Identified pill switches the preview to it", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(
      screen.getByTestId("journey-listing-preview-abandoned-cart-identified")
    ).toHaveTextContent("We saved your cart");
  });

  it("clicking a pill also selects it in the store, independent of the other pill", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking an already-selected, already-previewed pill deselects it but keeps it as the preview", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    const knownPill = screen.getByTestId("journey-listing-pill-abandoned-cart-known");
    fireEvent.click(knownPill); // select + preview
    fireEvent.click(knownPill); // deselect, stays preview
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(screen.getByTestId("journey-listing-preview-abandoned-cart-known")).toBeInTheDocument();
  });

  it("clicking the other pill previews and selects it without changing the first pill's selection", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
  });
});
