import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
import RevenueOpportunityCard from "@/components/engage2/RevenueOpportunityCard2";
import HeroSection from "@/components/engage2/home/HeroSection";
import LogoStrip from "@/components/engage2/home/LogoStrip";
import DarkStatBand from "@/components/engage2/home/DarkStatBand";
import BentoFeatureGrid from "@/components/engage2/home/BentoFeatureGrid";
import TestimonialSection from "@/components/engage2/home/TestimonialSection";
import FinalCTA from "@/components/engage2/home/FinalCTA";

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);
  const close = useFastrrEngagePanelStore((s) => s.close);
  const navigate = useNavigate();

  useEffect(() => {
    open();
  }, [open]);

  function handleEnable() {
    close();
    navigate("/engage-2/account-setup");
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
