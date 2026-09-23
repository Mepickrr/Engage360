import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EngageSetupPage from "../EngageSetup2";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
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

describe("EngageSetupPage", () => {
  it("lands on step 2 (Fund wallet) by default, with step 3 not yet reachable", () => {
    render(<EngageSetupPage />);
    expect(screen.getByTestId("fund-wallet-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-2")).toBeDisabled();
  });

  it("clicking step 1 on the progress bar shows the select recap, and it remains reachable", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("setup-progress-step-0"));
    expect(screen.getByTestId("select-recap-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-0")).not.toBeDisabled();
  });

  it("skipping the wallet step advances to WhatsApp Account Setup and unlocks that progress step", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    expect(screen.getByTestId("whatsapp-setup-step")).toBeInTheDocument();
    expect(screen.getByTestId("setup-progress-step-2")).not.toBeDisabled();
  });

  it("funding the wallet also advances to WhatsApp Account Setup", () => {
    useJourneySelectionStore2.getState().toggle("abandoned-cart-known");
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(screen.getByTestId("whatsapp-setup-step")).toBeInTheDocument();
  });

  it("confirming WhatsApp setup navigates to Meta Embedded Signup", () => {
    render(<EngageSetupPage />);
    fireEvent.click(screen.getByTestId("fund-wallet-skip"));
    fireEvent.click(screen.getByTestId("setup-cta-manual"));
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/meta-embedded-signup");
  });
});
