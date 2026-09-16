import React from "react";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function JourneyListingSection() {
  const hasSelection = useJourneySelectionStore2((s) => Object.keys(s.selected).length > 0);

  return (
    <div
      className={`mb-10 ${hasSelection ? "pb-28" : ""}`}
      data-testid="journey-listing-section"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Pick the moments worth messaging
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Each card shows the real message your shoppers would see. Select the ones you want —
          add as many as you like.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {JOURNEY_TYPES.map((type) => (
          <JourneyListingCard key={type.id} journeyTypeConfig={type} />
        ))}
      </div>
      <CartRail />
    </div>
  );
}
