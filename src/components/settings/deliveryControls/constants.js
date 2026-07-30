export const PERIOD_OPTIONS = ["Hour", "Day", "Week"];
export const GAP_UNIT_OPTIONS = ["Minutes", "Hours", "Days"];
export const DND_TYPE_OPTIONS = ["All", "Promotional"];

export const DEFAULT_FREQUENCY_CAPPING_ROWS = [
  { id: "all-all", channel: "All Channels", type: "All", enabled: true, limit: 20000, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "whatsapp-all", channel: "WhatsApp", type: "All", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "whatsapp-utility", channel: "WhatsApp", type: "Utility", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "whatsapp-marketing", channel: "WhatsApp", type: "Marketing", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "email-all", channel: "Email", type: "All", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "email-utility", channel: "Email", type: "Utility", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "email-marketing", channel: "Email", type: "Marketing", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "sms-all", channel: "SMS", type: "All", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "sms-utility", channel: "SMS", type: "Utility", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "sms-marketing", channel: "SMS", type: "Marketing", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "rcs-all", channel: "RCS", type: "All", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "rcs-utility", channel: "RCS", type: "Utility", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "rcs-marketing", channel: "RCS", type: "Marketing", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
  { id: "mobilepush-all", channel: "Mobile Push", type: "All", enabled: false, limit: 0, limitPeriod: "Day", gapEnabled: false, gap: 0, gapUnit: "Hours" },
];

export const DEFAULT_DND_ROWS = [
  { id: "whatsapp", channel: "WhatsApp", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "email", channel: "Email", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "sms", channel: "SMS", enabled: false, type: "All", start: "22:00", end: "08:00" },
  { id: "rcs", channel: "RCS", enabled: false, type: "All", start: "22:00", end: "07:00" },
  { id: "mobilepush", channel: "Mobile Push", enabled: false, type: "All", start: "22:00", end: "08:00" },
];

export const DEFAULT_SUBSCRIBE_KEYWORDS = ["START", "SUBSCRIBE", "hi"];
export const DEFAULT_UNSUBSCRIBE_KEYWORDS = ["STOP", "UNSUBSCRIBE"];

export const DEFAULT_SUBSCRIBE_REPLY =
  "✅ You’re now subscribed to our WhatsApp updates 🎉\nGet ready to receive exclusive offers, latest updates & more.";

export const DEFAULT_UNSUBSCRIBE_REPLY =
  "You’ve successfully unsubscribed from our WhatsApp updates ❌\nWe’ll miss you here, but don’t worry — you can type START/SUBSCRIBE anytime to join back!";
