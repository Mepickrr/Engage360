import {
  SMS_PROVIDERS, SMS_SENDER_IDS, SMS_TEMPLATE_STYLES, SMS_TEMPLATE_STYLE_CONFIGS,
  MOCK_SMS_TEMPLATES, defaultSMSNodeData,
} from "../mockData";

describe("SMS data model", () => {
  it("has providers with id and name", () => {
    expect(SMS_PROVIDERS.length).toBeGreaterThan(0);
    SMS_PROVIDERS.forEach((p) => {
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
    });
  });

  it("scopes every sender ID to a real provider", () => {
    const providerIds = SMS_PROVIDERS.map((p) => p.id);
    SMS_SENDER_IDS.forEach((s) => expect(providerIds).toContain(s.providerId));
  });

  it("has exactly two template styles: transactional and promotional", () => {
    expect(SMS_TEMPLATE_STYLES.map((s) => s.id).sort()).toEqual(["promotional", "transactional"]);
    SMS_TEMPLATE_STYLES.forEach((s) => {
      expect(typeof s.label).toBe("string");
      expect(typeof s.desc).toBe("string");
      expect(s.Icon).toBeDefined();
    });
  });

  it("gives every template a category of transactional or promotional, no gateway field", () => {
    expect(MOCK_SMS_TEMPLATES.length).toBeGreaterThan(0);
    MOCK_SMS_TEMPLATES.forEach((t) => {
      expect(["transactional", "promotional"]).toContain(t.category);
      expect(t.gateway).toBeUndefined();
    });
  });

  it("builds a style-config registry keyed by style id, pre-filtered by category", () => {
    expect(Object.keys(SMS_TEMPLATE_STYLE_CONFIGS).sort()).toEqual(["promotional", "transactional"]);
    Object.entries(SMS_TEMPLATE_STYLE_CONFIGS).forEach(([styleId, config]) => {
      expect(config.defaultDraft).toBeDefined();
      config.mockTemplates.forEach((t) => expect(t.category).toBe(styleId));
    });
  });

  it("defaults new SMS nodes to no provider/sender/style chosen", () => {
    expect(defaultSMSNodeData.providerId).toBeNull();
    expect(defaultSMSNodeData.senderIdId).toBeNull();
    expect(defaultSMSNodeData.templateStyle).toBeNull();
  });
});
