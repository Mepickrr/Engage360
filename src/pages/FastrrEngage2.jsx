import React from "react";
import HeroSection from "@/components/engage2/home/HeroSection";
import PersonalizedStatStrip from "@/components/engage2/home/PersonalizedStatStrip";
import JourneyListingSection from "@/components/engage2/home/JourneyListingSection";
import TestimonialSection from "@/components/engage2/home/TestimonialSection";

export default function FastrrEngagePage() {
  return (
    <div className="max-w-[1100px] mx-auto" data-testid="page-fastrr-engage">
      <HeroSection />
      <PersonalizedStatStrip />
      <JourneyListingSection />
      <TestimonialSection />
    </div>
  );
}
