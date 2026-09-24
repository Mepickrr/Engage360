import React, { useState } from "react";
import { Eye, ShoppingCart, CreditCard, Check } from "lucide-react";
import { JOURNEYS, RATE_CARD, WAIT_LABEL } from "@/components/engage2/journey-dashboard/data";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";

const ICONS = { Eye, ShoppingCart, CreditCard };
const MARKETING_RATE = RATE_CARD.enabled.find((c) => c.id === "wa-marketing").price;

export default function JourneyListingCard({ journeyTypeConfig }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const toggle = useJourneySelectionStore2((s) => s.toggle);
  const selected = useJourneySelectionStore2((s) => s.selected);

  const known = JOURNEYS.find(
    (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Known"
  );
  const identified = JOURNEYS.find(
    (j) => j.journeyType === journeyTypeConfig.journeyType && j.audience === "Fastrr Identified"
  );
  // The card no longer distinguishes audiences (see spec decision #5) — its
  // checked state is "either variant selected", and clicking it is a clean
  // boolean flip: reads selected -> ends with BOTH off; reads unselected ->
  // ends with BOTH on. Never leaves a mixed state from card interaction.
  const isSelected = !!selected[known.id] || !!selected[identified.id];
  const Icon = ICONS[journeyTypeConfig.icon];

  function handleToggleCard() {
    if (isSelected) {
      if (selected[known.id]) toggle(known.id);
      if (selected[identified.id]) toggle(identified.id);
    } else {
      if (!selected[known.id]) toggle(known.id);
      if (!selected[identified.id]) toggle(identified.id);
    }
  }

  function handleCardKeyDown(e) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggleCard();
    }
  }

  return (
    <div
      onClick={handleToggleCard}
      onKeyDown={handleCardKeyDown}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      data-testid={`journey-listing-card-${journeyTypeConfig.id}`}
      className={`flex flex-col p-5 rounded-lg bg-surface cursor-pointer transition-shadow ${
        isSelected
          ? "border-2 border-text-primary shadow-md"
          : "border border-border hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="w-10 h-10 rounded-md bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <span className="flex-1" />
        {journeyTypeConfig.recommended && (
          <span
            className="text-[10px] font-semibold text-primary bg-primary-tint px-2 py-0.5 rounded-full self-start"
            data-testid={`journey-listing-recommended-${journeyTypeConfig.id}`}
          >
            Recommended
          </span>
        )}
        <span
          data-testid={`journey-listing-checkbox-${journeyTypeConfig.id}`}
          className={`w-6 h-6 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? "bg-text-primary border-text-primary text-white"
              : "border-border text-transparent"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="text-lg font-semibold text-text-primary mt-4">
        {journeyTypeConfig.journeyType}
      </div>
      <p className="text-sm text-text-secondary mt-1.5">{journeyTypeConfig.description}</p>

      <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Shoppers/day</span>
          <span className="font-semibold text-text-primary tabular-nums">
            {`~${known.estimatedDailyVolume.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Message sent</span>
          <span className="font-semibold text-text-primary">{`${WAIT_LABEL} after drop-off`}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPreviewOpen(true);
        }}
        data-testid={`journey-listing-preview-trigger-${journeyTypeConfig.id}`}
        className="flex items-center gap-2.5 w-full mt-4 p-2.5 rounded-md border border-border bg-app-bg hover:border-primary/40 hover:bg-primary-tint/20 transition-colors text-left"
      >
        <span className="w-14 h-9 rounded-md bg-slate-800 flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-text-primary">Preview journey</span>
          <span className="block text-[11px] text-text-secondary">See the flow and the message</span>
        </span>
      </button>

      <div className="text-xs text-text-muted mt-3 text-right tabular-nums">{MARKETING_RATE}</div>

      {/* Radix Dialog portals to document.body, but React's synthetic event
          system still bubbles clicks through the REACT tree, not the DOM
          tree — without this wrapper, a click on "Activate Now" inside the
          modal would also reach handleToggleCard above and immediately
          re-toggle the card. stopPropagation here only blocks that upward
          bubble; it doesn't affect the modal's own internal handlers
          (overlay-click-to-close etc.), which fire on their own elements
          first. */}
      <div onClick={(e) => e.stopPropagation()}>
        <JourneyPreviewModal
          journey={previewOpen ? known : null}
          onClose={() => setPreviewOpen(false)}
          onActivate={() => {
            if (!selected[known.id]) toggle(known.id);
            if (!selected[identified.id]) toggle(identified.id);
            setPreviewOpen(false);
          }}
        />
      </div>
    </div>
  );
}
