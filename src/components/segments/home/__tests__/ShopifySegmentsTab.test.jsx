import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ShopifySegmentsTab from "../ShopifySegmentsTab";

describe("ShopifySegmentsTab", () => {
  test("renders header with last synced time and first 9 segments", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    const container = screen.getByTestId("shopify-segments-tab");
    expect(within(container).getByText("Your Shopify segments")).toBeInTheDocument();
    expect(screen.getByText("Last synced on: 23 Jul 2026 at 6:08 PM")).toBeInTheDocument();
    expect(within(container).getByText("Last 30 days")).toBeInTheDocument();
    expect(within(container).getByText("last_order_date > -30d")).toBeInTheDocument();
    expect(screen.getByText("Showing 9 out of 61 results")).toBeInTheDocument();
  });

  test("Show more reveals additional segments", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    fireEvent.click(screen.getByText("Show more"));
    // After clicking, the text should update to show 18 results
    expect(screen.getByText("Showing 18 out of 61 results")).toBeInTheDocument();
  });

  test("renders a Retention Segment section below the main grid with all 10 cards and no Show more", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    const retention = screen.getByTestId("shopify-section-retention");
    expect(within(retention).getByText("Retention Segment")).toBeInTheDocument();
    expect(within(retention).getByText("Champions")).toBeInTheDocument();
    expect(within(retention).getByText("Lost customers")).toBeInTheDocument();
    expect(within(retention).getByText(/Showing 10 out of 10 results/)).toBeInTheDocument();
    expect(within(retention).queryByText("Show more")).not.toBeInTheDocument();
  });

  test("search filters the Retention Segment section independently from the main Shopify grid", () => {
    render(<ShopifySegmentsTab searchQuery="champ" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Last 30 days")).not.toBeInTheDocument();
  });
});
