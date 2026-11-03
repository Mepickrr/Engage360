import React from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { blockSetHasConditions, enhanceAudience } from "./fastrrSignals";

// Appends the next Fastrr Signals OR-condition to an audience's include
// filters — same rotation as "Fastrr Enhance" on the segment builder.
export default function SignalsRecommendationButton({ audience, setAudience, testId = "signals-recommendation" }) {
  const handleClick = () => {
    if (!blockSetHasConditions(audience.include)) {
      toast("Add at least one condition, then get a Fastrr Signals recommendation.");
      return;
    }
    const result = enhanceAudience(audience);
    if (!result) {
      toast("All Fastrr Signals recommendations are already in this filter.");
      return;
    }
    setAudience(result.audience);
    const { property, operator, value } = result.added;
    toast.success(`Added OR ${property} ${operator} ${value}`, { description: "Click again for another Fastrr Signals recommendation" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={testId}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#D9C9FF] bg-[#F7F3FF] text-[#6C3AE8] hover:bg-[#EFE7FF] text-[12px] font-semibold"
    >
      <Sparkles className="w-3.5 h-3.5" />
      Recommendation
    </button>
  );
}
