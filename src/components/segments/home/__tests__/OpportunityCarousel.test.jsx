import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OpportunityCarousel from "../OpportunityCarousel";

describe("OpportunityCarousel", () => {
  test("renders the section heading and first 3 opportunity cards", () => {
    render(<OpportunityCarousel />);
    expect(screen.getByText("Opportunities to grow revenue")).toBeInTheDocument();
    expect(screen.getByText("89.87K Hibernating customers can be recovered")).toBeInTheDocument();
    expect(screen.getByText("42.62K high-value customers are active")).toBeInTheDocument();
    expect(screen.getByText("11.80K Dormant customers show small signals")).toBeInTheDocument();
  });

  test("disables the primary Boost sales button for the disabled opportunity", () => {
    render(<OpportunityCarousel />);
    const buttons = screen.getAllByText("Boost sales");
    expect(buttons[2]).toBeDisabled();
    expect(buttons[0]).not.toBeDisabled();
  });

  test("prev button is disabled at the start", () => {
    render(<OpportunityCarousel />);
    expect(screen.getByTestId("opportunity-carousel-prev")).toBeDisabled();
  });

  test("shows the revenue disclaimer tooltip when the info icon is focused", () => {
    render(<OpportunityCarousel />);
    const infoIcon = document.querySelector("svg.lucide-info");
    fireEvent.focus(infoIcon);
    // This environment's dev-tooling instrumentation (@emergentbase/visual-edits,
    // active under NODE_ENV=test) can render duplicate accessible-name nodes for
    // the same visible text — use getAllByText and check at least one match exists.
    expect(screen.getAllByText("Revenue based on past customer behavior and typical conversion rates. Results may vary.").length).toBeGreaterThan(0);
  });
});
