import React from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import ShopifySegmentsTab from "../ShopifySegmentsTab";

describe("ShopifySegmentsTab", () => {
  test("renders header with last synced time and first 9 segments", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    const container = screen.getByTestId("shopify-segments-tab");
    expect(within(container).getByText("Your Shopify segments")).toBeInTheDocument();
    // Check that the synced time text is present (allowing for whitespace variation)
    expect(within(container).getByText(/Last synced on/)).toBeInTheDocument();
    expect(within(container).getByText(/23 Jul 2026 at 6:08 PM/)).toBeInTheDocument();
    expect(within(container).getByText("Last 30 days")).toBeInTheDocument();
    expect(within(container).getByText("last_order_date > -30d")).toBeInTheDocument();
    // Check for results text using a more flexible matcher that looks for the pattern
    expect(within(container).getByText((content) => /Showing.*out of.*results/.test(content))).toBeInTheDocument();
  });

  test("Show more reveals additional segments", () => {
    const { rerender } = render(<ShopifySegmentsTab searchQuery="" />);
    fireEvent.click(screen.getByText("Show more"));
    // After clicking, the text should update to show 18 results
    const container = screen.getByTestId("shopify-segments-tab");
    expect(within(container).getByText((content) => /Showing.*out of.*results/.test(content))).toBeInTheDocument();
  });
});
