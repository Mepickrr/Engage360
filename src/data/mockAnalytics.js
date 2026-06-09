// Mock analytics data used when no backend is available.
// Keyed by flow ID → { overall, nodes }

export const MOCK_ANALYTICS = {
  "seed-cart-recovery": {
    timeRange: "last_7_days",
    overall: {
      triggered:        12847,
      unique_customers: 11203,
      messages_sent:    9891,
      messages_delivered: 8742,
      messages_opened:  3218,
      revenue_inr:      1864320,
    },
    nodes: {
      n_start: {
        triggered: 12847,
        stopped:   1644,
      },
      n_delay: {
        triggered:    11203,
        success_rate: 98.2,
      },
      n_whatsapp: {
        sent:           9891,
        delivered_pct:  88.4,
        opened_pct:     36.8,
        revenue_inr:    1864320,
        cta_clicks: [
          { label: "Complete Purchase →", clicks: 2847 },
          { label: "Remind me in 1 hour",  clicks: 412  },
        ],
      },
      n_sms: {
        sent:          1149,
        delivered_pct: 76.2,
        ctr_pct:       8.3,
        revenue_inr:   48200,
      },
    },
  },
};

// Lookup helper — returns analytics for a given flow ID,
// or falls back to the seed-cart-recovery demo data.
export function getAnalytics(flowId) {
  return MOCK_ANALYTICS[flowId] ?? MOCK_ANALYTICS["seed-cart-recovery"];
}

export function getNodeAnalytics(flowId, nodeId) {
  return getAnalytics(flowId)?.nodes?.[nodeId] ?? null;
}
