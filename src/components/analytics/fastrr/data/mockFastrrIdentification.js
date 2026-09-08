// Deterministic mock data for the Analytics > Fastrr Identification tab.
// No live data — every number is derived from an FNV-1a hash of the
// (datePreset, channel) pair, so output is stable across renders and
// re-imports. No Math.random / Date.now anywhere in this file.
//
// Scoping decision: the `channel` filter only narrows communication-centric
// sections (engagement, conversionRoi, and the trends.messagingFunnel
// chart added in later tasks). It intentionally does not alter
// identification-only sections (hero, funnel, segmentComparison,
// smartCard, sourceBreakdown) — those describe on-site identification
// behavior, not messaging channel.

export const FASTRR_CHANNELS = ["All", "WhatsApp", "Email", "SMS", "RCS", "AI Calling"];
export const FASTRR_DATE_PRESETS = ["today", "yesterday", "last_7_days", "this_month", "last_month"];

function hashKey(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function baseSeed(datePreset, channel) {
  return hashKey(`${datePreset}|${channel}`);
}

function identificationSeed(datePreset) {
  return hashKey(`identification|${datePreset}`);
}

function buildHeroAndFunnel(datePreset, channel) {
  const identSeed = identificationSeed(datePreset);
  const seed = baseSeed(datePreset, channel);

  const totalSessions = 40000 + (identSeed % 60000);
  const identificationRateFraction = 0.15 + ((identSeed >>> 3) % 15) / 100; // 15%-30%
  const identifiedSessions = Math.round(totalSessions * identificationRateFraction);
  const checkoutInitiated = Math.round(identifiedSessions * 0.42);
  const checkoutSso = Math.round(checkoutInitiated * 0.68);
  const orderPlaced = Math.round(checkoutSso * 0.71);

  const deltaPct = ((identSeed >>> 5) % 20) - 4; // -4 .. +15
  const identificationRateValue = (identifiedSessions / totalSessions) * 100;

  const hero = {
    totalSessions: { value: totalSessions, deltaPct, deltaAbs: Math.round(totalSessions * (deltaPct / 100)) },
    identifiedSessions: {
      value: identifiedSessions,
      deltaPct: deltaPct + 1,
      deltaAbs: Math.round(identifiedSessions * ((deltaPct + 1) / 100)),
    },
    identificationRate: {
      value: identificationRateValue,
      deltaPct: (identSeed >>> 7) % 10 - 3,
      deltaAbs: 0,
    },
    benchmark: {
      yourStore: identificationRateValue,
      allFastrrStores: 19.2,
      categoryAvg: 17.3,
    },
    gmv: {
      lastClick: 2000000 + (identSeed % 4000000),
      firstClick: 2600000 + (identSeed % 5200000),
    },
    freshness: {
      intervalMinutes: 15,
      lastRefreshed: new Date(Date.UTC(2026, 8, 8, 6, 0, 0)).toISOString(),
    },
  };

  const funnel = {
    stages: [
      { key: "totalSessions", label: "Total Sessions", count: totalSessions },
      { key: "identifiedSessions", label: "Identified Sessions", count: identifiedSessions },
      { key: "checkoutInitiated", label: "Checkout Initiated", count: checkoutInitiated },
      { key: "checkoutSso", label: "Checkout (Smart Card / SSO)", count: checkoutSso },
      { key: "orderPlaced", label: "Order Placed", count: orderPlaced },
    ],
    dropoffByPage: [
      { page: "Homepage", count: Math.round((identifiedSessions - checkoutInitiated) * 0.45) },
      { page: "PDP", count: Math.round((identifiedSessions - checkoutInitiated) * 0.3) },
      { page: "Cart", count: Math.round((identifiedSessions - checkoutInitiated) * 0.15) },
      { page: "Checkout", count: Math.round((identifiedSessions - checkoutInitiated) * 0.1) },
    ],
  };

  return { hero, funnel, seed };
}

const MESSAGING_CHANNELS = ["WhatsApp", "Email", "SMS", "RCS"];
const CHANNEL_SHARE = { WhatsApp: 0.46, Email: 0.19, SMS: 0.14, RCS: 0.09, "AI Calling": 0.12 };
// (estimated)
// TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message).
const CHANNEL_COST_PER_MSG = { WhatsApp: 0.35, Email: 0.05, SMS: 0.12, RCS: 0.28 };
const AI_CALLING_COST_PER_MIN = 1.5;

const JOURNEY_NAMES = [
  "Abandoned Cart Recovery", "Post-Purchase Upsell", "Welcome Series", "COD Confirmation",
  "Win-Back 30d", "Price Drop Alert", "Back in Stock", "Review Request",
  "Delivery Update", "Cashback Reminder", "Browse Abandonment", "VIP Early Access",
];
const TRIGGER_EVENTS = ["Product View", "Add-to-Cart", "Cart Abandon", "Order Placed"];

function isEmptyCombo(datePreset, channel) {
  return channel === "AI Calling" && datePreset === "today";
}

function buildEngagement(datePreset, channel, seed) {
  if (isEmptyCombo(datePreset, channel)) {
    return {
      isEmpty: true,
      funnel: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      readRate: 0,
      clickRate: 0,
      byChannel: [],
      aiCalling: { callsPlaced: 0, callsConnected: 0, callsCompleted: 0, actionTaken: 0 },
    };
  }

  const totalSent = 80000 + (seed % 120000);
  const scaledSent = channel === "All" ? totalSent : Math.round(totalSent * (CHANNEL_SHARE[channel] ?? 1));
  const delivered = Math.round(scaledSent * 0.94);
  const read = Math.round(delivered * (0.4 + ((seed >>> 2) % 20) / 100));
  const clicked = Math.round(read * (0.18 + ((seed >>> 4) % 12) / 100));

  // AI Calling has no messaging channel of its own to compare — its funnel
  // is a separate Calls Placed→Connected→Completed→Action Taken card below,
  // so the channel-comparison chart has nothing to show and must be empty,
  // not populated with the 4 messaging channels at "All"-like volumes
  // (that would visibly contradict the zeroed funnel/readRate/clickRate above).
  const byChannel = channel === "AI Calling"
    ? []
    : channel === "All"
    ? MESSAGING_CHANNELS.map((label, i) => {
        const chSent = Math.round(totalSent * CHANNEL_SHARE[label]);
        const chDelivered = Math.round(chSent * 0.94);
        const chRead = Math.round(chDelivered * (0.35 + i * 0.05));
        const chClicked = Math.round(chRead * (0.15 + i * 0.02));
        return { label, sent: chSent, delivered: chDelivered, read: chRead, clicked: chClicked };
      })
    : [{
        label: channel,
        sent: scaledSent,
        delivered,
        read,
        clicked,
      }];

  const callsPlaced = 5000 + (seed % 8000);
  const callsConnected = Math.round(callsPlaced * 0.62);
  const callsCompleted = Math.round(callsConnected * 0.81);
  const actionTaken = Math.round(callsCompleted * 0.44);

  const isAiCalling = channel === "AI Calling";
  const funnel = isAiCalling
    ? { sent: 0, delivered: 0, read: 0, clicked: 0 }
    : { sent: scaledSent, delivered, read, clicked };

  return {
    isEmpty: false,
    funnel,
    readRate: funnel.delivered > 0 ? (funnel.read / funnel.delivered) * 100 : 0,
    clickRate: funnel.delivered > 0 ? (funnel.clicked / funnel.delivered) * 100 : 0,
    byChannel,
    aiCalling: { callsPlaced, callsConnected, callsCompleted, actionTaken },
  };
}

function roiFor(revenue, cost) {
  return cost > 0 ? (revenue - cost) / cost : 0;
}

function buildConversionRoi(datePreset, channel, seed) {
  if (isEmptyCombo(datePreset, channel)) {
    return {
      isEmpty: true,
      byChannel: [],
      roiFormulaNote: "Channel costs are estimated — a flat assumed cost per message, except AI Calling which is billed per-minute.",
      attribution: { lastClick: 0, firstClick: 0 },
      topJourneys: [],
      triggerSplit: [],
    };
  }

  const allChannels = [...MESSAGING_CHANNELS, "AI Calling"];
  const byChannelAll = allChannels.map((label, i) => {
    const share = CHANNEL_SHARE[label];
    const orders = Math.round((1200 + (seed % 3000)) * share * 3);
    const revenue = orders * (900 + ((seed >>> i) % 700));
    const aov = Math.round(revenue / orders);
    const cost = label === "AI Calling"
      ? (500 + (seed % 900)) * AI_CALLING_COST_PER_MIN
      : orders * 8 * CHANNEL_COST_PER_MSG[label];
    const roi = roiFor(revenue, cost);
    return { label, orders, revenue, aov, roi };
  });
  // Same pattern as buildEngagement: narrow byChannel down to the single
  // selected channel's row so §4 actually reflects the channel filter,
  // rather than only re-seeding its random numbers while showing all channels.
  const byChannel = channel === "All" ? byChannelAll : byChannelAll.filter((c) => c.label === channel);

  const topJourneysAll = JOURNEY_NAMES.map((name, i) => {
    const sent = 4000 + ((seed + i * 977) % 20000);
    const delivered = Math.round(sent * 0.93);
    const orders = Math.round(delivered * (0.02 + (i % 5) * 0.01));
    const revenue = orders * (700 + (i * 137) % 1200);
    const cost = delivered * 0.3;
    const aov = orders > 0 ? Math.round(revenue / orders) : 0;
    return {
      id: `journey-${i + 1}`,
      name,
      channels: [MESSAGING_CHANNELS[i % MESSAGING_CHANNELS.length]],
      triggerEvent: TRIGGER_EVENTS[i % TRIGGER_EVENTS.length],
      sent, delivered, orders, revenue, aov,
      roi: roiFor(revenue, cost),
      uniqueCustomers: Math.round(orders * 0.86),
    };
  });
  // Journeys only ever carry messaging channels in their `channels` array
  // (never "AI Calling"), so filtering to channel: "AI Calling" correctly
  // yields an empty list here — that's expected, not a bug.
  const topJourneys = channel === "All"
    ? topJourneysAll
    : topJourneysAll.filter((j) => j.channels.includes(channel));

  // triggerSplit intentionally does NOT narrow by channel filter, unlike
  // byChannel/topJourneys above: trigger-event revenue has no channel
  // dimension modeled in this mock (a trigger like "Cart Abandon" isn't
  // tied to a single channel) — this is a deliberate, documented exception.
  const triggerSplit = [
    { trigger: "Product View", revenue: 800000 + (seed % 400000) },
    { trigger: "Add-to-Cart", revenue: 1200000 + (seed % 600000) },
    { trigger: "Cart Abandon", revenue: 1500000 + (seed % 900000) },
    { trigger: "Other", revenue: 300000 + (seed % 150000) },
  ];

  return {
    isEmpty: false,
    byChannel,
    roiFormulaNote: "Channel costs are estimated — a flat assumed cost per message, except AI Calling which is billed per-minute.",
    attribution: { lastClick: 3200000 + (seed % 2000000), firstClick: 4100000 + (seed % 2600000) },
    topJourneys,
    triggerSplit,
  };
}

const IDENTIFIED_USER_NAMES = ["Ritika Desai", "Manav Shah", "Ishaan Kapoor", "Simran Kaur", "Aarav Joshi"];

function buildSegmentComparison(seed) {
  const segments = [
    { key: "known", label: "Known", orders: 9200 + (seed % 3000), revenue: 0, aov: 0, repeatRate: 38 + (seed % 10), engagementRate: 61 + (seed % 8) },
    { key: "fastrrIdentified", label: "Fastrr-Identified", orders: 4100 + (seed % 2000), revenue: 0, aov: 0, repeatRate: 29 + (seed % 10), engagementRate: 54 + (seed % 8) },
    { key: "anonymous", label: "Anonymous", orders: 1200 + (seed % 800), revenue: 0, aov: 0, repeatRate: 6 + (seed % 4), engagementRate: 11 + (seed % 5) },
  ].map((seg, i) => {
    const aov = 850 + ((seed >>> i) % 900);
    return { ...seg, aov, revenue: seg.orders * aov };
  });

  const growthTrend = Array.from({ length: 6 }, (_, i) => ({
    period: `Wk ${i + 1}`,
    conversionRate: 4 + i * 0.6 + ((seed >>> i) % 3) * 0.2,
  }));

  const topIdentifiedUsers = IDENTIFIED_USER_NAMES.map((name, i) => ({
    id: `top-user-${i + 1}`,
    name,
    identifiedOn: `0${(i % 9) + 1} Sep 2026`,
    ltv: 8000 + ((seed + i * 613) % 40000),
  }));

  const repeatCohort = ["W0", "W1", "W2", "W3", "W4"].map((week, i) => ({
    week,
    fastrrIdentified: Math.max(0, 22 - i * 4 + ((seed >>> i) % 3)),
    known: Math.max(0, 30 - i * 4 + ((seed >>> i) % 3)),
  }));

  return { segments, growthTrend, topIdentifiedUsers, repeatCohort };
}

function buildSmartCard(idSeed) {
  return {
    autofillTriggerRate: 58 + (idSeed % 20),
    acceptanceRate: 71 + (idSeed % 15),
    fieldEditRates: [
      { field: "Name", editRate: 3 + (idSeed % 5) },
      { field: "Phone", editRate: 5 + (idSeed % 6) },
      { field: "Address", editRate: 14 + (idSeed % 10) },
      { field: "Pincode", editRate: 8 + (idSeed % 7) },
    ],
    checkoutTimeSeconds: { smartCard: 28 + (idSeed % 12), manual: 95 + (idSeed % 40) },
    conversionRate: { smartCard: 34 + (idSeed % 8), standard: 19 + (idSeed % 5) },
    dropoffByStep: ["Cart", "Address", "Payment", "Confirmation"].map((step, i) => ({
      step,
      withSmartCard: Math.max(1, 12 - i * 3 + (idSeed % 3)),
      withoutSmartCard: Math.max(2, 24 - i * 4 + (idSeed % 4)),
    })),
  };
}

const DAY_LABELS = ["01 Sep", "02 Sep", "03 Sep", "04 Sep", "05 Sep", "06 Sep", "07 Sep"];
const WEEK_LABELS = ["Wk 27", "Wk 28", "Wk 29", "Wk 30"];

function buildTrendSeries(dayLabels, weekLabels, seed, buildPoint) {
  return {
    day: dayLabels.map((period, i) => buildPoint(period, i, seed)),
    week: weekLabels.map((period, i) => buildPoint(period, i, seed + 17)),
    deltaPct: ((seed >>> 6) % 20) - 5,
  };
}

function buildTrends(idSeed, commSeed) {
  const identificationRate = buildTrendSeries(DAY_LABELS, WEEK_LABELS, idSeed, (period, i, s) => ({
    period, value: 18 + ((s >>> i) % 10) + i * 0.4,
  }));

  const messagingFunnel = buildTrendSeries(DAY_LABELS, WEEK_LABELS, commSeed, (period, i, s) => {
    const sent = 9000 + ((s >>> i) % 6000);
    const delivered = Math.round(sent * 0.93);
    const read = Math.round(delivered * 0.5);
    const clicked = Math.round(read * 0.22);
    return { period, sent, delivered, read, clicked };
  });

  const ordersRevenue = buildTrendSeries(DAY_LABELS, WEEK_LABELS, commSeed, (period, i, s) => {
    const orders = 300 + ((s >>> i) % 400);
    return { period, orders, revenue: orders * (900 + (s % 500)) };
  });

  const repeatOrders = buildTrendSeries(DAY_LABELS, WEEK_LABELS, idSeed, (period, i, s) => ({
    period, value: 400 + ((s >>> i) % 300) + i * 5,
  }));

  return { identificationRate, messagingFunnel, ordersRevenue, repeatOrders };
}

function buildSourceBreakdown(idSeed) {
  const rawSources = [
    { source: "Smart Card", weight: 34 + (idSeed % 10) },
    { source: "Checkout", weight: 27 + (idSeed % 8) },
    { source: "Pop-up", weight: 18 + (idSeed % 6) },
    { source: "Cookie", weight: 12 + (idSeed % 5) },
    { source: "Signup", weight: 9 + (idSeed % 4) },
  ];
  const total = rawSources.reduce((acc, s) => acc + s.weight, 0);
  const sources = rawSources
    .map((s) => ({ source: s.source, pct: (s.weight / total) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  const deviceRaw = [
    { device: "Web (Desktop)", weight: 38 + (idSeed % 10) },
    { device: "Web (Mobile)", weight: 44 + (idSeed % 10) },
    { device: "App", weight: 18 + (idSeed % 6) },
  ];
  const deviceTotal = deviceRaw.reduce((acc, d) => acc + d.weight, 0);
  const deviceSplit = deviceRaw.map((d) => ({ device: d.device, pct: (d.weight / deviceTotal) * 100 }));

  return { sources, deviceSplit };
}

export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel, seed } = buildHeroAndFunnel(datePreset, channel);
  const idSeed = identificationSeed(datePreset);
  const engagement = buildEngagement(datePreset, channel, seed);
  const conversionRoi = buildConversionRoi(datePreset, channel, seed);
  const segmentComparison = buildSegmentComparison(idSeed);
  const smartCard = buildSmartCard(idSeed);
  const trends = buildTrends(idSeed, seed);
  const sourceBreakdown = buildSourceBreakdown(idSeed);
  return { hero, funnel, engagement, conversionRoi, segmentComparison, smartCard, trends, sourceBreakdown };
}
