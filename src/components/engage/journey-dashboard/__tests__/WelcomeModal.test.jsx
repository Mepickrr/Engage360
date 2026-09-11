import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeModal from "../WelcomeModal";
import { useJourneyWalletStore } from "@/store/journeyWalletStore";

jest.mock("@/components/common/PreviewHeader", () => ({
  previewToast: jest.fn(),
}));
import { previewToast } from "@/components/common/PreviewHeader";

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));
import { toast } from "sonner";

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  useJourneyWalletStore.setState({ balance: 0 });
  previewToast.mockClear();
  toast.success.mockClear();
});

describe("WelcomeModal", () => {
  it("renders nothing when closed", () => {
    render(<WelcomeModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("renders the congratulations header and the 3 enabled channels by default, with disabled channels hidden", () => {
    render(<WelcomeModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Your WhatsApp Channel Is Live! 🎉")).toBeInTheDocument();

    expect(screen.getByTestId("welcome-rate-row-wa-utility")).toHaveTextContent("₹0.40 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-marketing")).toHaveTextContent("₹1.50 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-session")).toHaveTextContent("₹0.40 / message");

    expect(screen.queryByTestId("welcome-rate-row-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-rcs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-sms")).not.toBeInTheDocument();
  });

  it("expanding the rate card reveals the 3 disabled channels", () => {
    render(<WelcomeModal open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("welcome-rate-card-expand-toggle"));

    expect(screen.getByTestId("welcome-rate-row-email")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
    expect(screen.getByTestId("welcome-rate-row-rcs")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
    expect(screen.getByTestId("welcome-rate-row-sms")).toHaveTextContent(
      "Connect with your KAM to activate"
    );
  });

  it("defaults the wallet amount to ₹500 and increments it via the +chips", () => {
    render(<WelcomeModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId("welcome-wallet-amount-input")).toHaveValue(500);

    fireEvent.click(screen.getByTestId("welcome-wallet-increment-100"));
    expect(screen.getByTestId("welcome-wallet-amount-input")).toHaveValue(600);

    fireEvent.click(screen.getByTestId("welcome-wallet-increment-1000"));
    expect(screen.getByTestId("welcome-wallet-amount-input")).toHaveValue(1600);
  });

  it("clicking Add to Wallet credits the wallet store, closes the modal, and shows a success toast", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-wallet-add-cta"));

    expect(useJourneyWalletStore.getState().balance).toBe(500);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("₹500 added to your wallet");
  });

  it("clicking Transfer from Checkout Wallet calls previewToast and does not credit the wallet", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-wallet-transfer-cta"));

    expect(previewToast).toHaveBeenCalledTimes(1);
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });

  it("clicking Skip for now closes the modal without crediting the wallet", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-modal-skip"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });
});
