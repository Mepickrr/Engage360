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

export function getFastrrIdentificationAnalytics(filters) {
  const { datePreset, channel } = filters;
  const { hero, funnel } = buildHeroAndFunnel(datePreset, channel);
  return { hero, funnel };
}
