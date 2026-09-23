import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FundWalletStep from "../FundWalletStep";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

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
});

describe("FundWalletStep", () => {
  it("seeds the amount from the cart total and shows the runway-days subtitle while unchanged", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<FundWalletStep onDone={() => {}} onSkip={() => {}} />);
    // 4,000/day * ₹1.50 * 3 days = ₹18,000
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
    expect(
      screen.getByText("This covers the journeys you just picked for their first 3 days.")
    ).toBeInTheDocument();
  });

  it("clicking 'Skip and Continue Meta (WhatsApp) Setup' calls onSkip", () => {
    const onSkip = jest.fn();
    render(<FundWalletStep onDone={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("clicking Add to Wallet credits the cart-derived amount and calls onDone", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    const onDone = jest.fn();
    render(<FundWalletStep onDone={onDone} onSkip={() => {}} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(useJourneyWalletStore.getState().balance).toBe(18000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
