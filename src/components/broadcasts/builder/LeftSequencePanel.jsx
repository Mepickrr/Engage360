import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useBroadcastBuilderStore } from "@/store/broadcastBuilderStore";
import StepCard from "./StepCard";
import ChannelPickerModal from "./ChannelPickerModal";

export default function LeftSequencePanel() {
  const sequence = useBroadcastBuilderStore((s) => s.sequence);
  const selectedStepId = useBroadcastBuilderStore((s) => s.selectedStepId);
  const selectStep = useBroadcastBuilderStore((s) => s.selectStep);
  const addFollowupStep = useBroadcastBuilderStore((s) => s.addFollowupStep);
  const [followupPickerOpen, setFollowupPickerOpen] = useState(false);

  return (
    <div className="w-[280px] shrink-0 border-r border-border bg-white p-3 overflow-y-auto" data-testid="left-sequence-panel">
      {sequence.map((step) => (
        <StepCard key={step.id} step={step} selected={step.id === selectedStepId} onSelect={selectStep} />
      ))}
      <button
        type="button"
        data-testid="add-followup-btn"
        onClick={() => setFollowupPickerOpen(true)}
        className="w-full border-2 border-dashed border-border rounded-lg py-3 text-[12px] font-medium text-text-muted hover:border-primary/50 hover:text-primary flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add a follow-up
      </button>
      <ChannelPickerModal
        open={followupPickerOpen}
        title="Add a follow-up channel"
        onSelect={(channel) => {
          addFollowupStep(channel);
          setFollowupPickerOpen(false);
        }}
        onClose={() => setFollowupPickerOpen(false)}
      />
    </div>
  );
}
