import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AllSegmentsTab from "../AllSegmentsTab";

describe("AllSegmentsTab", () => {
  test("renders one section per source, each paginated at 9", () => {
    render(<AllSegmentsTab searchQuery="" />);

    const fastrr = screen.getByTestId("all-section-fastrr");
    expect(within(fastrr).getByText("Fastrr Signals")).toBeInTheDocument();
    expect(within(fastrr).getByText("Hot Leads")).toBeInTheDocument();
    expect(within(fastrr).queryByText("Champions")).not.toBeInTheDocument();
    expect(within(fastrr).getByText(/Showing 9 out of 25 results/)).toBeInTheDocument();

    const custom = screen.getByTestId("all-section-custom");
    expect(within(custom).getByText("Custom segments")).toBeInTheDocument();
    expect(within(custom).getByText("Cart Abandoners 48h")).toBeInTheDocument();

    const shopify = screen.getByTestId("all-section-shopify");
    expect(within(shopify).getByText("Shopify segments")).toBeInTheDocument();
    // Retention cards (e.g. Champions) are listed first, so they're on the
    // first page; the original Shopify cards (e.g. "Last 30 days") follow.
    expect(within(shopify).getByText("Champions")).toBeInTheDocument();
    expect(within(shopify).getByText(/Showing 9 out of 71 results/)).toBeInTheDocument();
    fireEvent.click(within(shopify).getByText("Show more"));
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
    // Champions now lives in the Shopify segments section (Retention Segment
    // cards moved there), so searching for it should surface only that
    // section, not Fastrr Signals, Custom, or Suppression.
    render(<AllSegmentsTab searchQuery="champions" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
    // Sections with no matches are hidden entirely rather than shown empty.
    expect(screen.queryByTestId("all-section-fastrr")).not.toBeInTheDocument();
    expect(screen.queryByTestId("all-section-custom")).not.toBeInTheDocument();
    expect(screen.getByTestId("all-section-shopify")).toBeInTheDocument();
    expect(screen.queryByTestId("all-section-suppression")).not.toBeInTheDocument();
  });

  test("renders the Opportunities to grow revenue carousel above the Fastrr Signals section", () => {
    render(<AllSegmentsTab searchQuery="" />);

    const carousel = screen.getByTestId("opportunity-carousel");
    const fastrr = screen.getByTestId("all-section-fastrr");
    expect(carousel.compareDocumentPosition(fastrr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
