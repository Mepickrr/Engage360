import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeModal from "../WelcomeModal";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

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

  it("renders the congratulations header, the 3 enabled channels by default, disabled channels hidden, and a funded/live recap", () => {
    useJourneyWalletStore.setState({ balance: 18000 });
    render(<WelcomeModal open={true} onClose={() => {}} activatedCount={2} />);
    expect(screen.getByTestId("welcome-modal")).toBeInTheDocument();
    expect(screen.getByText("Your WhatsApp Channel Is Live! 🎉")).toBeInTheDocument();

    expect(screen.getByTestId("welcome-rate-row-wa-utility")).toHaveTextContent("₹0.40 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-marketing")).toHaveTextContent("₹1.50 / message");
    expect(screen.getByTestId("welcome-rate-row-wa-session")).toHaveTextContent("₹0.40 / message");

    expect(screen.queryByTestId("welcome-rate-row-email")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-rcs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("welcome-rate-row-sms")).not.toBeInTheDocument();

    expect(screen.getByTestId("welcome-recap")).toHaveTextContent("₹18,000 funded, 2 journeys live");
    expect(screen.queryByTestId("wallet-recharge-card")).not.toBeInTheDocument();
  });

  it("singularizes the recap when exactly 1 journey is live", () => {
    render(<WelcomeModal open={true} onClose={() => {}} activatedCount={1} />);
    expect(screen.getByTestId("welcome-recap")).toHaveTextContent("1 journey live");
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

  it("clicking Got it closes the modal", () => {
    const onClose = jest.fn();
    render(<WelcomeModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("welcome-modal-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a funding nudge instead of a false 'funded' claim when the wallet balance is still zero", () => {
    render(<WelcomeModal open={true} onClose={() => {}} activatedCount={1} />);
    expect(screen.getByTestId("welcome-recap")).not.toHaveTextContent("funded");
    expect(screen.getByTestId("welcome-recap")).toHaveTextContent("1 journey live");
  });
});
