import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — webhook", () => {
  const baseConfig = {
    kind: "webhook",
    webhookUrl: "https://bikapi.bikayi.app/chatbot/webhook/abc123?flow=test",
    authProtected: false,
    authConfig: null,
    samplePayload: '{"vas_id": "+919999999999"}',
    payloadVariables: [{ path: "vas_id", example: "+919999999999" }],
    uniqueId: { type: "Phone Number", payloadVariable: "vas_id" },
    secondaryId: null,
    variableMappings: [
      { payloadVariable: "vas_id", existingVariable: { category: "Customer variables", group: "Basic", key: "customer.phone", label: "Phone" } },
    ],
    audience: { include_all: true },
  };

  it("marks the summary as a webhook trigger with URL and unique id fields", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isWebhook).toBe(true);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.webhookUrl).toBe(baseConfig.webhookUrl);
    expect(summary.uniqueIdType).toBe("Phone Number");
    expect(summary.uniqueIdVar).toBe("vas_id");
  });

  it("counts only mapped variable rows that have an existingVariable set", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.mappedVarCount).toBe(1);

    const unmapped = { ...baseConfig, variableMappings: [{ payloadVariable: "vas_id", existingVariable: null }] };
    expect(summariseTriggerConfig(unmapped).mappedVarCount).toBe(0);
  });

  it("has no exit condition and derives audience fields from the shared audience summariser", () => {
    const withAudience = {
      ...baseConfig,
      audience: {
        include_all: false,
        audience_kind: "all",
        include: { blocks: [{ type: "property", conditions: [{ property: "city", operator: "is", value: "Mumbai" }] }] },
      },
    };
    const summary = summariseTriggerConfig(withAudience);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
    expect(summary.whoLine).toContain("city");
  });
});
