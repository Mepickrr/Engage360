export const PERIOD_OPTIONS = ["Hour", "Day", "Month"];
export const GAP_UNIT_OPTIONS = ["Minutes", "Hours", "Days"];
export const DND_TYPE_OPTIONS = ["Utility", "Marketing"];

export const FREQUENCY_TYPE_OPTIONS = ["All", "Utility", "Marketing"];
export const FREQUENCY_MODE_OPTIONS = ["All", "Campaign", "Journey"];

// Frequency Capping is a flat list of rules, grouped by channel for display.
// A channel can carry several rules — e.g. WhatsApp/All/All capped at 10 per
// month AND a separate WhatsApp/All/All capped at 1 per day — so a seller can
// layer a loose long-window cap with a tight short-window one. The unique key
// is (channel, type, mode, time range): two "All / All" rules are fine as
// long as one is Day and the other is Month — only an exact repeat of all
// three fields races itself. Each dropdown only ever offers combinations
// that don't collide with another rule already on the channel, so a
// duplicate can't be created in the first place — no error state needed.
export const FREQUENCY_CHANNELS = [
  { id: "all", channel: "All Channels", types: ["All"] },
  { id: "whatsapp", channel: "WhatsApp", types: FREQUENCY_TYPE_OPTIONS },
  { id: "email", channel: "Email", types: FREQUENCY_TYPE_OPTIONS },
  { id: "sms", channel: "SMS", types: FREQUENCY_TYPE_OPTIONS },
  { id: "rcs", channel: "RCS", types: FREQUENCY_TYPE_OPTIONS },
  { id: "mobilepush", channel: "Mobile Push", types: ["All"] },
];

export function frequencyRuleId(channelId, type, mode, limitPeriod) {
  return `${channelId}__${type}__${mode}__${limitPeriod}`;
}

function blankRule(channelId, type, mode, limitPeriod, overrides = {}) {
  return {
    id: frequencyRuleId(channelId, type, mode, limitPeriod),
    channelId,
    type,
    mode,
    enabled: false,
    limit: 0,
    limitPeriod,
    gapEnabled: false,
    gap: 0,
    gapUnit: "Hours",
    ...overrides,
  };
}

export const DEFAULT_FREQUENCY_CAPPING_RULES = FREQUENCY_CHANNELS.map((c) =>
  c.id === "all"
    ? blankRule(c.id, "All", "All", "Day", { enabled: true, limit: 20000 })
    : blankRule(c.id, c.types[0], "All", "Day")
);

export const DND_CHANNELS = [
  { id: "whatsapp", channel: "WhatsApp", start: "22:00", end: "08:00" },
  { id: "email", channel: "Email", start: "22:00", end: "08:00" },
  { id: "sms", channel: "SMS", start: "22:00", end: "08:00" },
  { id: "rcs", channel: "RCS", start: "22:00", end: "07:00" },
  { id: "mobilepush", channel: "Mobile Push", start: "22:00", end: "08:00" },
];

// Each channel carries one row per Type — Utility and Marketing DND windows
// are independent, so a seller can (for example) go quiet on Marketing
// sends overnight while still allowing Utility/transactional messages through.
export const DEFAULT_DND_ROWS = DND_CHANNELS.flatMap((c) =>
  DND_TYPE_OPTIONS.map((type) => ({
    id: `${c.id}-${type.toLowerCase()}`,
    channelId: c.id,
    channel: c.channel,
    type,
    enabled: false,
    start: c.start,
    end: c.end,
  }))
);

export const JOURNEY_CAP_EVENT_POOL = [
  "Back in Stock",
  "Price Drop",
  "Segment Entry",
  "Segment Exit",
  "Abandoned Cart",
  "Abandoned Checkout",
  "Abandoned Product",
  "On Site Pop-up Phone Number",
  "Add to Cart",
  "Added to Wishlist",
  "Address Filled",
  "App/Website Open",
  "Checkout Started",
  "Payment Completed",
  "Payment Failed",
  "Product Viewed",
  "Purchased a Product",
  "Remove from Cart",
  "Review Created",
  "Request Review",
  "Search",
  "Sign Up",
];

// Journey Entry Capping is a flat list of independent rules — each rule is
// { id, label, enabled, limit, selectedEvents }. A rule with one event behaves
// like the old "Same Start Trigger" cap; a rule with several events behaves
// like the old "Across Start Trigger" shared pool. An event belonging to
// multiple rules must satisfy all of them (all-must-allow) to enter a journey.
export const DEFAULT_EVENT_CAP_RULES = [];
export const DEFAULT_RULE_LIMIT = 1;

// Campaign Throttling Limits — per-channel send-speed caps applied while a
// campaign is dispatching. Each row's `limit` starts at 0/disabled; sellers
// opt in per channel and set a value between `min` and `max`.
export const DEFAULT_THROTTLING_ROWS = [
  { id: "push", label: "Push", unit: "Push notifications per minute", max: 1000000, min: 60000, defaultSpeed: 100000, enabled: false, limit: 0 },
  { id: "smsRcs", label: "SMS & RCS", unit: "SMS & RCS per minute", max: 200000, min: 60000, defaultSpeed: 60000, enabled: false, limit: 0 },
  { id: "email", label: "Email", unit: "Email per minute", max: 225000, min: 1000, defaultSpeed: 60000, enabled: false, limit: 0 },
  { id: "whatsapp", label: "WhatsApp", unit: "WhatsApp per minute", max: 200000, min: 10000, defaultSpeed: 60000, enabled: false, limit: 0 },
  { id: "connectors", label: "Connectors", unit: "Connectors per minute", max: 200000, min: 60000, defaultSpeed: 60000, enabled: false, limit: 0 },
];

export const DEFAULT_SUBSCRIBE_KEYWORDS = ["START", "SUBSCRIBE", "hi"];
export const DEFAULT_UNSUBSCRIBE_KEYWORDS = ["STOP", "UNSUBSCRIBE"];

export const DEFAULT_SUBSCRIBE_REPLY =
  "✅ You’re now subscribed to our WhatsApp updates 🎉\nGet ready to receive exclusive offers, latest updates & more.";

export const DEFAULT_UNSUBSCRIBE_REPLY =
  "You’ve successfully unsubscribed from our WhatsApp updates ❌\nWe’ll miss you here, but don’t worry — you can type START/SUBSCRIBE anytime to join back!";
