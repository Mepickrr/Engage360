import React from "react";
import { Link } from "react-router-dom";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";

export default function SelectRecapStep() {
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());
  const types = [...new Set(selectedJourneys.map((j) => j.journeyType))];

  return (
    <div className="mb-10" data-testid="select-recap-step">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Step 1 of 3
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-3">Your selected journeys</h2>
      <div className="flex flex-wrap gap-2 mb-3" data-testid="select-recap-types">
        {types.map((t) => (
          <span
            key={t}
            className="text-xs font-semibold text-text-primary bg-primary-tint px-3 py-1.5 rounded-full"
          >
            {t}
          </span>
        ))}
      </div>
      <Link
        to="/fastrr-engage-2"
        data-testid="select-recap-change-link"
        className="text-xs font-medium text-primary hover:text-primary-hover"
      >
        Change selection
      </Link>
    </div>
  );
}
