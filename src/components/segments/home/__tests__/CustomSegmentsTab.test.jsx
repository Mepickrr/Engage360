import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomSegmentsTab from "../CustomSegmentsTab";

describe("CustomSegmentsTab", () => {
  test("defaults to Filter-based sub-tab showing filter-created segments with a Filters badge", () => {
    render(<CustomSegmentsTab searchQuery="" />);
    expect(screen.getByTestId("custom-toggle-filter")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    expect(screen.queryByText("Diwali excel import")).not.toBeInTheDocument();
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
  });

  test("switching to CSV Upload sub-tab shows csv-created segments only", () => {
    render(<CustomSegmentsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("custom-toggle-csv"));
    expect(screen.getByText("Diwali excel import")).toBeInTheDocument();
    expect(screen.getByText("Store loyalty list Q2")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });

  test("search filters within the active sub-tab", () => {
    render(<CustomSegmentsTab searchQuery="cart" />);
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    expect(screen.queryByText("VIP Customers (LTV > ₹10K)")).not.toBeInTheDocument();
  });
});
