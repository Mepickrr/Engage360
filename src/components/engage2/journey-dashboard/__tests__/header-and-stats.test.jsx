import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JourneyHeader from "../JourneyHeader";
import JourneyStatsRow from "../JourneyStatsRow";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

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

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneyWalletStore.setState({ balance: 0 });
  window.localStorage.clear();
});

describe("JourneyHeader", () => {
  it("renders the WhatsApp connected status, wallet balance, recharge link, profile icon, and Open Engage link", () => {
    render(<JourneyHeader />);
    expect(screen.getByTestId("journey-header")).toBeInTheDocument();
    expect(screen.getByTestId("journey-whatsapp-status")).toHaveTextContent(
      "WhatsApp: TSP Karix Connected"
    );
    expect(screen.getByTestId("journey-wallet-balance")).toHaveTextContent("₹0.00");
    expect(screen.getByTestId("journey-recharge-link")).toBeInTheDocument();
    expect(screen.getByTestId("journey-profile-icon")).toBeInTheDocument();
    expect(screen.getByTestId("journey-open-engage-link")).toHaveAttribute("href", "/");
  });

  it("clicking the wallet pill opens the recharge wallet modal", () => {
    render(<JourneyHeader />);
    expect(screen.queryByTestId("recharge-wallet-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("journey-wallet-pill"));
    expect(screen.getByTestId("recharge-wallet-modal")).toBeInTheDocument();
  });

  it("clicking the profile icon opens the profile details modal", () => {
    render(<JourneyHeader />);
    expect(screen.queryByTestId("profile-details-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("journey-profile-icon"));
    expect(screen.getByTestId("profile-details-modal")).toBeInTheDocument();
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
