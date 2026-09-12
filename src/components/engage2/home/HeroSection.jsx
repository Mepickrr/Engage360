import React from "react";
import { Button } from "@/components/ui/button";
import ChatPreviewMockup from "./ChatPreviewMockup";

export default function HeroSection({ onEnable }) {
  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-block bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            For D2C Brands on WhatsApp
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Convert Every Anonymous Visitor Into a Paying Customer
          </h1>
          <p className="text-base text-text-secondary mb-6">
            Identify shoppers before they sign up, then win them back on WhatsApp —
            the channel with the highest open and reply rates in commerce.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Button
              type="button"
              size="lg"
              data-testid="fastrr-engage-hero-cta"
              onClick={onEnable}
            >
              Set Up My Abandoned Cart Journey
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-testid="fastrr-engage-hero-secondary-cta"
              onClick={() => {}} // TODO: wire up once enablement flow is defined
            >
              See how it works
            </Button>
          </div>
        </div>
        <div>
          <ChatPreviewMockup />
        </div>
      </div>
    </div>
  );
}
