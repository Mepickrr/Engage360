import React from "react";
import { Check } from "lucide-react";

export default function StepRail({ activeIndex, count = 3 }) {
  return (
    <div className="flex flex-col items-center gap-1 pt-6 px-3" data-testid="step-rail">
      {Array.from({ length: count }, (_, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                isDone ? "bg-success border-success" : isActive ? "border-primary" : "border-slate-300"
              }`}
              data-testid={`step-rail-dot-${i}`}
            >
              {isDone && <Check className="w-3 h-3 text-white" />}
            </div>
            {i < count - 1 && <div className="w-px h-4 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}
