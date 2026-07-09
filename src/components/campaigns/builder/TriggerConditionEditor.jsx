import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";

const BEHAVIOR_OPTIONS = [
  { value: "delivered_not_viewed", label: "Primary broadcast received, but not viewed" },
  { value: "viewed_not_clicked", label: "Primary broadcast viewed, but CTA not clicked" },
  { value: "clicked", label: "Primary broadcast CTA clicked" },
  { value: "failed", label: "Primary broadcast failed" },
];

export default function TriggerConditionEditor({ step }) {
  const sequence = useCampaignBuilderStore((s) => s.sequence);
  const updateTriggerCondition = useCampaignBuilderStore((s) => s.updateTriggerCondition);
  const tc = step.trigger_condition;
  const priorSteps = sequence.filter((s) => s.order_index < step.order_index);

  const setMode = (mode) => {
    if (mode === "delay") {
      updateTriggerCondition(step.id, {
        mode,
        fire_at: null,
        delay: tc.delay ?? { value: 1, unit: "hours" },
      });
    } else {
      updateTriggerCondition(step.id, { mode, delay: null });
    }
  };

  return (
    <div data-testid="trigger-condition-editor">
      <label className="block text-[12px] font-medium text-text-secondary mb-1">Reference step</label>
      <select
        data-testid="tc-reference-step"
        value={tc.reference_step_id || ""}
        onChange={(e) => updateTriggerCondition(step.id, { reference_step_id: e.target.value })}
        className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4"
      >
        {priorSteps.map((s) => (
          <option key={s.id} value={s.id}>{s.name || s.channel}</option>
        ))}
      </select>

      <label className="block text-[12px] font-medium text-text-secondary mb-1">Set follow-up time</label>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          data-testid="tc-mode-delay"
          onClick={() => setMode("delay")}
          className={`flex-1 px-3 py-1.5 rounded-md text-[12px] font-medium border ${
            tc.mode === "delay" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"
          }`}
        >
          Delay after previous step
        </button>
        <button
          type="button"
          data-testid="tc-mode-date"
          onClick={() => setMode("date")}
          className={`flex-1 px-3 py-1.5 rounded-md text-[12px] font-medium border ${
            tc.mode === "date" ? "border-primary bg-primary-tint text-primary" : "border-border text-text-secondary"
          }`}
        >
          On a specific date & time
        </button>
      </div>

      {tc.mode === "delay" ? (
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min={1}
            data-testid="tc-delay-value"
            value={tc.delay?.value ?? 1}
            onChange={(e) =>
              updateTriggerCondition(step.id, { delay: { ...tc.delay, value: Number(e.target.value) } })
            }
            className="w-20 border border-border rounded-md px-2 py-1.5 text-sm"
          />
          <select
            data-testid="tc-delay-unit"
            value={tc.delay?.unit ?? "hours"}
            onChange={(e) => updateTriggerCondition(step.id, { delay: { ...tc.delay, unit: e.target.value } })}
            className="border border-border rounded-md px-2 py-1.5 text-sm"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      ) : (
        <input
          type="datetime-local"
          data-testid="tc-fire-at"
          value={tc.fire_at || ""}
          onChange={(e) => updateTriggerCondition(step.id, { fire_at: e.target.value })}
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4"
        />
      )}

      <label className="block text-[12px] font-medium text-text-secondary mb-1">Send to users</label>
      <div className="space-y-2">
        {BEHAVIOR_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
            <input
              type="checkbox"
              data-testid={`tc-behavior-${opt.value}`}
              checked={tc.behavior === opt.value}
              onChange={() => updateTriggerCondition(step.id, { behavior: opt.value })}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
