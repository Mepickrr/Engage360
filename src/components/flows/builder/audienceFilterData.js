/**
 * audienceFilterData.js
 * Static data for Step 2 (Audience Qualification) of the Flow Trigger Modal.
 * Provides attribute groups, event groups, affinity values, segments, and operators.
 */

// ── Operator sets by data type ────────────────────────────────
export const OPERATORS_BY_TYPE = {
  string:   ["equals","not equals","contains","does not contain","starts with","ends with","exists","does not exist","is one of","is not one of"],
  integer:  ["equals","not equals","greater than","less than","≥","≤","between","exists","does not exist"],
  float:    ["equals","not equals","greater than","less than","≥","≤","between","exists","does not exist"],
  datetime: ["before","after","on","between","in the last","more than N days ago","exists","does not exist"],
  boolean:  [], // rendered as True/False toggle
  enum:     ["is","is not","is one of","is not one of"],
  time:     ["before","after","between","equals"],
};

export function getOperatorsForType(dataType) {
  return OPERATORS_BY_TYPE[dataType] || OPERATORS_BY_TYPE.string;
}

// ── Attribute helper ──────────────────────────────────────────
const a = (key, label, dataType, description = "", platform = "") =>
  ({ key, label, dataType, description, platform });

// ── Attribute groups ──────────────────────────────────────────
export const ATTRIBUTE_GROUPS = [
  {
    label: "Audience Type",
    key: "audience_type",
    attributes: [
      a("audience.all",              "All",                          "enum",   "All users in the system"),
      a("audience.known",            "Known Users",                  "enum",   "Users known to the seller"),
      a("audience.engage_identified","Engage Identified (Anonymous)","enum",   "Anonymous users identified by Engage 360"),
    ],
  },
  {
    label: "Predictive Insights",
    key: "predictive",
    attributes: [
      a("predict.best_time_email",   "Best Time to Send Email",      "time",   "ML-computed optimal email send hour",     "Email"),
      a("predict.best_time_wa",      "Best Time to Send WhatsApp",   "time",   "ML-computed optimal WhatsApp send window","WhatsApp"),
      a("predict.best_time_sms",     "Best Time to Send SMS",        "time",   "Optimal SMS delivery window",             "SMS"),
      a("predict.best_time_push",    "Best Time to Send Push",       "time",   "Optimal push notification window",        "Push"),
      a("predict.preferred_channel", "Most Preferred Channel",       "enum",   "Channel the user most frequently engages with"),
    ],
  },
  {
    label: "Shiprocket Buyer Attributes",
    key: "shiprocket",
    attributes: [
      a("sr.quality_first_shopper",  "Quality First Shopper",        "boolean"),
      a("sr.bargain_hunter",         "Bargain Hunter",               "boolean"),
      a("sr.full_price_averse",      "Full Price Averse",            "boolean"),
      a("sr.economy_shopper",        "Economy Shopper",              "boolean"),
      a("sr.value_seeker",           "Value Seeker",                 "boolean"),
      a("sr.high_value_shopper",     "High Value Shopper",           "boolean"),
      a("sr.seen_three_years_ago",   "Seen Three Years Ago",         "boolean"),
      a("sr.d_o",                    "D_O",                          "float"),
      a("sr.t_o",                    "T_O",                          "float"),
      a("sr.metro_o",                "Metro_O",                      "float"),
      a("sr.cod_o",                  "COD_O",                        "float"),
      a("sr.cancel_o",               "Cancel_O",                     "float"),
      a("sr.rto_o",                  "RTO_O",                        "float"),
      a("sr.weekday_o",              "Weekday_O",                    "float"),
      a("sr.weekend_o",              "Weekend_O",                    "float"),
      a("sr.discount_affinity",      "Discount Affinity",            "float"),
      a("sr.prepaid_affinity",       "Prepaid Affinity",             "float"),
      a("sr.cancel_risk",            "Cancel Risk",                  "float"),
      a("sr.rto_risk",               "RTO Risk",                     "float"),
      a("sr.disc_perc",              "Disc Perc",                    "float"),
      a("sr.lifetime_orders",        "Lifetime Orders",              "integer"),
      a("sr.lifetime_orders_del",    "Lifetime Orders Delivered",    "integer"),
      a("sr.lifetime_orders_cod",    "Lifetime Orders COD",          "integer"),
      a("sr.lifetime_orders_pre",    "Lifetime Orders Prepaid",      "integer"),
      a("sr.lifetime_aov",           "Lifetime AOV",                 "float",  "Average order value lifetime"),
      a("sr.three_months_orders",    "3-Month Orders",               "integer"),
      a("sr.three_months_del",       "3-Month Delivered",            "integer"),
      a("sr.three_months_aov",       "3-Month AOV",                  "float"),
      a("sr.six_months_orders",      "6-Month Orders",               "integer"),
      a("sr.six_months_aov",         "6-Month AOV",                  "float"),
      a("sr.twelve_months_orders",   "12-Month Orders",              "integer"),
      a("sr.twelve_months_aov",      "12-Month AOV",                 "float"),
      a("sr.ytd_orders",             "YTD Orders",                   "integer"),
      a("sr.prior_year_orders",      "Prior Year Orders",            "integer"),
      a("sr.active_online_shoppers", "Active Online Shoppers",       "boolean"),
      a("sr.frequent_shoppers",      "Frequent Shoppers",            "boolean"),
      a("sr.preferred_category",     "Preferred Category",           "string", "User's most purchased product category"),
      a("sr.total_engaged_brands",   "Total Engaged Brands",         "integer"),
      a("sr.buying_time",            "Buying Time",                  "time"),
      a("sr.buying_hour",            "Buying Hour",                  "integer"),
      a("sr.amount_spent_last_7d",   "Amount Spent Last 7D",         "float"),
      a("sr.gender",                 "Gender",                       "enum",   "User gender","All"),
    ],
  },
  {
    label: "Lifecycle",
    key: "lifecycle",
    attributes: [
      a("lc.first_seen",             "First Seen",                   "datetime","When the user first interacted"),
      a("lc.last_seen",              "Last Seen",                    "datetime","Most recent activity timestamp"),
      a("lc.ltv",                    "LTV (Lifetime Value)",          "float",   "Total revenue attributed to this user"),
      a("lc.num_conversions",        "No. of Conversions",           "integer", "Total completed conversion events"),
      a("lc.num_sessions",           "No. of Sessions",              "integer", "Total app/web sessions"),
      a("lc.creation_source",        "User Creation Source",         "enum",    "Shopify, API, SDK, manual, etc."),
    ],
  },
  {
    label: "Acquisition",
    key: "acquisition",
    attributes: [
      a("acq.template_name",         "Template Name",                "string"),
      a("acq.utm_parameter",         "UTM Parameter",                "string",  "UTM Source, Medium, Campaign"),
      a("acq.first_install_source",  "First App Install Source",     "string"),
      a("acq.referral_source",       "Referral Source",              "enum",    "direct, organic, paid, affiliate"),
    ],
  },
  {
    label: "Install",
    key: "install",
    attributes: [
      a("inst.install_status",       "Install Status",               "string"),
      a("inst.uninstall_time",       "Uninstall Time",               "datetime"),
    ],
  },
  {
    label: "Reachability",
    key: "reachability",
    attributes: [
      a("reach.push",                "Reachability Push",            "string"),
      a("reach.push_android",        "Reachability Push Android",    "string"),
      a("reach.push_ios",            "Reachability Push iOS",        "string"),
      a("reach.push_tv",             "Reachability Push TV",         "string"),
      a("reach.push_web",            "Reachability Push Web",        "string"),
      a("reach.sms_status",          "SMS Subscription Status",      "string"),
      a("reach.webpush_page_url",    "Web Push Subscription Page URL","string"),
      a("reach.webpush_page_status", "Web Push Subscription Page Status","string"),
    ],
  },
  {
    label: "Localization",
    key: "localization",
    attributes: [
      a("loc.city",                  "Last Known City",              "string"),
      a("loc.country",               "Last Known Country",           "string",  "ISO 3166 country code"),
      a("loc.state",                 "Last Known State",             "string"),
      a("loc.pincode",               "Last Known Pincode",           "string"),
      a("loc.tz_offset",             "User Time Zone Offset (Mins)", "integer", "Offset from UTC in minutes"),
    ],
  },
  {
    label: "Email Attributes",
    key: "email",
    attributes: [
      a("em.optin_status",           "Email Opt-in Status",          "string"),
      a("em.hard_bounce",            "Hard Bounce",                  "string"),
      a("em.spam",                   "Spam",                         "string"),
      a("em.unsubscribe",            "Unsubscribe",                  "string"),
      a("em.consent_ad_pers",        "Consent for Ad Personalization","string"),
      a("em.consent_ad_data",        "Consent for Ad User Data",     "string"),
      a("em.email",                  "Email (Standard)",             "string"),
    ],
  },
  {
    label: "Device Data",
    key: "device",
    attributes: [
      a("dev.mobile_user",           "Mobile User",                  "boolean", "Most recent session was on mobile"),
      a("dev.os_ios",                "OS Version iOS",               "string"),
      a("dev.browser",               "Browser Details",              "string"),
      a("dev.gaid",                  "Google Advertising ID (Android)","string"),
      a("dev.idfa",                  "Advertising Identifier iOS/Windows","string"),
    ],
  },
  {
    label: "Standard Attributes",
    key: "standard",
    attributes: [
      a("std.id",                    "ID",                           "string"),
      a("std.first_name",            "First Name",                   "string"),
      a("std.last_name",             "Last Name",                    "string"),
      a("std.name",                  "Name",                         "string"),
      a("std.locale_country",        "Locale Country",               "string"),
      a("std.locale_language",       "Locale Language",              "string"),
      a("std.mobile_number",         "Mobile Number Standard",       "string"),
      a("std.wa_status",             "WhatsApp Subscription Status", "string"),
    ],
  },
  {
    label: "Tracked Custom Attributes",
    key: "custom",
    attributes: [
      a("custom.tag_webengage",      "Tag_webengage",                "string"),
      a("custom.order_status_page",  "Order_status_page",            "string"),
    ],
  },
];

// Flat lookup map
export const ATTRIBUTE_MAP = {};
for (const group of ATTRIBUTE_GROUPS) {
  for (const attr of group.attributes) {
    ATTRIBUTE_MAP[attr.key] = attr;
  }
}

export function getAttributesByGroup() {
  return ATTRIBUTE_GROUPS;
}

// ── Behavior / Affinity event groups ─────────────────────────
const ev = (key, label, description = "") => ({ key, label, description });

export const BEHAVIOR_EVENT_GROUPS = [
  {
    label: "E-Commerce",
    events: [
      ev("order_placed",          "Order Placed",           "User completes a purchase order"),
      ev("checkout_started",      "Checkout Started",       "User initiates checkout flow"),
      ev("product_viewed",        "Product Viewed",         "User views a product detail page"),
      ev("add_to_cart",           "Add to Cart",            "User adds a product to their cart"),
      ev("cart_abandoned",        "Cart Abandoned",         "Cart not converted within abandonment window"),
      ev("product_abandoned",     "Product Abandoned",      "Product viewed but not added to cart"),
      ev("purchased_a_product",   "Purchased a Product",    "Specific product purchase confirmed"),
      ev("order_delivered",       "Order Delivered",        "Full order delivery confirmed"),
      ev("order_cancelled",       "Order Cancelled",        "Order cancellation event"),
      ev("order_refunded",        "Order Refunded",         "Refund processed on an order"),
      ev("product_delivered",     "Product Delivered",      "Individual product delivered"),
      ev("collection_viewed",     "Collection Viewed",      "User views a product collection page"),
      ev("customer_created",      "Customer Created",       "New customer profile created"),
      ev("keyword_searched",      "Keyword Searched",       "User performs site search"),
    ],
  },
  {
    label: "Channel Engagement",
    events: [
      ev("email_sent",                  "Email Sent"),
      ev("email_delivered",             "Email Delivered"),
      ev("email_opened",                "Email Opened"),
      ev("email_clicked",               "Email Clicked"),
      ev("email_unsubscribed",          "Email Unsubscribed"),
      ev("email_spam_complained",       "Email Spam Complained"),
      ev("email_hard_bounced",          "Email Hard Bounced"),
      ev("email_soft_bounced",          "Email Soft Bounced"),
      ev("esp_dropped_request",         "ESP Dropped Request"),
      ev("wa_sent",                     "WhatsApp Message Sent"),
      ev("wa_delivered",                "WhatsApp Message Delivered"),
      ev("wa_read",                     "WhatsApp Message Read"),
      ev("wa_clicked",                  "WhatsApp Message Clicked"),
      ev("wa_failed",                   "WhatsApp Message Failed"),
      ev("sms_sent",                    "SMS Sent"),
      ev("sms_delivered",               "SMS Delivered"),
      ev("sms_bounced",                 "SMS Bounced"),
      ev("sms_unsubscribed",            "SMS Unsubscribed"),
      ev("sms_clicked",                 "SMS Clicked"),
      ev("push_sent",                   "Push Notification Sent"),
      ev("push_delivered",              "Push Notification Delivered"),
      ev("push_clicked",                "Push Notification Clicked"),
      ev("push_dismissed",              "Push Notification Dismissed"),
      ev("webpush_allowed",             "Allowed Web Push Subscription"),
      ev("webpush_denied",              "Denied Web Push Subscription"),
      ev("webpush_dismissed",           "Dismissed Web Push Subscription"),
      ev("push_subscribed",             "Subscribed to Push"),
      ev("webpush_unsubscribed",        "Unsubscribed from Web Push"),
    ],
  },
  {
    label: "App & Site Lifecycle",
    events: [
      ev("app_opened",            "App/Site Opened",        "User opens app or visits site"),
      ev("push_id_register",      "Push ID Register Android"),
      ev("user_logout",           "User Logout"),
      ev("user_merged",           "User Merged"),
      ev("viewed_web_page",       "Viewed Web Page"),
      ev("app_installed",         "App Installed"),
      ev("user_reinstall",        "User Reinstall"),
      ev("app_session_ended",     "App/Site Session Ended"),
      ev("inapp_shown",           "Mobile In-App Shown"),
      ev("inapp_clicked",         "Mobile In-App Clicked"),
      ev("inapp_closed",          "Mobile In-App Closed"),
      ev("inapp_auto_dismissed",  "Mobile In-App Auto Dismissed"),
      ev("webpush_shown",         "Web Push Shown"),
      ev("webpush_clicked_event", "Web Push Clicked"),
      ev("flow_trip_conversion",  "Flow Trip Conversion"),
    ],
  },
  {
    label: "Campaign Activity",
    events: [
      ev("card_campaign_clicked",       "Card Campaign Clicked"),
      ev("card_campaign_delivered",     "Card Campaign Delivered"),
      ev("card_campaign_sent",          "Card Campaign Sent"),
      ev("notification_clicked_android","Notification Clicked Android"),
      ev("notification_clicked_ios",    "Notification Clicked iOS"),
      ev("rcs_delivered",               "RCS Delivered"),
      ev("rcs_message_clicked",         "RCS Message Clicked"),
      ev("rcs_message_read",            "RCS Message Read"),
      ev("rcs_sent",                    "RCS Sent"),
      ev("response_submitted",          "Response Submitted"),
      ev("user_added_control",          "User Added to Control Group"),
      ev("user_entered_flow",           "User Entered Flow"),
      ev("user_exited_flow",            "User Exited Flow"),
    ],
  },
  {
    label: "Uninstall Events",
    events: [
      ev("uninstalled",           "Uninstalled from Device"),
      ev("user_reinstall_ev",     "User ReInstall"),
    ],
  },
];

export function getEventsByCategory() {
  return BEHAVIOR_EVENT_GROUPS;
}

// Flat event map for quick lookup
export const EVENT_MAP = {};
for (const group of BEHAVIOR_EVENT_GROUPS) {
  for (const event of group.events) {
    EVENT_MAP[event.key] = event;
  }
}

// ── Affinity dimension values ─────────────────────────────────
export const AFFINITY_DIMENSION_VALUES = {
  ACTIVITY_NAME:    ["search","browse","checkout","purchase","view_product","add_to_cart"],
  CONTENT_CATEGORY: null, // free text
  CHANNEL:          ["Email","WhatsApp","SMS","Push","Web Push"],
  TIME_OF_DAY:      ["Morning (06:00–11:59)","Afternoon (12:00–16:59)","Evening (17:00–20:59)","Night (21:00–05:59)"],
  DAY_OF_WEEK:      ["Weekday","Weekend"],
  DEVICE_TYPE:      ["Mobile","Desktop","Tablet"],
};

export const AFFINITY_DIMENSIONS = [
  { key: "ACTIVITY_NAME",    label: "Activity Name",    stringType: true  },
  { key: "CONTENT_CATEGORY", label: "Content Category", stringType: true  },
  { key: "CHANNEL",          label: "Channel",          stringType: false },
  { key: "TIME_OF_DAY",      label: "Time of Day",      stringType: false },
  { key: "DAY_OF_WEEK",      label: "Day of Week",      stringType: false },
  { key: "DEVICE_TYPE",      label: "Device Type",      stringType: false },
];

export function getAffinityValues(dimension) {
  return AFFINITY_DIMENSION_VALUES[dimension] || null;
}

// ── Mock segment list ─────────────────────────────────────────
// TODO: replace with real API call to GET /api/segments
export const MOCK_SEGMENTS = [
  { id: "seg_001", name: "High Value Customers",           userCount: 12450,  type: "dynamic", updatedAt: "2 hours ago"  },
  { id: "seg_002", name: "Lapsed Users — 60d",             userCount:  8200,  type: "dynamic", updatedAt: "1 day ago"    },
  { id: "seg_003", name: "500_Sellers_Cohort_3_30 march 2026", userCount: 500, type: "static", updatedAt: "30 Mar 2026" },
  { id: "seg_004", name: "Cart Abandoners — Last 7d",      userCount:  3100,  type: "dynamic", updatedAt: "30 min ago"   },
  { id: "seg_005", name: "New Signups — This Month",       userCount:  1840,  type: "dynamic", updatedAt: "1 hour ago"   },
  { id: "seg_006", name: "VIP Buyers — Lifetime AOV > 2k", userCount:   480,  type: "dynamic", updatedAt: "6 hours ago"  },
  { id: "seg_007", name: "Offline Export — April 2026",    userCount:  9999,  type: "static",  updatedAt: "01 Apr 2026"  },
];
