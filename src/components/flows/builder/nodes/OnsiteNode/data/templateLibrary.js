// ── Onsite template library ────────────────────────────────────
// Prebuilt templates a seller can use as-is or open in the editor.
// Each has a `theme` (colours the preview/editor read) and `blocks`.
// `layout: "split"` puts the first image block beside the content.

const T = {
  clean:   { bg: "#FFFFFF", ink: "#0F172A", muted: "#475569", accent: "#14B8A6", accentInk: "#FFFFFF" },
  midnight:{ bg: "#111827", ink: "#F9FAFB", muted: "#9CA3AF", accent: "#FACC15", accentInk: "#111827" },
  grape:   { bg: "#2E1065", ink: "#FFFFFF", muted: "#C4B5FD", accent: "#F472B6", accentInk: "#FFFFFF" },
  sunset:  { bg: "#FFF7ED", ink: "#7C2D12", muted: "#9A3412", accent: "#EA580C", accentInk: "#FFFFFF" },
  cherry:  { bg: "#FFF1F2", ink: "#881337", muted: "#9F1239", accent: "#E11D48", accentInk: "#FFFFFF" },
  mint:    { bg: "#ECFDF5", ink: "#064E3B", muted: "#047857", accent: "#059669", accentInk: "#FFFFFF" },
  ocean:   { bg: "#EFF6FF", ink: "#1E3A8A", muted: "#1D4ED8", accent: "#2563EB", accentInk: "#FFFFFF" },
  sand:    { bg: "#FEFCE8", ink: "#422006", muted: "#713F12", accent: "#1C1917", accentInk: "#FEFCE8" },
  slate:   { bg: "#1E293B", ink: "#F8FAFC", muted: "#CBD5E1", accent: "#38BDF8", accentInk: "#0F172A" },
  whatsapp:{ bg: "#FFFFFF", ink: "#0F172A", muted: "#475569", accent: "#25D366", accentInk: "#FFFFFF" },
};

const art = (emoji, from, to) => ({ type: "image", emoji, bg: `linear-gradient(135deg, ${from}, ${to})` });

export const ONSITE_USE_CASES = [
  "Lead Gen", "Cart Recovery", "Promotions & Sales", "Gamification",
  "Notification", "Product Info", "Survey",
];

export const ONSITE_TEMPLATE_LIBRARY = [
  // ── Popups ──
  {
    id: "lib_smart_lead", name: "Popup: Smart Lead Capture", displayType: "popup", useCase: "Lead Gen", theme: T.clean,
    blocks: [
      { type: "badge", text: "WELCOME GIFT" },
      { type: "title", content: "Unlock 10% off your first order" },
      { type: "text", content: "Confirm your details and we'll send the code to your WhatsApp." },
      { type: "form", fields: ["name", "phone"], cta: "Get my code", smart: true },
      { type: "text", content: "No thanks", style: "link" },
    ],
  },
  {
    id: "lib_cart_recovery", name: "Popup: Cart Recovery", displayType: "popup", useCase: "Cart Recovery", theme: T.clean,
    blocks: [
      art("🛒", "#CCFBF1", "#99F6E4"),
      { type: "title", content: "Still thinking it over?" },
      { type: "text", content: "Your cart is waiting. Complete your order in the next 15 minutes and get free shipping." },
      { type: "button", label: "Complete my order" },
      { type: "text", content: "Continue browsing", style: "link" },
    ],
  },
  {
    id: "lib_exit_offer", name: "Popup: Exit Intent Offer", displayType: "popup", useCase: "Cart Recovery", theme: T.midnight,
    blocks: [
      { type: "title", content: "Wait! Don't leave empty-handed" },
      { type: "text", content: "Here's 15% off everything, just for you." },
      { type: "coupon", code: "STAY15" },
      { type: "button", label: "Apply & checkout" },
    ],
  },
  {
    id: "lib_welcome_split", name: "Popup: Welcome Two Column", displayType: "popup", useCase: "Lead Gen", layout: "split", theme: T.sand,
    blocks: [
      art("🎁", "#FDE68A", "#F59E0B"),
      { type: "badge", text: "NEW HERE?" },
      { type: "title", content: "Join the club, get 10% off" },
      { type: "form", fields: ["email"], cta: "Sign me up" },
    ],
  },
  {
    id: "lib_spin", name: "Popup: Spin the Wheel", displayType: "popup", useCase: "Gamification", theme: T.grape,
    blocks: [
      { type: "title", content: "Spin to win!" },
      { type: "custom", subtype: "spin_wheel" },
      { type: "text", content: "Try your luck for up to 30% off. One spin per shopper." },
      { type: "form", fields: ["phone"], cta: "Spin now", smart: true },
    ],
  },
  {
    id: "lib_scratch", name: "Popup: Scratch & Win", displayType: "popup", useCase: "Gamification", theme: T.slate,
    blocks: [
      { type: "title", content: "Scratch to reveal your reward" },
      { type: "custom", subtype: "scratch_card" },
      { type: "button", label: "Claim reward" },
    ],
  },
  {
    id: "lib_black_friday", name: "Popup: Black Friday Sale", displayType: "popup", useCase: "Promotions & Sales", theme: T.midnight,
    blocks: [
      { type: "badge", text: "TODAY ONLY" },
      { type: "title", content: "BLACK FRIDAY · 50% OFF" },
      { type: "countdown" },
      { type: "button", label: "Shop the sale" },
    ],
  },
  {
    id: "lib_flash", name: "Popup: Flash Sale", displayType: "popup", useCase: "Promotions & Sales", theme: T.cherry,
    blocks: [
      art("⚡", "#FECDD3", "#FB7185"),
      { type: "title", content: "Flash sale ends soon" },
      { type: "countdown" },
      { type: "button", label: "Grab the deal" },
    ],
  },
  {
    id: "lib_festive", name: "Popup: Festive Offer", displayType: "popup", useCase: "Promotions & Sales", layout: "split", theme: T.sunset,
    blocks: [
      art("🪔", "#FED7AA", "#FB923C"),
      { type: "badge", text: "FESTIVE SALE" },
      { type: "title", content: "Celebrate with flat 25% off" },
      { type: "coupon", code: "FESTIVE25" },
      { type: "button", label: "Shop now" },
    ],
  },
  {
    id: "lib_free_ship", name: "Popup: Free Shipping Unlock", displayType: "popup", useCase: "Promotions & Sales", theme: T.ocean,
    blocks: [
      art("🚚", "#BFDBFE", "#60A5FA"),
      { type: "title", content: "You're ₹200 away from free shipping" },
      { type: "text", content: "Add one more item and we'll ship it free." },
      { type: "button", label: "Keep shopping" },
    ],
  },
  {
    id: "lib_whatsapp_optin", name: "Popup: WhatsApp Opt-in", displayType: "popup", useCase: "Lead Gen", theme: T.whatsapp,
    blocks: [
      art("💬", "#DCFCE7", "#86EFAC"),
      { type: "title", content: "Get order updates on WhatsApp" },
      { type: "text", content: "Delivery alerts, exclusive drops and early sale access." },
      { type: "form", fields: ["name", "phone"], cta: "Subscribe on WhatsApp", smart: true },
    ],
  },
  {
    id: "lib_survey", name: "Popup: Quick Survey", displayType: "popup", useCase: "Survey", theme: T.clean,
    blocks: [
      { type: "title", content: "How did you hear about us?" },
      { type: "options", items: ["Instagram", "Friend", "Google", "Other"] },
      { type: "button", label: "Submit" },
    ],
  },
  {
    id: "lib_launch", name: "Popup: New Collection Launch", displayType: "popup", useCase: "Product Info", layout: "split", theme: T.mint,
    blocks: [
      art("🌿", "#A7F3D0", "#34D399"),
      { type: "badge", text: "JUST DROPPED" },
      { type: "title", content: "The Summer Edit is here" },
      { type: "text", content: "Lightweight fabrics, made for the heat." },
      { type: "button", label: "Explore collection" },
    ],
  },

  // ── Banners ──
  {
    id: "lib_banner_ship", name: "Banner: Free Shipping Bar", displayType: "banner", useCase: "Notification", theme: T.slate,
    blocks: [
      { type: "text", content: "🚚 Free shipping on orders above ₹499" },
      { type: "button", label: "Shop now" },
    ],
  },
  {
    id: "lib_banner_flash", name: "Banner: Flash Sale with Timer", displayType: "banner", useCase: "Promotions & Sales", theme: T.cherry,
    blocks: [
      { type: "text", content: "⚡ 40% off sitewide ends in" },
      { type: "countdown" },
      { type: "button", label: "Shop sale" },
    ],
  },
  {
    id: "lib_banner_coupon", name: "Banner: Coupon Strip", displayType: "banner", useCase: "Promotions & Sales", theme: T.sand,
    blocks: [
      { type: "text", content: "Use code at checkout for 10% off" },
      { type: "coupon", code: "HELLO10" },
    ],
  },
  {
    id: "lib_banner_cod", name: "Banner: COD Available", displayType: "banner", useCase: "Notification", theme: T.mint,
    blocks: [
      { type: "text", content: "✅ Cash on Delivery available · Easy 7-day returns" },
    ],
  },
  {
    id: "lib_banner_cookie", name: "Banner: Cookie Notice", displayType: "banner", useCase: "Notification", theme: T.clean,
    blocks: [
      { type: "text", content: "We use cookies to improve your experience on our store." },
      { type: "button", label: "Accept" },
    ],
  },

  // ── Nudges ──
  {
    id: "lib_nudge_callback", name: "Nudge: Smart Callback Request", displayType: "nudge", useCase: "Lead Gen", theme: T.clean,
    blocks: [
      { type: "title", content: "Need help choosing?" },
      { type: "form", fields: ["name", "phone"], cta: "Call me back", smart: true },
    ],
  },
  {
    id: "lib_nudge_review", name: "Nudge: Review Request", displayType: "nudge", useCase: "Survey", theme: T.sand,
    blocks: [
      { type: "text", content: "Loving your purchase? ⭐⭐⭐⭐⭐" },
      { type: "button", label: "Leave a review" },
    ],
  },
  {
    id: "lib_nudge_stock", name: "Nudge: Back in Stock", displayType: "nudge", useCase: "Product Info", theme: T.ocean,
    blocks: [
      { type: "badge", text: "BACK IN STOCK" },
      { type: "title", content: "{{product.name}} is back!" },
      { type: "button", label: "Buy now" },
    ],
  },
  {
    id: "lib_nudge_low_stock", name: "Nudge: Low Stock Alert", displayType: "nudge", useCase: "Product Info", theme: T.cherry,
    blocks: [
      { type: "text", content: "🔥 Only 3 left in your size" },
      { type: "button", label: "Add to cart" },
    ],
  },
  {
    id: "lib_nudge_social", name: "Nudge: Social Proof", displayType: "nudge", useCase: "Notification", theme: T.slate,
    blocks: [
      { type: "text", content: "👀 24 people are viewing this right now" },
    ],
  },
  {
    id: "lib_nudge_spin", name: "Nudge: Spin to Win Teaser", displayType: "nudge", useCase: "Gamification", theme: T.grape,
    blocks: [
      { type: "text", content: "🎡 Feeling lucky? Win up to 30% off" },
      { type: "button", label: "Spin now" },
    ],
  },
];

// Start-from-scratch skeletons: minimal but already styled, so a seller
// only replaces words and colours instead of building from nothing.
export const BLANK_TEMPLATES = [
  {
    id: "blank_popup", name: "Blank Popup Template", displayType: "popup", useCase: "Custom", theme: T.clean,
    blocks: [
      { type: "title", content: "Your headline here" },
      { type: "text", content: "Add a short message that tells shoppers what's in it for them." },
      { type: "button", label: "Call to action" },
    ],
  },
  {
    id: "blank_banner", name: "Blank Banner Template", displayType: "banner", useCase: "Custom", theme: T.clean,
    blocks: [
      { type: "text", content: "Your announcement goes here" },
      { type: "button", label: "Learn more" },
    ],
  },
  {
    id: "blank_nudge", name: "Blank Nudge Template", displayType: "nudge", useCase: "Custom", theme: T.clean,
    blocks: [
      { type: "text", content: "A short, friendly nudge" },
      { type: "button", label: "Take a look" },
    ],
  },
];

export const BLANK_DESCRIPTIONS = {
  popup:  "Centred modal with overlay. Best for offers and lead capture.",
  banner: "Full-width bar at the top of the page. Best for announcements.",
  nudge:  "Small corner card. Best for gentle, non-blocking prompts.",
};

// Content filters are derived from blocks, so new templates tag themselves.
export function templateContentTags(t) {
  const tags = new Set();
  (t.blocks || []).forEach((b) => {
    if (b.type === "form") tags.add(b.smart ? "Smart Pop-up" : "Form");
    if (b.type === "custom" && b.subtype === "spin_wheel") tags.add("Spin the wheel");
    if (b.type === "custom" && b.subtype === "scratch_card") tags.add("Scratch card");
    if (b.type === "countdown") tags.add("Countdown timer");
    if (b.type === "coupon") tags.add("Coupon code");
    if (b.type === "button") tags.add("Button");
    if (b.type === "image") tags.add("Image");
    if (b.type === "options") tags.add("Survey options");
  });
  return [...tags];
}

export const ONSITE_CONTENT_FILTERS = [
  "Smart Pop-up", "Spin the wheel", "Scratch card", "Countdown timer",
  "Coupon code", "Form", "Survey options", "Button", "Image",
];

// Saved templates persist per browser for the prototype.
const SAVED_KEY = "onsite_saved_templates";
export function loadSavedTemplates() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
}
export function saveTemplateToLibrary(tpl) {
  const all = loadSavedTemplates().filter((t) => t.id !== tpl.id);
  const next = [{ ...tpl, saved: true }, ...all];
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
