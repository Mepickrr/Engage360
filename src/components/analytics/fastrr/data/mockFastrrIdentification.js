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
  const identificationRateFraction = 0.15 + ((identSeed >> 3) % 15) / 100; // 15%-30%
  const identifiedSessions = Math.round(totalSessions * identificationRateFraction);
  const checkoutInitiated = Math.round(identifiedSessions * 0.42);
  const checkoutSso = Math.round(checkoutInitiated * 0.68);
  const orderPlaced = Math.round(checkoutSso * 0.71);

  const deltaPct = ((identSeed >> 5) % 20) - 4; // -4 .. +15
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
      deltaPct: (identSeed >> 7) % 10 - 3,
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
const CHANNEL_COST_PER_MSG = { WhatsApp: 0.35, Email: 0.05, SMS: 0.12, RCS: 0.28 }; // (estimated)
const AI_CALLING_COST_PER_MIN = 1.5; // (estimated)

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
  const read = Math.round(delivered * (0.4 + ((seed >> 2) % 20) / 100));
  const clicked = Math.round(read * (0.18 + ((seed >> 4) % 12) / 100));

  const byChannel = channel === "All" || channel === "AI Calling"
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

  return {
    isEmpty: false,
    funnel: { sent: scaledSent, delivered, read, clicked },
    readRate: (read / delivered) * 100,
    clickRate: (clicked / delivered) * 100,
    byChannel,
    aiCalling: { callsPlaced, callsConnected, callsCompleted, actionTaken },
  };
}

function roiFor(revenue, cost) {
  return cost > 0 ? (revenue - cost) / cost * 100 / 100 : 0; // expressed as an X multiplier
}

function buildConversionRoi(datePreset, channel, seed) {
  if (isEmptyCombo(datePreset, channel)) {
    return {
      isEmpty: true,
      byChannel: [],
      roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated). TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message).",
      attribution: { lastClick: 0, firstClick: 0 },
      topJourneys: [],
      triggerSplit: [],
    };
  }

  const allChannels = [...MESSAGING_CHANNELS, "AI Calling"];
  const byChannel = allChannels.map((label, i) => {
    const share = CHANNEL_SHARE[label];
    const orders = Math.round((1200 + (seed % 3000)) * share * 3);
    const revenue = orders * (900 + ((seed >> i) % 700));
    const aov = Math.round(revenue / orders);
    const cost = label === "AI Calling"
      ? (500 + (seed % 900)) * AI_CALLING_COST_PER_MIN
      : orders * 8 * CHANNEL_COST_PER_MSG[label];
    const roi = cost > 0 ? (revenue - cost) / cost : 0;
    return { label, orders, revenue, aov, roi };
  });

  const topJourneys = JOURNEY_NAMES.map((name, i) => {
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
      roi: cost > 0 ? (revenue - cost) / cost : 0,
      uniqueCustomers: Math.round(orders * 0.86),
    };
  });

  const triggerSplit = [
    { trigger: "Product View", revenue: 800000 + (seed % 400000) },
    { trigger: "Add-to-Cart", revenue: 1200000 + (seed % 600000) },
    { trigger: "Cart Abandon", revenue: 1500000 + (seed % 900000) },
    { trigger: "Other", revenue: 300000 + (seed % 150000) },
  ];

  return {
    isEmpty: false,
    byChannel,
    roiFormulaNote: "ROI (WhatsApp) ≈ Delivered Count × assumed cost/msg (estimated). TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message).",
    attribution: { lastClick: 3200000 + (seed % 2000000), firstClick: 4100000 + (seed % 2600000) },
    topJourneys,
    triggerSplit,
  };
}

export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel, seed } = buildHeroAndFunnel(datePreset, channel);
  const engagement = buildEngagement(datePreset, channel, seed);
  const conversionRoi = buildConversionRoi(datePreset, channel, seed);
  return { hero, funnel, engagement, conversionRoi };
}
