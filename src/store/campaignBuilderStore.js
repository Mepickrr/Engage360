import { create } from "zustand";
import { defaultDataForPaletteItem } from "@/lib/flowMeta";

let stepCounter = 0;
function nextStepId() {
  stepCounter += 1;
  return `step-${stepCounter}`;
}

function defaultTriggerCondition(referenceStepId) {
  return {
    reference_step_id: referenceStepId,
    condition_type: "time_elapsed",
    behavior: null,
    mode: "delay",
    delay: { value: 1, unit: "hours" },
    fire_at: null,
  };
}

const initialState = {
  campaignId: null,
  meta: { name: "Untitled Broadcast 1" },
  sequence: [],
  selectedStepId: null,
  autosaveStatus: "idle",
};

export const useCampaignBuilderStore = create((set, get) => ({
  ...initialState,

  setCampaignId: (id) => set({ campaignId: id }),

  hydrate: (campaign) =>
    set({
      campaignId: campaign.id,
      meta: campaign.meta ?? { name: "Untitled Broadcast" },
      sequence: campaign.sequence ?? [],
      selectedStepId: campaign.sequence?.[0]?.id ?? null,
    }),

  reset: () => set({ ...initialState, meta: { ...initialState.meta } }),

  patchMeta: (patch) => set((s) => ({ meta: { ...s.meta, ...patch } })),

  addPrimaryStep: (channel) =>
    set((s) => {
      if (s.sequence.some((step) => step.is_primary)) return s;
      const step = {
        id: nextStepId(),
        order_index: 0,
        channel,
        is_primary: true,
        trigger_condition: null,
        audience: { mode: "manual", segments_or_lists: [], suppression_lists: [] },
        channel_config: defaultDataForPaletteItem({ kind: channel }),
      };
      return { sequence: [step], selectedStepId: step.id };
    }),

  addFollowupStep: (channel) =>
    set((s) => {
      const previous = s.sequence[s.sequence.length - 1];
      const step = {
        id: nextStepId(),
        order_index: s.sequence.length,
        channel,
        is_primary: false,
        trigger_condition: defaultTriggerCondition(previous?.id ?? null),
        audience: { mode: "computed", segments_or_lists: [], suppression_lists: [] },
        channel_config: defaultDataForPaletteItem({ kind: channel }),
      };
      return { sequence: [...s.sequence, step], selectedStepId: step.id };
    }),

  updateStepChannelConfig: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, channel_config: { ...step.channel_config, ...patch } }
          : step,
      ),
    })),

  updateTriggerCondition: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, trigger_condition: { ...step.trigger_condition, ...patch } }
          : step,
      ),
    })),

  removeStep: (stepId) =>
    set((s) => ({
      sequence: s.sequence.filter((step) => step.is_primary || step.id !== stepId),
      selectedStepId: s.selectedStepId === stepId ? null : s.selectedStepId,
    })),

  selectStep: (stepId) => set({ selectedStepId: stepId }),

  setAutosaveStatus: (status) => set({ autosaveStatus: status }),
}));
