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
  const Icon = ICONS[journeyTypeConfig.icon];

  function handlePillClick(audience) {
    setActiveAudience(audience);
    toggle(variants[audience].id);
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

      <div className="flex gap-2 mb-3">
        {["Known", "Fastrr Identified"].map((audience) => {
          const isSelected = !!selected[variants[audience].id];
          const isActive = activeAudience === audience;
          return (
            <button
              key={audience}
              type="button"
              data-testid={`journey-listing-pill-${variants[audience].id}`}
              onClick={() => handlePillClick(audience)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border hover:border-primary"
              } ${isActive ? "ring-2 ring-primary/30" : ""}`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {audience}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted mb-3">{AUDIENCE_EXPLAINER[activeAudience]}</p>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary border border-dashed border-primary/40 rounded-md py-2.5 mb-3 hover:bg-primary-tint/40 transition-colors"
        data-testid={`journey-listing-preview-trigger-${activeJourney.id}`}
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="w-3.5 h-3.5" />
        Preview this flow
      </button>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{`~${activeJourney.estimatedDailyVolume.toLocaleString("en-IN")}/day`}</span>
        <span className="tabular-nums">{MARKETING_RATE}</span>
      </div>

      <JourneyPreviewModal
        journey={previewOpen ? activeJourney : null}
        onClose={() => setPreviewOpen(false)}
        onActivate={(id) => {
          // "Activate Now" here means "add to selection" (this is the
          // pre-recharge/pre-signup listing page, not the live dashboard) —
          // idempotent so re-confirming an already-selected journey from the
          // preview never silently deselects it the way the pill's toggle would.
          if (!selected[id]) toggle(id);
          setPreviewOpen(false);
        }}
      />
    </div>
  );
}
