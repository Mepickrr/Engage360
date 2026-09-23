import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyListingCard from "../JourneyListingCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

const cartConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Cart");
const checkoutConfig = JOURNEY_TYPES.find((t) => t.journeyType === "Abandoned Checkout");

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
});

describe("JourneyListingCard", () => {
  it("renders the journey type name, description, and an unchecked checkbox", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Adds to cart but doesn't check out.")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("shows a Recommended chip only on the journey type marked recommended", () => {
    render(<JourneyListingCard journeyTypeConfig={checkoutConfig} />);
    expect(screen.getByTestId("journey-listing-recommended-abandoned-checkout")).toBeInTheDocument();
  });

  it("does not show a Recommended chip on a non-recommended journey type", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(
      screen.queryByTestId("journey-listing-recommended-abandoned-cart")
    ).not.toBeInTheDocument();
  });

  it("clicking the card selects BOTH the Known and Fastrr Identified variants of that journey type", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("clicking an already-selected card deselects BOTH variants", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    const card = screen.getByTestId("journey-listing-card-abandoned-cart");
    fireEvent.click(card);
    fireEvent.click(card);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking a card that has only ONE of its two variants selected (a partial pre-existing state) ends with BOTH selected", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    // The card already reads as selected (either true counts) — the spec's
    // truth table says clicking it should end with BOTH deselected.
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking the preview trigger opens the flow-chart preview for the Known variant, without selecting anything", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByText("Known buyer adds product to cart")).toBeInTheDocument();
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("you left");
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(false);
  });

  it("clicking the preview trigger does not also toggle the card (event does not bubble into the card's onClick)", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("clicking 'Activate Now' inside the preview modal selects both variants and closes the modal, without also re-triggering the card's own toggle", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(true);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
    // If the portaled modal's click had bubbled into the card's own onClick
    // too, this second click would have flipped the card back off.
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });
});
