import {
  emptyWebhookConfig,
  generateWebhookUrl,
  flattenPayload,
  simulateTestEvent,
  MOCK_EXISTING_VARIABLES,
} from "../webhookHelpers";

describe("generateWebhookUrl", () => {
  it("builds a URL containing the seed and flow slug", () => {
    const url = generateWebhookUrl("abc123", "my-flow");
    expect(url).toBe("https://bikapi.bikayi.app/chatbot/webhook/abc123?flow=my-flow");
  });

  it("defaults the flow slug when omitted", () => {
    const url = generateWebhookUrl("abc123");
    expect(url).toContain("flow=flow");
  });
});

describe("emptyWebhookConfig", () => {
  it("returns the zero-state shape with a generated URL", () => {
    const cfg = emptyWebhookConfig();
    expect(cfg.webhookUrl).toMatch(/^https:\/\/bikapi\.bikayi\.app\/chatbot\/webhook\//);
    expect(cfg.authProtected).toBe(false);
    expect(cfg.authConfig).toBeNull();
    expect(cfg.samplePayload).toBe("");
    expect(cfg.uniqueId).toBeNull();
    expect(cfg.secondaryId).toBeNull();
    expect(cfg.variableMappings).toEqual([]);
  });

  it("generates a different URL seed on each call", () => {
    const a = emptyWebhookConfig();
    const b = emptyWebhookConfig();
    expect(a.webhookUrl).not.toBe(b.webhookUrl);
  });
});

describe("flattenPayload", () => {
  it("returns an empty list with no error for an empty string", () => {
    expect(flattenPayload("")).toEqual({ variables: [], error: null });
  });

  it("flattens a flat object into top-level paths", () => {
    const { variables, error } = flattenPayload('{"bikExampleId": 143671, "bikExampleEmail": "abc@bik.ai"}');
    expect(error).toBeNull();
    expect(variables).toEqual([
      { path: "bikExampleId", example: "143671" },
      { path: "bikExampleEmail", example: "abc@bik.ai" },
    ]);
  });

  it("flattens nested objects into dot-paths", () => {
    const { variables, error } = flattenPayload('{"order": {"customer": {"email": "abc@bik.ai"}}}');
    expect(error).toBeNull();
    expect(variables).toEqual([{ path: "order.customer.email", example: "abc@bik.ai" }]);
  });

  it("flattens only the first element of an array, under the array's own path", () => {
    const { variables, error } = flattenPayload('{"items": [{"sku": "A1"}, {"sku": "A2"}]}');
    expect(error).toBeNull();
    expect(variables).toEqual([{ path: "items.sku", example: "A1" }]);
  });

  it("returns an error for invalid JSON without throwing", () => {
    const { variables, error } = flattenPayload("{not json");
    expect(variables).toEqual([]);
    expect(error).not.toBeNull();
  });

  it("returns an error when the top-level payload is not an object", () => {
    const { variables, error } = flattenPayload("5");
    expect(variables).toEqual([]);
    expect(error).not.toBeNull();
  });
});

describe("simulateTestEvent", () => {
  const payload = '{"vas_id": "+919999999999", "order_id": 555}';

  it("succeeds and resolves the unique id value when it matches a payload path", () => {
    const result = simulateTestEvent(payload, { type: "Phone Number", payloadVariable: "vas_id" });
    expect(result.success).toBe(true);
    expect(result.variableCount).toBe(2);
    expect(result.resolvedIdValue).toBe("+919999999999");
    expect(result.error).toBeNull();
  });

  it("succeeds with no resolved id when uniqueId is not yet set", () => {
    const result = simulateTestEvent(payload, null);
    expect(result.success).toBe(true);
    expect(result.resolvedIdValue).toBeNull();
  });

  it("fails on invalid JSON", () => {
    const result = simulateTestEvent("{broken", null);
    expect(result.success).toBe(false);
    expect(result.variableCount).toBe(0);
    expect(result.error).not.toBeNull();
  });
});

describe("MOCK_EXISTING_VARIABLES", () => {
  it("has the four expected categories", () => {
    const categories = MOCK_EXISTING_VARIABLES.map((c) => c.category);
    expect(categories).toEqual([
      "Customer variables",
      "Flow variables",
      "Store variables",
      "Global variables",
    ]);
  });

  it("every item has a unique key across the whole catalogue", () => {
    const keys = MOCK_EXISTING_VARIABLES.flatMap((c) => c.groups.flatMap((g) => g.items.map((i) => i.key)));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
