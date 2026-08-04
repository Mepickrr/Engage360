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
});
