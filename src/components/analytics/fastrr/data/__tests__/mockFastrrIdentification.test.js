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

describe("getFastrrIdentificationAnalytics — engagement + conversionRoi", () => {
  test("engagement byChannel never includes AI Calling", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.engagement.byChannel.map((c) => c.label)).not.toContain("AI Calling");
    expect(data.engagement.byChannel).toHaveLength(4);
  });

  test("read rate and click rate are derived from delivered", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const { sent, delivered, read, clicked } = data.engagement.funnel;
    expect(data.engagement.readRate).toBeCloseTo((read / delivered) * 100, 5);
    expect(data.engagement.clickRate).toBeCloseTo((clicked / delivered) * 100, 5);
    expect(delivered).toBeLessThanOrEqual(sent);
    expect(read).toBeLessThanOrEqual(delivered);
    expect(clicked).toBeLessThanOrEqual(read);
  });

  test("conversionRoi.byChannel includes all 5 channels", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.byChannel.map((c) => c.label).sort()).toEqual(
      ["AI Calling", "Email", "RCS", "SMS", "WhatsApp"]
    );
  });

  test("topJourneys has 12 rows with unique ids", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.topJourneys).toHaveLength(12);
    expect(new Set(data.conversionRoi.topJourneys.map((j) => j.id)).size).toBe(12);
  });

  test("triggerSplit covers exactly Product View, Add-to-Cart, Cart Abandon, Other", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.conversionRoi.triggerSplit.map((t) => t.trigger)).toEqual([
      "Product View", "Add-to-Cart", "Cart Abandon", "Other",
    ]);
  });

  test("AI Calling + today is empty for engagement and conversionRoi only", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "today", channel: "AI Calling", compare: true });
    expect(data.engagement.isEmpty).toBe(true);
    expect(data.engagement.funnel).toEqual({ sent: 0, delivered: 0, read: 0, clicked: 0 });
    expect(data.engagement.byChannel).toEqual([]);
    expect(data.conversionRoi.isEmpty).toBe(true);
    expect(data.conversionRoi.byChannel).toEqual([]);
    expect(data.conversionRoi.topJourneys).toEqual([]);
    // hero/funnel are unaffected by channel — documented scoping decision
    expect(data.hero.totalSessions.value).toBeGreaterThan(0);
  });

  test("other datePreset+channel combos are never empty", () => {
    expect(getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true }).engagement.isEmpty).toBe(false);
    expect(getFastrrIdentificationAnalytics({ datePreset: "today", channel: "WhatsApp", compare: true }).engagement.isEmpty).toBe(false);
  });
});

describe("getFastrrIdentificationAnalytics — AI Calling messaging funnel", () => {
  test("AI Calling channel (non-today) zeroes the messaging funnel but keeps aiCalling and byChannel populated", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true });
    expect(data.engagement.isEmpty).toBe(false);
    expect(data.engagement.funnel).toEqual({ sent: 0, delivered: 0, read: 0, clicked: 0 });
    expect(data.engagement.readRate).toBe(0);
    expect(data.engagement.clickRate).toBe(0);
    expect(data.engagement.aiCalling.callsPlaced).toBeGreaterThan(0);
    expect(data.engagement.byChannel.length).toBeGreaterThan(0);
  });
});

describe("getFastrrIdentificationAnalytics — segmentComparison", () => {
  test("segments are known, fastrrIdentified, anonymous in that order", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.segments.map((s) => s.key)).toEqual(["known", "fastrrIdentified", "anonymous"]);
  });

  test("every segment has a repeat rate and engagement rate under 100", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    data.segmentComparison.segments.forEach((s) => {
      expect(s.repeatRate).toBeGreaterThan(0);
      expect(s.repeatRate).toBeLessThanOrEqual(100);
      expect(s.engagementRate).toBeGreaterThan(0);
      expect(s.engagementRate).toBeLessThanOrEqual(100);
    });
  });

  test("growthTrend has 6 points and topIdentifiedUsers has 5 unique rows", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.growthTrend).toHaveLength(6);
    expect(data.segmentComparison.topIdentifiedUsers).toHaveLength(5);
    expect(new Set(data.segmentComparison.topIdentifiedUsers.map((u) => u.id)).size).toBe(5);
  });

  test("repeatCohort covers W0 through W4", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.segmentComparison.repeatCohort.map((c) => c.week)).toEqual(["W0", "W1", "W2", "W3", "W4"]);
  });

  test("segmentComparison is unaffected by channel — identification-only section", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withWa = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "WhatsApp", compare: true });
    expect(withAll.segmentComparison).toEqual(withWa.segmentComparison);
  });

  test("segment aov and revenue are never negative, across every datePreset", () => {
    for (const datePreset of FASTRR_DATE_PRESETS) {
      const data = getFastrrIdentificationAnalytics({ datePreset, channel: "All", compare: true });
      data.segmentComparison.segments.forEach((s) => {
        expect(s.aov).toBeGreaterThan(0);
        expect(s.revenue).toBeGreaterThan(0);
      });
    }
  });
});
