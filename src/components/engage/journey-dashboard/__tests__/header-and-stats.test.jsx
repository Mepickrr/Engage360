import React from "react";
import { render, screen } from "@testing-library/react";
import JourneyHeader from "../JourneyHeader";
import JourneyStatsRow from "../JourneyStatsRow";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

describe("JourneyHeader", () => {
  it("renders the wallet balance, recharge link, profile icon, and Open Engage link", () => {
    render(<JourneyHeader />);
    expect(screen.getByTestId("journey-header")).toBeInTheDocument();
    expect(screen.getByTestId("journey-wallet-balance")).toHaveTextContent("₹0.00");
    expect(screen.getByTestId("journey-recharge-link")).toBeInTheDocument();
    expect(screen.getByTestId("journey-profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("journey-open-engage-link")).toHaveAttribute("href", "/");
  });
});

describe("JourneyStatsRow", () => {
  it("renders all 5 cards with zero-state copy when activeCount is 0", () => {
    render(<JourneyStatsRow activeCount={0} />);
    expect(screen.getByTestId("journey-stats-row")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("0 / 6");
    expect(screen.getByText("Turn one on below to start recovering revenue")).toBeInTheDocument();
    expect(screen.getByTestId("journey-stat-revenue")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-deliverability")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-users")).toHaveTextContent("—");
    expect(screen.getByTestId("journey-stat-roi")).toHaveTextContent("—");
  });

  it("reflects a non-zero activeCount", () => {
    render(<JourneyStatsRow activeCount={2} />);
    expect(screen.getByTestId("journey-stat-active")).toHaveTextContent("2 / 6");
  });
});
