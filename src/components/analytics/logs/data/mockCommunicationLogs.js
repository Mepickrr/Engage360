// Deterministic dummy dataset for the Analytics > Communication Logs tab.
// No live data — every value is derived by cycling fixed pools off the row
// index, so the output (and any test/snapshot built on it) is stable across
// renders and re-imports. No Math.random / Date.now anywhere in this file.

const ANCHOR_MS = new Date("2026-08-10T12:00:00Z").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_COUNT = 150;

const CHANNELS = ["WhatsApp", "Email", "SMS", "RCS", "AI Calling"];
const TYPES = ["Campaign", "Journey"];

// 12-slot weighted cycle: 8 successful, 1 pending, 3 failure states.
const STATUS_CYCLE = [
  "Delivered", "Delivered", "Read", "Sent", "Delivered", "Pending",
  "Failed", "Delivered", "Read", "Bounced", "Delivered", "Sent",
];

const TEMPLATES_BY_CHANNEL = {
  WhatsApp: ["order_confirmation_v2", "cod_reminder_evening", "abandoned_cart_recovery", "cashback_offer_diwali", "delivery_update_final"],
  Email: ["welcome_series_01", "invoice_receipt", "win_back_30d", "product_review_request"],
  SMS: ["otp_verification", "order_shipped_alert", "flash_sale_today"],
  RCS: ["rich_card_new_arrival", "carousel_offer_weekend"],
  "AI Calling": ["cod_confirmation_call", "feedback_survey_call", "delivery_reminder_call"],
};

const ERRORS_BY_CHANNEL = {
  WhatsApp: ["Rate limit hit", "Health Ecosystem issue", "Template not approved", "User opted out"],
  Email: ["Mailbox full", "Spam block"],
  SMS: ["DND Provider level block", "Invalid number"],
  RCS: ["Device not RCS-capable", "Agent not verified"],
  "AI Calling": ["No answer", "Call declined", "Number unreachable"],
};

const SENDER_BY_CHANNEL = {
  WhatsApp: { senderPhone: "+91 79771 12200", senderEmail: null },
  Email: { senderPhone: null, senderEmail: "orders@sellerbrand.com" },
  SMS: { senderPhone: "SELLRR", senderEmail: null },
  RCS: { senderPhone: "+91 79771 12200", senderEmail: null },
  "AI Calling": { senderPhone: "+91 79771 12200", senderEmail: null },
};

const NAME_POOL = [
  "priya.sharma", "rahul.verma", "ananya.iyer", "vikram.singh", "neha.gupta",
  "arjun.mehta", "sneha.reddy", "karan.malhotra", "divya.nair", "aditya.rao",
];

function contactForIndex(i, channel) {
  if (channel !== "Email") {
    const digits = String(9800000000 + i * 37).slice(0, 10);
    return { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, email: null };
  }
  const name = NAME_POOL[i % NAME_POOL.length];
  return { phone: null, email: `${name}${i}@gmail.com` };
}

function buildRow(i) {
  const channel = CHANNELS[i % CHANNELS.length];
  const type = TYPES[i % TYPES.length];
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
  const templates = TEMPLATES_BY_CHANNEL[channel];
  const templateName = templates[i % templates.length];
  const { phone, email } = contactForIndex(i, channel);
  const { senderPhone, senderEmail } = SENDER_BY_CHANNEL[channel];

  const isFailure = status === "Failed" || status === "Bounced";
  const errors = ERRORS_BY_CHANNEL[channel];
  const errorResponse = isFailure ? errors[i % errors.length] : null;

  // Stay within a single calendar day (0-29 days back) — never cross a day
  // boundary here, so date-range filtering (which compares whole UTC days)
  // always sees a row from the day it was assigned to.
  // Hour is always 06:00-11:59 UTC, strictly before the anchor's 12:00 UTC —
  // this keeps every row's sentAt at or before the anchor even when
  // dayOffset is 0 ("today"), so no row is ever a "future" timestamp.
  const dayOffset = i % 30;
  const sentAt = new Date(ANCHOR_MS - dayOffset * DAY_MS);
  sentAt.setUTCHours(6 + (i % 6), (i * 7) % 60, 0, 0);

  const updateOffsetMs = 60 * 1000 + (i % 180) * 60 * 1000; // 1 min to 3h later
  const updatedAt = new Date(sentAt.getTime() + updateOffsetMs);

  const isTerminalState = status === "Delivered" || status === "Read" || status === "Sent";
  const aiCallDurationSec = channel === "AI Calling" && isTerminalState ? 30 + ((i * 47) % 570) : null;

  return {
    id: `log-${String(i + 1).padStart(4, "0")}`,
    sentAt: sentAt.toISOString(),
    engageId: `ENG-${48000 + i}`,
    phone,
    email,
    type,
    templateName,
    channel,
    senderPhone,
    senderEmail,
    deliveryStatus: status,
    aiCallDurationSec,
    errorResponse,
    updatedAt: updatedAt.toISOString(),
  };
}

export const COMMUNICATION_LOGS = Array.from({ length: ROW_COUNT }, (_, i) => buildRow(i));

export const LOG_CHANNELS = CHANNELS;
export const LOG_TYPES = TYPES;
export const LOG_STATUSES = ["Sent", "Delivered", "Read", "Failed", "Bounced", "Pending"];
export const LOG_DATA_ANCHOR = new Date(ANCHOR_MS);
