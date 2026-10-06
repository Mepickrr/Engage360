import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(screen.getByTestId("hero-cta")).toHaveTextContent("Set up recovery journeys");
    expect(screen.getByTestId("hero-features")).toHaveTextContent("Pay per message");
    expect(screen.getByTestId("hero-features")).toHaveTextContent("Zero code");
    expect(screen.getByTestId("hero-features")).toHaveTextContent("Full control");
  });

  it("marks the story step matching the phone's current scene as active, and the rest as inactive", () => {
    // With matchMedia mocked to non-reduced-motion, the player starts at
    // SCENE_CHECKOUT (scene 0, step 0) on first render, before any timer fires.
    render(<HeroSection />);
    expect(screen.getByTestId("hero-story-step-0")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hero-story-step-1")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-2")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("hero-story-step-3")).toHaveAttribute("data-active", "false");
  });

  it("clicking a story step jumps the phone to that step's scene and re-highlights it", () => {
    render(<HeroSection />);
    fireEvent.click(screen.getByTestId("hero-story-step-3"));
    expect(screen.getByTestId("hero-story-step-3")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("hero-story-step-0")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("phone-phase-done")).toBeInTheDocument();
  });

  it("the play/pause control pauses the animation and updates its label", () => {
    render(<HeroSection />);
    const toggle = screen.getByLabelText("Pause animation");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Play animation")).toBeInTheDocument();
  });
});
