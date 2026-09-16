import React from "react";
import { render, screen } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage2";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

beforeEach(() => {
  useFastrrEngagePanelStore.getState().close();
  useJourneySelectionStore2.getState().clear();
});

describe("FastrrEngagePage (v2 listing)", () => {
  it("renders the page wrapper, hero, stat strip, listing section, and testimonials", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(screen.getByTestId("hero-headline")).toBeInTheDocument();
    expect(screen.getByTestId("personalized-stat-strip")).toBeInTheDocument();
    expect(screen.getByTestId("journey-listing-section")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
  });

  it("does not auto-open the FastrrEngagePanel2 side panel on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
  });

  it("adds bottom padding to the page root once a journey is selected, so the floating cart rail can't cover the testimonials", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage").className).toContain("pb-28");
  });

  it("has no bottom padding on the page root when nothing is selected", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage").className).not.toContain("pb-28");
  });
});
