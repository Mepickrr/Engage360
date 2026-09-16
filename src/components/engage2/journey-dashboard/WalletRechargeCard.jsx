import React, { useState } from "react";
import { Sparkles, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { previewToast } from "@/components/common/PreviewHeader";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { RATE_CARD, WALLET_TOPUP, COUPONS } from "./data";

export function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function computeAiSuggestion() {
  const { abandonedCheckoutPerDay } = computeRevenueOpportunity();
  const marketingRate = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").pricePerMessage;
  const dailyCost = abandonedCheckoutPerDay * marketingRate;
  const suggestedAmount = dailyCost * WALLET_TOPUP.aiSuggestRunwayDays;
  return { abandonedCheckoutPerDay, dailyCost, suggestedAmount };
}

// Shared recharge experience — the AI-suggested amount, manual amount
// entry, discount code, and the two recharge CTAs. Used by
// RechargeStep2 (the post-listing checkout step, with its own
// cart-derived amount and showAiSuggestion={false}) and RechargeWalletModal
// (opened any time from the journey dashboard header, whole-store AI
// suggestion still shown), so a seller always gets the exact same recharge
// mechanics no matter where they start it from.
export default function WalletRechargeCard({
  eyebrow = "Fund Your Wallet",
  subtitle = "Add balance so your journeys keep sending without interruption.",
  onDone,
  initialAmount = WALLET_TOPUP.defaultAmount,
  showAiSuggestion = true,
}) {
  const [expandCoupon, setExpandCoupon] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const credit = useJourneyWalletStore((s) => s.credit);

  const aiSuggestion = computeAiSuggestion();
  const bonusAmount = appliedCoupon
    ? Math.round((amount * appliedCoupon.bonusPercent) / 100)
    : 0;
  const totalCredit = amount + bonusAmount;

  function handleIncrement(inc) {
    setAmount((a) => a + inc);
  }

  function handleAmountChange(e) {
    const next = Number(e.target.value);
    setAmount(Number.isFinite(next) && next >= 0 ? next : 0);
  }

  function handleUseAiSuggestion() {
    setAmount(aiSuggestion.suggestedAmount);
  }

  function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const coupon = COUPONS[code];
    if (coupon) {
      setAppliedCoupon({ code, ...coupon });
      setCouponError(null);
    } else {
      setAppliedCoupon(null);
      setCouponError("Invalid code");
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  function handleAddToWallet() {
    if (amount <= 0) return;
    credit(totalCredit);
    if (onDone) onDone();
    toast.success(`${formatINR(totalCredit)} added to your wallet`);
  }

  return (
    <div
      className="rounded-lg bg-primary-tint/40 border border-border p-4"
      data-testid="wallet-recharge-card"
    >
      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {eyebrow}
        </div>
        <div className="text-sm text-text-secondary">{subtitle}</div>
      </div>

      {showAiSuggestion && (
        <div
          className="rounded-md bg-surface border border-primary/30 p-3 mb-3"
          data-testid="wallet-recharge-ai-suggestion"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggested for Your Store
          </div>
          <p className="text-xs text-text-secondary mb-2">
            {`Your store sees ~${aiSuggestion.abandonedCheckoutPerDay.toLocaleString(
              "en-IN"
            )} abandoned carts a day. At current WhatsApp rates, that's ~${formatINR(
              aiSuggestion.suggestedAmount
            )} to keep recovery messages flowing for the next ${
              WALLET_TOPUP.aiSuggestRunwayDays
            } days without a gap.`}
          </p>
          <button
            type="button"
            data-testid="wallet-recharge-ai-suggestion-cta"
            className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            onClick={handleUseAiSuggestion}
          >
            Use {formatINR(aiSuggestion.suggestedAmount)}
          </button>
        </div>
      )}

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-primary pointer-events-none">
          ₹
        </span>
        <Input
          type="number"
          min={0}
          step={100}
          value={amount}
          onChange={handleAmountChange}
          className="pl-7 pr-9 bg-surface"
          data-testid="wallet-recharge-amount-input"
        />
        {amount > 0 && (
          <button
            type="button"
            aria-label="Clear amount"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            onClick={() => setAmount(0)}
            data-testid="wallet-recharge-amount-clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {WALLET_TOPUP.increments.map((inc) => (
          <button
            key={inc}
            type="button"
            data-testid={`wallet-recharge-increment-${inc}`}
            className="px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold text-text-primary hover:border-primary hover:text-primary transition-colors"
            onClick={() => handleIncrement(inc)}
          >
            +{formatINR(inc)}
          </button>
        ))}
      </div>

      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-testid="wallet-recharge-discount-toggle"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors mb-2"
              onClick={() => setExpandCoupon((v) => !v)}
            >
              Have a discount code?
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${expandCoupon ? "rotate-180" : ""}`}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            className="w-56 bg-surface text-text-primary border border-border p-3"
            data-testid="wallet-recharge-rate-tooltip"
          >
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Your Messaging Rates
            </div>
            <div className="space-y-1">
              {RATE_CARD.enabled.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span>{c.name}</span>
                  <span className="text-text-secondary tabular-nums">{c.price}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {expandCoupon &&
        (appliedCoupon ? (
          <div
            className="flex items-center justify-between rounded-md bg-success-bg px-3 py-2 mb-4"
            data-testid="wallet-recharge-coupon-applied"
          >
            <span className="text-xs font-medium text-text-primary">
              {`"${appliedCoupon.code}" applied — ${appliedCoupon.bonusPercent}% bonus (+${formatINR(
                bonusAmount
              )})`}
            </span>
            <button
              type="button"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              onClick={handleRemoveCoupon}
              data-testid="wallet-recharge-coupon-remove"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter code"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponError) setCouponError(null);
                }}
                className="bg-surface"
                data-testid="wallet-recharge-coupon-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim()}
                data-testid="wallet-recharge-coupon-apply"
              >
                Apply
              </Button>
            </div>
            {couponError && (
              <p className="text-xs text-destructive mt-1" data-testid="wallet-recharge-coupon-error">
                {couponError}
              </p>
            )}
          </div>
        ))}

      {appliedCoupon && (
        <p className="text-xs text-text-secondary mb-2" data-testid="wallet-recharge-total-breakdown">
          {`You'll receive ${formatINR(amount)} + ${formatINR(bonusAmount)} bonus = ${formatINR(
            totalCredit
          )}`}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={amount <= 0}
          onClick={handleAddToWallet}
          data-testid="wallet-recharge-add-cta"
        >
          Add {formatINR(amount)} to Wallet
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => previewToast()}
          data-testid="wallet-recharge-transfer-cta"
        >
          Transfer from Checkout Wallet
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center mt-3">
        Funds are used only for message delivery. No lock-in.
      </p>
    </div>
  );
}
