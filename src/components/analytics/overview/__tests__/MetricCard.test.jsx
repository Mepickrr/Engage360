import React from "react";
import { render, screen } from "@testing-library/react";
import MetricCard from "../MetricCard";

describe("MetricCard", () => {
  test("renders label, value, delta, and optional sub-badge", () => {
    render(
      <MetricCard
        testId="metric-revenue-fastrr"
        label="Fastrr Revenue"
        value="₹36.1L"
        delta={{ text: "↑ 3% (+₹89.15K)", tone: "positive" }}
        subBadge="17.0 %"
      />
    );
    const card = screen.getByTestId("metric-revenue-fastrr");
    expect(card).toHaveTextContent("Fastrr Revenue");
    expect(card).toHaveTextContent("₹36.1L");
    expect(card).toHaveTextContent("↑ 3% (+₹89.15K)");
    expect(card).toHaveTextContent("17.0 %");
  });

  test("omits sub-badge when not provided", () => {
    render(
      <MetricCard
        testId="metric-revenue-overall"
        label="Overall Revenue"
        value="₹2.1C"
        delta={{ text: "↑ 8% (+₹15.35L)", tone: "positive" }}
      />
    );
    expect(screen.queryByTestId("metric-revenue-overall-badge")).not.toBeInTheDocument();
  });

  test("renders negative-tone delta with rose styling", () => {
    render(
      <MetricCard
        testId="metric-orders-overall"
        label="Overall Orders"
        value="1.2K"
        delta={{ text: "↓ 5% (-60)", tone: "negative" }}
      />
    );
    const card = screen.getByTestId("metric-orders-overall");
    expect(card).toHaveTextContent("↓ 5% (-60)");
    expect(card).toHaveTextContent("vs last period");
  });
});
