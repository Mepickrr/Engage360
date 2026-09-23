import React from "react";
import { render, screen } from "@testing-library/react";
import HeroSection from "../HeroSection";

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

beforeEach(() => {
  mockMatchMedia(false);
});

describe("HeroSection", () => {
  it("renders the headline, the animated phone mockup, and the 4-step story list", () => {
    render(<HeroSection />);
    expect(screen.getByTestId("hero-headline")).toHaveTextContent(
      "Recover abandoned revenue on WhatsApp"
    );
    expect(screen.getByTestId("phone-mockup")).toBeInTheDocument();
    expect(screen.getByTestId("hero-story-steps").children).toHaveLength(4);
    expect(screen.getByText("Shopper drops off")).toBeInTheDocument();
    expect(screen.getByText("One tap back to purchase")).toBeInTheDocument();
  });

  it("marks the story step matching the phone's current phase as active, and the rest as inactive", () => {
    // With matchMedia mocked to non-reduced-motion, usePhonePhase starts at
    // PHASE_CHECKOUT (0) on first render, before any timer has fired.
    render(<HeroSection />);
    expect(screen.getByTestId("hero-story-step-0")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hero-story-step-1")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-2")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-3")).toHaveAttribute("data-active", "false");
  });
});
