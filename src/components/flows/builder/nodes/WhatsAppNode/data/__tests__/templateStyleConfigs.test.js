import { TEMPLATE_STYLE_CONFIGS, COLLECT_INPUT_PRESETS } from "../templateStyleConfigs";

const RESOLVED_STYLE_IDS = [
  "standard", "session", "authentication", "carousel", "location", "audio",
  "order_payment", "order_confirmation", "complete_checkout", "payment_link",
  "address", "collect_input", "call_permission",
  "catalog_single", "catalog_multiple", "catalog_view", "catalog_list_bestsellers", "catalog",
  "list",
];

describe("TEMPLATE_STYLE_CONFIGS", () => {
  it("has an entry for every resolved style id", () => {
    RESOLVED_STYLE_IDS.forEach((id) => {
      expect(TEMPLATE_STYLE_CONFIGS[id]).toBeDefined();
    });
  });

  it("every entry has a previewKind, a defaultDraft, and at least 2 mock templates", () => {
    Object.entries(TEMPLATE_STYLE_CONFIGS).forEach(([id, config]) => {
      expect(typeof config.previewKind).toBe("string");
      expect(typeof config.defaultDraft).toBe("object");
      expect(config.mockTemplates.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("standard-family entries expose a fields array; carousel/list/collect_input use their bespoke editor (fields: null)", () => {
    expect(Array.isArray(TEMPLATE_STYLE_CONFIGS.standard.fields)).toBe(true);
    expect(TEMPLATE_STYLE_CONFIGS.carousel.fields).toBeNull();
    expect(TEMPLATE_STYLE_CONFIGS.list.fields).toBeNull();
    expect(TEMPLATE_STYLE_CONFIGS.collect_input.fields).toBeNull();
  });

  it("standard reuses the 6 existing MOCK_TEMPLATES", () => {
    expect(TEMPLATE_STYLE_CONFIGS.standard.mockTemplates.length).toBe(6);
  });

  it("carousel mock templates are tagged isCarousel and have a cards array", () => {
    TEMPLATE_STYLE_CONFIGS.carousel.mockTemplates.forEach((t) => {
      expect(t.isCarousel).toBe(true);
      expect(Array.isArray(t.cards)).toBe(true);
    });
  });

  it("list mock templates are tagged isListMessage and have a sections array", () => {
    TEMPLATE_STYLE_CONFIGS.list.mockTemplates.forEach((t) => {
      expect(t.isListMessage).toBe(true);
      expect(Array.isArray(t.sections)).toBe(true);
    });
  });

  it("collect_input mock templates are tagged isCollectInput and have a questionMessage", () => {
    TEMPLATE_STYLE_CONFIGS.collect_input.mockTemplates.forEach((t) => {
      expect(t.isCollectInput).toBe(true);
      expect(typeof t.questionMessage).toBe("string");
    });
  });

  it("flow_form's default draft pre-seeds a Complete flow button, not an empty buttons list", () => {
    expect(TEMPLATE_STYLE_CONFIGS.flow_form.defaultDraft.buttons).toEqual([
      { type: "FLOW", label: "View Flow", flowFormId: null, flowFormName: null },
    ]);
  });

  it("flow_form's buttons field allows the Complete flow button type", () => {
    const buttonsField = TEMPLATE_STYLE_CONFIGS.flow_form.fields.find((f) => f.key === "buttons");
    expect(buttonsField.allowFlow).toBe(true);
  });

  it("exposes a question preset for every ask_* input type shortcut", () => {
    ["text", "phone", "email", "number", "location", "image", "video", "document"].forEach((type) => {
      expect(COLLECT_INPUT_PRESETS[type]).toBeDefined();
      expect(typeof COLLECT_INPUT_PRESETS[type].questionMessage).toBe("string");
    });
  });
});
