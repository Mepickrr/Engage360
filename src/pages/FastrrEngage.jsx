import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
import RevenueOpportunityCard from "@/components/engage/RevenueOpportunityCard";
import HeroSection from "@/components/engage/home/HeroSection";
import LogoStrip from "@/components/engage/home/LogoStrip";
import DarkStatBand from "@/components/engage/home/DarkStatBand";
import BentoFeatureGrid from "@/components/engage/home/BentoFeatureGrid";
import TestimonialSection from "@/components/engage/home/TestimonialSection";
import FinalCTA from "@/components/engage/home/FinalCTA";

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);
  const close = useFastrrEngagePanelStore((s) => s.close);
  const navigate = useNavigate();

  useEffect(() => {
    open();
  }, [open]);

  function handleEnable() {
    close();
    navigate("/engage/account-setup");
  }

  return (
    <div className="max-w-[1100px] mx-auto" data-testid="page-fastrr-engage">
      <HeroSection onEnable={handleEnable} />
      <LogoStrip />
      <RevenueOpportunityCard
        variant="full"
        ctaLabel="Unlock This Revenue with Fastrr Journey"
        onCtaClick={handleEnable}
      />
      <DarkStatBand />
      <BentoFeatureGrid />
      <TestimonialSection />
      <FinalCTA onEnable={handleEnable} />
    </div>
  );
}
