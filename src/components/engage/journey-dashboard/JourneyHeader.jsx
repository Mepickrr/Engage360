import React from "react";
import { Link } from "react-router-dom";
import { Wallet, User } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import { useJourneyWalletStore } from "@/store/journeyWalletStore";

function formatINR(amount) {
  return `₹${amount.toFixed(2)}`;
}

export default function JourneyHeader() {
  const balance = useJourneyWalletStore((s) => s.balance);

  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface"
      data-testid="journey-header"
    >
      <span className="text-sm font-semibold text-text-primary">Fastrr Journey</span>

      <div className="flex items-center gap-4">
        <div
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full border border-border bg-app-bg"
          data-testid="journey-wallet-pill"
        >
          <Wallet className="w-3.5 h-3.5 text-text-secondary" />
          <span
            className="text-[12px] font-semibold tabular-nums text-text-primary"
            data-testid="journey-wallet-balance"
          >
            {formatINR(balance)}
          </span>
          <span className="h-3 w-px bg-border" />
          <button
            type="button"
            data-testid="journey-recharge-link"
            className="text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
            onClick={() => previewToast()}
          >
            Recharge
          </button>
        </div>

        <div
          className="w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center"
          data-testid="journey-profile-icon"
        >
          <User className="w-4 h-4 text-primary" />
        </div>

        <Link
          to="/"
          data-testid="journey-open-engage-link"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Open Engage
        </Link>
      </div>
    </div>
  );
}
