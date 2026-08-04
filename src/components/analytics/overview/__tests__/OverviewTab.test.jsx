import React from "react";
import { render, screen } from "@testing-library/react";
import OverviewTab from "../OverviewTab";

describe("OverviewTab", () => {
  test("renders all sections with last_7_days data", () => {
    render(<OverviewTab timeRange="last_7_days" />);
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
    expect(screen.getByTestId("metric-revenue-overall")).toHaveTextContent("₹2.1C");
    expect(screen.getByTestId("metric-revenue-fastrr")).toHaveTextContent("₹36.1L");
    expect(screen.getByTestId("metric-orders-overall")).toHaveTextContent("24.55K");
    expect(screen.getByTestId("metric-orders-fastrr")).toHaveTextContent("3.75K");
    expect(screen.getByTestId("roi-card")).toHaveTextContent("10.85X");
    expect(screen.getByTestId("split-revenue")).toBeInTheDocument();
    expect(screen.getByTestId("split-orders")).toBeInTheDocument();
    expect(screen.getByTestId("trend-revenue")).toBeInTheDocument();
    expect(screen.getByTestId("trend-orders")).toBeInTheDocument();
    expect(screen.getByTestId("customers-acquired-section")).toBeInTheDocument();
    expect(screen.getByTestId("metric-customers-overall")).toHaveTextContent("32.6K");
    expect(screen.getByTestId("metric-customers-fastrr")).toHaveTextContent("32.6K");
  });

  test("re-renders with different numbers when timeRange changes", () => {
    const { rerender } = render(<OverviewTab timeRange="last_7_days" />);
    expect(screen.getByTestId("metric-revenue-overall")).toHaveTextContent("₹2.1C");
    rerender(<OverviewTab timeRange="this_month" />);
    expect(screen.getByTestId("metric-revenue-overall")).not.toHaveTextContent("₹2.1C");
  });

  test("renders no BIK or Avimee strings", () => {
    const { container } = render(<OverviewTab timeRange="last_7_days" />);
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
    expect(container.textContent).toMatch(/Fastrr/);
  });
});
