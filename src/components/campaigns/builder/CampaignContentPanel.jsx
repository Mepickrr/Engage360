import React from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import { TemplateTab } from "@/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel";

export default function CampaignContentPanel({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);

  if (!step) {
    return <div className="w-[320px] shrink-0 bg-white p-4" data-testid="campaign-content-panel" />;
  }

  if (step.channel !== "whatsapp") {
    return (
      <div className="w-[320px] shrink-0 bg-white p-4" data-testid="campaign-content-panel">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>
        <div className="text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          NO TEMPLATE SELECTED
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] shrink-0 bg-white p-4 overflow-y-auto" data-testid="campaign-content-panel">
      <h3 className="text-[13px] font-semibold text-text-primary mb-3">Broadcast Content</h3>
      <TemplateTab
        data={step.channel_config}
        patch={(p) => updateStepChannelConfig(step.id, p)}
      />
    </div>
  );
}
