import catalogueData from "../eventCatalogue.json";

function getSection(header, section) {
  return catalogueData.catalogue[header][section];
}

describe("eventCatalogue — Date and time section", () => {
  it.each(["Date and time", "ALL"])("has exactly 6 date-relative cards with no attribute selection under %s", (header) => {
    const cards = getSection(header, "User date attributes");
    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.name)).toEqual([
      "Birthday",
      "Anniversary",
      "Custom date attribute",
      "Account Created",
      "First Order Date",
      "Subscription Start Date",
    ]);
    cards.forEach((c) => {
      expect(c.date_relative).toBe(true);
      expect(c.attribute_allowed).toBe(false);
      expect(c.audience_qualification_allow).toBe(true);
      expect(typeof c.attribute_key).toBe("string");
      expect(c.attribute_key.length).toBeGreaterThan(0);
    });
  });

  it.each(["Date and time", "ALL"])("maps each date-relative card to a unique attribute_key under %s", (header) => {
    const cards = getSection(header, "User date attributes");
    expect(cards.map((c) => c.attribute_key)).toEqual([
      "date_of_birth",
      "anniversary_date",
      "custom_date_attribute",
      "account_created",
      "first_order_date",
      "subscription_start_date",
    ]);
  });

  it.each(["Date and time", "ALL"])("flags Back in Stock and Price Drop as system_event_relative with no attribute selection under %s", (header) => {
    const cards = getSection(header, "Product");
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(["Back in Stock", "Price Drop"]);
    cards.forEach((c) => {
      expect(c.system_event_relative).toBe(true);
      expect(c.attribute_allowed).toBe(false);
      expect(c.audience_qualification_allow).toBe(true);
    });
  });
});
