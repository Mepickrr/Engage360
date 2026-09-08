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

  test("conversionRoi.byChannel narrows to just the selected channel, like engagement.byChannel does", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "SMS", compare: true });
    expect(data.conversionRoi.byChannel.map((c) => c.label)).toEqual(["SMS"]);
  });

  test("conversionRoi.topJourneys narrows to journeys whose channels include the selected channel", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withWa = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "WhatsApp", compare: true });
    expect(withWa.conversionRoi.topJourneys.length).toBeLessThan(withAll.conversionRoi.topJourneys.length);
    withWa.conversionRoi.topJourneys.forEach((j) => expect(j.channels).toContain("WhatsApp"));
  });

  test("conversionRoi.topJourneys is empty for AI Calling — journeys never carry that channel", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true });
    expect(data.conversionRoi.isEmpty).toBe(false);
    expect(data.conversionRoi.topJourneys).toEqual([]);
  });

  test("conversionRoi.triggerSplit is never filtered down by channel (documented exception) — always all 4 triggers", () => {
    // Unlike byChannel/topJourneys, triggerSplit isn't narrowed by channel — only its
    // underlying random numbers re-seed per channel (same as before this fix), since
    // trigger-event revenue has no channel dimension modeled in this mock.
    const withSms = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "SMS", compare: true });
    const withAiCalling = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true });
    expect(withSms.conversionRoi.triggerSplit.map((t) => t.trigger)).toEqual([
      "Product View", "Add-to-Cart", "Cart Abandon", "Other",
    ]);
    expect(withAiCalling.conversionRoi.triggerSplit.map((t) => t.trigger)).toEqual([
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
  test("AI Calling channel (non-today) zeroes the messaging funnel and byChannel, but keeps aiCalling populated", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "AI Calling", compare: true });
    expect(data.engagement.isEmpty).toBe(false);
    expect(data.engagement.funnel).toEqual({ sent: 0, delivered: 0, read: 0, clicked: 0 });
    expect(data.engagement.readRate).toBe(0);
    expect(data.engagement.clickRate).toBe(0);
    expect(data.engagement.aiCalling.callsPlaced).toBeGreaterThan(0);
    // byChannel is empty for AI Calling at every datePreset — it has no messaging
    // channel of its own to compare against, so the channel chart has nothing to show
    // (this must not contradict the zeroed funnel/readRate/clickRate above by being populated).
    expect(data.engagement.byChannel).toEqual([]);
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

describe("getFastrrIdentificationAnalytics — smartCard + trends + sourceBreakdown", () => {
  test("smartCard rates are within 0-100 and channel-agnostic", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withSms = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "SMS", compare: true });
    expect(withAll.smartCard).toEqual(withSms.smartCard);
    expect(withAll.smartCard.autofillTriggerRate).toBeGreaterThan(0);
    expect(withAll.smartCard.autofillTriggerRate).toBeLessThanOrEqual(100);
    expect(withAll.smartCard.conversionRate.smartCard).toBeGreaterThan(withAll.smartCard.conversionRate.standard);
  });

  test("smartCard field edit rates cover exactly Name, Phone, Address, Pincode", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.smartCard.fieldEditRates.map((f) => f.field)).toEqual(["Name", "Phone", "Address", "Pincode"]);
  });

  test("trends each carry day + week arrays and a deltaPct", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    for (const key of ["identificationRate", "messagingFunnel", "ordersRevenue", "repeatOrders"]) {
      expect(Array.isArray(data.trends[key].day)).toBe(true);
      expect(Array.isArray(data.trends[key].week)).toBe(true);
      expect(data.trends[key].day.length).toBeGreaterThan(data.trends[key].week.length);
      expect(typeof data.trends[key].deltaPct).toBe("number");
    }
  });

  test("messagingFunnel and ordersRevenue react to channel, identificationRate and repeatOrders do not", () => {
    const withAll = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const withRcs = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "RCS", compare: true });
    expect(withAll.trends.identificationRate).toEqual(withRcs.trends.identificationRate);
    expect(withAll.trends.repeatOrders).toEqual(withRcs.trends.repeatOrders);
    expect(withAll.trends.messagingFunnel).not.toEqual(withRcs.trends.messagingFunnel);
  });

  test("sourceBreakdown uses exactly the 5 fixed sources, sorted descending by pct", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    const sources = data.sourceBreakdown.sources;
    expect(new Set(sources.map((s) => s.source))).toEqual(
      new Set(["Smart Card", "Checkout", "Pop-up", "Cookie", "Signup"])
    );
    const pcts = sources.map((s) => s.pct);
    expect(pcts).toEqual([...pcts].sort((a, b) => b - a));
  });

  test("deviceSplit covers Web (Desktop), Web (Mobile), App and sums close to 100", () => {
    const data = getFastrrIdentificationAnalytics({ datePreset: "last_7_days", channel: "All", compare: true });
    expect(data.sourceBreakdown.deviceSplit.map((d) => d.device)).toEqual(["Web (Desktop)", "Web (Mobile)", "App"]);
    const sum = data.sourceBreakdown.deviceSplit.reduce((acc, d) => acc + d.pct, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  test("smartCard/trends/sourceBreakdown fields are never negative, across multiple datePresets", () => {
    for (const datePreset of ["last_7_days", "this_month", "yesterday"]) {
      const data = getFastrrIdentificationAnalytics({ datePreset, channel: "All", compare: true });

      expect(data.smartCard.autofillTriggerRate).toBeGreaterThan(0);
      expect(data.smartCard.acceptanceRate).toBeGreaterThan(0);
      data.smartCard.fieldEditRates.forEach((f) => expect(f.editRate).toBeGreaterThan(0));
      expect(data.smartCard.checkoutTimeSeconds.smartCard).toBeGreaterThan(0);
      expect(data.smartCard.checkoutTimeSeconds.manual).toBeGreaterThan(0);
      expect(data.smartCard.conversionRate.smartCard).toBeGreaterThan(0);
      expect(data.smartCard.conversionRate.standard).toBeGreaterThan(0);
      data.smartCard.dropoffByStep.forEach((d) => {
        expect(d.withSmartCard).toBeGreaterThan(0);
        expect(d.withoutSmartCard).toBeGreaterThan(0);
      });

      for (const key of ["identificationRate", "repeatOrders"]) {
        data.trends[key].day.forEach((p) => expect(p.value).toBeGreaterThan(0));
        data.trends[key].week.forEach((p) => expect(p.value).toBeGreaterThan(0));
      }
      ["day", "week"].forEach((granularity) => {
        data.trends.messagingFunnel[granularity].forEach((p) => {
          expect(p.sent).toBeGreaterThan(0);
          expect(p.delivered).toBeGreaterThan(0);
          expect(p.read).toBeGreaterThan(0);
          expect(p.clicked).toBeGreaterThan(0);
        });
        data.trends.ordersRevenue[granularity].forEach((p) => {
          expect(p.orders).toBeGreaterThan(0);
          expect(p.revenue).toBeGreaterThan(0);
        });
      });

      data.sourceBreakdown.sources.forEach((s) => expect(s.pct).toBeGreaterThan(0));
      data.sourceBreakdown.deviceSplit.forEach((d) => expect(d.pct).toBeGreaterThan(0));
    }
  });
});
