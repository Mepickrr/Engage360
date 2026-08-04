// Mock analytics for the Analytics > Overview tab. All numbers are dummy data.

const DAY_LABELS_7 = ["28 Jul", "29 Jul", "30 Jul", "31 Jul", "01 Aug", "02 Aug", "03 Aug", "04 Aug"];

function trend(labels, overallSeries, fastrrSeries) {
  return labels.map((date, i) => ({ date, overall: overallSeries[i], fastrr: fastrrSeries[i] }));
}

const CHANNEL_LABELS = ["WhatsApp", "SMS", "RCS", "Email", "Instagram", "AI Calling", "AI Chatbot"];
const SERVICE_LABELS = ["Broadcast", "Journey"];

const OVERVIEW_ANALYTICS = {
  last_7_days: {
    revenue: {
      overall: { value: 21000000, deltaPct: 8, deltaAbs: 1555556 },
      fastrr: { value: 3610000, deltaPct: 3, deltaAbs: 105146, pctOfOverall: 17.0 },
    },
    orders: {
      overall: { value: 24550, deltaPct: 9, deltaAbs: 2026 },
      fastrr: { value: 3750, deltaPct: 5, deltaAbs: 179, pctOfOverall: 15.2 },
    },
    roi: {
      value: 10.85,
      totalRevenue: 3460000,
      totalCost: 320000,
      byChannel: {
        whatsapp: 10.85,
        email: 0,
        instagram: 0,
        sms: 0,
        rcs: 0,
        aiCalling: 0,
        aiChatbot: 0,
      },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 2060000 },
        { label: "Journey", value: 1545000 },
      ],
      byChannel: [
        { label: "WhatsApp", value: 3350000 },
        { label: "SMS", value: 120000 },
        { label: "RCS", value: 60000 },
        { label: "Email", value: 40000 },
        { label: "Instagram", value: 25000 },
        { label: "AI Calling", value: 10000 },
        { label: "AI Chatbot", value: 5000 },
      ],
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 2050 },
        { label: "Journey", value: 1650 },
      ],
      byChannel: [
        { label: "WhatsApp", value: 3400 },
        { label: "SMS", value: 180 },
        { label: "RCS", value: 90 },
        { label: "Email", value: 50 },
        { label: "Instagram", value: 20 },
        { label: "AI Calling", value: 6 },
        { label: "AI Chatbot", value: 4 },
      ],
    },
    revenueTrend: trend(
      DAY_LABELS_7,
      [3000000, 3000000, 3050000, 3080000, 3200000, 4000000, 3800000, 1500000],
      [500000, 500000, 500000, 500000, 500000, 680000, 650000, 250000]
    ),
    ordersTrend: trend(
      DAY_LABELS_7,
      [3000, 3400, 3600, 3200, 3100, 4500, 3400, 1500],
      [450, 510, 540, 480, 465, 675, 510, 150]
    ),
    customersAcquired: {
      overall: { value: 32600, deltaPct: 3, deltaAbs: 1050 },
      fastrr: { value: 32600, deltaPct: 3, deltaAbs: 1050 },
      bySource: [
        { source: "Campaigns", count: 30600 },
        { source: "Journeys", count: 2000 },
        { source: "Data upload", count: 3 },
      ],
    },
    customersTrend: trend(
      DAY_LABELS_7,
      [0, 4600, 4900, 5350, 4950, 5150, 5100, 2600],
      [0, 4600, 4900, 5350, 4950, 5150, 5100, 2600]
    ),
  },

  today: {
    revenue: {
      overall: { value: 3200000, deltaPct: 6, deltaAbs: 181132 },
      fastrr: { value: 520000, deltaPct: 4, deltaAbs: 20000, pctOfOverall: 16.3 },
    },
    orders: {
      overall: { value: 3500, deltaPct: 7, deltaAbs: 228 },
      fastrr: { value: 540, deltaPct: 4, deltaAbs: 21, pctOfOverall: 15.4 },
    },
    roi: {
      value: 9.6,
      totalRevenue: 500000,
      totalCost: 52000,
      byChannel: { whatsapp: 9.6, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 300000 },
        { label: "Journey", value: 220000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [480000, 18000, 9000, 6000, 4000, 2000, 1000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 300 },
        { label: "Journey", value: 240 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [490, 26, 13, 7, 3, 1, 0][i] })),
    },
    revenueTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [200000, 600000, 900000, 700000, 500000, 300000], [12000, 90000, 140000, 110000, 100000, 68000]),
    ordersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [220, 640, 980, 760, 540, 360], [30, 110, 160, 120, 100, 40]),
    customersAcquired: {
      overall: { value: 4600, deltaPct: 2, deltaAbs: 90 },
      fastrr: { value: 4600, deltaPct: 2, deltaAbs: 90 },
      bySource: [
        { source: "Campaigns", count: 4300 },
        { source: "Journeys", count: 290 },
        { source: "Data upload", count: 1 },
      ],
    },
    customersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [400, 900, 1200, 1000, 700, 400], [400, 900, 1200, 1000, 700, 400]),
  },

  yesterday: {
    revenue: {
      overall: { value: 2950000, deltaPct: -3, deltaAbs: -91237 },
      fastrr: { value: 480000, deltaPct: -2, deltaAbs: -9796, pctOfOverall: 16.3 },
    },
    orders: {
      overall: { value: 3250, deltaPct: -4, deltaAbs: -135 },
      fastrr: { value: 495, deltaPct: -3, deltaAbs: -15, pctOfOverall: 15.2 },
    },
    roi: {
      value: 9.1,
      totalRevenue: 470000,
      totalCost: 51600,
      byChannel: { whatsapp: 9.1, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 280000 },
        { label: "Journey", value: 200000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [440000, 17000, 8000, 5500, 3500, 1800, 900][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 280 },
        { label: "Journey", value: 215 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [450, 24, 11, 6, 3, 1, 0][i] })),
    },
    revenueTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [190000, 560000, 850000, 660000, 470000, 280000], [10000, 82000, 130000, 100000, 92000, 62000]),
    ordersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [200, 600, 920, 710, 500, 320], [28, 100, 150, 112, 92, 38]),
    customersAcquired: {
      overall: { value: 4300, deltaPct: -1, deltaAbs: -40 },
      fastrr: { value: 4300, deltaPct: -1, deltaAbs: -40 },
      bySource: [
        { source: "Campaigns", count: 4000 },
        { source: "Journeys", count: 299 },
        { source: "Data upload", count: 1 },
      ],
    },
    customersTrend: trend(["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"], [380, 850, 1150, 950, 660, 380], [380, 850, 1150, 950, 660, 380]),
  },

  this_month: {
    revenue: {
      overall: { value: 90000000, deltaPct: 12, deltaAbs: 9642857 },
      fastrr: { value: 15400000, deltaPct: 6, deltaAbs: 871698, pctOfOverall: 1.7 },
    },
    orders: {
      overall: { value: 105200, deltaPct: 11, deltaAbs: 10425 },
      fastrr: { value: 16100, deltaPct: 7, deltaAbs: 1053, pctOfOverall: 15.3 },
    },
    roi: {
      value: 11.4,
      totalRevenue: 14800000,
      totalCost: 1300000,
      byChannel: { whatsapp: 11.4, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 8800000 },
        { label: "Journey", value: 6600000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [14300000, 500000, 260000, 170000, 110000, 45000, 15000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 8800 },
        { label: "Journey", value: 7300 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [14600, 780, 380, 210, 90, 25, 15][i] })),
    },
    revenueTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [21000000, 23000000, 24500000, 21500000],
      [3400000, 3900000, 4200000, 3900000]
    ),
    ordersTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [24500, 26800, 28200, 25700],
      [3700, 4100, 4400, 3900]
    ),
    customersAcquired: {
      overall: { value: 140000, deltaPct: 9, deltaAbs: 11600 },
      fastrr: { value: 140000, deltaPct: 9, deltaAbs: 11600 },
      bySource: [
        { source: "Campaigns", count: 131000 },
        { source: "Journeys", count: 8900 },
        { source: "Data upload", count: 100 },
      ],
    },
    customersTrend: trend(["Wk 1", "Wk 2", "Wk 3", "Wk 4"], [32000, 35500, 38200, 34300], [32000, 35500, 38200, 34300]),
  },

  last_month: {
    revenue: {
      overall: { value: 80400000, deltaPct: 4, deltaAbs: 3092308 },
      fastrr: { value: 14530000, deltaPct: 2, deltaAbs: 284902, pctOfOverall: 1.8 },
    },
    orders: {
      overall: { value: 94800, deltaPct: 3, deltaAbs: 2761 },
      fastrr: { value: 15050, deltaPct: 2, deltaAbs: 295, pctOfOverall: 15.9 },
    },
    roi: {
      value: 10.9,
      totalRevenue: 13900000,
      totalCost: 1275000,
      byChannel: { whatsapp: 10.9, email: 0, instagram: 0, sms: 0, rcs: 0, aiCalling: 0, aiChatbot: 0 },
    },
    revenueSplit: {
      byService: [
        { label: "Broadcast", value: 8300000 },
        { label: "Journey", value: 6230000 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [13500000, 470000, 240000, 160000, 100000, 40000, 12000][i] })),
    },
    ordersSplit: {
      byService: [
        { label: "Broadcast", value: 8250 },
        { label: "Journey", value: 6800 },
      ],
      byChannel: CHANNEL_LABELS.map((label, i) => ({ label, value: [13800, 720, 350, 190, 80, 22, 13][i] })),
    },
    revenueTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [19800000, 20500000, 21000000, 19100000],
      [3500000, 3650000, 3800000, 3580000]
    ),
    ordersTrend: trend(
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      [23100, 24200, 24800, 22700],
      [3600, 3800, 3950, 3700]
    ),
    customersAcquired: {
      overall: { value: 128400, deltaPct: 5, deltaAbs: 6100 },
      fastrr: { value: 128400, deltaPct: 5, deltaAbs: 6100 },
      bySource: [
        { source: "Campaigns", count: 120000 },
        { source: "Journeys", count: 8300 },
        { source: "Data upload", count: 100 },
      ],
    },
    customersTrend: trend(["Wk 1", "Wk 2", "Wk 3", "Wk 4"], [29800, 31200, 32100, 30800], [29800, 31200, 32100, 30800]),
  },
};

export function getOverviewAnalytics(timeRange) {
  return OVERVIEW_ANALYTICS[timeRange] ?? OVERVIEW_ANALYTICS.last_7_days;
}

export const OVERVIEW_SERVICE_LABELS = SERVICE_LABELS;
export const OVERVIEW_CHANNEL_LABELS = CHANNEL_LABELS;
