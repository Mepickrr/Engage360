export const ONSITE_TEAL = "#14B8A6";

// ── Display types ──────────────────────────────────────────────
export const DISPLAY_TYPES = [
  {
    id: "popup",
    label: "Popup",
    emoji: "🪟",
    desc: "Full-attention overlay for offers, lead gen and announcements",
    popular: true,
  },
  {
    id: "banner",
    label: "Banner",
    emoji: "📢",
    desc: "Top or bottom bar for sale alerts, cookie notices and countdowns",
    popular: false,
  },
  {
    id: "nudge",
    label: "Nudge",
    emoji: "💬",
    desc: "Subtle corner message for feedback, subscriptions or soft CTAs",
    popular: false,
  },
];

// ── Platform options ───────────────────────────────────────────
export const PLATFORM_OPTIONS = [
  { id: "web",        label: "Web",         icon: "🌐" },
  { id: "mobile_web", label: "Mobile Web",  icon: "📱" },
  { id: "android",    label: "Android",     icon: "🤖" },
  { id: "ios",        label: "iOS",         icon: "🍎" },
];

// ── Trigger types ──────────────────────────────────────────────
export const TRIGGER_TYPES = [
  { id: "page_load",    label: "On Page / Screen Load",  desc: "Show when a page or screen loads" },
  { id: "session_start",label: "On Session Start",       desc: "Show when user opens the app or site" },
  { id: "custom_event", label: "On Custom Event",        desc: "Show when a specific event fires" },
  { id: "exit_intent",  label: "On Exit Intent",         desc: "Show when user moves to close tab (web only)" },
];

// ── Output delivery options ────────────────────────────────────
export const ONSITE_DELIVERY_OPTIONS = [
  { id: "next_step",  label: "Next Step",    isDefault: true  },
  { id: "shown",      label: "Shown",        isDefault: false },
  { id: "cta_clicked",label: "CTA Clicked",  isDefault: false },
  { id: "dismissed",  label: "Dismissed",    isDefault: false },
  { id: "timed_out",  label: "Timed Out",    isDefault: false },
];

// ── Prebuilt templates ─────────────────────────────────────────
export const MOCK_ONSITE_TEMPLATES = [
  {
    id: "osm_001",
    name: "Cart Recovery Popup",
    displayType: "popup",
    useCase: "Promotions & Sales",
    thumbnailBg: "#FEF3C7",
    thumbnailAccent: "#F59E0B",
    platforms: ["web", "mobile_web"],
    status: "Active",
    lastUpdated: "2025-05-14",
    blocks: [
      { type: "image",  src: null },
      { type: "title",  content: "Still thinking it over?" },
      { type: "text",   content: "Your cart is waiting. Complete your order and get {{discount}}% off!" },
      { type: "button", label: "Complete My Order", url: "{{cart_url}}", style: "primary" },
      { type: "text",   content: "No thanks", style: "link" },
    ],
  },
  {
    id: "osm_002",
    name: "Email Capture — 10% Off",
    displayType: "popup",
    useCase: "Lead Gen",
    thumbnailBg: "#EDE9FE",
    thumbnailAccent: "#7C3AED",
    platforms: ["web"],
    status: "Active",
    lastUpdated: "2025-05-10",
    blocks: [
      { type: "title",  content: "Get 10% off your first order" },
      { type: "text",   content: "Enter your email below to unlock the discount." },
      { type: "form",   fields: ["email"], cta: "Claim My 10% Off" },
    ],
  },
  {
    id: "osm_003",
    name: "Flash Sale Banner",
    displayType: "banner",
    useCase: "Promotions & Sales",
    thumbnailBg: "#FEE2E2",
    thumbnailAccent: "#EF4444",
    platforms: ["web", "mobile_web"],
    status: "Active",
    lastUpdated: "2025-05-08",
    blocks: [
      { type: "text",      content: "⚡ Flash Sale — 40% off everything today only!" },
      { type: "button",    label: "Shop Now", url: "{{sale_url}}", style: "primary" },
      { type: "countdown", endsAt: null },
    ],
  },
  {
    id: "osm_004",
    name: "Review Nudge",
    displayType: "nudge",
    useCase: "Notification",
    thumbnailBg: "#ECFDF5",
    thumbnailAccent: "#10B981",
    platforms: ["web", "mobile_web"],
    status: "Active",
    lastUpdated: "2025-04-28",
    blocks: [
      { type: "text",   content: "Enjoying your purchase? Rate us ⭐" },
      { type: "button", label: "Leave a Review", url: "{{review_url}}", style: "primary" },
    ],
  },
  {
    id: "osm_005",
    name: "Back in Stock Alert",
    displayType: "nudge",
    useCase: "Product Info",
    thumbnailBg: "#EFF6FF",
    thumbnailAccent: "#3B82F6",
    platforms: ["web", "android", "ios"],
    status: "Draft",
    lastUpdated: "2025-05-12",
    blocks: [
      { type: "title",  content: "{{product.name}} is back!" },
      { type: "text",   content: "Grab it before it sells out again." },
      { type: "button", label: "Shop Now", url: "{{product_url}}", style: "primary" },
    ],
  },
  {
    id: "osm_006",
    name: "Spin the Wheel",
    displayType: "popup",
    useCase: "Gamification",
    thumbnailBg: "#F5F3FF",
    thumbnailAccent: "#8B5CF6",
    platforms: ["web"],
    status: "Active",
    lastUpdated: "2025-05-06",
    blocks: [
      { type: "title",  content: "Spin to win!" },
      { type: "custom", subtype: "spin_wheel" },
      { type: "text",   content: "Try your luck for up to 30% off" },
    ],
  },
];

// ── Editor block catalogue ─────────────────────────────────────
export const EDITOR_BLOCK_GROUPS = [
  {
    id: "essentials",
    label: "Essentials",
    blocks: [
      { type: "title",   label: "Title",   icon: "T"  },
      { type: "text",    label: "Text",    icon: "¶"  },
      { type: "image",   label: "Image",   icon: "🖼" },
      { type: "button",  label: "Button",  icon: "⬜" },
      { type: "icon",    label: "Icon",    icon: "★"  },
      { type: "spacer",  label: "Spacer",  icon: "↕"  },
      { type: "form",    label: "Form",    icon: "📋" },
      { type: "line",    label: "Line",    icon: "—"  },
    ],
  },
  {
    id: "media",
    label: "Media",
    blocks: [
      { type: "video",    label: "Video",    icon: "▶" },
      { type: "audio",    label: "Audio",    icon: "🔊" },
    ],
  },
  {
    id: "content",
    label: "Content",
    blocks: [
      { type: "countdown", label: "Countdown", icon: "⏱" },
      { type: "carousel",  label: "Carousel",  icon: "◧"  },
      { type: "alert",     label: "Alert",     icon: "⚠"  },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    blocks: [
      { type: "spin_wheel",   label: "Spin Wheel",   icon: "🎡" },
      { type: "scratch_card", label: "Scratch Card", icon: "🎟" },
    ],
  },
];

// ── Template config registry — reused by UnifiedTemplateModal ────
// Keyed by displayType, mirroring SMS/RCS's Transactional/Promotional split.
// Each mockTemplate gets a computed `body` summary (first title/text block)
// so UnifiedTemplateModal's browse-card text preview has something to show —
// Onsite templates have no single `body` string, they have `blocks`.
function summaryFromBlocks(blocks) {
  const textBlock = (blocks || []).find((b) => b.type === "title" || b.type === "text");
  return textBlock?.content || "";
}

function makeOnsiteStyleConfig(displayType) {
  return {
    defaultDraft: { id: null, name: "", displayType, useCase: "Custom", blocks: [], bgColor: "#FFFFFF" },
    mockTemplates: MOCK_ONSITE_TEMPLATES
      .filter((t) => t.displayType === displayType)
      .map((t) => ({ ...t, body: summaryFromBlocks(t.blocks) })),
  };
}

export const ONSITE_TEMPLATE_STYLE_CONFIGS = {
  popup:  makeOnsiteStyleConfig("popup"),
  banner: makeOnsiteStyleConfig("banner"),
  nudge:  makeOnsiteStyleConfig("nudge"),
};

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",  example: "Priya"    },
    { key: "customer.lastName",  label: "Last Name",   example: "Sharma"   },
    { key: "customer.name",      label: "Full Name",   example: "Priya Sharma" },
    { key: "customer.email",     label: "Email",       example: "priya@example.com" },
  ],
  Order: [
    { key: "order.id",     label: "Order ID",     example: "#ORD-7842" },
    { key: "order.amount", label: "Order Amount", example: "₹1,299"   },
    { key: "order.status", label: "Order Status", example: "Shipped"  },
  ],
  Product: [
    { key: "product.name",  label: "Product Name", example: "Rosemary Water" },
    { key: "product.price", label: "Price",        example: "₹399"           },
    { key: "product.url",   label: "Product URL",  example: "https://store.com/p/1" },
  ],
  Store: [
    { key: "store.name", label: "Store Name", example: "Avimee Herbal"  },
    { key: "store.url",  label: "Store URL",  example: "https://avimee.com" },
  ],
};

export const defaultOnsiteNodeData = {
  label:       "Onsite Message",
  displayType: null,          // "popup" | "banner" | "nudge" — null = picker shown
  template:    null,
  platforms:   ["web"],
  triggerType: "page_load",
  triggerEvent: "",           // used when triggerType === "custom_event"
  triggerDelay: 0,            // seconds after trigger condition
  pageTarget:  "all",         // "all" | "specific"
  pageRules:   [],            // [{ operator, value }]
  outputConfig: {
    routingMode:      "next_step",
    deliveryOutputs:  [],
    wiredPorts:       [],
  },
};
