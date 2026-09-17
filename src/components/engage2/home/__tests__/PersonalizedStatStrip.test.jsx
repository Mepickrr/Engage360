import React from "react";
import { render, screen } from "@testing-library/react";
import PersonalizedStatStrip from "../PersonalizedStatStrip";

describe("PersonalizedStatStrip", () => {
  it("renders 3 stats computed from the store's mock activity", () => {
    render(<PersonalizedStatStrip />);
    expect(screen.getByTestId("personalized-stat-strip")).toBeInTheDocument();
    // visitorsPerDay: 10,000 -> formatCompactNumber -> "10K"
    expect(screen.getByText("10K")).toBeInTheDocument();
    expect(screen.getByText("visitors/day")).toBeInTheDocument();
    // abandonmentRate: 40
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("abandon before paying")).toBeInTheDocument();
    // monthlyRevenueAtRisk: 12,000,000 -> formatCompactCurrency -> "₹1.2C"
    expect(screen.getByText("₹1.2C")).toBeInTheDocument();
    expect(screen.getByText("at risk / month")).toBeInTheDocument();
  });
});
