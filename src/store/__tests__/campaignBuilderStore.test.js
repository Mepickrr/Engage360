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
    expect(sequence[0].channel_config.fallback).toEqual({ enabled: false, template: null });
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
});
