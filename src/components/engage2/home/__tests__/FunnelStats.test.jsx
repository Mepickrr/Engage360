import React from "react";
import { render, screen } from "@testing-library/react";
import FunnelStats from "../FunnelStats";

describe("FunnelStats", () => {
  it("shows total visitors, identified shoppers, abandoned carts+checkouts, and missed opportunity", () => {
    render(<FunnelStats />);
    expect(screen.getByTestId("funnel-stats")).toBeInTheDocument();
    // visitorsPerDay = 10,000
    expect(screen.getByTestId("funnel-stat-total-visitors")).toHaveTextContent("10K");
    // identifiedPerDay = 3,400 -> 34% of visitors
    expect(screen.getByTestId("funnel-stat-identified-shoppers")).toHaveTextContent("3.4K");
    expect(screen.getByTestId("funnel-stat-identified-shoppers")).toHaveTextContent("34% reachable");
    // Abandoned Cart (4,000) + Abandoned Checkout (1,600) = 5,600
    expect(screen.getByTestId("funnel-stat-abandoned-carts-checkouts")).toHaveTextContent("5.6K");
    // 5,600 * aov(100) = 560,000/day -> formatCompactCurrency -> ₹5.6L
    expect(screen.getByTestId("funnel-stat-missed-opportunity")).toHaveTextContent("₹5.6L");
  });
});
