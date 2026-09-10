// Deterministic mock data for the Analytics > Journey tab. Sample data only —
// no live pipeline. Scope: Fastrr Journeys (flow builder) only — not the
// Conversational-AI-bot or Voice/Calling-agent analytics (separate specs).

export const JOURNEY_CHANNELS = ["WhatsApp", "SMS", "Email"]; // SMS/Email are placeholders — Journeys is WhatsApp-only today
export const AUDIENCE_TYPES = ["Known", "Identified"];
export const ECOMMERCE_STAGES = ["Acquisition", "Cart Recovery", "Order Confirmation", "Fulfillment", "Delivery & Returns", "Reviews", "Retention", "Support"];
export const DATE_RANGES = [
  { value: "last_7_days", label: "Last 7 Days", multiplier: 1, deltaPct: 12 },
  { value: "last_30_days", label: "Last 30 Days", multiplier: 4.2, deltaPct: 18 },
  { value: "last_90_days", label: "Last 90 Days", multiplier: 12.6, deltaPct: 26 },
];

export const SUPPRESSION_REASONS = ["duplicate_active_journey", "frequency_cap", "quiet_hours_dnd", "contact_opted_out", "template_not_approved", "api_failure", "invalid_contact"];

const JOURNEYS_BASE = [
  { id: "j1", name: "Shipping Updates Automation TM", channel: "WhatsApp", status: "live", ecommerceStage: "Fulfillment", audienceTargeting: "known", triggerType: "order_shipped", totalTriggers: 112207, triggersCapped: 0, cancelledTriggers: 0, customersActive: 23046, messagesSent: 108900, delivered: 105400, read: 81200, clicked: 12400, orders: 0, revenue: 0, addToCarts: 0, productsViewed: 0, uniqueCustomers: 96500, healthFlag: "healthy" },
  { id: "j2", name: "Product Viewed Retarget", channel: "WhatsApp", status: "live", ecommerceStage: "Cart Recovery", audienceTargeting: "identified", triggerType: "product_viewed", totalTriggers: 91643, triggersCapped: 45123, cancelledTriggers: 7505, customersActive: 14414, messagesSent: 21512, delivered: 20100, read: 12800, clicked: 1422, orders: 274, revenue: 266742, addToCarts: 223, productsViewed: 99, uniqueCustomers: 18900, healthFlag: "needs-attention" },
  { id: "j3", name: "C2P — New (Manual Order)", channel: "WhatsApp", status: "live", ecommerceStage: "Order Confirmation", audienceTargeting: "both", triggerType: "manual_broadcast_entry", totalTriggers: 34917, triggersCapped: 0, cancelledTriggers: 0, customersActive: 277, messagesSent: 287, delivered: 275, read: 233, clicked: 0, orders: 104, revenue: 135777, addToCarts: 0, productsViewed: 0, uniqueCustomers: 260, healthFlag: "healthy" },
  { id: "j4", name: "C2P with Confirm & Cancel", channel: "WhatsApp", status: "live", ecommerceStage: "Order Confirmation", audienceTargeting: "known", triggerType: "order_placed", totalTriggers: 34899, triggersCapped: 0, cancelledTriggers: 0, customersActive: 30393, messagesSent: 85228, delivered: 82100, read: 71300, clicked: 0, orders: 577, revenue: 476130, addToCarts: 0, productsViewed: 0, uniqueCustomers: 32579, healthFlag: "healthy" },
  { id: "j5", name: "COD Regular Updates Flow", channel: "WhatsApp", status: "live", ecommerceStage: "Fulfillment", audienceTargeting: "known", triggerType: "order_confirmed", totalTriggers: 34889, triggersCapped: 0, cancelledTriggers: 1720, customersActive: 12761, messagesSent: 33100, delivered: 31900, read: 24600, clicked: 0, orders: 61, revenue: 58400, addToCarts: 0, productsViewed: 0, uniqueCustomers: 12100, healthFlag: "needs-attention" },
  { id: "j6", name: "WA — Delayed Order", channel: "WhatsApp", status: "live", ecommerceStage: "Delivery & Returns", audienceTargeting: "known", triggerType: "order_delivered", totalTriggers: 146, triggersCapped: 0, cancelledTriggers: 0, customersActive: 118, messagesSent: 94, delivered: 90, read: 62, clicked: 91, orders: 4, revenue: 4200, addToCarts: 2, productsViewed: 8, uniqueCustomers: 90, healthFlag: "healthy" },
  { id: "j7", name: "End to End WA Checkout", channel: "WhatsApp", status: "live", ecommerceStage: "Order Confirmation", audienceTargeting: "identified", triggerType: "cart_abandoned", totalTriggers: 585, triggersCapped: 12, cancelledTriggers: 3, customersActive: 466, messagesSent: 1144, delivered: 1080, read: 812, clicked: 245, orders: 202, revenue: 171144, addToCarts: 57, productsViewed: 63, uniqueCustomers: 466, healthFlag: "healthy" },
  { id: "j8", name: "Fastrr Flow for not ordered users", channel: "WhatsApp", status: "paused", ecommerceStage: "Retention", audienceTargeting: "both", triggerType: "scheduled_time", totalTriggers: 8725, triggersCapped: 0, cancelledTriggers: 0, customersActive: 7125, messagesSent: 12787, delivered: 12100, read: 8190, clicked: 1422, orders: 184, revenue: 229509, addToCarts: 0, productsViewed: 0, uniqueCustomers: 7125, healthFlag: "healthy" },
  { id: "j9", name: "Where's My Order — CP", channel: "WhatsApp", status: "live", ecommerceStage: "Support", audienceTargeting: "known", triggerType: "keyword_match", totalTriggers: 1555, triggersCapped: 0, cancelledTriggers: 0, customersActive: 1210, messagesSent: 2451, delivered: 2350, read: 1750, clicked: 254, orders: 0, revenue: 0, addToCarts: 0, productsViewed: 0, uniqueCustomers: 1210, healthFlag: "healthy" },
  { id: "j10", name: "Back in Stock Alert", channel: "WhatsApp", status: "draft", ecommerceStage: "Acquisition", audienceTargeting: "identified", triggerType: "back_in_stock", totalTriggers: 0, triggersCapped: 0, cancelledTriggers: 0, customersActive: 0, messagesSent: 0, delivered: 0, read: 0, clicked: 0, orders: 0, revenue: 0, addToCarts: 0, productsViewed: 0, uniqueCustomers: 0, healthFlag: "no-data-yet" },
  { id: "j11", name: "Post-Delivery Review Ask", channel: "WhatsApp", status: "live", ecommerceStage: "Reviews", audienceTargeting: "known", triggerType: "order_delivered", totalTriggers: 4200, triggersCapped: 0, cancelledTriggers: 60, customersActive: 3600, messagesSent: 4050, delivered: 3900, read: 2600, clicked: 310, orders: 0, revenue: 0, addToCarts: 0, productsViewed: 0, uniqueCustomers: 3600, healthFlag: "healthy" },
];

// Trigger-type table — one row per trigger type actually used across journeys above.
const TRIGGER_TABLE_BASE = [
  { triggerType: "order_shipped", totalFires: 112207, matchedEntries: 108900, avgLatencyMs: 4200, entryToConversionRate: 0.4, suppressed: [{ reason: "quiet_hours_dnd", count: 2100 }, { reason: "invalid_contact", count: 1207 }] },
  { triggerType: "product_viewed", totalFires: 91643, matchedEntries: 21512, avgLatencyMs: 8600, entryToConversionRate: 1.3, suppressed: [{ reason: "frequency_cap", count: 45123 }, { reason: "duplicate_active_journey", count: 25008 }] },
  { triggerType: "manual_broadcast_entry", totalFires: 34917, matchedEntries: 287, avgLatencyMs: 1200, entryToConversionRate: 36.2, suppressed: [{ reason: "contact_opted_out", count: 340 }] },
  { triggerType: "order_placed", totalFires: 34899, matchedEntries: 85228, avgLatencyMs: 2800, entryToConversionRate: 0.68, suppressed: [] },
  { triggerType: "order_confirmed", totalFires: 34889, matchedEntries: 33100, avgLatencyMs: 3100, entryToConversionRate: 0.18, suppressed: [{ reason: "quiet_hours_dnd", count: 1720 }] },
  { triggerType: "order_delivered", totalFires: 4346, matchedEntries: 3994, avgLatencyMs: 5400, entryToConversionRate: 0.09, suppressed: [{ reason: "template_not_approved", count: 60 }] },
  { triggerType: "cart_abandoned", totalFires: 585, matchedEntries: 1144, avgLatencyMs: 15200, entryToConversionRate: 17.7, suppressed: [{ reason: "frequency_cap", count: 12 }, { reason: "api_failure", count: 3 }] },
  { triggerType: "scheduled_time", totalFires: 8725, matchedEntries: 12787, avgLatencyMs: 900, entryToConversionRate: 1.4, suppressed: [] },
  { triggerType: "keyword_match", totalFires: 1555, matchedEntries: 2451, avgLatencyMs: 650, entryToConversionRate: 0, suppressed: [] },
  { triggerType: "back_in_stock", totalFires: 0, matchedEntries: 0, avgLatencyMs: null, entryToConversionRate: null, suppressed: [] },
];

const ECOMMERCE_COVERAGE_BASE = ECOMMERCE_STAGES.map((stage) => {
  const rows = JOURNEYS_BASE.filter((j) => j.ecommerceStage === stage);
  if (rows.length === 0) return { stage, journeyCount: 0, activeJourneyCount: 0, totalTriggers: 0, revenue: 0, healthFlag: "not-automated" };
  const active = rows.filter((j) => j.status === "live");
  return {
    stage,
    journeyCount: rows.length,
    activeJourneyCount: active.length,
    totalTriggers: rows.reduce((s, j) => s + j.totalTriggers, 0),
    revenue: rows.reduce((s, j) => s + j.revenue, 0),
    healthFlag: rows.some((j) => j.healthFlag === "no-data-yet") ? "no-data-yet" : rows.every((j) => j.healthFlag === "healthy") ? "healthy" : "needs-attention",
  };
});

const NODE_TYPE_BASE = {
  "Template message": { sent: 145000, delivered: 139000, read: 98000, optedOut: 320 },
  "Interactive / button": { sent: 42000, delivered: 40200, read: 31000, buttonClicked: 8400 },
  "Catalog / product card": { sent: 21500, delivered: 20600, read: 14200, productCardClicked: 3100, addToCart: 890 },
  "AI recommendation": { sent: 9800, delivered: 9400, read: 6700, aiRevenue: 184000, productCardsSent: 9800, linksClicked: 2050 },
  "Address message": { sent: 6200, delivered: 5950, read: 4400, addressConfirmed: 3800 },
};

const NUMBER_SPLIT_BASE = [
  { number: "+91 74360 36067", revenue: 1285000, orders: 890 },
  { number: "+91 74360 36065", revenue: 42000, orders: 31 },
  { number: "+91 98244 45471", revenue: 18000, orders: 12 },
  { number: "+91 98244 56831", revenue: 135000, orders: 104 },
];

const CHANNEL_HEALTH_BASE = {
  WhatsApp: { optOuts: 320, templatesRejected: 2, templatesPaused: 1, qualityTier: "High", messagingLimit: "250K/24h", deliveryRate: 96.4, storeAvg: 95.1, fastrrPlatformAvg: 94.0, industryAvg: 92.0 },
  SMS: { optOuts: 0, templatesRejected: 0, templatesPaused: 0, deliveryRate: 0, storeAvg: 95.9, fastrrPlatformAvg: 94.8, industryAvg: 93.5 },
  Email: { optOuts: 0, templatesRejected: 0, templatesPaused: 0, deliveryRate: 0, storeAvg: 94.5, fastrrPlatformAvg: 93.0, industryAvg: 96.0 },
};

const UNDERPERFORMING_BASE = [
  { journey: "Product Viewed Retarget", issue: "High frequency_cap suppression (49%)" },
  { journey: "COD Regular Updates Flow", issue: "1.7K quiet_hours_dnd cancellations" },
];

function scale(value, multiplier) {
  if (value == null) return null;
  return Math.round(value * multiplier);
}

function delta(value, deltaPct) {
  return { value, deltaPct, deltaAbsolute: Math.round(value * (deltaPct / 100)) };
}

function matches(journey, channels, audiences, stages) {
  const channelOk = channels.length === 0 || channels.includes(journey.channel);
  const audienceOk = audiences.length === 0 || audiences.some((a) => journey.audienceTargeting === a.toLowerCase() || journey.audienceTargeting === "both");
  const stageOk = stages.length === 0 || stages.includes(journey.ecommerceStage);
  return channelOk && audienceOk && stageOk;
}

export function getJourneyAnalytics(filters) {
  const { dateRange, channels = [], audiences = [], stages = [] } = filters;
  const range = DATE_RANGES.find((r) => r.value === dateRange) || DATE_RANGES[0];

  const journeys = JOURNEYS_BASE.filter((j) => matches(j, channels, audiences, stages)).map((j) => ({
    ...j,
    totalTriggers: scale(j.totalTriggers, range.multiplier),
    triggersCapped: scale(j.triggersCapped, range.multiplier),
    cancelledTriggers: scale(j.cancelledTriggers, range.multiplier),
    customersActive: scale(j.customersActive, range.multiplier),
    messagesSent: scale(j.messagesSent, range.multiplier),
    delivered: scale(j.delivered, range.multiplier),
    read: scale(j.read, range.multiplier),
    clicked: scale(j.clicked, range.multiplier),
    orders: scale(j.orders, range.multiplier),
    revenue: scale(j.revenue, range.multiplier),
    addToCarts: scale(j.addToCarts, range.multiplier),
    productsViewed: scale(j.productsViewed, range.multiplier),
    uniqueCustomers: scale(j.uniqueCustomers, range.multiplier),
    cost: Math.round(scale(j.messagesSent, range.multiplier) * 0.18),
  }));

  const revenue = journeys.reduce((s, j) => s + j.revenue, 0);
  const orders = journeys.reduce((s, j) => s + j.orders, 0);
  const totalCost = journeys.reduce((s, j) => s + j.cost, 0);

  const overview = {
    activeJourneys: delta(journeys.filter((j) => j.status === "live").length, range.deltaPct),
    pausedJourneys: delta(journeys.filter((j) => j.status === "paused").length, 0),
    draftJourneys: delta(journeys.filter((j) => j.status === "draft").length, 0),
    revenue: delta(revenue, range.deltaPct),
    orders: delta(orders, range.deltaPct - 2),
    totalCost: delta(totalCost, range.deltaPct - 4),
    deliverySuccessRate: journeys.length ? (journeys.reduce((s, j) => s + j.delivered, 0) / Math.max(1, journeys.reduce((s, j) => s + j.messagesSent, 0))) * 100 : 0,
    activeAlerts: [
      { type: "template_paused", journeyId: "j8", message: "Fastrr Flow for not ordered users is paused — template pending re-approval." },
      { type: "quality_drop", journeyId: "j5", message: "COD Regular Updates Flow saw a spike in quiet-hours cancellations." },
    ],
  };

  const revenueByChannel = JOURNEY_CHANNELS.map((ch) => ({ channel: ch, revenue: journeys.filter((j) => j.channel === ch).reduce((s, j) => s + j.revenue, 0) }));
  const ordersByChannel = JOURNEY_CHANNELS.map((ch) => ({ channel: ch, orders: journeys.filter((j) => j.channel === ch).reduce((s, j) => s + j.orders, 0) }));
  const costByChannel = JOURNEY_CHANNELS.reduce((acc, ch) => ({ ...acc, [ch]: journeys.filter((j) => j.channel === ch).reduce((s, j) => s + j.cost, 0) }), {});

  const roi = {
    totalRevenue: revenue,
    totalCost,
    roi: totalCost > 0 ? (revenue - totalCost) / totalCost : null,
    byChannel: JOURNEY_CHANNELS.map((ch) => {
      const chRevenue = revenueByChannel.find((r) => r.channel === ch).revenue;
      const chCost = costByChannel[ch];
      const hasData = chCost > 0;
      return { channel: ch, hasData, revenue: chRevenue, cost: chCost, roi: hasData ? (chRevenue - chCost) / chCost : null };
    }),
  };

  const channelSplit = { revenueByChannel, ordersByChannel, byNumber: NUMBER_SPLIT_BASE };

  const startTrigger = {
    totalTriggerFires: delta(TRIGGER_TABLE_BASE.reduce((s, t) => s + scale(t.totalFires, range.multiplier), 0), range.deltaPct),
    entryRate: (() => {
      const fires = TRIGGER_TABLE_BASE.reduce((s, t) => s + t.totalFires, 0);
      const matched = TRIGGER_TABLE_BASE.reduce((s, t) => s + t.matchedEntries, 0);
      return delta(fires > 0 ? (matched / fires) * 100 : 0, range.deltaPct - 6);
    })(),
    avgLatencyMs: delta(Math.round(TRIGGER_TABLE_BASE.filter((t) => t.avgLatencyMs != null).reduce((s, t) => s + t.avgLatencyMs, 0) / TRIGGER_TABLE_BASE.filter((t) => t.avgLatencyMs != null).length), -5),
    suppressedRate: delta((TRIGGER_TABLE_BASE.reduce((s, t) => s + t.suppressed.reduce((ss, x) => ss + x.count, 0), 0) / Math.max(1, TRIGGER_TABLE_BASE.reduce((s, t) => s + t.totalFires, 0))) * 100, 3),
    byType: TRIGGER_TABLE_BASE.map((t) => ({
      ...t,
      totalFires: scale(t.totalFires, range.multiplier),
      matchedEntries: scale(t.matchedEntries, range.multiplier),
      suppressedEntries: t.suppressed.map((s) => ({ reason: s.reason, count: scale(s.count, range.multiplier) })),
      journeysUsingThisTrigger: journeys.filter((j) => j.triggerType === t.triggerType).map((j) => j.name),
    })),
  };

  const audience = AUDIENCE_TYPES.map((type) => {
    const key = type.toLowerCase();
    const rows = journeys.filter((j) => j.audienceTargeting === key || j.audienceTargeting === "both");
    const delivered = rows.reduce((s, j) => s + j.delivered, 0);
    const engaged = rows.reduce((s, j) => s + j.read + j.clicked, 0);
    const rev = rows.reduce((s, j) => s + j.revenue, 0);
    return {
      type,
      reached: delta(rows.reduce((s, j) => s + j.uniqueCustomers, 0), range.deltaPct),
      journeysEntered: delta(rows.length, 0),
      revenue: delta(rev, range.deltaPct),
      orders: delta(rows.reduce((s, j) => s + j.orders, 0), range.deltaPct),
      engagementRate: delivered > 0 ? (engaged / delivered) * 100 : 0,
      conversionRate: delivered > 0 ? (rows.reduce((s, j) => s + j.orders, 0) / delivered) * 100 : 0,
    };
  });
  const known = audience.find((a) => a.type === "Known");
  const identified = audience.find((a) => a.type === "Identified");
  const headToHead = [
    { metric: "Revenue", knownValue: known.revenue.value, identifiedValue: identified.revenue.value },
    { metric: "Conversion Rate", knownValue: known.conversionRate, identifiedValue: identified.conversionRate },
    { metric: "Engagement Rate", knownValue: known.engagementRate, identifiedValue: identified.engagementRate },
  ].map((row) => ({ ...row, deltaBetweenSegments: row.knownValue - row.identifiedValue }));

  const totalSent = journeys.reduce((s, j) => s + j.messagesSent, 0);
  const totalDelivered = journeys.reduce((s, j) => s + j.delivered, 0);
  const totalRead = journeys.reduce((s, j) => s + j.read, 0);
  const totalClicked = journeys.reduce((s, j) => s + j.clicked, 0);
  const engagementOverview = {
    totalCustomersReached: delta(journeys.reduce((s, j) => s + j.customersActive, 0), range.deltaPct),
    uniqueCustomersReached: delta(journeys.reduce((s, j) => s + j.uniqueCustomers, 0), range.deltaPct),
    messagesSent: delta(totalSent, range.deltaPct - 3),
    delivered: totalDelivered,
    deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
    readRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
    clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
  };
  const engagementByNodeType = Object.fromEntries(
    Object.entries(NODE_TYPE_BASE).map(([node, stats]) => [
      node,
      Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, scale(v, range.multiplier)])),
    ])
  );

  // §9 activity DOES follow the date-range filter (unlike the campaign
  // spec's fixed trailing-24h chart) — Journeys are always-on, so a fixed
  // window would hide the trend a seller is trying to see.
  const days = Math.min(30, Math.round(7 * range.multiplier));
  const dayLabels = Array.from({ length: Math.min(days, 7) }, (_, i) => `Day ${i + 1}`);
  const activityOverTime = {
    messageFunnel: dayLabels.map((date, i) => {
      const wave = 0.6 + Math.sin(i / 2) * 0.3;
      const sent = Math.round(15000 * wave * range.multiplier);
      return { date, messagesSent: sent, delivered: Math.round(sent * 0.95), read: Math.round(sent * 0.72), clicked: Math.round(sent * 0.09) };
    }),
    commerceFunnel: dayLabels.map((date, i) => {
      const wave = 0.6 + Math.sin(i / 2 + 1) * 0.3;
      const views = Math.round(120 * wave * range.multiplier);
      return { date, productViews: views, addToCarts: Math.round(views * 0.35), ordersPlaced: Math.round(views * 0.12), revenue: Math.round(views * 850) };
    }),
  };

  const retention = {
    newLeadsCollected: delta(Math.round(920 * range.multiplier), range.deltaPct),
    repeatOrders: delta(Math.round(32 * range.multiplier), -14),
    repeatRevenue: delta(Math.round(48200 * range.multiplier), range.deltaPct - 8),
    firstOrderJourney: "j3",
    repeatOrderJourney: "j8",
  };

  const channelHealthOverview = {
    totalOptOuts: delta(JOURNEY_CHANNELS.reduce((s, ch) => s + (CHANNEL_HEALTH_BASE[ch].optOuts || 0), 0), -6),
    waOptOuts: delta(CHANNEL_HEALTH_BASE.WhatsApp.optOuts, -6),
    templatesRejected: delta(CHANNEL_HEALTH_BASE.WhatsApp.templatesRejected, 0),
    templatesPaused: delta(CHANNEL_HEALTH_BASE.WhatsApp.templatesPaused, 0),
    waQualityTier: CHANNEL_HEALTH_BASE.WhatsApp.qualityTier,
  };
  const channelHealthDetail = {
    unsubscribesByChannel: JOURNEY_CHANNELS.map((ch) => ({ channel: ch, unsubscribed: CHANNEL_HEALTH_BASE[ch].optOuts || 0 })),
    waQualityTier: CHANNEL_HEALTH_BASE.WhatsApp.qualityTier,
    waMessagingLimit: CHANNEL_HEALTH_BASE.WhatsApp.messagingLimit,
    underperformingJourneys: UNDERPERFORMING_BASE,
  };
  const deliveryRateBenchmarks = JOURNEY_CHANNELS.map((ch) => ({
    channel: ch,
    current: CHANNEL_HEALTH_BASE[ch].deliveryRate,
    storeAvg: CHANNEL_HEALTH_BASE[ch].storeAvg,
    fastrrPlatformAvg: CHANNEL_HEALTH_BASE[ch].fastrrPlatformAvg,
    industryAvg: CHANNEL_HEALTH_BASE[ch].industryAvg,
  }));

  return {
    journeys,
    overview,
    roi,
    channelSplit,
    startTrigger,
    audience,
    headToHead,
    ecommerceCoverage: ECOMMERCE_COVERAGE_BASE,
    engagementOverview,
    engagementByNodeType,
    activityOverTime,
    retention,
    channelHealthOverview,
    channelHealthDetail,
    deliveryRateBenchmarks,
  };
}
