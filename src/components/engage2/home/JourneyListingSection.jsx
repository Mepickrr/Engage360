import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES, JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function JourneyListingSection() {
  const navigate = useNavigate();

  // All journeys start selected by default (matches the prototype) — but
  // only when nothing is selected yet, so returning here after making or
  // changing a selection (e.g. "Change selection" from a later step) never
  // gets silently overwritten.
  //
  // Reads/writes the store directly via getState() rather than a
  // useJourneySelectionStore2((s) => ...) subscription: under
  // <React.StrictMode> (this app's root is wrapped in it), effects with an
  // empty dependency array run twice in dev. toggle() is a flip, not a
  // set — if this effect's check read from a subscribed value captured at
  // render time, both StrictMode invocations would see the same stale
  // "nothing selected" snapshot and each journey would get toggled on,
  // then immediately off again, netting to nothing selected. getState()
  // reads the store fresh each time this runs, so the second invocation
  // correctly sees the first invocation's writes and skips the reseed.
  useEffect(() => {
    if (Object.keys(useJourneySelectionStore2.getState().selected).length === 0) {
      JOURNEYS.forEach((j) => useJourneySelectionStore2.getState().toggle(j.id));
    }
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
