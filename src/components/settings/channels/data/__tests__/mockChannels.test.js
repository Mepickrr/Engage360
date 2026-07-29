import {
  SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
  EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL, CONNECT_CHANNEL_GROUPS,
} from "../mockChannels";

describe("mockChannels", () => {
  it("has no 'Avimee' anywhere in the mock content", () => {
    const blob = JSON.stringify({
      SHOPIFY_STORE, WHATSAPP_NUMBERS, FACEBOOK_PAGES, INSTAGRAM_ACCOUNTS,
      EMAIL_ADDRESSES, WEB_PUSH_CHANNEL, EMAIL_MARKETING_CHANNEL,
    });
    expect(blob.toLowerCase()).not.toContain("avimee");
  });

  it("has exactly one default-for-campaigns WhatsApp number", () => {
    const defaults = WHATSAPP_NUMBERS.filter((n) => n.isDefaultForCampaigns);
    expect(defaults.length).toBe(1);
  });

  it("has 4 WhatsApp numbers with provider and quality fields", () => {
    expect(WHATSAPP_NUMBERS.length).toBe(4);
    WHATSAPP_NUMBERS.forEach((n) => {
      expect(typeof n.provider).toBe("string");
      expect(["High", "Medium", "Low"]).toContain(n.quality);
    });
  });

  it("does not include shopify as a connectable type", () => {
    const allTypeIds = CONNECT_CHANNEL_GROUPS.flatMap((g) => g.types.map((t) => t.id));
    expect(allTypeIds).not.toContain("shopify");
    expect(allTypeIds).not.toContain("sms");
  });

  it("every connect type has a formField with key/label/placeholder", () => {
    CONNECT_CHANNEL_GROUPS.forEach((g) => {
      g.types.forEach((t) => {
        expect(t.formField.key).toBeTruthy();
        expect(t.formField.label).toBeTruthy();
        expect(t.formField.placeholder).toBeTruthy();
      });
    });
  });
});
