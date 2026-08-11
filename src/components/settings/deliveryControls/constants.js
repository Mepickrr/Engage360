export const PERIOD_OPTIONS = ["Hour", "Day", "Week"];
export const GAP_UNIT_OPTIONS = ["Minutes", "Hours", "Days"];
export const DND_TYPE_OPTIONS = ["All", "Promotional"];

const BLANK_TYPE_CONFIG = { enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" };

function configByTypeFor(types, overrides = {}) {
  return types.reduce((acc, t) => ({ ...acc, [t]: { ...BLANK_TYPE_CONFIG, ...(overrides[t] || {}) } }), {});
}

export const FREQUENCY_TYPE_OPTIONS = ["All", "Utility", "Marketing"];

export const DEFAULT_FREQUENCY_CAPPING_ROWS = [
  {
    id: "all",
    channel: "All Channels",
    types: ["All"],
    selectedType: "All",
    configByType: configByTypeFor(["All"], { All: { enabled: true, limit: 20000 } }),
  },
  {
    id: "whatsapp",
    channel: "WhatsApp",
    types: FREQUENCY_TYPE_OPTIONS,
    selectedType: "All",
    configByType: configByTypeFor(FREQUENCY_TYPE_OPTIONS),
  },
  {
    id: "email",
    channel: "Email",
    types: FREQUENCY_TYPE_OPTIONS,
    selectedType: "All",
    configByType: configByTypeFor(FREQUENCY_TYPE_OPTIONS),
  },
  {
    id: "sms",
    channel: "SMS",
    types: FREQUENCY_TYPE_OPTIONS,
    selectedType: "All",
    configByType: configByTypeFor(FREQUENCY_TYPE_OPTIONS),
  },
  {
    id: "rcs",
    channel: "RCS",
    types: FREQUENCY_TYPE_OPTIONS,
    selectedType: "All",
    configByType: configByTypeFor(FREQUENCY_TYPE_OPTIONS),
  },
  {
    id: "mobilepush",
    channel: "Mobile Push",
    types: ["All"],
    selectedType: "All",
    configByType: configByTypeFor(["All"]),
  },
];

export const DEFAULT_DND_ROWS = [
  { id: "whatsapp", channel: "WhatsApp", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "email", channel: "Email", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "sms", channel: "SMS", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "rcs", channel: "RCS", enabled: false, type: "All", start: "22:00", end: "07:00" },
  { id: "mobilepush", channel: "Mobile Push", enabled: false, type: "All", start: "22:00", end: "08:00" },
];

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
