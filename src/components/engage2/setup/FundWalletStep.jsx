import React from "react";
import { Wallet } from "lucide-react";
import WalletRechargeCard from "@/components/engage2/journey-dashboard/WalletRechargeCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { computeCartFunding } from "@/components/engage2/home/cartFunding";
import { WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

export default function FundWalletStep({ onDone, onSkip }) {
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());
  const { total, runwayDays } = computeCartFunding(selectedJourneys);
  const cartAmount = total || WALLET_TOPUP.defaultAmount;

  return (
    <div data-testid="fund-wallet-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 2 of 3
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Fund your messaging wallet</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            One step before setup — add balance so your selected journeys can start sending the
            moment they go live.
          </p>
        </div>
      </div>

      <WalletRechargeCard
        eyebrow="Recharge for Your Selected Journeys"
        subtitle={`This covers the journeys you just picked for their first ${runwayDays} days.`}
        initialAmount={cartAmount}
        hideSubtitleOnChange
        onDone={onDone}
      />

      <button
        type="button"
        className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto block mt-4"
        onClick={onSkip}
        data-testid="fund-wallet-skip"
      >
        Skip and Continue Meta (WhatsApp) Setup
      </button>
    </div>
  );
}
