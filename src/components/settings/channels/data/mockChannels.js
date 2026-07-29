// src/components/settings/channels/data/mockChannels.js
export const SHOPIFY_STORE = {
  id: "shopify_1",
  name: "Herbal Roots",
  domain: "https://herbalroots.com",
  webhookStatus: "Live",
  customers: 921681,
  orders: 858226,
  products: 111,
  shortCode: "",
  websiteEventsScopeGranted: true,
  websiteEventsTrackerEnabled: true,
};

export const EMAIL_MARKETING_CHANNEL = { id: "em_mkt_1", name: "Email marketing" };
export const WEB_PUSH_CHANNEL = { id: "wp_1", name: "Web push notification" };

export const WHATSAPP_NUMBERS = [
  {
    id: "wa_1", number: "+91 74360 36062", username: "herbalroots",
    isExistingNumber: true, isDefaultForCampaigns: true,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false,
    businessDescription: "Grow naturally, feel beautifully.",
    messagesConsumed: 0, messagingLimit: 100000,
    about: "Hey, there! I am using WhatsApp.",
    businessAddress: "", businessEmail: "support@herbalroots.com", businessWebsite: "https://herbalroots.com/",
    catalogId: "1175317264111343", catalogAllowAccess: true, removeOutOfStock: false,
    brandName: "herbal-roots", brandLogoUrl: "",
    wabaId: "328175003703387", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_2", number: "+91 74360 36067", username: "herbalroots_support",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703388", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_3", number: "+91 74360 36065", username: "",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "Medium",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 50000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703389", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
  {
    id: "wa_4", number: "+91 98244 45471", username: "",
    isExistingNumber: true, isDefaultForCampaigns: false,
    apiTier: "Marketing Message Lite API", provider: "TSP Karix", quality: "High",
    voiceCallEnabled: false, businessDescription: "", messagesConsumed: 0, messagingLimit: 25000,
    about: "", businessAddress: "", businessEmail: "", businessWebsite: "",
    catalogId: "", catalogAllowAccess: false, removeOutOfStock: false,
    brandName: "", brandLogoUrl: "",
    wabaId: "328175003703390", businessPortfolioId: "1379257819643222", wabaProvider: "TSPENGAGE",
  },
];

export const FACEBOOK_PAGES = [
  { id: "fb_1", name: "Herbal Roots", url: "https://facebook.com/105513214301140" },
  { id: "fb_2", name: "Herbal Roots Hair", url: "https://facebook.com/541617399033389" },
];

export const INSTAGRAM_ACCOUNTS = [
  { id: "ig_1", name: "Herbal Roots", handle: "herbalroots" },
  { id: "ig_2", name: "herbalroots.hair", handle: "herbalroots.hair" },
];

export const EMAIL_ADDRESSES = [
  { id: "em_1", address: "support@herbalroots.com" },
  { id: "em_2", address: "business@herbalroots.com" },
  { id: "em_3", address: "marketing@herbalroots.com" },
];

// Drives the Connect-channel modal's picker step. Shopify is intentionally
// absent (real Shopify connections happen via app install, not this flow).
// SMS is intentionally absent (dropped from this feature entirely).
export const CONNECT_CHANNEL_GROUPS = [
  { group: "Business messaging", types: [
    { id: "whatsapp", desc: "Businesses can use the WhatsApp Business API to improve customer service.", formField: { key: "number", label: "Phone number", placeholder: "+91 98765 43210" } },
    { id: "instagram", desc: "Connect Instagram to automate customer comments, DMs, and reaction responses.", formField: { key: "handle", label: "Instagram handle", placeholder: "yourbrand" } },
    { id: "facebook", desc: "Connect Facebook to manage DMs and comments.", formField: { key: "url", label: "Facebook Page URL", placeholder: "https://facebook.com/yourbrand" } },
    { id: "webpush", desc: "Configure web push to send notifications across a user's device(s).", formField: { key: "name", label: "Website name", placeholder: "e.g. My Store" } },
    { id: "livechat", desc: "Manage real-time customer conversations via live chat.", formField: { key: "name", label: "Widget name", placeholder: "e.g. Support Chat" } },
    { id: "rcs", desc: "Leverage RCS for smart, automated, and broadcast messaging.", formField: { key: "number", label: "Phone number", placeholder: "+91 98765 43210" } },
  ]},
  { group: "Email", types: [
    { id: "emails", desc: "Connect email providers through SMTP to streamline your email communication.", formField: { key: "address", label: "Email address", placeholder: "you@yourstore.com" } },
    { id: "emailmarketing", desc: "Enables businesses to connect with their audience, deliver targeted messages, and drive results.", formField: { key: "name", label: "Sender name", placeholder: "e.g. Marketing Team" } },
  ]},
];
