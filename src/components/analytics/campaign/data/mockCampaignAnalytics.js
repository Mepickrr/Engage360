// Deterministic mock data for the Analytics > Campaign tab. Sample data only —
// no live pipeline. Scope: Fastrr Campaigns (not Journeys, Popups, Helpdesk).

export const CAMPAIGN_CHANNELS = ["WhatsApp", "SMS", "RCS", "Email", "AI Calling"];
export const AUDIENCE_SOURCES = ["Seller Uploaded", "Fastrr Identified", "Known"];
export const DATE_RANGES = [
  { value: "last_7_days", label: "Last 7 Days", multiplier: 1, deltaPct: 8 },
  { value: "last_30_days", label: "Last 30 Days", multiplier: 4.1, deltaPct: 14 },
  { value: "last_90_days", label: "Last 90 Days", multiplier: 11.5, deltaPct: 22 },
];

// channel -> per-message cost (estimated), used to derive campaign cost from delivered count.
const COST_PER_MSG = { WhatsApp: 0.35, SMS: 0.12, RCS: 0.28, Email: 0.05, "AI Calling": 1.5 };

const CAMPAIGNS_BASE = [
  { id: "c1", name: "Diwali Cashback Blast", channel: "WhatsApp", audienceSource: "Fastrr Identified", customers: 9800, delivered: 9400, read: 7100, clicked: 2200, orders: 410, revenue: 512000, addToCarts: 980, productsViewed: 3100 },
  { id: "c2", name: "Abandoned Cart Recovery", channel: "WhatsApp", audienceSource: "Known", customers: 6200, delivered: 5950, read: 4600, clicked: 1800, orders: 520, revenue: 468000, addToCarts: 1200, productsViewed: 2600 },
  { id: "c3", name: "COD Confirmation Nudge", channel: "SMS", audienceSource: "Known", customers: 15200, delivered: 14800, read: null, clicked: null, orders: 340, revenue: 187000, addToCarts: null, productsViewed: null },
  { id: "c4", name: "Flash Sale Alert", channel: "SMS", audienceSource: "Seller Uploaded", customers: 8100, delivered: 7600, read: null, clicked: null, orders: 210, revenue: 134000, addToCarts: null, productsViewed: null },
  { id: "c5", name: "Rich Card New Arrivals", channel: "RCS", audienceSource: "Fastrr Identified", customers: 4200, delivered: 3950, read: 2800, clicked: 1100, orders: 165, revenue: 143000, addToCarts: 410, productsViewed: 1300 },
  { id: "c6", name: "Weekend Offer Carousel", channel: "RCS", audienceSource: "Known", customers: 3100, delivered: 2900, read: 2000, clicked: 720, orders: 98, revenue: 82000, addToCarts: 260, productsViewed: 890 },
  { id: "c7", name: "Win-Back 30 Day", channel: "Email", audienceSource: "Seller Uploaded", customers: 22000, delivered: 20500, read: 6200, clicked: 1400, orders: 180, revenue: 156000, addToCarts: 520, productsViewed: 2100 },
  { id: "c8", name: "Post-Purchase Review Ask", channel: "Email", audienceSource: "Known", customers: 9600, delivered: 9100, read: 3800, clicked: 900, orders: 40, revenue: 21000, addToCarts: 90, productsViewed: 340 },
  { id: "c9", name: "COD Confirmation Call", channel: "AI Calling", audienceSource: "Known", customers: 5400, delivered: 5100, read: null, clicked: null, orders: 610, revenue: 498000, addToCarts: null, productsViewed: null },
  { id: "c10", name: "Delivery Reminder Call", channel: "AI Calling", audienceSource: "Fastrr Identified", customers: 2100, delivered: 1950, read: null, clicked: null, orders: 95, revenue: 71000, addToCarts: null, productsViewed: null },
];

// Fastrr-specific: campaigns configured with a fallback channel when the
// primary delivery fails/times out — highlighted separately from the base
// per-channel engagement shapes above, since no other platform models this.
const FALLBACK_BASE = [
  { primaryChannel: "RCS", fallbackChannel: "SMS", attempted: 4200, fallbackTriggered: 640, fallbackDelivered: 590, fallbackRevenue: 38500 },
  { primaryChannel: "WhatsApp", fallbackChannel: "SMS", attempted: 9800, fallbackTriggered: 410, fallbackDelivered: 375, fallbackRevenue: 21200 },
  { primaryChannel: "AI Calling", fallbackChannel: "SMS", attempted: 5400, fallbackTriggered: 890, fallbackDelivered: 820, fallbackRevenue: 45600 },
];

const ENGAGEMENT_BY_CHANNEL_BASE = {
  WhatsApp: { sent: 16000, delivered: 15350, read: 11700, replied: 2100, interacted: 3400, linkClicked: 4000, abandonedCart: 1200, optedOut: 85 },
  RCS: { sent: 7300, delivered: 6850, read: 4800, richCardInteractions: 1820, fallbackToSmsRate: 15.2, optedOut: 22 },
  SMS: { sent: 23300, delivered: 22400, failed: 900, linkClicked: null, abandonedCart: null },
  Email: { sent: 31600, delivered: 29600, softBounced: 980, hardBounced: 420, uniqueOpened: 10000, totalOpened: 15400, uniqueLinkClicked: 2300, unsubscribed: 145, abandonedCart: 610 },
  "AI Calling": { callsAttempted: 7500, callsConnected: 4650, avgDurationSec: 68, outcomes: { interested: 1850, callbackRequested: 620, orderPlaced: 705, notReachable: 1400, doNotDisturb: 75 }, handoff: { ivr: 3900, agent: 750 }, costPerCall: 1.5, revenueAttributed: 569000 },
};

const CHANNEL_HEALTH_BASE = {
  WhatsApp: { unsubscribed: 85, deliveryRate: 96.8, storeAvg: 95.4, fastrrPlatformAvg: 94.1, industryAvg: 92.0, qualityTier: "High", messagingLimit: "100K/24h" },
  SMS: { unsubscribed: 0, deliveryRate: 96.1, storeAvg: 95.9, fastrrPlatformAvg: 94.8, industryAvg: 93.5, dltStatus: "Verified", senderId: "FSTRRX" },
  RCS: { unsubscribed: 22, deliveryRate: 93.8, storeAvg: 92.0, fastrrPlatformAvg: 90.5, industryAvg: 88.0 },
  Email: { unsubscribed: 145, bounceRate: 4.2, bounceBenchmark: 2.0, spamCount: 38, deliveryRate: 93.7, storeAvg: 94.5, fastrrPlatformAvg: 93.0, industryAvg: 96.0 },
  "AI Calling": { unsubscribed: 0, connectRate: 62.0, storeAvg: 59.5, fastrrPlatformAvg: 57.0, industryAvg: 54.0 },
};

const UNDERPERFORMING_BASE = [
  { campaign: "Post-Purchase Review Ask", channel: "Email", issue: "Low click-through (4.4%)" },
  { campaign: "Weekend Offer Carousel", channel: "RCS", issue: "High fallback-to-SMS rate (15.2%)" },
  { campaign: "Flash Sale Alert", channel: "SMS", issue: "Delivery rate below store average" },
];

function hashKey(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function scale(value, multiplier) {
  if (value == null) return null;
  return Math.round(value * multiplier);
}

function delta(value, deltaPct) {
  const deltaAbsolute = Math.round(value * (deltaPct / 100));
  return { value, deltaPct, deltaAbsolute };
}

function matchesFilters(campaign, channels, audienceSources) {
  const channelOk = channels.length === 0 || channels.includes(campaign.channel);
  const audienceOk = audienceSources.length === 0 || audienceSources.includes(campaign.audienceSource);
  return channelOk && audienceOk;
}

export function getCampaignAnalytics(filters) {
  const { dateRange, channels = [], audienceSources = [] } = filters;
  const range = DATE_RANGES.find((r) => r.value === dateRange) || DATE_RANGES[0];
  const seed = hashKey(dateRange + channels.join(",") + audienceSources.join(","));

  const campaigns = CAMPAIGNS_BASE
    .filter((c) => matchesFilters(c, channels, audienceSources))
    .map((c) => ({
      ...c,
      customers: scale(c.customers, range.multiplier),
      delivered: scale(c.delivered, range.multiplier),
      read: scale(c.read, range.multiplier),
      clicked: scale(c.clicked, range.multiplier),
      orders: scale(c.orders, range.multiplier),
      revenue: scale(c.revenue, range.multiplier),
      addToCarts: scale(c.addToCarts, range.multiplier),
      productsViewed: scale(c.productsViewed, range.multiplier),
      cost: Math.round(scale(c.delivered, range.multiplier) * COST_PER_MSG[c.channel]),
    }));

  const revenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const orders = campaigns.reduce((sum, c) => sum + c.orders, 0);
  const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
  const productViews = campaigns.reduce((sum, c) => sum + (c.productsViewed || 0), 0);
  const addToCarts = campaigns.reduce((sum, c) => sum + (c.addToCarts || 0), 0);

  const costByChannel = {};
  const revenueByChannel = {};
  const ordersByChannel = {};
  CAMPAIGN_CHANNELS.forEach((ch) => {
    const chCampaigns = campaigns.filter((c) => c.channel === ch);
    costByChannel[ch] = chCampaigns.reduce((s, c) => s + c.cost, 0);
    revenueByChannel[ch] = chCampaigns.reduce((s, c) => s + c.revenue, 0);
    ordersByChannel[ch] = chCampaigns.reduce((s, c) => s + c.orders, 0);
  });

  const overview = {
    totalCampaigns: delta(campaigns.length, range.deltaPct),
    revenue: delta(revenue, range.deltaPct),
    orders: delta(orders, range.deltaPct - 2),
    totalCost: delta(totalCost, range.deltaPct - 5),
    productViews: delta(productViews, range.deltaPct),
    addToCarts: delta(addToCarts, range.deltaPct),
    costByChannel,
  };

  const roi = {
    totalRevenue: revenue,
    totalCost,
    roi: totalCost > 0 ? (revenue - totalCost) / totalCost : null,
    byChannel: CAMPAIGN_CHANNELS.map((ch) => {
      const hasData = costByChannel[ch] > 0;
      return {
        channel: ch,
        hasData,
        revenue: revenueByChannel[ch],
        cost: costByChannel[ch],
        roi: hasData ? (revenueByChannel[ch] - costByChannel[ch]) / costByChannel[ch] : null,
      };
    }),
  };

  const channelSplit = {
    revenueByChannel: CAMPAIGN_CHANNELS.map((ch) => ({ channel: ch, revenue: revenueByChannel[ch] })),
    ordersByChannel: CAMPAIGN_CHANNELS.map((ch) => ({ channel: ch, orders: ordersByChannel[ch] })),
  };

  const audience = AUDIENCE_SOURCES.map((source) => {
    const rows = campaigns.filter((c) => c.audienceSource === source);
    const reached = rows.reduce((s, c) => s + c.customers, 0);
    const rev = rows.reduce((s, c) => s + c.revenue, 0);
    const ord = rows.reduce((s, c) => s + c.orders, 0);
    const delivered = rows.reduce((s, c) => s + c.delivered, 0);
    const engaged = rows.reduce((s, c) => s + (c.read || c.delivered * 0.3), 0);
    return {
      source,
      reached,
      revenue: rev,
      orders: ord,
      engagementRate: delivered > 0 ? (engaged / delivered) * 100 : 0,
      lastClickRevenue: Math.round(rev * 0.62),
      firstClickOpenRevenue: Math.round(rev * 0.81),
    };
  });

  const totalSent = CAMPAIGN_CHANNELS.reduce((s, ch) => s + scale(ENGAGEMENT_BY_CHANNEL_BASE[ch].sent ?? ENGAGEMENT_BY_CHANNEL_BASE[ch].callsAttempted, range.multiplier), 0);
  const totalDelivered = CAMPAIGN_CHANNELS.reduce((s, ch) => s + scale(ENGAGEMENT_BY_CHANNEL_BASE[ch].delivered ?? ENGAGEMENT_BY_CHANNEL_BASE[ch].callsConnected, range.multiplier), 0);
  const totalRead = ["WhatsApp", "RCS"].reduce((s, ch) => s + scale(ENGAGEMENT_BY_CHANNEL_BASE[ch].read, range.multiplier), 0);
  const totalClicked = scale(ENGAGEMENT_BY_CHANNEL_BASE.WhatsApp.linkClicked, range.multiplier) + scale(ENGAGEMENT_BY_CHANNEL_BASE.Email.uniqueLinkClicked, range.multiplier);

  const engagementOverview = {
    totalCustomersReached: delta(totalSent, range.deltaPct),
    uniqueCustomersReached: delta(Math.round(totalSent * 0.91), range.deltaPct),
    messagesSent: delta(totalSent, range.deltaPct),
    delivered: totalDelivered,
    deliveryRate: (totalDelivered / totalSent) * 100,
    readRate: (totalRead / totalDelivered) * 100,
    clickThroughRate: (totalClicked / totalDelivered) * 100,
  };

  const engagementByChannel = CAMPAIGN_CHANNELS.reduce((acc, ch) => {
    const base = ENGAGEMENT_BY_CHANNEL_BASE[ch];
    const scaled = {};
    Object.entries(base).forEach(([key, val]) => {
      if (typeof val === "number") scaled[key] = key.includes("Rate") || key === "avgDurationSec" || key === "costPerCall" ? val : scale(val, range.multiplier);
      else if (typeof val === "object" && val !== null) {
        scaled[key] = Object.fromEntries(Object.entries(val).map(([k, v]) => [k, scale(v, range.multiplier)]));
      } else scaled[key] = val;
    });
    acc[ch] = scaled;
    return acc;
  }, {});

  const fallbackPerformance = FALLBACK_BASE.map((f) => ({
    ...f,
    attempted: scale(f.attempted, range.multiplier),
    fallbackTriggered: scale(f.fallbackTriggered, range.multiplier),
    fallbackDelivered: scale(f.fallbackDelivered, range.multiplier),
    fallbackRevenue: scale(f.fallbackRevenue, range.multiplier),
    fallbackTriggerRate: (f.fallbackTriggered / f.attempted) * 100,
    fallbackDeliveryRate: (f.fallbackDelivered / f.fallbackTriggered) * 100,
  }));

  // 24hr activity is intentionally NOT filtered by date range or channel —
  // always the trailing 24 hours across all campaigns.
  const activityTimeline = {
    isEmpty: false,
    revenueMade: delta(seed % 2 === 0 ? 84500 : 96200, -6), // vs yesterday, not vs date-range filter
    hourly: Array.from({ length: 24 }, (_, hour) => {
      const wave = Math.sin((hour / 24) * Math.PI * 2 - 1.2) * 0.5 + 0.6;
      const base = Math.max(0.05, wave);
      return {
        hour,
        opened: Math.round(base * 320 + (hour % 5) * 8),
        clicked: Math.round(base * 110 + (hour % 3) * 4),
        productViewed: Math.round(base * 260),
        addedToCart: Math.round(base * 70),
        ordered: Math.round(base * 22),
      };
    }),
  };

  const channelHealthOverview = {
    totalUnsubscribed: delta(CAMPAIGN_CHANNELS.reduce((s, ch) => s + (CHANNEL_HEALTH_BASE[ch].unsubscribed || 0), 0), -4),
    whatsappUnsubscribed: delta(CHANNEL_HEALTH_BASE.WhatsApp.unsubscribed, -4),
    emailUnsubscribed: delta(CHANNEL_HEALTH_BASE.Email.unsubscribed, -4),
    emailMarkedAsSpam: delta(CHANNEL_HEALTH_BASE.Email.spamCount, -8),
    emailBouncedCount: delta(Math.round(scale(CAMPAIGNS_BASE.find((c) => c.channel === "Email").delivered, range.multiplier) * (CHANNEL_HEALTH_BASE.Email.bounceRate / 100)), -3),
  };

  const channelHealthDetail = {
    unsubscribesByChannel: CAMPAIGN_CHANNELS.map((ch) => ({ channel: ch, unsubscribed: CHANNEL_HEALTH_BASE[ch].unsubscribed || 0 })),
    emailBounceRate: CHANNEL_HEALTH_BASE.Email.bounceRate,
    emailBounceBenchmark: CHANNEL_HEALTH_BASE.Email.bounceBenchmark,
    waQualityTier: CHANNEL_HEALTH_BASE.WhatsApp.qualityTier,
    waMessagingLimit: CHANNEL_HEALTH_BASE.WhatsApp.messagingLimit,
    smsSenderHealth: { dltStatus: CHANNEL_HEALTH_BASE.SMS.dltStatus, senderId: CHANNEL_HEALTH_BASE.SMS.senderId },
    underperformingCampaigns: UNDERPERFORMING_BASE,
  };

  const deliveryRateBenchmarks = CAMPAIGN_CHANNELS.map((ch) => {
    const h = CHANNEL_HEALTH_BASE[ch];
    return {
      channel: ch,
      current: h.deliveryRate ?? h.connectRate,
      storeAvg: h.storeAvg,
      fastrrPlatformAvg: h.fastrrPlatformAvg,
      industryAvg: h.industryAvg,
      metricLabel: ch === "AI Calling" ? "Connect Rate" : "Delivery Rate",
    };
  });

  return {
    campaigns,
    overview,
    roi,
    channelSplit,
    audience,
    engagementOverview,
    engagementByChannel,
    fallbackPerformance,
    activityTimeline,
    channelHealthOverview,
    channelHealthDetail,
    deliveryRateBenchmarks,
  };
}
