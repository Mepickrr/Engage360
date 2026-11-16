import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import BroadcastsPage from "@/pages/Broadcasts";

describe("BroadcastsPage", () => {
  it("opens the detail drawer with full stats when a broadcast row is clicked", () => {
    render(<BroadcastsPage />);
    expect(screen.queryByTestId("broadcast-detail-drawer")).toBeNull();
    fireEvent.click(screen.getByTestId("broadcasts-row-271606"));
    const drawer = screen.getByTestId("broadcast-detail-drawer");
    const d = within(drawer);
    expect(drawer.textContent).toContain("Broadcast · 271606");
    expect(d.getByText("06_nov_diwali_copy_1")).toBeInTheDocument();
    expect(d.getByText("72.0% of Sent")).toBeInTheDocument();
    expect(d.getByText("59.4% of Delivered")).toBeInTheDocument();
    expect(d.getByText("4.0% of Read")).toBeInTheDocument();
    expect(d.getByText("63,379")).toBeInTheDocument();
    // Spend = delivered x rate per template: 44,262 x 0.15 + 1,18,583 x 0.85
    expect(d.getByTestId("broadcast-section-revenue").textContent).toContain("₹1,07,434.85");
    expect(d.getByText("Disabled")).toBeInTheDocument();
    expect(d.getByText("Shop Now & Save")).toBeInTheDocument();
    expect(d.getByText("View Offer")).toBeInTheDocument();
  });

  it("shows the Utility -> Marketing category change, side-by-side comparisons", () => {
    render(<BroadcastsPage />);
    fireEvent.click(screen.getByTestId("broadcasts-row-271606"));
    const d = within(screen.getByTestId("broadcast-detail-drawer"));
    expect(d.getByTestId("broadcast-category-changed")).toBeInTheDocument();
    expect(d.getByTestId("broadcast-category-change-count").textContent).toContain("Changed 1×");
    expect(d.queryByTestId("broadcast-split-carousel")).toBeNull();
    const compare = within(d.getByTestId("broadcast-split-compare"));
    expect(compare.getByTestId("compare-total-Sent count").textContent).toBe("2,26,210");
    expect(compare.getByTestId("compare-total-Delivered count").textContent).toBe("1,62,845");
    expect(compare.getByTestId("compare-total-Rate").textContent).toBe("");
    expect(compare.getByTestId("compare-total-Spent").textContent).toBe("₹1,07,434.85");
    expect(d.queryByText(/After re-categorisation/)).toBeNull();
    // preview tables stay two-column
    expect(within(d.getByTestId("broadcast-preview-compare-utility")).queryByTestId("compare-total-Spent")).toBeNull();
    expect(d.getByTestId("broadcast-preview-compare-utility")).toBeInTheDocument();
    expect(d.getByTestId("broadcast-preview-compare-marketing")).toBeInTheDocument();
  });

  it("shows a single-column comparison and no change badge when the category never changed", () => {
    render(<BroadcastsPage />);
    fireEvent.click(screen.getByTestId("broadcasts-row-271544"));
    const d = within(screen.getByTestId("broadcast-detail-drawer"));
    expect(d.queryByTestId("broadcast-category-changed")).toBeNull();
    const compare = d.getByTestId("broadcast-split-compare");
    expect(compare.textContent).toContain("Marketing");
    expect(within(compare).queryByTestId("compare-total-Spent")).toBeNull();
  });
});
