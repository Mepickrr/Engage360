import React from "react";
import JourneyListingCard from "./JourneyListingCard";
import CartRail from "./CartRail";
import { JOURNEY_TYPES } from "@/components/engage2/journey-dashboard/data";

// Bottom clearance for the floating cart rail lives on the page root
// (FastrrEngage2.jsx), not here — this section isn't reliably the page's
// last one (TestimonialSection renders after it), so padding added at
// this level doesn't guarantee the rail clears the page's true end.
export default function JourneyListingSection() {
  return (
    <div className="mb-10" data-testid="journey-listing-section">
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
