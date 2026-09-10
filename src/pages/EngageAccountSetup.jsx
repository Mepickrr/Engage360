import React from "react";
import { Link } from "react-router-dom";
import SetupInstructions from "@/components/engage/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage/account-setup/WhatsAppProfilePreview";

export default function EngageAccountSetupPage() {
  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-engage-account-setup">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <span className="text-sm font-semibold text-text-primary">Fastrr Engage</span>
        <Link
          to="/fastrr-engage"
          data-testid="exit-setup-link"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Exit setup
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <div>
          <SetupInstructions />
        </div>
        <div className="flex justify-center lg:sticky lg:top-10 lg:self-start">
          <PhoneMockup>
            <WhatsAppProfilePreview />
          </PhoneMockup>
        </div>
      </div>
    </div>
  );
}
