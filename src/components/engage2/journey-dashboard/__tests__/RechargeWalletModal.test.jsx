import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RechargeWalletModal from "../RechargeWalletModal";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

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
  useJourneyWalletStore.setState({ balance: 0 });
});

describe("RechargeWalletModal", () => {
  it("renders nothing when closed", () => {
    render(<RechargeWalletModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("recharge-wallet-modal")).not.toBeInTheDocument();
  });

  it("shows the current wallet balance and the shared recharge card", () => {
    useJourneyWalletStore.setState({ balance: 1200 });
    render(<RechargeWalletModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId("recharge-wallet-modal")).toBeInTheDocument();
    expect(screen.getByText("Recharge Your Wallet")).toBeInTheDocument();
    expect(screen.getByTestId("recharge-wallet-current-balance")).toHaveTextContent(
      "Current balance: ₹1,200"
    );
    expect(screen.getByTestId("wallet-recharge-card")).toBeInTheDocument();
  });

  it("crediting the wallet via the shared card closes the modal and updates the displayed balance on reopen", () => {
    const onClose = jest.fn();
    const { rerender } = render(<RechargeWalletModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));

    expect(useJourneyWalletStore.getState().balance).toBe(500);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<RechargeWalletModal open={true} onClose={onClose} />);
    expect(screen.getByTestId("recharge-wallet-current-balance")).toHaveTextContent(
      "Current balance: ₹500"
    );
  });
});
