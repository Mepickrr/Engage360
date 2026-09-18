import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FundWalletModal from "../FundWalletModal";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneySelectionStore2.getState().clear();
  useJourneyWalletStore.setState({ balance: 0 });
  mockNavigate.mockClear();
});

describe("FundWalletModal", () => {
  it("renders nothing when closed", () => {
    render(<FundWalletModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("fund-wallet-modal")).not.toBeInTheDocument();
  });

  it("seeds the amount from the cart total and shows the runway-days subtitle while unchanged", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FundWalletModal open={true} onClose={() => {}} />);
    // 4,000/day * ₹1.50 * 3 days = ₹18,000
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
    expect(
      screen.getByText("This covers the journeys you just picked for their first 3 days.")
    ).toBeInTheDocument();
  });

  it("hides the runway-days subtitle once the amount is changed", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FundWalletModal open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-increment-100"));
    expect(
      screen.queryByText("This covers the journeys you just picked for their first 3 days.")
    ).not.toBeInTheDocument();
  });

  it("clicking 'Skip and Continue Meta (WhatsApp) Setup' closes the modal and navigates to account setup", () => {
    const onClose = jest.fn();
    render(<FundWalletModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
  });

  it("clicking Add to Wallet credits the cart-derived amount, closes the modal, and navigates to account setup", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    const onClose = jest.fn();
    render(<FundWalletModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(useJourneyWalletStore.getState().balance).toBe(18000);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
  });
});
