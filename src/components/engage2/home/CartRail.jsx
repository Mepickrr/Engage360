import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { RATE_CARD, WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

const MARKETING_RATE_PER_MESSAGE = RATE_CARD.enabled.find(
  (c) => c.id === "wa-marketing"
).pricePerMessage;

function formatINR(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CartRail() {
  const navigate = useNavigate();
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());

  if (selectedJourneys.length === 0) return null;

  const dailyCost = selectedJourneys.reduce(
    (sum, j) => sum + j.estimatedDailyVolume * MARKETING_RATE_PER_MESSAGE,
    0
  );
  const total = dailyCost * WALLET_TOPUP.aiSuggestRunwayDays;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 flex justify-center pb-5 px-4" data-testid="cart-rail">
      <div className="w-full max-w-[900px] bg-slate-900 text-white rounded-xl shadow-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold" data-testid="cart-rail-summary">
            {`${selectedJourneys.length} journey${
              selectedJourneys.length > 1 ? "s" : ""
            } selected · est. ${formatINR(total)} to fund ${WALLET_TOPUP.aiSuggestRunwayDays} days`}
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            Funds stay in your wallet until each journey actually sends.
          </div>
        </div>
        <Button
          type="button"
          className="bg-white text-slate-900 hover:bg-white/90 flex-shrink-0"
          data-testid="cart-rail-continue"
          onClick={() => navigate("/engage-2/recharge")}
        >
          Continue to Recharge
        </Button>
      </div>
    </div>
  );
}
