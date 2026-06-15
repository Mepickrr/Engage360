// Pre-built demo flows. These are always shown in the flows list and are
// loadable in the builder without a backend. When a user opens and saves one,
// the builder will create a real persisted copy.

export const SEED_FLOWS = [
  {
    id: "seed-cart-recovery",
    name: "Cart Recovery — WhatsApp + SMS Fallback",
    description:
      "Sends a WhatsApp message 1 hour after cart abandonment. Automatically falls back to SMS if WhatsApp delivery fails.",
    status: "active",
    lifecycle_stage: "Conversion",
    health: "healthy",
    channels: ["whatsapp", "sms"],
    performance: {
      entered: 12847,
      completed: 3218,
      conversion_rate: 25.1,
      revenue_inr: 1864320,
    },
    updated_at: null,

    // ── Canvas nodes ──────────────────────────────────────────────────────────
    nodes: [
      // 1. Start Trigger — cart_abandoned event
      {
        id: "n_start",
        type: "start-trigger",
        position: { x: 300, y: 40 },
        data: {
          config: {
            type: "event",
            event: "cart_abandoned",
            filters: [
              {
                id: "fg_seed_1",
                combinator: "AND",
                conditions: [
                  { property: "cart_value", operator: "greater_than", value: "0" },
                ],
              },
            ],
            audience: null,
            re_entry: false,
            frequency: "once_per_24h",
          },
        },
      },

      // 2. Delay — wait 1 hour before messaging
      {
        id: "n_delay",
        type: "wait",
        position: { x: 300, y: 230 },
        data: {
          label: "Wait 1 hour",
          delayTab: "duration",
          forValue: 1,
          forUnit: "hours",
        },
      },

      // 3. WhatsApp — cart recovery template
      {
        id: "n_whatsapp",
        type: "whatsapp",
        position: { x: 300, y: 410 },
        data: {
          label: "Send WhatsApp",
          template: {
            id: "tpl_cart_recovery_wa",
            name: "cart_recovery_v2",
            status: "Active",
            category: "Marketing",
            header: { type: "image", bg: "#10B981" },
            body: "Hi {{first_name}}! 👋\n\nYou left something in your cart. Complete your purchase and save *10%* with code SAVE10!\n\n🛒 Cart value: ₹{{order_amount}}\n⏰ Offer expires in 2 hours",
            footer: "Reply STOP to unsubscribe",
            buttons: [
              { type: "url",         label: "Complete Purchase →", url: "{{checkout_url}}" },
              { type: "quick_reply", label: "Remind me in 1 hour" },
            ],
          },
          variableMap: {
            "first_name":   ["customer.first_name"],
            "order_amount": ["flow.orderAmount"],
            "checkout_url": ["flow.paymentLink"],
          },
          wabaNumberId: "waba_1",
          templateType: "Marketing",
          markAsMarketing: true,
          utm: { enabled: true, source: "whatsapp", medium: "journey", campaign: "cart_recovery" },
          aiBestTime: false,
          smartRetry: { enabled: true, mode: "smart", smartWindow: "72", manualSlots: [] },
          fallback: { enabled: false, template: null },
          outputConfig: {
            routingMode: "delivery_branches",
            deliveryOutputs: ["delivery_failed"],
            wiredPorts: ["delivery_failed"],
          },
        },
      },

      // 4. SMS fallback — WhatsApp delivery failed path
      {
        id: "n_sms",
        type: "sms",
        position: { x: 300, y: 1000 },
        data: {
          label: "SMS Fallback",
          template: {
            id: "sms_cart_recovery",
            name: "cart_recovery_sms",
            approvedId: "1507167539658137253",
            gateway: "trustsignal_trans",
            text: "Hi {{customer.first_name}}, your cart worth Rs.{{flow.orderAmount}} is waiting! Complete purchase: {{flow.paymentLink}} - Reply STOP to opt out.",
          },
          variableMap: {},
          outputConfig: {
            routingMode: "next_step",
            deliveryOutputs: [],
            wiredPorts: [],
          },
          utm: { enabled: false, source: "sms", medium: "journey", campaign: "cart_recovery" },
          aiBestTime: false,
          smartRetry: { enabled: false, mode: "smart" },
        },
      },
    ],

    // ── Edges ─────────────────────────────────────────────────────────────────
    edges: [
      {
        id: "e1",
        source: "n_start",
        target: "n_delay",
        type: "smoothstep",
        markerEnd: { type: "arrowclosed", color: "#94A3B8" },
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
      },
      {
        id: "e2",
        source: "n_delay",
        target: "n_whatsapp",
        type: "smoothstep",
        markerEnd: { type: "arrowclosed", color: "#94A3B8" },
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
      },
      {
        id: "e3",
        source: "n_whatsapp",
        sourceHandle: "delivery_failed",
        target: "n_sms",
        type: "smoothstep",
        label: "Delivery Failed",
        markerEnd: { type: "arrowclosed", color: "#EF4444" },
        style: { stroke: "#EF4444", strokeWidth: 1.5 },
        labelStyle: { fontSize: 11, fill: "#EF4444", fontWeight: 600 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: "#ffffff" },
      },
    ],
  },
];

// Fast lookup by id
export const SEED_FLOW_MAP = Object.fromEntries(SEED_FLOWS.map((f) => [f.id, f]));
