import React from "react";
import { Loader2, X } from "lucide-react";
import FlowBriefPreview from "./FlowBriefPreview";
import SegmentPreview from "./SegmentPreview";
import CreativePreview from "./CreativePreview";

export default function ArtefactPanel({
  message,
  isGenerating,
  onCollapse,
  onApproveFlow,
  onSaveSegment,
  onUseCreative,
}) {
  const artefact = message?.artefact;

  if (!message) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No artefact selected.
      </div>
    );
  }

  const header = (
    <div className="absolute top-3 right-3 z-10">
      <button
        type="button"
        onClick={onCollapse}
        data-testid="artefact-collapse"
        className="p-1.5 rounded-md hover:bg-slate-100 text-text-muted"
        aria-label="Collapse artefact"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (isGenerating || !artefact) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        {header}
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <div className="text-sm font-medium text-text-primary">
          {isGenerating
            ? "Building your artefact..."
            : "Preparing artefact preview..."}
        </div>
        <div className="text-[12px] text-text-secondary mt-1 max-w-xs">
          The AI is composing a structured payload — this takes a few seconds.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {header}
      {artefact.type === "flow_brief" && (
        <FlowBriefPreview
          payload={artefact.payload}
          onApprove={onApproveFlow}
          onReject={onCollapse}
          onRequestChanges={onCollapse}
        />
      )}
      {artefact.type === "segment_preview" && (
        <SegmentPreview
          payload={artefact.payload}
          onSave={onSaveSegment}
          onModify={onCollapse}
        />
      )}
      {artefact.type === "creative_preview" && (
        <CreativePreview
          payload={artefact.payload}
          onUse={onUseCreative}
          onRegenerate={() => {}}
        />
      )}
    </div>
  );
}
