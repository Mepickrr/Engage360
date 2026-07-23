import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AllSegmentsTab from "../AllSegmentsTab";

describe("AllSegmentsTab", () => {
  test("aggregates cards from every source and paginates at 9", () => {
    render(<AllSegmentsTab searchQuery="" />);
    // Fastrr Signals (retention) card present
    expect(screen.getByText("Champions")).toBeInTheDocument();
    // Custom (real) segment present
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    // Shopify mock present
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    // Suppression mock present or not, depending on page size — check pagination text instead
    expect(screen.getByText(/Showing 9 out of/)).toBeInTheDocument();
  });

  test("Show more reveals additional aggregated cards", () => {
    render(<AllSegmentsTab searchQuery="" />);
    const before = screen.getAllByTestId(/^all-card-/).length;
    fireEvent.click(screen.getByText("Show more"));
    const after = screen.getAllByTestId(/^all-card-/).length;
    expect(after).toBeGreaterThan(before);
  });

  test("search filters across all aggregated sources", () => {
    render(<AllSegmentsTab searchQuery="champions" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });
});
