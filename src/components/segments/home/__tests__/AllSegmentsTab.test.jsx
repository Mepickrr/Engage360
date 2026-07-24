import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AllSegmentsTab from "../AllSegmentsTab";

describe("AllSegmentsTab", () => {
  test("renders one section per source, each paginated at 9", () => {
    render(<AllSegmentsTab searchQuery="" />);

    const fastrr = screen.getByTestId("all-section-fastrr");
    expect(within(fastrr).getByText("Fastrr Signals")).toBeInTheDocument();
    expect(within(fastrr).getByText("Champions")).toBeInTheDocument();
    expect(within(fastrr).getByText(/Showing 9 out of 35 results/)).toBeInTheDocument();

    const custom = screen.getByTestId("all-section-custom");
    expect(within(custom).getByText("Custom segments")).toBeInTheDocument();
    expect(within(custom).getByText("Cart Abandoners 48h")).toBeInTheDocument();

    const shopify = screen.getByTestId("all-section-shopify");
    expect(within(shopify).getByText("Shopify segments")).toBeInTheDocument();
    expect(within(shopify).getByText("Last 30 days")).toBeInTheDocument();

    const suppression = screen.getByTestId("all-section-suppression");
    expect(within(suppression).getByText("Suppression assets")).toBeInTheDocument();
    expect(within(suppression).getByText("Email suppressed by Fastrr")).toBeInTheDocument();
    // Suppression only has 2 total entries — no Show more needed.
    expect(within(suppression).queryByText("Show more")).not.toBeInTheDocument();
  });

  test("each section's Show more only reveals more cards within that section", () => {
    render(<AllSegmentsTab searchQuery="" />);

    const fastrr = screen.getByTestId("all-section-fastrr");
    const before = within(fastrr).getAllByTestId(/^all-card-/).length;
    fireEvent.click(within(fastrr).getByText("Show more"));
    const after = within(fastrr).getAllByTestId(/^all-card-/).length;
    expect(after).toBeGreaterThan(before);

    // Other sections are unaffected by clicking Fastrr Signals' Show more.
    const custom = screen.getByTestId("all-section-custom");
    expect(within(custom).getByText(/Showing \d+ out of \d+ results/)).toBeInTheDocument();
  });

  test("search filters each section independently by name", () => {
    render(<AllSegmentsTab searchQuery="champions" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
    // Sections with no matches are hidden entirely rather than shown empty.
    expect(screen.queryByTestId("all-section-custom")).not.toBeInTheDocument();
    expect(screen.queryByTestId("all-section-shopify")).not.toBeInTheDocument();
    expect(screen.queryByTestId("all-section-suppression")).not.toBeInTheDocument();
  });
});
