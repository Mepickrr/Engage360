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

  it("shows a preview trigger for the default Known variant, the daily volume stat, and no open modal yet", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(
      screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known")
    ).toBeInTheDocument();
    expect(screen.getByText("~4,000/day")).toBeInTheDocument();
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("clicking the preview trigger opens the flow preview modal for that variant, without selecting it", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByText("Known buyer adds product to cart")).toBeInTheDocument();
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("you left");
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
  });

  it("clicking the Fastrr Identified pill moves the preview trigger to that variant", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(
      screen.queryByTestId("journey-listing-preview-trigger-abandoned-cart-known")
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-identified")
    );
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("We saved your cart");
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
    expect(
      screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known")
    ).toBeInTheDocument();
  });

  it("clicking the other pill previews and selects it without changing the first pill's selection", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-identified"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
  });

  it("clicking 'Activate Now' inside the preview modal selects the previewed journey and closes the modal", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("clicking 'Activate Now' on an already-selected journey leaves it selected instead of toggling it off", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-pill-abandoned-cart-known")); // select via pill
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
  });
});
