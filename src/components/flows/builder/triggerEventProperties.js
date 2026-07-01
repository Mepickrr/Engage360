/**
 * triggerEventProperties.js
 *
 * All event property data sourced from the spec CSV files.
 * Provides getPropertiesForEvent(), getEvaluateComputations(), TRIGGER_FAMILIES.
 */

// ─── operator shorthand sets ──────────────────────────────────
const S  = ["Is","Is Not","Contains","Doesn't Contain","Starts With","Ends With","Exists","Doesn't Exist"];
const N  = ["Is","Is Not","Greater Than","Less Than","Greater Than or Equal","Less Than or Equal","Between","Exists","Doesn't Exist"];
const DT = ["Before","After","On","Between","Exists","Doesn't Exist"];
const P  = ["Is","Is Not"]; // Type-B Shopify picker

// helper builders
const a = (name, key, type, ops, notes = "") => ({ name, key, type, inputType: "A", pickerType: null, ops, notes });
const b = (name, key, pickerType)              => ({ name, key, type: "String", inputType: "B", pickerType, ops: P, notes: "" });
const bool = (name, key)                       => ({ name, key, type: "Boolean", inputType: "A", pickerType: null, ops: null, notes: "" });

// ─── raw property catalogue, keyed by normalised event name ──
const CATALOGUE = {

  // ── Ecommerce / Shopping behaviour ───────────────────────────
  "app/website open": [
    a("Page URL",         "page_url",       "String",  S),
    a("Referrer URL",     "referrer_url",   "String",  S),
    a("UTM Source",       "utm_source",     "String",  S),
    a("UTM Medium",       "utm_medium",     "String",  S),
    a("Device Type",      "device_type",    "String",  S),
  ],

  "product viewed": [
    a("Product Price",    "product_price",  "Numeric", N),
    a("Currency",         "currency",       "String",  S),
    a("Page URL",         "page_url",       "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Collection Name",  "collection_name","collection_picker"),
    b("Collection ID",    "collection_id",  "collection_picker"),
    b("Variant Id",       "variant_id",     "sku_picker"),
  ],

  "add to cart": [
    a("Quantity",         "quantity",       "Numeric", N),
    a("Cart Value",       "cart_value",     "Numeric", N),
    a("Product Price",    "product_price",  "Numeric", N),
    a("Currency",         "currency",       "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Collection Name",  "collection_name","collection_picker"),
    b("Collection ID",    "collection_id",  "collection_picker"),
    b("Variant Id",       "variant_id",     "sku_picker"),
  ],

  "remove from cart": [
    a("Quantity",             "quantity",             "Numeric", N),
    a("Cart Value After",     "cart_value_after",     "Numeric", N),
    a("Product Price",        "product_price",        "Numeric", N),
    a("Currency",             "currency",             "String",  S),
    a("Removal Source",       "removal_source",       "String",  S),
    a("Cart Id",              "cart_id",              "String",  S),
    a("Session Id",           "session_id",           "String",  S),
    a("Page URL",             "page_url",             "String",  S),
    b("Product Name",         "product_name",         "product_picker"),
    b("Product Id",           "product_id",           "product_picker"),
    b("SKU ID",               "sku_id",               "sku_picker"),
    b("Collection Name",      "collection_name",      "collection_picker"),
    b("Collection ID",        "collection_id",        "collection_picker"),
    b("Variant Id",           "variant_id",           "sku_picker"),
  ],

  "search": [
    a("Search Term",      "search_term",    "String",  S),
  ],

  "search / keyword search": [
    a("Search Term",      "search_term",    "String",  S),
  ],

  "sign up": [
    a("Signup Source",    "signup_source",  "String",  S, "e.g. google, facebook, direct, referral"),
    a("Signup Channel",   "signup_channel", "String",  S, "e.g. web, app, whatsapp"),
    a("Referral Code",    "referral_code",  "String",  S),
    a("Email",            "email",          "String",  S),
    a("Phone Number",     "phone_number",   "String",  S),
    bool("Email Opt-in",  "email_optin"),
    bool("WhatsApp Opt-in","wa_optin"),
  ],

  "purchased a product": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Product Price",    "product_price",  "Numeric", N),
    a("Customer Id",      "customer_id",    "String",  S),
    a("Variant Id",       "variant_id",     "String",  S),
    a("Total Amount",     "total_amount",   "Numeric", N),
    a("User Amount",      "user_amount",    "Numeric", N),
    bool("Is COD",        "is_cod"),
    a("Discount Code",    "discount_code",  "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  "checkout started": [
    a("Cart Value",       "cart_value",     "Numeric", N),
    a("Total Number of Items","item_count", "Numeric", N),
    a("Discount Code",    "discount_code",  "String",  S),
    a("Shipping Country", "shipping_country","String", S),
    bool("Is COD",        "is_cod"),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Collection Name",  "collection_name","collection_picker"),
    b("Collection ID",    "collection_id",  "collection_picker"),
  ],

  "added to wishlist": [
    a("Product Price",    "product_price",  "Numeric", N),
    a("Variant Id",       "variant_id",     "String",  S),
    a("Variant Name",     "variant_name",   "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("Collection Name",  "collection_name","collection_picker"),
    b("Collection ID",    "collection_id",  "collection_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  "review created": [], // Judge.me third-party — no payload control

  // ── Ecommerce / Order ─────────────────────────────────────────
  "order placed": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Product Price",    "product_price",  "Numeric", N),
    a("Customer Id",      "customer_id",    "String",  S),
    a("Variant Id",       "variant_id",     "String",  S),
    a("Total Amount",     "total_amount",   "Numeric", N),
    a("User Amount",      "user_amount",    "Numeric", N, "Amount paid after discounts"),
    bool("Is COD",        "is_cod"),
    a("Discount Code",    "discount_code",  "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  "draft order placed": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Total Amount",     "total_amount",   "Numeric", N),
    a("Discount Code",    "discount_code",  "String",  S),
    bool("Is COD",        "is_cod"),
    a("Customer Id",      "customer_id",    "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
  ],

  "custom sdk event": [], // Merchant-defined payload — free text key input

  // ── Post-purchase / Fulfilment ────────────────────────────────
  "order shipped": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Tracking Number",  "tracking_number","String",  S),
    a("Courier / Carrier","courier_name",   "String",  S),
    a("Shipping Price",   "shipping_price", "Numeric", N),
    a("Total Amount",     "total_amount",   "Numeric", N),
    bool("Is COD",        "is_cod"),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  "out for delivery": [
    a("Order Id",                "order_id",               "String",   S),
    a("Order Name",              "order_name",             "String",   S),
    a("Carrier Name",            "carrier_name",           "String",   S),
    a("Estimated Delivery Date", "estimated_delivery_date","DateTime", DT),
    a("Total Amount",            "total_amount",           "Numeric",  N),
    bool("Is COD",               "is_cod"),
    b("Product Name",            "product_name",           "product_picker"),
    b("Product Id",              "product_id",             "product_picker"),
    b("SKU ID",                  "sku_id",                 "sku_picker"),
  ],

  "product delivered": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Tracking Number",  "tracking_number","String",  S),
    a("Courier Name",     "courier_name",   "String",  S),
    a("Delivery Date",    "delivery_date",  "DateTime",DT),
    a("Total Amount",     "total_amount",   "Numeric", N),
    bool("Is COD",        "is_cod"),
    a("Customer Id",      "customer_id",    "String",  S),
    a("Shipping Price",   "shipping_price", "Numeric", N),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
  ],

  "order delivered": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Tracking Number",  "tracking_number","String",  S),
    a("Delivery Date",    "delivery_date",  "DateTime",DT),
    a("Total Amount",     "total_amount",   "Numeric", N),
    bool("Is COD",        "is_cod"),
    a("Courier Name",     "courier_name",   "String",  S),
    a("Customer Id",      "customer_id",    "String",  S),
  ],

  "order delay": [
    a("Order Id",               "order_id",              "String",  S),
    a("Order Name",             "order_name",            "String",  S),
    a("Delay Reason",           "delay_reason",          "String",  S, "e.g. weather, logistics issue"),
    a("Original Delivery Date", "original_delivery_date","DateTime",DT),
    a("New ETA",                "new_eta",               "DateTime",DT),
    a("Total Amount",           "total_amount",          "Numeric", N),
    bool("Is COD",              "is_cod"),
    b("Product Name",           "product_name",          "product_picker"),
    b("Product Id",             "product_id",            "product_picker"),
  ],

  "order cancelled": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Cancel Reason",    "cancel_reason",  "String",  S),
    a("Total Amount",     "total_amount",   "Numeric", N),
    a("Refund Amount",    "refund_amount",  "Numeric", N),
    bool("Is COD",        "is_cod"),
    a("Customer Id",      "customer_id",    "String",  S),
    a("Discount Code",    "discount_code",  "String",  S),
    a("Cancelled At",     "cancelled_at",   "DateTime",DT),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
  ],

  "refund issued": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Refund Amount",    "refund_amount",  "Numeric", N),
    a("Refund Reason",    "refund_reason",  "String",  S, "e.g. damaged, wrong item, customer request"),
    a("Refund Type",      "refund_type",    "String",  S, "e.g. full, partial"),
    bool("Is COD",        "is_cod"),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  "returned": [
    a("Order Id",         "order_id",       "String",  S),
    a("Order Name",       "order_name",     "String",  S),
    a("Return Reason",    "return_reason",  "String",  S, "e.g. wrong size, not as described, damaged"),
    a("Return Status",    "return_status",  "String",  S, "e.g. initiated, received, refunded"),
    a("Refund Amount",    "refund_amount",  "Numeric", N),
    a("Total Amount",     "total_amount",   "Numeric", N),
    bool("Is COD",        "is_cod"),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Order Tag",        "order_tag",      "order_tag_picker"),
  ],

  // ── Segment and state ─────────────────────────────────────────
  "segment entry": [],
  "segment exit":  [],

  // ── Communication / Flow state ────────────────────────────────
  "flow completed": [
    a("Flow Id",          "flow_id",        "String",  S),
    a("Flow Name",        "flow_name",      "String",  S),
  ],

  "flow exited early": [
    a("Flow Id",          "flow_id",        "String",  S),
    a("Flow Name",        "flow_name",      "String",  S),
    a("Exit Reason",      "exit_reason",    "String",  S, "e.g. cancel_trigger, admin_stop, error"),
  ],

  "communication": [
    a("Template Id",      "template_id",    "String",  S),
    a("Template Name",    "template_name",  "String",  S),
    a("Channel",          "channel",        "String",  P, "e.g. whatsapp, email, sms, push"),
    a("Flow Id",          "flow_id",        "String",  S),
    a("Flow Name",        "flow_name",      "String",  S),
    a("Delivery Status",  "delivery_status","String",  P, "e.g. delivered, read, clicked, failed"),
  ],

  "communication (template)": [
    a("Template Id",      "template_id",    "String",  S),
    a("Template Name",    "template_name",  "String",  S),
    a("Channel",          "channel",        "String",  P, "e.g. whatsapp, email, sms, push"),
    a("Flow Id",          "flow_id",        "String",  S),
    a("Flow Name",        "flow_name",      "String",  S),
    a("Delivery Status",  "delivery_status","String",  P, "e.g. delivered, read, clicked, failed"),
  ],

  // ── Inbound message / WhatsApp ────────────────────────────────
  "whatsapp message received": [
    a("Message Content",  "message_content","String",  S),
    a("Phone Number",     "phone_number",   "String",  S),
    a("Message Type",     "message_type",   "String",  P, "text, image, video, document, audio, location"),
    a("WABA Number",      "waba_number",    "String",  P),
  ],

  "keyword match": [
    a("Matched Keyword",  "matched_keyword","String",  S),
    a("Message Content",  "message_content","String",  S),
    a("Phone Number",     "phone_number",   "String",  S),
  ],

  "click-to-whatsapp ad": [
    a("Ad Id",            "ad_id",          "String",  S),
    a("Ad Name",          "ad_name",        "String",  S),
    a("Campaign Id",      "campaign_id",    "String",  S),
    a("Campaign Name",    "campaign_name",  "String",  S),
    a("Phone Number",     "phone_number",   "String",  S),
  ],

  "button reply received": [
    a("Button Text",      "button_text",    "String",  S),
    a("Button Id",        "button_id",      "String",  S),
    a("Phone Number",     "phone_number",   "String",  S),
    a("Template Name",    "template_name",  "String",  S),
  ],

  // ── Inbound message / Instagram ───────────────────────────────
  "dm received": [
    a("Message Content",  "message_content","String",  S),
    a("Sender Username",  "sender_username","String",  S),
    a("Message Type",     "message_type",   "String",  P, "text, image, reel_share, story_reply"),
  ],

  "dm received (instagram)": [
    a("Message Content",  "message_content","String",  S),
    a("Sender Username",  "sender_username","String",  S),
    a("Message Type",     "message_type",   "String",  P, "text, image, reel_share, story_reply"),
  ],

  "comment received": [
    a("Comment Text",     "comment_text",   "String",  S),
    a("Post Id",          "post_id",        "String",  S),
    a("Sender Username",  "sender_username","String",  S),
    a("Post Type",        "post_type",      "String",  P, "reel, image, carousel"),
  ],

  "story tag": [
    a("Story Id",         "story_id",       "String",  S),
    a("Tagged By Username","tagged_by",     "String",  S),
  ],

  // ── Inbound message / Email ───────────────────────────────────
  "email received": [
    a("Subject",          "subject",        "String",  S),
    a("From Address",     "from_address",   "String",  S),
    a("Email Body",       "email_body",     "String",  ["Contains","Doesn't Contain"], "Substring match only"),
  ],

  "email unsubscribed": [
    a("Email",            "email",          "String",  S),
    a("Unsubscribe Reason","unsubscribe_reason","String",P, "e.g. manual, spam_complaint, bounce"),
    a("List Id",          "list_id",        "String",  S),
  ],

  // ── Date and time / User date attributes ─────────────────────
  "birthday": [
    a("Days Before",      "days_before",    "Numeric", N, "0 = on birthday, 3 = 3 days before"),
    a("Birth Month",      "birth_month",    "Numeric", ["Is","Is Not","Between"], "1-12"),
  ],

  "anniversary": [
    a("Anniversary Type", "anniversary_type","String", P, "e.g. first_order, signup, custom"),
    a("Years Since",      "years_since",    "Numeric", N),
    a("Days Before",      "days_before",    "Numeric", N),
  ],

  "custom date attribute": [
    a("Attribute Name",   "attribute_name", "String",  P, "Name of the customer profile date field"),
    a("Days Before",      "days_before",    "Numeric", N),
    a("Days After",       "days_after",     "Numeric", N),
  ],

  // ── Date and time / Inactivity and win-back ───────────────────
  "inactivity threshold": [
    a("Inactive For (Days)","inactive_days","Numeric", N),
    a("Inactivity Type",  "inactivity_type","String",  P, "no_order, no_visit, no_engagement"),
    a("Last Order Channel","last_order_channel","String",P),
  ],

  "n days after event": [
    a("Reference Event",  "reference_event","String",  P, "e.g. order_placed, product_delivered"),
    a("Days After",       "days_after",     "Numeric", N),
  ],

  // ── Date and time / Product ───────────────────────────────────
  "back in stock": [
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
    b("Collection Name",  "collection_name","collection_picker"),
  ],

  "price drop": [
    a("New Price",        "new_price",      "Numeric", N),
    a("Discount Percentage","discount_pct", "Numeric", N),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],

  // ── Webhook and API / External signals ───────────────────────
  "webhook trigger": "special", // free-text key input
  "api trigger":     "special",

  // ── Broadcast ─────────────────────────────────────────────────
  // Schedule-based, no event attribute filters
  "saved segment":   [],
  "csv upload":      [],
  "dynamic filter":  [],
  "all subscribers": [],

  // ── Agent ─────────────────────────────────────────────────────
  "task created": [
    a("Ticket Id",        "ticket_id",      "String",  S),
    a("Ticket Title",     "ticket_title",   "String",  S),
    a("Assigned Agent",   "assigned_agent", "String",  P),
    a("Team",             "team",           "String",  P),
    a("Priority",         "priority",       "String",  P, "low, medium, high, urgent"),
    a("Channel",          "channel",        "String",  P, "whatsapp, email, instagram, chat"),
    a("Created By",       "created_by",     "String",  P, "agent, ai_agent, customer"),
  ],

  "task closed": [
    a("Ticket Id",        "ticket_id",      "String",  S),
    a("Resolution Status","resolution_status","String",P, "resolved, unresolved, escalated"),
    a("Closed By",        "closed_by",      "String",  P, "agent, ai_agent, auto_close"),
    a("Handle Time (Minutes)","handle_time_mins","Numeric",N),
    a("CSAT Score",       "csat_score",     "Numeric", N),
    a("Channel",          "channel",        "String",  P),
  ],

  "task stage change": [
    a("Ticket Id",        "ticket_id",      "String",  S),
    a("Previous Stage",   "previous_stage", "String",  P, "e.g. open, pending, escalated"),
    a("New Stage",        "new_stage",      "String",  P, "e.g. in_progress, resolved, closed"),
    a("Changed By",       "changed_by",     "String",  P, "agent, ai_agent, automation"),
  ],

  "reassigned agent": [
    a("Ticket Id",        "ticket_id",      "String",  S),
    a("Previous Agent",   "previous_agent", "String",  P),
    a("New Agent",        "new_agent",      "String",  P),
    a("Reassignment Reason","reassignment_reason","String",["Is","Is Not","Exists","Doesn't Exist"],"e.g. capacity, expertise, escalation"),
  ],

  "ticket assigned to agent": [
    a("Ticket Id",        "ticket_id",      "String",  S),
    a("Assigned Agent",   "assigned_agent", "String",  P),
    a("Team",             "team",           "String",  P),
    a("Priority",         "priority",       "String",  P, "low, medium, high, urgent"),
    a("Channel",          "channel",        "String",  P),
    a("Assignment Type",  "assignment_type","String",  P, "manual, auto_assign, ai_routed"),
  ],

  "abandoned payment": [
    a("Product Price",    "product_price",  "Numeric", N),
    a("Currency",         "currency",       "String",  S),
    a("UTM Source",       "utm_source",     "String",  S),
    a("UTM Medium",       "utm_medium",     "String",  S),
    a("UTM Campaign",     "utm_campaign",   "String",  S),
    b("Product Name",     "product_name",   "product_picker"),
    b("Product Id",       "product_id",     "product_picker"),
    b("SKU ID",           "sku_id",         "sku_picker"),
  ],
};

// ─── Evaluate computations ───────────────────────────────────
const EVALUATE_CATALOGUE = {
  "product viewed": [
    { key: "last_product_viewed",      label: "Last product viewed",                outputType: "Product object" },
    { key: "first_product_viewed",     label: "First product viewed",               outputType: "Product object" },
    { key: "most_viewed_product",      label: "Most frequently viewed product",      outputType: "Product object" },
    { key: "max_viewed_price",         label: "Max price of products viewed",        outputType: "Numeric" },
  ],
  "add to cart": [
    { key: "last_cart_product",        label: "Last product added to cart",          outputType: "Product object" },
    { key: "first_cart_product",       label: "First product added to cart",         outputType: "Product object" },
    { key: "last_removed_product",     label: "Last product removed from cart",      outputType: "Product object" },
    { key: "first_removed_product",    label: "First product removed from cart",     outputType: "Product object" },
    { key: "max_sku_in_cart",          label: "Maximum product SKU in cart",         outputType: "String (SKU)" },
    { key: "max_cart_price",           label: "Max price of products in cart",       outputType: "Numeric" },
  ],
  "remove from cart": [
    { key: "last_removed_product",     label: "Last product removed from cart",      outputType: "Product object" },
    { key: "first_removed_product",    label: "First product removed from cart",     outputType: "Product object" },
    { key: "max_sku_removed",          label: "Maximum product SKU removed",         outputType: "String (SKU)" },
  ],
};

// ─── Compatibility families ───────────────────────────────────
// Scheduled events (date-and-time, broadcast) cannot be paired with any other.
// External and Agent are self-pairing only.
export const TRIGGER_FAMILIES = {
  commerce:    { headers: ["ecommerce", "post-purchase"],     canPairWith: ["commerce", "engagement"] },
  engagement:  { headers: ["segment-and-state", "communication"], canPairWith: ["engagement", "commerce"] },
  inbound:     { headers: ["inbound-message"],                canPairWith: ["inbound"] },
  scheduled:   { headers: ["date-and-time", "broadcast"],     canPairWith: [] },   // cannot be paired
  external:    { headers: ["webhook-and-api"],                canPairWith: ["external"] },
  agent:       { headers: ["agent"],                          canPairWith: ["agent"] },
};

export function getFamilyForHeader(headerKey) {
  for (const [family, cfg] of Object.entries(TRIGGER_FAMILIES)) {
    if (cfg.headers.includes(headerKey)) return family;
  }
  return null;
}

export function isScheduledHeader(headerKey) {
  return TRIGGER_FAMILIES.scheduled.headers.includes(headerKey);
}

// ─── Public API ───────────────────────────────────────────────
export function getPropertiesForEvent(eventCategory) {
  const key = (eventCategory || "").toLowerCase().trim();
  const result = CATALOGUE[key];
  if (result === undefined) return [];
  if (result === "special")  return "special";
  return result;
}

export function getEvaluateComputations(eventCategory) {
  const key = (eventCategory || "").toLowerCase().trim();
  return EVALUATE_CATALOGUE[key] || null;
}

// Mock Shopify picker data (replace with real API calls in production)
export const MOCK_SHOPIFY_DATA = {
  product_picker: [
    { id: "p001", name: "Vitamin C Serum", sku: "SKU-001", image: null },
    { id: "p002", name: "Aloe Vera Moisturiser", sku: "SKU-002", image: null },
    { id: "p003", name: "Sunscreen SPF 50", sku: "SKU-003", image: null },
    { id: "p004", name: "Night Repair Cream", sku: "SKU-004", image: null },
    { id: "p005", name: "Lip Butter Rose", sku: "SKU-005", image: null },
  ],
  sku_picker: [
    { id: "SKU-001-A", name: "Vitamin C Serum — 30ml",   productId: "p001" },
    { id: "SKU-001-B", name: "Vitamin C Serum — 50ml",   productId: "p001" },
    { id: "SKU-002-A", name: "Aloe Vera Moisturiser — 100g", productId: "p002" },
    { id: "SKU-003-A", name: "Sunscreen SPF 50 — 50ml",  productId: "p003" },
    { id: "SKU-004-A", name: "Night Repair Cream — 30g", productId: "p004" },
  ],
  collection_picker: [
    { id: "c001", name: "Skincare Essentials" },
    { id: "c002", name: "Wellness Range" },
    { id: "c003", name: "Summer Collection" },
    { id: "c004", name: "New Arrivals" },
  ],
  order_tag_picker: [
    { id: "vip",     name: "VIP" },
    { id: "cod",     name: "COD" },
    { id: "express", name: "Express Delivery" },
    { id: "gift",    name: "Gift Order" },
    { id: "return",  name: "Return Initiated" },
  ],
};
