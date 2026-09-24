import React from "react";

const STEPS = ["Select journeys", "Fund wallet", "WhatsApp Account Setup"];

export default function SetupProgressBar({ currentStep, furthestStep, onStepClick }) {
  return (
    <div className="flex items-center gap-2.5 mb-10" data-testid="setup-progress-bar">
      {STEPS.map((label, i) => {
        const isDone = i <= furthestStep && i !== currentStep;
        const isCurrent = i === currentStep;
        const canJump = i <= furthestStep;
        return (
          <button
            key={label}
            type="button"
            data-testid={`setup-progress-step-${i}`}
            onClick={() => canJump && onStepClick(i)}
            disabled={!canJump}
            className="flex-1 flex flex-col gap-2 text-left bg-transparent border-0 p-0 disabled:cursor-not-allowed"
          >
            <span
              className={`h-1 rounded-full transition-colors ${
                isDone ? "bg-success" : isCurrent ? "bg-text-primary" : "bg-border"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                isCurrent ? "text-text-primary" : isDone ? "text-success" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
