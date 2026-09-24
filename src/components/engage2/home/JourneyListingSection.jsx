import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES, JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function JourneyListingSection() {
  const navigate = useNavigate();
  const selected = useJourneySelectionStore2((s) => s.selected);
  const toggle = useJourneySelectionStore2((s) => s.toggle);

  // All journeys start selected by default (matches the prototype) — but
  // only when nothing is selected yet, so returning here after making or
  // changing a selection (e.g. "Change selection" from a later step) never
  // gets silently overwritten.
  useEffect(() => {
    if (Object.keys(selected).length === 0) {
      JOURNEYS.forEach((j) => toggle(j.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mb-10" id="recovery-journeys" data-testid="journey-listing-section">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Select your recovery journeys
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Each journey is triggered by a specific drop-off point. Most brands start with
          Abandoned Checkout — the highest-intent audience — and expand from there.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {JOURNEY_TYPES.map((type) => (
          <JourneyListingCard key={type.id} journeyTypeConfig={type} />
        ))}
      </div>
      <CartRail onContinue={() => navigate("/engage-2/setup")} />
    </div>
  );
}
