import React, { useState } from "react";
import { PartyPopper, CheckCircle2, Lock, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { previewToast } from "@/components/common/PreviewHeader";
import { useJourneyWalletStore } from "@/store/journeyWalletStore";
import { RATE_CARD, WALLET_TOPUP } from "./data";

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function WelcomeModal({ open, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(WALLET_TOPUP.defaultAmount);
  const credit = useJourneyWalletStore((s) => s.credit);

  function handleIncrement(inc) {
    setAmount((a) => a + inc);
  }

  function handleAmountChange(e) {
    const next = Number(e.target.value);
    setAmount(Number.isFinite(next) && next >= 0 ? next : 0);
  }

  function handleAddToWallet() {
    if (amount <= 0) return;
    credit(amount);
    onClose();
    toast.success(`${formatINR(amount)} added to your wallet`);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid="welcome-modal">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-2">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-lg">Your WhatsApp Channel Is Live! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            You're all set to turn window-shoppers into customers — automatically, on the
            channel they already use.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-surface p-4" data-testid="welcome-rate-card">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Your Messaging Rates
            </div>
            <div className="text-sm text-text-secondary">
              No setup fees. Pay only for what you send.
            </div>
          </div>

          <div className="space-y-2">
            {RATE_CARD.enabled.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between"
                data-testid={`welcome-rate-row-${channel.id}`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-text-primary">{channel.name}</span>
                </div>
                <span className="text-sm text-text-secondary tabular-nums">{channel.price}</span>
              </div>
            ))}
          </div>

          {expanded && (
            <div className="space-y-2 mt-2 pt-2 border-t border-border">
              {RATE_CARD.disabled.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between"
                  data-testid={`welcome-rate-row-${channel.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted">{channel.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">Connect with your KAM to activate</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            data-testid="welcome-rate-card-expand-toggle"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors mt-3"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide channels" : `+ ${RATE_CARD.disabled.length} more channels`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="rounded-lg bg-primary-tint/40 border border-border p-4" data-testid="welcome-wallet-section">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Fund Your First Journey
            </div>
            <div className="text-sm text-text-secondary">
              Add balance now so your Abandoned Cart journey can start sending the moment it's
              live — no delays, no missed carts.
            </div>
          </div>

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
              data-testid="welcome-wallet-amount-input"
            />
            {amount > 0 && (
              <button
                type="button"
                aria-label="Clear amount"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                onClick={() => setAmount(0)}
                data-testid="welcome-wallet-amount-clear"
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
                data-testid={`welcome-wallet-increment-${inc}`}
                className="px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-semibold text-text-primary hover:border-primary hover:text-primary transition-colors"
                onClick={() => handleIncrement(inc)}
              >
                +{formatINR(inc)}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              className="flex-1"
              disabled={amount <= 0}
              onClick={handleAddToWallet}
              data-testid="welcome-wallet-add-cta"
            >
              Add {formatINR(amount)} to Wallet
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => previewToast()}
              data-testid="welcome-wallet-transfer-cta"
            >
              Transfer from Checkout Wallet
            </Button>
          </div>

          <p className="text-xs text-text-muted text-center mt-3">
            Funds are used only for message delivery. No lock-in.
          </p>
        </div>

        <button
          type="button"
          className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto"
          onClick={onClose}
          data-testid="welcome-modal-skip"
        >
          Skip for now
        </button>
      </DialogContent>
    </Dialog>
  );
}
