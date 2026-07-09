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
    behavior: "delivered_not_viewed",
    mode: "delay",
    delay: { value: 1, unit: "hours" },
    fire_at: null,
  };
}

function whatsappCampaignConfigDefaults(broadcastName) {
  return {
    suppressionList: "wa_default",
    utm: { enabled: false, source: "Engage 360", medium: "WhatsApp", campaign: broadcastName },
    aiSmartSend: false,
    campaignSmartRetry: { enabled: false, windowHours: 72 },
    internationalAudience: false,
    validityWindow: { custom: false, minutes: 10 },
  };
}

function channelConfigFor(channel, broadcastName) {
  const base = defaultDataForPaletteItem({ kind: channel });
  if (channel !== "whatsapp") return base;
  return {
    ...base,
    ...whatsappCampaignConfigDefaults(broadcastName),
    fallback: { ...base.fallback, categoryChangeEnabled: false },
  };
}

const initialState = {
  campaignId: null,
  meta: { name: "Untitled Broadcast 1" },
  sequence: [],
  selectedStepId: null,
  autosaveStatus: "idle",
  createdAt: null,
  status: "draft",
  schedule: { mode: null, datetime: null },
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
      createdAt: campaign.createdAt ?? null,
      status: campaign.status ?? "draft",
      schedule: campaign.schedule ?? { mode: null, datetime: null },
    }),

  reset: () => set({ ...initialState, meta: { ...initialState.meta }, schedule: { ...initialState.schedule } }),

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
        channel_config: channelConfigFor(channel, s.meta.name),
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
        channel_config: channelConfigFor(channel, s.meta.name),
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

  updateStepAudience: (stepId, patch) =>
    set((s) => ({
      sequence: s.sequence.map((step) =>
        step.id === stepId
          ? { ...step, audience: { ...step.audience, ...patch } }
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
  setCreatedAt: (createdAt) => set({ createdAt }),
  setStatus: (status) => set({ status }),
  setSchedule: (schedule) => set({ schedule }),
}));
