import React, { useState } from "react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "@/components/settings/deliveryControls/SaveBar";
import DraggableRankList from "./DraggableRankList";
import { DEFAULT_CAMPAIGN_VS_JOURNEY_WINNER, DEFAULT_CHANNEL_PRIORITY } from "./constants";

const INITIAL_STATE = {
  campaignVsJourneyWinner: DEFAULT_CAMPAIGN_VS_JOURNEY_WINNER,
  channelPriority: DEFAULT_CHANNEL_PRIORITY,
};

export default function PrioritiesTab() {
  const [state, setState] = useState(INITIAL_STATE);
  const [baseline, setBaseline] = useState(INITIAL_STATE);
  const dirty = state !== baseline;

  function handleDiscard() {
    setState(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(state);
  }

  return (
    <div data-testid="settings-revenue-attribution-priorities">
      <SaveBar
        title="Priorities"
        subtitle="Decide which source and channel wins credit when an order could be attributed to more than one."
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        testIdPrefix="attribution-priorities"
      />

      <section className="bg-surface border border-border rounded-lg p-5 mb-4" data-testid="attribution-priorities-campaign-vs-journey">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Campaigns V/S Journeys</h3>
        <p className="text-[12px] text-text-secondary mb-3">
          When an order could be attributed to both a Campaign and a Journey, this decides which one gets the credit.
        </p>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {[
            { id: "campaigns", label: "Campaigns win ties" },
            { id: "journeys", label: "Journeys win ties" },
          ].map((option) => {
            const isActive = state.campaignVsJourneyWinner === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, campaignVsJourneyWinner: option.id }))}
                data-testid={`attribution-priorities-campaign-vs-journey-${option.id}`}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white" : "bg-white text-text-secondary hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-lg p-5" data-testid="attribution-priorities-channel">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Channel Priority</h3>
        <p className="text-[12px] text-text-secondary mb-3">
          Drag to reorder, or use the arrows. When an order could be attributed via more than one channel, the
          higher-ranked channel wins.
        </p>
        <DraggableRankList
          items={state.channelPriority}
          onReorder={(next) => setState((prev) => ({ ...prev, channelPriority: next }))}
          testIdPrefix="attribution-priorities-channel"
        />
      </section>
    </div>
  );
}
