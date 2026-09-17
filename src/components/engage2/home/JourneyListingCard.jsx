import React, { useState } from "react";
import { Eye, ShoppingCart, CreditCard, Check } from "lucide-react";
import { JOURNEYS, RATE_CARD } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";

const ICONS = { Eye, ShoppingCart, CreditCard };

const AUDIENCE_EXPLAINER = {
  Known: "Customers reached on their verified WhatsApp number.",
  "Fastrr Identified":
    "Anonymous visitors Fastrr recognizes from browsing, before they've ever signed up.",
};

const MARKETING_RATE = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").price;

export default function JourneyListingCard({ journeyTypeConfig }) {
  const [activeAudience, setActiveAudience] = useState("Known");
  const [previewOpen, setPreviewOpen] = useState(false);
  const toggle = useJourneySelectionStore2((s) => s.toggle);
  const selected = useJourneySelectionStore2((s) => s.selected);

  const variants = {
    Known: JOURNEYS.find(
      (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Known"
    ),
    "Fastrr Identified": JOURNEYS.find(
      (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Fastrr Identified"
    ),
  };

  const activeJourney = variants[activeAudience];
  const otherAudience = activeAudience === "Known" ? "Fastrr Identified" : "Known";
  const isActivated = !!selected[activeJourney.id];
  const Icon = ICONS[journeyTypeConfig.icon];

  // Tabs only switch which audience you're looking at — no side effects.
  // "Activate Now" is the one, explicit place selection actually happens.
  function handleTabClick(audience) {
    setActiveAudience(audience);
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg p-5"
      data-testid={`journey-listing-card-${journeyTypeConfig.id}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-base font-semibold text-text-primary">
            {journeyTypeConfig.journeyType}
          </div>
          <div className="text-xs text-text-secondary">{journeyTypeConfig.description}</div>
        </div>
      </div>

      <div className="flex p-0.5 rounded-md bg-app-bg border border-border mb-3" role="tablist">
        {["Known", "Fastrr Identified"].map((audience) => {
          const isActive = activeAudience === audience;
          return (
            <button
              key={audience}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`journey-listing-tab-${variants[audience].id}`}
              onClick={() => handleTabClick(audience)}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {audience}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted mb-3">{AUDIENCE_EXPLAINER[activeAudience]}</p>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-md py-2.5 mb-2 hover:bg-primary-tint/40 transition-colors"
        data-testid={`journey-listing-preview-trigger-${activeJourney.id}`}
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="w-3.5 h-3.5" />
        Preview Journey
      </button>

      <button
        type="button"
        data-testid={`journey-listing-activate-${activeJourney.id}`}
        onClick={() => toggle(activeJourney.id)}
        className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md py-2.5 mb-3 transition-colors ${
          isActivated
            ? "bg-success-bg text-success border border-success/30 hover:bg-success-bg/70"
            : "bg-primary text-white hover:bg-primary-hover"
        }`}
      >
        {isActivated ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Activated — tap to remove
          </>
        ) : (
          "Activate Now"
        )}
      </button>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{`~${activeJourney.estimatedDailyVolume.toLocaleString("en-IN")}/day`}</span>
        <span className="tabular-nums">{MARKETING_RATE}</span>
      </div>

      <JourneyPreviewModal
        journey={previewOpen ? activeJourney : null}
        otherAudienceJourney={previewOpen ? variants[otherAudience] : null}
        onClose={() => setPreviewOpen(false)}
        onActivate={(id) => {
          // Idempotent — re-confirming from inside the preview never
          // silently removes an already-activated journey.
          if (!selected[id]) toggle(id);
          setPreviewOpen(false);
        }}
      />
    </div>
  );
}
