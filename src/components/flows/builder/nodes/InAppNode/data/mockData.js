export const INAPP_VIOLET = "#7C3AED";

// ── Display types ──────────────────────────────────────────────
export const INAPP_DISPLAY_TYPES = [
  {
    id: "popup",
    label: "Pop Up",
    emoji: "🪟",
    desc: "Centered overlay for offers, surveys and announcements",
    popular: true,
  },
  {
    id: "fullscreen",
    label: "Full Screen",
    emoji: "📱",
    desc: "Full-screen takeover for high-impact campaigns",
    popular: false,
  },
  {
    id: "nudge",
    label: "Nudge",
    emoji: "💬",
    desc: "Subtle top or bottom bar for soft CTAs and feedback",
    popular: false,
  },
];

// ── Platform options ───────────────────────────────────────────
export const INAPP_PLATFORM_OPTIONS = [
  { id: "android", label: "Android", icon: "🤖" },
  { id: "ios",     label: "iOS",     icon: "🍎" },
];

// ── Trigger types ──────────────────────────────────────────────
export const INAPP_TRIGGER_TYPES = [
  { id: "screen_load",   label: "On Screen Load",   desc: "Show when a screen loads" },
  { id: "session_start", label: "On Session Start",  desc: "Show when the user opens the app" },
  { id: "custom_event",  label: "On Custom Event",   desc: "Show when a specific event fires" },
];

// ── Nudge placement ────────────────────────────────────────────
export const NUDGE_PLACEMENTS = [
  { id: "bottom", label: "Bottom" },
  { id: "top",    label: "Top"    },
];

// ── Entry/exit animations ──────────────────────────────────────
export const ANIMATIONS = [
  { id: "none",      label: "None"      },
  { id: "slide_up",  label: "Slide Up"  },
  { id: "slide_down",label: "Slide Down"},
  { id: "fade",      label: "Fade"      },
  { id: "zoom",      label: "Zoom"      },
];

// ── Output delivery options ────────────────────────────────────
export const INAPP_DELIVERY_OPTIONS = [
  { id: "next_step",  label: "Next Step",   isDefault: true  },
  { id: "shown",      label: "Shown",       isDefault: false },
  { id: "cta_clicked",label: "CTA Clicked", isDefault: false },
  { id: "dismissed",  label: "Dismissed",   isDefault: false },
  { id: "timed_out",  label: "Timed Out",   isDefault: false },
];

// ── Filter categories for template picker ─────────────────────
export const FILTER_VERTICALS = [
  "E-commerce", "Fintech", "Travel",
];

export const FILTER_USE_CASES = [
  "Survey", "Lead Gen", "Feedback", "Gamification",
  "Sale", "Cart abandonment", "Product recommendation",
  "Onboarding", "Greeting", "Promotional",
];

// ── Prebuilt templates ─────────────────────────────────────────
export const MOCK_INAPP_TEMPLATES = [
  {
    id: "ia_001",
    name: "Cart Recovery Pop Up",
    displayType: "popup",
    vertical: "E-commerce",
    useCase: "Cart abandonment",
    thumbnailBg: "#FEF3C7",
    thumbnailAccent: "#F59E0B",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-05-14",
    blocks: [
      { id: "b1", type: "image",   src: null, bgColor: "#FEF3C7" },
      { id: "b2", type: "heading", content: "Still thinking it over?" },
      { id: "b3", type: "text",    content: "Complete your order and get {{discount}}% off!" },
      { id: "b4", type: "button",  label: "Complete My Order", action: "deeplink", url: "{{cart_url}}", style: "primary" },
    ],
  },
  {
    id: "ia_002",
    name: "Rating Survey",
    displayType: "nudge",
    vertical: "E-commerce",
    useCase: "Survey",
    thumbnailBg: "#EFF6FF",
    thumbnailAccent: "#3B82F6",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-05-10",
    blocks: [
      { id: "b1", type: "heading", content: "How was your order?" },
      { id: "b2", type: "rating",  stars: 5 },
      { id: "b3", type: "button",  label: "Submit", action: "dismiss", style: "primary" },
    ],
  },
  {
    id: "ia_003",
    name: "Flash Sale Full Screen",
    displayType: "fullscreen",
    vertical: "E-commerce",
    useCase: "Sale",
    thumbnailBg: "#FEE2E2",
    thumbnailAccent: "#EF4444",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-05-08",
    blocks: [
      { id: "b1", type: "image",   src: null, bgColor: "#FEE2E2" },
      { id: "b2", type: "heading", content: "⚡ Flash Sale — 40% Off" },
      { id: "b3", type: "text",    content: "Today only. Tap to grab your deal." },
      { id: "b4", type: "button",  label: "Shop Now", action: "deeplink", url: "{{sale_url}}", style: "primary" },
    ],
  },
  {
    id: "ia_004",
    name: "Coupon Nudge",
    displayType: "nudge",
    vertical: "E-commerce",
    useCase: "Promotional",
    thumbnailBg: "#F0FDF4",
    thumbnailAccent: "#10B981",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-04-28",
    blocks: [
      { id: "b1", type: "image",   src: null, bgColor: "#1a1a1a" },
    ],
  },
  {
    id: "ia_005",
    name: "Product Recommendation",
    displayType: "popup",
    vertical: "E-commerce",
    useCase: "Product recommendation",
    thumbnailBg: "#F5F3FF",
    thumbnailAccent: "#8B5CF6",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-05-01",
    blocks: [
      { id: "b1", type: "image",   src: null, bgColor: "#F5F3FF" },
      { id: "b2", type: "heading", content: "Just for you, {{customer.firstName}}" },
      { id: "b3", type: "text",    content: "Based on your recent browsing, we picked these." },
      { id: "b4", type: "button",  label: "View Products", action: "deeplink", url: "{{products_url}}", style: "primary" },
    ],
  },
  {
    id: "ia_006",
    name: "Onboarding Welcome",
    displayType: "fullscreen",
    vertical: "E-commerce",
    useCase: "Onboarding",
    thumbnailBg: "#EDE9FE",
    thumbnailAccent: "#7C3AED",
    platforms: ["android", "ios"],
    status: "Active",
    lastUpdated: "2025-04-20",
    blocks: [
      { id: "b1", type: "image",   src: null, bgColor: "#EDE9FE" },
      { id: "b2", type: "heading", content: "Welcome to {{store.name}}!" },
      { id: "b3", type: "text",    content: "Discover products you'll love, delivered fast." },
      { id: "b4", type: "button",  label: "Get Started", action: "dismiss", style: "primary" },
    ],
  },
];

// ── Editor block catalogue ─────────────────────────────────────
export const INAPP_BLOCK_GROUPS = [
  {
    id: "essentials",
    label: "Essentials",
    blocks: [
      { type: "heading", label: "Heading",  icon: "T"  },
      { type: "text",    label: "Text",     icon: "¶"  },
      { type: "image",   label: "Image",    icon: "🖼" },
      { type: "button",  label: "Button",   icon: "⬜" },
      { type: "spacer",  label: "Spacer",   icon: "↕"  },
      { type: "line",    label: "Divider",  icon: "—"  },
    ],
  },
  {
    id: "interactive",
    label: "Interactive",
    blocks: [
      { type: "rating",    label: "Rating",    icon: "⭐" },
      { type: "form",      label: "Form",      icon: "📋" },
      { type: "countdown", label: "Countdown", icon: "⏱" },
      { type: "carousel",  label: "Carousel",  icon: "◧"  },
    ],
  },
  {
    id: "media",
    label: "Media",
    blocks: [
      { type: "video",  label: "Video",  icon: "▶" },
      { type: "gif",    label: "GIF",    icon: "🎞" },
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
// Keyed by displayType, mirroring SMS/RCS/Onsite's style-config pattern.
function summaryFromBlocks(blocks) {
  const textBlock = (blocks || []).find((b) => b.type === "heading" || b.type === "text");
  return textBlock?.content || "";
}

function makeInAppStyleConfig(displayType) {
  return {
    defaultDraft: { id: null, name: "", displayType, useCase: "Custom", blocks: [], bgColor: "#FFFFFF" },
    mockTemplates: MOCK_INAPP_TEMPLATES
      .filter((t) => t.displayType === displayType)
      .map((t) => ({ ...t, body: summaryFromBlocks(t.blocks) })),
  };
}

export const INAPP_TEMPLATE_STYLE_CONFIGS = {
  popup:      makeInAppStyleConfig("popup"),
  fullscreen: makeInAppStyleConfig("fullscreen"),
  nudge:      makeInAppStyleConfig("nudge"),
};

export const INAPP_SYSTEM_VARIABLES = {
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

export const defaultInAppNodeData = {
  label:         "InApp Message",
  displayType:   null,             // "popup" | "fullscreen" | "nudge" — null = picker shown
  template:      null,
  platforms:     ["android", "ios"],
  mirrorPlatforms: true,
  triggerType:   "screen_load",
  triggerEvent:  "",
  triggerDelay:  0,
  placement:     "bottom",         // nudge only: "top" | "bottom"
  bgType:        "color",          // "color" | "image"
  bgColor:       "#FFFFFF",
  bgImageUrl:    "",
  entryAnimation: "none",
  exitAnimation:  "none",
  showCloseButton: true,
  closeButtonStyle: "black_filled", // "black_filled" | "white_filled" | "none"
  outputConfig: {
    routingMode:     "next_step",
    deliveryOutputs: [],
    wiredPorts:      [],
  },
};
