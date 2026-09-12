import React from "react";
import { Button } from "@/components/ui/button";

export default function FinalCTA({ onEnable }) {
  return (
    <div className="text-center py-12 px-6 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white">
      <h2 className="text-xl font-semibold mb-2">Quick Onboarding, Real Results</h2>
      <p className="text-sm text-white/90 max-w-md mx-auto mb-6">
        Go live with your first abandoned-cart journey in as little as 15
        minutes — no dev work required.
      </p>
      <Button
        type="button"
        size="lg"
        className="bg-white text-primary hover:bg-white/90"
        data-testid="fastrr-engage-onboarding-cta"
        onClick={onEnable}
      >
        Set Up My Abandoned Cart Journey
      </Button>
    </div>
  );
}
