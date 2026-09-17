import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RechargeStep2Page from "../RechargeStep2";
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

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));

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

describe("RechargeStep2Page", () => {
  it("seeds the wallet-recharge card's amount from the selected journeys' cart total", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<RechargeStep2Page />);
    expect(screen.getByTestId("page-recharge")).toBeInTheDocument();
    // 4,000/day * ₹1.50/message * 3-day runway = ₹18,000
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
  });

  it("falls back to the default amount when nothing was selected", () => {
    render(<RechargeStep2Page />);
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(500);
  });

  it("clicking Add to Wallet navigates to account setup", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<RechargeStep2Page />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
  });

  it("clicking Skip for now navigates to account setup without crediting the wallet", () => {
    render(<RechargeStep2Page />);
    fireEvent.click(screen.getByTestId("recharge-skip"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });

  it("hides the generic AI-suggestion block since the amount is already cart-derived", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<RechargeStep2Page />);
    expect(screen.queryByTestId("wallet-recharge-ai-suggestion")).not.toBeInTheDocument();
  });
});
