import React, { useState } from "react";
import JourneyHeader from "@/components/engage2/journey-dashboard/JourneyHeader";
import JourneyStatsRow from "@/components/engage2/journey-dashboard/JourneyStatsRow";
import JourneysTable from "@/components/engage2/journey-dashboard/JourneysTable";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";
import WelcomeModal from "@/components/engage2/journey-dashboard/WelcomeModal";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";

function consumeWelcomeFlag() {
  const shouldShow = window.sessionStorage.getItem("fastrrJourney2Welcome") === "1";
  if (shouldShow) window.sessionStorage.removeItem("fastrrJourney2Welcome");
  return shouldShow;
}

export default function FastrrJourneyPage() {
  const [enabledMap, setEnabledMap] = useState({});
  const [previewId, setPreviewId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(consumeWelcomeFlag);

  const activeCount = Object.values(enabledMap).filter(Boolean).length;
  const previewJourney = JOURNEYS.find((j) => j.id === previewId) || null;

  function handleToggle(id) {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handlePreview(id) {
    setPreviewId(id);
  }

  function handleActivate(id) {
    setEnabledMap((prev) => ({ ...prev, [id]: true }));
    setPreviewId(null);
  }

  return (
    <div className="min-h-screen bg-app-bg" data-testid="page-fastrr-journey-2">
      <JourneyHeader />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <JourneyStatsRow activeCount={activeCount} />
        <JourneysTable
          journeys={JOURNEYS}
          enabledMap={enabledMap}
          onToggle={handleToggle}
          onPreview={handlePreview}
        />
      </div>
      <JourneyPreviewModal
        journey={previewJourney}
        onClose={() => setPreviewId(null)}
        onActivate={handleActivate}
      />
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  );
}
