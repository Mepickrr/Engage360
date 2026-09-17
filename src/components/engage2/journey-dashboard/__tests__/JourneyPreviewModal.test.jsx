import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyPreviewModal from "../JourneyPreviewModal";
import { JOURNEYS } from "../data";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));
import { previewToast } from "@/components/common/PreviewHeader";

describe("JourneyPreviewModal", () => {
  it("renders nothing (dialog closed) when journey is null", () => {
    render(<JourneyPreviewModal journey={null} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.queryByTestId("journey-preview-modal")).not.toBeInTheDocument();
  });

  it("renders the trigger label, wait duration, and WhatsApp draft body for the given journey", () => {
    const journey = JOURNEYS.find((j) => j.id === "abandoned-cart-known");
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.getByTestId("journey-preview-modal")).toBeInTheDocument();
    expect(screen.getByText(journey.triggerLabel)).toBeInTheDocument();
    expect(screen.getByText("30 Minutes")).toBeInTheDocument();
    expect(screen.getByTestId("preview-whatsapp-block")).toHaveTextContent("you left");
  });

  it("renders the journey's description below the title and audience badge", () => {
    const journey = JOURNEYS.find((j) => j.id === "abandoned-cart-known");
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.getByTestId("journey-preview-description")).toHaveTextContent(journey.tooltip);
  });

  it("shows the WhatsApp Marketing rate in the footer", () => {
    const journey = JOURNEYS[0];
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.getByTestId("journey-preview-cost")).toHaveTextContent(
      "1 WhatsApp Marketing: ₹1.50 / message"
    );
  });

  it("clicking 'Edit on Engage' calls previewToast", () => {
    const journey = JOURNEYS[0];
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    fireEvent.click(screen.getByTestId("journey-preview-edit-on-engage"));
    expect(previewToast).toHaveBeenCalledTimes(1);
  });

  it("clicking 'Activate Now' calls onActivate with the journey's id", () => {
    const journey = JOURNEYS[0];
    const onActivate = jest.fn();
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={onActivate} />);
    fireEvent.click(screen.getByTestId("journey-preview-activate"));
    expect(onActivate).toHaveBeenCalledWith(journey.id);
  });

  it("shows both audience variants side by side when otherAudienceJourney is passed, instead of the single trigger/wait chain", () => {
    const known = JOURNEYS.find((j) => j.id === "abandoned-cart-known");
    const identified = JOURNEYS.find((j) => j.id === "abandoned-cart-identified");
    render(
      <JourneyPreviewModal
        journey={known}
        otherAudienceJourney={identified}
        onClose={() => {}}
        onActivate={() => {}}
      />
    );
    expect(screen.getByTestId("preview-dual-audience")).toBeInTheDocument();
    expect(screen.getByTestId("preview-dual-block-abandoned-cart-known")).toHaveTextContent(
      "you left"
    );
    expect(screen.getByTestId("preview-dual-block-abandoned-cart-identified")).toHaveTextContent(
      "We saved your cart"
    );
    expect(screen.queryByTestId("preview-trigger-block")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-wait-block")).not.toBeInTheDocument();
  });

  it("omitting otherAudienceJourney keeps the original single-flow layout (dashboard usage unaffected)", () => {
    const journey = JOURNEYS.find((j) => j.id === "abandoned-cart-known");
    render(<JourneyPreviewModal journey={journey} onClose={() => {}} onActivate={() => {}} />);
    expect(screen.queryByTestId("preview-dual-audience")).not.toBeInTheDocument();
    expect(screen.getByTestId("preview-trigger-block")).toBeInTheDocument();
  });
});
