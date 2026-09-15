import React, { useState } from "react";
import { PartyPopper, CheckCircle2, Lock, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";
import { RATE_CARD } from "./data";

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function WelcomeModal({ open, onClose, activatedCount = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const balance = useJourneyWalletStore((s) => s.balance);

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

        <div
          className="rounded-lg bg-success-bg text-center py-4 px-4 mb-2"
          data-testid="welcome-recap"
        >
          <p className="text-sm font-semibold text-text-primary">
            {`✓ ${formatINR(balance)} funded, ${activatedCount} journey${
              activatedCount === 1 ? "" : "s"
            } live`}
          </p>
        </div>

        <Button type="button" className="w-full" onClick={onClose} data-testid="welcome-modal-done">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
