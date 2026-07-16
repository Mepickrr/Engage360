import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TriggerConditionEditor from "./TriggerConditionEditor";
import WhatsAppBroadcastDetails from "./WhatsAppBroadcastDetails";
import WhatsAppFollowupDetails from "./WhatsAppFollowupDetails";

export default function CenterConfigPanel({ step }) {
  const meta = useCampaignBuilderStore((s) => s.meta);
  const patchMeta = useCampaignBuilderStore((s) => s.patchMeta);

  if (!step) {
    return (
      <div className="flex-1 border-r border-border bg-white p-4" data-testid="center-config-panel">
        <p className="text-sm text-text-muted">Select a step to configure it.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 border-r border-border bg-white p-4 overflow-y-auto" data-testid="center-config-panel">
      {step.is_primary ? (
        <div className="space-y-6">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Broadcast Name</label>
            <input
              type="text"
              value={meta.name}
              onChange={(e) => patchMeta({ name: e.target.value })}
              data-testid="broadcast-name-field"
              className="w-full border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
          {step.channel === "whatsapp" && <WhatsAppBroadcastDetails step={step} />}
        </div>
      ) : (
        <>
          <TriggerConditionEditor step={step} />
          {step.channel === "whatsapp" && <WhatsAppFollowupDetails step={step} />}
        </>
      )}
    </div>
  );
}
