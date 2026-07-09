import { useCampaignBuilderStore } from "../campaignBuilderStore";

const getState = () => useCampaignBuilderStore.getState();

beforeEach(() => {
  getState().reset();
});

describe("campaignBuilderStore", () => {
  it("starts with an empty sequence and default meta", () => {
    expect(getState().sequence).toEqual([]);
    expect(getState().meta.name).toMatch(/^Untitled Broadcast/);
    expect(getState().campaignId).toBeNull();
  });

  it("addPrimaryStep creates a single locked primary step", () => {
    getState().addPrimaryStep("whatsapp");
    const { sequence, selectedStepId } = getState();
    expect(sequence).toHaveLength(1);
    expect(sequence[0].is_primary).toBe(true);
    expect(sequence[0].channel).toBe("whatsapp");
    expect(sequence[0].order_index).toBe(0);
    expect(sequence[0].trigger_condition).toBeNull();
    expect(sequence[0].channel_config.fallback).toEqual({ enabled: false, template: null, categoryChangeEnabled: false });
    expect(selectedStepId).toBe(sequence[0].id);
  });

  it("addPrimaryStep is a no-op if a primary step already exists", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addPrimaryStep("email");
    expect(getState().sequence).toHaveLength(1);
    expect(getState().sequence[0].channel).toBe("whatsapp");
  });

  it("addFollowupStep appends a non-primary step referencing the previous one", () => {
    getState().addPrimaryStep("whatsapp");
    const primaryId = getState().sequence[0].id;
    getState().addFollowupStep("sms");
    const followup = getState().sequence[1];
    expect(followup.is_primary).toBe(false);
    expect(followup.order_index).toBe(1);
    expect(followup.trigger_condition.reference_step_id).toBe(primaryId);
    expect(followup.trigger_condition.mode).toBe("delay");
    expect(followup.audience.mode).toBe("computed");
  });

  it("updateStepChannelConfig merges into the step's channel_config", () => {
    getState().addPrimaryStep("whatsapp");
    const id = getState().sequence[0].id;
    getState().updateStepChannelConfig(id, { template: { name: "order_confirm" } });
    expect(getState().sequence[0].channel_config.template).toEqual({ name: "order_confirm" });
  });

  it("updateTriggerCondition merges into the step's trigger_condition", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const id = getState().sequence[1].id;
    getState().updateTriggerCondition(id, { mode: "date", fire_at: "2026-08-01T09:00" });
    expect(getState().sequence[1].trigger_condition.mode).toBe("date");
    expect(getState().sequence[1].trigger_condition.fire_at).toBe("2026-08-01T09:00");
  });

  it("removeStep removes a follow-up but refuses to remove the primary step", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const primaryId = getState().sequence[0].id;
    const followupId = getState().sequence[1].id;
    getState().removeStep(primaryId);
    expect(getState().sequence).toHaveLength(2);
    getState().removeStep(followupId);
    expect(getState().sequence).toHaveLength(1);
    expect(getState().sequence[0].id).toBe(primaryId);
  });

  it("hydrate loads an existing campaign and reset clears it", () => {
    getState().hydrate({ id: "c1", meta: { name: "Diwali Blast" }, sequence: [{ id: "s1", is_primary: true }] });
    expect(getState().campaignId).toBe("c1");
    expect(getState().meta.name).toBe("Diwali Blast");
    getState().reset();
    expect(getState().campaignId).toBeNull();
    expect(getState().sequence).toEqual([]);
  });

  it("addPrimaryStep gives whatsapp steps campaign-specific channel_config defaults", () => {
    getState().addPrimaryStep("whatsapp");
    const cc = getState().sequence[0].channel_config;
    expect(cc.suppressionList).toBe("wa_default");
    expect(cc.utm).toEqual({ enabled: false, source: "Engage 360", medium: "WhatsApp", campaign: "Untitled Broadcast 1" });
    expect(cc.aiSmartSend).toBe(false);
    expect(cc.campaignSmartRetry).toEqual({ enabled: false, windowHours: 72 });
    expect(cc.internationalAudience).toBe(false);
    expect(cc.validityWindow).toEqual({ custom: false, minutes: 10 });
    expect(cc.fallback).toEqual({ enabled: false, template: null, categoryChangeEnabled: false });
  });

  it("addFollowupStep defaults behavior to delivered_not_viewed and has no condition_type", () => {
    getState().addPrimaryStep("whatsapp");
    getState().addFollowupStep("sms");
    const tc = getState().sequence[1].trigger_condition;
    expect(tc.behavior).toBe("delivered_not_viewed");
    expect(tc.condition_type).toBeUndefined();
  });

  it("updateStepAudience merges into the step's audience field", () => {
    getState().addPrimaryStep("whatsapp");
    const id = getState().sequence[0].id;
    getState().updateStepAudience(id, { sourceType: "segment", broadcastSourceConfig: { selectedSegments: [{ id: "s1", userCount: 500 }] } });
    expect(getState().sequence[0].audience.sourceType).toBe("segment");
    expect(getState().sequence[0].audience.broadcastSourceConfig.selectedSegments).toHaveLength(1);
  });

  it("createdAt/status/schedule default and can be set", () => {
    expect(getState().createdAt).toBeNull();
    expect(getState().status).toBe("draft");
    expect(getState().schedule).toEqual({ mode: null, datetime: null });
    getState().setCreatedAt("2026-07-09T00:00:00.000Z");
    getState().setStatus("scheduled");
    getState().setSchedule({ mode: "scheduled", datetime: "2026-07-10T09:00" });
    expect(getState().createdAt).toBe("2026-07-09T00:00:00.000Z");
    expect(getState().status).toBe("scheduled");
    expect(getState().schedule).toEqual({ mode: "scheduled", datetime: "2026-07-10T09:00" });
  });

  it("hydrate restores createdAt/status/schedule, reset clears them", () => {
    getState().hydrate({
      id: "c1", meta: { name: "X" }, sequence: [],
      createdAt: "2026-07-01T00:00:00.000Z", status: "scheduled", schedule: { mode: "now", datetime: null },
    });
    expect(getState().createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(getState().status).toBe("scheduled");
    getState().reset();
    expect(getState().createdAt).toBeNull();
    expect(getState().status).toBe("draft");
    expect(getState().schedule).toEqual({ mode: null, datetime: null });
  });
});
