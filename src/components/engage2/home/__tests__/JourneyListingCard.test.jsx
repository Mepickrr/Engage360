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
  it("renders the journey type name, description, and both audience tabs", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(screen.getByTestId("journey-listing-card-abandoned-cart")).toBeInTheDocument();
    expect(screen.getByText("Abandoned Cart")).toBeInTheDocument();
    expect(screen.getByText("Adds to cart but doesn't check out.")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-tab-abandoned-cart-known")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-tab-abandoned-cart-identified")).toBeInTheDocument();
  });

  it("shows a preview trigger and an unactivated 'Activate Now' button for the default Known variant", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    expect(
      screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known")
    ).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-activate-abandoned-cart-known")).toHaveTextContent(
      "Activate Now"
    );
    expect(screen.getByText("~4,000/day")).toBeInTheDocument();
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("clicking a tab only switches which variant is shown — it never selects or deselects anything", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-tab-abandoned-cart-identified"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(
      false
    );
    fireEvent.click(screen.getByTestId("journey-listing-tab-abandoned-cart-known"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
  });

  it("switching tabs moves the preview trigger and Activate Now button to that variant", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-tab-abandoned-cart-identified"));
    expect(
      screen.queryByTestId("journey-listing-preview-trigger-abandoned-cart-known")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-identified")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("journey-listing-activate-abandoned-cart-identified")
    ).toBeInTheDocument();
  });

  it("clicking 'Activate Now' selects the active variant and flips the button to its activated state", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-activate-abandoned-cart-known"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(screen.getByTestId("journey-listing-activate-abandoned-cart-known")).toHaveTextContent(
      "Activated"
    );
  });

  it("clicking an already-activated journey's button deselects it and reverts the label", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    const activateBtn = screen.getByTestId("journey-listing-activate-abandoned-cart-known");
    fireEvent.click(activateBtn); // activate
    fireEvent.click(activateBtn); // deactivate
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(activateBtn).toHaveTextContent("Activate Now");
  });

  it("activating one audience variant doesn't affect the other's selection, and survives switching tabs", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-activate-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-listing-tab-abandoned-cart-identified"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(
      false
    );
    expect(
      screen.getByTestId("journey-listing-activate-abandoned-cart-identified")
    ).toHaveTextContent("Activate Now");
  });

  it("clicking the preview trigger opens a modal showing both audience variants side by side, without selecting either", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByTestId("preview-dual-audience")).toBeInTheDocument();
    expect(screen.getByTestId("preview-dual-block-abandoned-cart-known")).toHaveTextContent(
      "you left"
    );
    expect(screen.getByTestId("preview-dual-block-abandoned-cart-identified")).toHaveTextContent(
      "We saved your cart"
    );
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(false);
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-identified")).toBe(
      false
    );
  });

  it("clicking 'Activate Now' inside the preview modal selects the previewed journey and closes the modal", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("clicking 'Activate Now' inside the modal on an already-activated journey leaves it selected instead of toggling it off", () => {
    render(<JourneyListingCard journeyTypeConfig={cartConfig} />);
    fireEvent.click(screen.getByTestId("journey-listing-activate-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-listing-preview-trigger-abandoned-cart-known"));
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(useJourneySelectionStore2.getState().isSelected("abandoned-cart-known")).toBe(true);
  });
});
