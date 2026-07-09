import React, { useState } from "react";
import { useCampaignBuilderStore } from "@/store/campaignBuilderStore";
import TemplateGalleryPanel from "./TemplateGalleryPanel";
import TemplatePreview from "@/components/flows/builder/nodes/WhatsAppNode/TemplatePreview";
import UnifiedTemplateModal from "@/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal";
import { mapCatalogTemplateToDraft } from "./templateCatalog";

export default function CampaignContentPanel({ step }) {
  const updateStepChannelConfig = useCampaignBuilderStore((s) => s.updateStepChannelConfig);
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  const template = step.channel_config?.template;

  const handleGallerySelect = (catalogEntry) => {
    updateStepChannelConfig(step.id, { template: mapCatalogTemplateToDraft(catalogEntry) });
  };

  const handleGalleryEdit = (catalogEntry) => {
    setEditingTemplate(mapCatalogTemplateToDraft(catalogEntry));
  };

  const handleModalSave = (draft) => {
    updateStepChannelConfig(step.id, { template: draft });
    setEditingTemplate(null);
  };

  return (
    <div className="w-[320px] shrink-0 bg-white p-4 overflow-y-auto" data-testid="campaign-content-panel">
      {template ? (
        <div data-testid="template-preview-mode">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary truncate">{template.name}</h3>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                data-testid="change-template-btn"
                onClick={() => updateStepChannelConfig(step.id, { template: null })}
                className="text-[11px] text-text-secondary font-medium"
              >
                Change
              </button>
              <button
                type="button"
                data-testid="edit-template-btn"
                onClick={() => setEditingTemplate(template)}
                className="text-[11px] text-primary font-medium"
              >
                Edit
              </button>
            </div>
          </div>
          <TemplatePreview template={template} />
        </div>
      ) : (
        <TemplateGalleryPanel onSelect={handleGallerySelect} onEdit={handleGalleryEdit} />
      )}

      {editingTemplate && (
        <UnifiedTemplateModal
          open
          styleId="standard"
          styleLabel="Template"
          initialTemplate={editingTemplate}
          onSave={handleModalSave}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
