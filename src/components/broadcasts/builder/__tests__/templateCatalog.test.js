import { WHATSAPP_CATALOG_TEMPLATES, mapCatalogTemplateToDraft } from "../templateCatalog";

describe("templateCatalog", () => {
  it("WHATSAPP_CATALOG_TEMPLATES only contains whatsapp channel entries", () => {
    expect(WHATSAPP_CATALOG_TEMPLATES.length).toBeGreaterThan(0);
    WHATSAPP_CATALOG_TEMPLATES.forEach((t) => expect(t.channel).toBe("whatsapp"));
  });

  it("mapCatalogTemplateToDraft flattens preview.* into top-level fields and normalizes casing", () => {
    const entry = WHATSAPP_CATALOG_TEMPLATES[0];
    const draft = mapCatalogTemplateToDraft(entry);
    expect(draft.name).toBe(entry.name);
    expect(draft.header).toEqual(entry.preview.header);
    expect(draft.body).toBe(entry.preview.body);
    expect(draft.footer).toBe(entry.preview.footer);
    draft.buttons.forEach((b) => expect(b.type).toEqual(b.type.toUpperCase()));
  });

  it("mapCatalogTemplateToDraft normalizes type and status to the capitalized labels TemplatePreview expects", () => {
    const entry = { ...WHATSAPP_CATALOG_TEMPLATES[0], type: "marketing", status: "active" };
    const draft = mapCatalogTemplateToDraft(entry);
    expect(draft.type).toBe("Marketing");
    expect(draft.status).toBe("Active");
  });
});
