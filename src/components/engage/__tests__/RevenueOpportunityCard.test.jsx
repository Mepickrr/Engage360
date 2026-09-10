import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RevenueOpportunityCard, {
  computeRevenueOpportunity,
  MOCK_STORE_ACTIVITY,
} from "../RevenueOpportunityCard";

describe("computeRevenueOpportunity", () => {
  it("computes abandonment rate and revenue at risk from the mock activity", () => {
    const result = computeRevenueOpportunity(MOCK_STORE_ACTIVITY);
    expect(result.visitorsPerDay).toBe(10000);
    expect(result.abandonedCheckoutPerDay).toBe(4000);
    expect(result.abandonmentRate).toBe(40);
    expect(result.dailyRevenueAtRisk).toBe(400000);
    expect(result.monthlyRevenueAtRisk).toBe(12000000);
  });
});

describe("RevenueOpportunityCard", () => {
  it("full variant renders the funnel, abandonment rate, and formatted revenue", () => {
    render(<RevenueOpportunityCard variant="full" ctaLabel="Unlock This Revenue" onCtaClick={() => {}} />);
    expect(screen.getByTestId("fastrr-revenue-opportunity")).toBeInTheDocument();
    expect(screen.getByText("Here's What Abandoned Checkouts Are Costing You")).toBeInTheDocument();
    expect(screen.getByText("10K")).toBeInTheDocument();
    expect(screen.getByText("4K")).toBeInTheDocument();
    expect(screen.getByText("40% abandon")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-revenue-opportunity-monthly")).toHaveTextContent("₹1.2C");
    expect(screen.getByText(/₹4L\/day left unclaimed/)).toBeInTheDocument();
    expect(screen.getByText("Based on your store's recent activity")).toBeInTheDocument();
  });

  it("compact variant renders the condensed headline and omits the abandonment-rate label", () => {
    render(<RevenueOpportunityCard variant="compact" ctaLabel="See How This Gets Recovered" onCtaClick={() => {}} />);
    expect(screen.getByText("Revenue You're Leaving on the Table")).toBeInTheDocument();
    expect(screen.queryByText("40% abandon")).not.toBeInTheDocument();
  });

  it("calls onCtaClick with the given label when the CTA is clicked", () => {
    const onCtaClick = jest.fn();
    render(<RevenueOpportunityCard variant="full" ctaLabel="Unlock This Revenue" onCtaClick={onCtaClick} />);
    fireEvent.click(screen.getByTestId("fastrr-revenue-opportunity-cta"));
    expect(onCtaClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Unlock This Revenue")).toBeInTheDocument();
  });
});
