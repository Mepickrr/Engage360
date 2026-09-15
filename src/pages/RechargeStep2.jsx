import React from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import WalletRechargeCard from "@/components/engage2/journey-dashboard/WalletRechargeCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { RATE_CARD, WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

const MARKETING_RATE_PER_MESSAGE = RATE_CARD.enabled.find(
  (c) => c.id === "wa-marketing"
).pricePerMessage;

export default function RechargeStep2Page() {
  const navigate = useNavigate();
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());

  const dailyCost = selectedJourneys.reduce(
    (sum, j) => sum + j.estimatedDailyVolume * MARKETING_RATE_PER_MESSAGE,
    0
  );
  const cartAmount = dailyCost * WALLET_TOPUP.aiSuggestRunwayDays || WALLET_TOPUP.defaultAmount;

  function handleContinue() {
    navigate("/engage-2/account-setup");
  }

  return (
    <div
      className="min-h-screen bg-app-bg flex items-center justify-center px-6 py-10"
      data-testid="page-recharge"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Fund Your Wallet</h1>
          <p className="text-sm text-text-secondary mt-1">
            One step before setup — add balance so your selected journeys can start sending the
            moment they go live.
          </p>
        </div>

        <WalletRechargeCard
          eyebrow="Recharge for Your Selected Journeys"
          subtitle="This covers the journeys you just picked for their first 3 days."
          initialAmount={cartAmount}
          onDone={handleContinue}
        />

        <button
          type="button"
          className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto block mt-4"
          onClick={handleContinue}
          data-testid="recharge-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
