import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
}

beforeEach(() => {
  // NOTE: this project's jest config sets resetMocks: true, which wipes a
  // beforeAll-installed mock before every test (verified: identical code
  // fails on every test, not just later ones). Using beforeEach instead of
  // brief's beforeAll — same fix already used in HeroSection.test.jsx.
  mockMatchMedia(false);
  useJourneySelectionStore2.getState().clear();
});

describe("FastrrEngagePage (v2 prototype home page)", () => {
  it("renders the page wrapper, store selector, funnel stats, hero, and journey listing section", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("store-selector")).toBeInTheDocument();
    expect(screen.getByTestId("funnel-stats")).toBeInTheDocument();
    expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
  });

  it("adds bottom padding to the page root by default, since all journeys start pre-selected", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage").className).toContain("pb-28");
  });

  it("removes bottom padding once every journey is manually deselected", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-product"));
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-cart"));
    fireEvent.click(screen.getByTestId("journey-listing-card-abandoned-checkout"));
    expect(screen.getByTestId("page-fastrr-engage").className).not.toContain("pb-28");
  });
});
