import React from "react";
import ChatPreviewMockup from "./ChatPreviewMockup";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { formatCompactCurrency } from "@/lib/analyticsFormat";

export default function HeroSection() {
  const { abandonedCheckoutPerDay, monthlyRevenueAtRisk } = computeRevenueOpportunity();

  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-block bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Your Store · Today's Activity
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
            data-testid="hero-headline"
          >
            {`${formatCompactCurrency(monthlyRevenueAtRisk)} a month is walking out through your checkout.`}
          </h1>
          <p className="text-base text-text-secondary" data-testid="hero-subhead">
            {`${abandonedCheckoutPerDay.toLocaleString(
              "en-IN"
            )} shoppers a day abandon before paying. Pick the moments worth messaging below, fund your wallet, and go live in minutes.`}
          </p>
        </div>
        <div>
          <ChatPreviewMockup />
        </div>
      </div>
    </div>
  );
}
