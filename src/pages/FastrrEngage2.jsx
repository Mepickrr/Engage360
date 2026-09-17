import React from "react";
import HeroSection from "@/components/engage2/home/HeroSection";
import PersonalizedStatStrip from "@/components/engage2/home/PersonalizedStatStrip";
import JourneyListingSection from "@/components/engage2/home/JourneyListingSection";
import TestimonialSection from "@/components/engage2/home/TestimonialSection";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function FastrrEngagePage() {
  // The cart rail portals to document.body and floats fixed-to-viewport
  // while any journey is selected. Padding lives on the page root (always
  // after whatever section renders last) so the rail never overlaps
  // trailing content, however the sections above get reordered.
  const hasSelection = useJourneySelectionStore2((s) => Object.keys(s.selected).length > 0);

  return (
    <div
      className={`max-w-[1100px] mx-auto ${hasSelection ? "pb-28" : ""}`}
      data-testid="page-fastrr-engage"
    >
      <HeroSection />
      <PersonalizedStatStrip />
      <JourneyListingSection />
      <TestimonialSection />
    </div>
  );
}
