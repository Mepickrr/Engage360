import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeModal from "../WelcomeModal";
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

describe("WelcomeModal", () => {
  it("renders nothing when closed", () => {
    render(<WelcomeModal open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("welcome-modal")).not.toBeInTheDocument();
  });

  it("renders the congratulations header, the 3 enabled channels by default, disabled channels hidden, and the shared wallet recharge card", () => {
    render(<WelcomeModal open={true} onClose={() => {}} />);
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Your WhatsApp Channel Is Live! 🎉")).toBeInTheDocument();

    expect(screen.getByTestId("welcome-rate-row-wa-utility")).toHaveTextContent("₹0.40 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-marketing")).toHaveTextContent("₹1.50 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-session")).toHaveTextContent("₹0.40 / message");

    expect(screen.queryByTestId("welcome-rate-row-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-rcs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-sms")).not.toBeInTheDocument();

    expect(screen.getByTestId("wallet-recharge-card")).toBeInTheDocument();
    expect(screen.getByText("Fund Your First Journey")).toBeInTheDocument();
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

  it("clicking Add to Wallet in the shared recharge card closes the modal (via onDone)", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));

    expect(useJourneyWalletStore.getState().balance).toBe(500);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking Skip for now closes the modal without crediting the wallet", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-modal-skip"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });
});
