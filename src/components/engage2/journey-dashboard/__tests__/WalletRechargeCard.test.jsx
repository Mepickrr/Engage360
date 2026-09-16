import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WalletRechargeCard from "../WalletRechargeCard";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

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

describe("WalletRechargeCard", () => {
  it("renders the given eyebrow and subtitle", () => {
    render(<WalletRechargeCard eyebrow="Recharge Your Wallet" subtitle="Top up anytime." />);
    expect(screen.getByText("Recharge Your Wallet")).toBeInTheDocument();
    expect(screen.getByText("Top up anytime.")).toBeInTheDocument();
  });

  it("shows an AI-suggested amount computed from the store's mock traffic, and Use applies it", () => {
    render(<WalletRechargeCard />);
    // 4,000 abandoned carts/day * ₹1.50/message * 3-day runway = ₹18,000
    expect(screen.getByTestId("wallet-recharge-ai-suggestion")).toHaveTextContent(
      "4,000 abandoned carts"
    );
    expect(screen.getByTestId("wallet-recharge-ai-suggestion")).toHaveTextContent("₹18,000");

    fireEvent.click(screen.getByTestId("wallet-recharge-ai-suggestion-cta"));
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
  });

  it("defaults the wallet amount to ₹500 and increments it via the +chips", () => {
    render(<WalletRechargeCard />);
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(500);

    fireEvent.click(screen.getByTestId("wallet-recharge-increment-100"));
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(600);

    fireEvent.click(screen.getByTestId("wallet-recharge-increment-1000"));
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(1600);
  });

  it("clicking Add to Wallet credits the wallet store, calls onDone, and shows a success toast", () => {
    const onDone = jest.fn();
    render(<WalletRechargeCard onDone={onDone} />);
    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));

    expect(useJourneyWalletStore.getState().balance).toBe(500);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("₹500 added to your wallet");
  });

  it("clicking Transfer from Checkout Wallet calls previewToast and does not credit the wallet", () => {
    render(<WalletRechargeCard />);
    fireEvent.click(screen.getByTestId("wallet-recharge-transfer-cta"));

    expect(previewToast).toHaveBeenCalledTimes(1);
    expect(useJourneyWalletStore.getState().balance).toBe(0);
  });

  it("the discount code field is hidden until 'Have a discount code?' is clicked", () => {
    render(<WalletRechargeCard />);
    expect(screen.queryByTestId("wallet-recharge-coupon-input")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("wallet-recharge-discount-toggle"));
    expect(screen.getByTestId("wallet-recharge-coupon-input")).toBeInTheDocument();
  });

  it("hovering (focusing) 'Have a discount code?' shows the current rate card as a tooltip", async () => {
    render(<WalletRechargeCard />);
    // Radix Tooltip opens on pointermove or focus — focus is the reliable
    // way to trigger it in jsdom (no real pointer events).
    fireEvent.focus(screen.getByTestId("wallet-recharge-discount-toggle"));
    expect(await screen.findByTestId("wallet-recharge-rate-tooltip")).toHaveTextContent(
      "WhatsApp Marketing"
    );
    expect(screen.getByTestId("wallet-recharge-rate-tooltip")).toHaveTextContent(
      "₹1.50 / message"
    );
  });

  it("applying a valid coupon shows the bonus breakdown and credits the bonus amount to the wallet", () => {
    render(<WalletRechargeCard />);
    fireEvent.click(screen.getByTestId("wallet-recharge-discount-toggle"));
    fireEvent.change(screen.getByTestId("wallet-recharge-coupon-input"), {
      target: { value: "welcome10" },
    });
    fireEvent.click(screen.getByTestId("wallet-recharge-coupon-apply"));

    expect(screen.getByTestId("wallet-recharge-coupon-applied")).toHaveTextContent(
      '"WELCOME10" applied — 10% bonus (+₹50)'
    );
    expect(screen.getByTestId("wallet-recharge-total-breakdown")).toHaveTextContent(
      "You'll receive ₹500 + ₹50 bonus = ₹550"
    );

    fireEvent.click(screen.getByTestId("wallet-recharge-add-cta"));
    expect(useJourneyWalletStore.getState().balance).toBe(550);
    expect(toast.success).toHaveBeenCalledWith("₹550 added to your wallet");
  });

  it("shows an inline error for an invalid coupon and applies no bonus", () => {
    render(<WalletRechargeCard />);
    fireEvent.click(screen.getByTestId("wallet-recharge-discount-toggle"));
    fireEvent.change(screen.getByTestId("wallet-recharge-coupon-input"), {
      target: { value: "BOGUS" },
    });
    fireEvent.click(screen.getByTestId("wallet-recharge-coupon-apply"));

    expect(screen.getByTestId("wallet-recharge-coupon-error")).toHaveTextContent("Invalid code");
    expect(screen.queryByTestId("wallet-recharge-coupon-applied")).not.toBeInTheDocument();
  });

  it("removing an applied coupon clears the bonus and reverts to the plain coupon input", () => {
    render(<WalletRechargeCard />);
    fireEvent.click(screen.getByTestId("wallet-recharge-discount-toggle"));
    fireEvent.change(screen.getByTestId("wallet-recharge-coupon-input"), {
      target: { value: "WELCOME10" },
    });
    fireEvent.click(screen.getByTestId("wallet-recharge-coupon-apply"));
    fireEvent.click(screen.getByTestId("wallet-recharge-coupon-remove"));

    expect(screen.queryByTestId("wallet-recharge-coupon-applied")).not.toBeInTheDocument();
    expect(screen.getByTestId("wallet-recharge-coupon-input")).toHaveValue("");
  });

  it("seeds the amount from initialAmount when given, instead of the default", () => {
    render(<WalletRechargeCard initialAmount={18000} />);
    expect(screen.getByTestId("wallet-recharge-amount-input")).toHaveValue(18000);
  });

  it("hides the AI suggestion block when showAiSuggestion is false", () => {
    render(<WalletRechargeCard showAiSuggestion={false} />);
    expect(screen.queryByTestId("wallet-recharge-ai-suggestion")).not.toBeInTheDocument();
  });
});
