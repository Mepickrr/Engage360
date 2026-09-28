import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { computeCartFunding, formatINR } from "./cartFunding";

export default function CartRail({ onContinue }) {
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());

  if (selectedJourneys.length === 0) return null;

  const { total, runwayDays } = computeCartFunding(selectedJourneys);
  // Selecting a card toggles BOTH the Known and Fastrr Identified JOURNEYS
  // entries for that type together — count distinct journey TYPES here,
  // matching SelectRecapStep's dedup, not raw selectedJourneys.length (which
  // would be exactly double the number of cards the seller actually chose).
  const typeCount = new Set(selectedJourneys.map((j) => j.journeyType)).size;

  return createPortal(
    <div
      className="fixed left-0 right-0 bottom-0 z-40 bg-slate-900 text-white border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
      data-testid="cart-rail"
    >
      <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold" data-testid="cart-rail-summary">
            {`${typeCount} journey${
              typeCount > 1 ? "s" : ""
            } selected · est. ${formatINR(total)} to fund ${runwayDays} days`}
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            Funds stay in your wallet until each journey actually sends.
          </div>
        </div>
        <Button
          type="button"
          className="bg-white text-slate-900 hover:bg-white/90 flex-shrink-0"
          data-testid="cart-rail-continue"
          onClick={onContinue}
        >
          Set up Journey
        </Button>
      </div>
    </div>,
    document.body
  );
}
