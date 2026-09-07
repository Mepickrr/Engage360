import { getFastrrIdentificationAnalytics, FASTRR_CHANNELS, FASTRR_DATE_PRESETS } from "../mockFastrrIdentification";

function everyCombo(fn) {
  for (const datePreset of FASTRR_DATE_PRESETS) {
    for (const channel of FASTRR_CHANNELS) {
      fn(getFastrrIdentificationAnalytics({ datePreset, channel, compare: true }), datePreset, channel);
    }
  }
}

describe("getFastrrIdentificationAnalytics — hero + funnel", () => {
  test("is deterministic for the same filters", () => {
    const a = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const b = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(a.hero.totalSessions.value).toBe(b.hero.totalSessions.value);
    expect(a.funnel.stages).toEqual(b.funnel.stages);
  });

  test("hero identified sessions always matches the funnel's identified stage", () => {
    everyCombo((data) => {
      expect(data.funnel.stages[1].count).toBe(data.hero.identifiedSessions.value);
      expect(data.funnel.stages[0].count).toBe(data.hero.totalSessions.value);
    });
  });

  test("identification rate is consistent with total/identified sessions", () => {
    everyCombo((data) => {
      const expected = (data.hero.identifiedSessions.value / data.hero.totalSessions.value) * 100;
      expect(data.hero.identificationRate.value).toBeCloseTo(expected, 5);
    });
  });

  test("benchmark yourStore always equals the identification rate", () => {
    everyCombo((data) => {
      expect(data.hero.benchmark.yourStore).toBeCloseTo(data.hero.identificationRate.value, 5);
    });
  });

  test("funnel stage counts never increase down the funnel", () => {
    everyCombo((data) => {
      const counts = data.funnel.stages.map((s) => s.count);
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
      }
    });
  });

  test("funnel has exactly 5 stages in the documented order", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.funnel.stages.map((s) => s.key)).toEqual([
      "totalSessions", "identifiedSessions", "checkoutInitiated", "checkoutSso", "orderPlaced",
    ]);
  });

  test("dropoffByPage covers exactly Homepage, PDP, Cart, Checkout", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.funnel.dropoffByPage.map((d) => d.page)).toEqual(["Homepage", "PDP", "Cart", "Checkout"]);
  });

  test("hero and funnel are channel-invariant (identification-only sections)", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withWa = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "WhatsApp", compare: true });
    expect(withAll.hero).toEqual(withWa.hero);
    expect(withAll.funnel).toEqual(withWa.funnel);
  });
});
