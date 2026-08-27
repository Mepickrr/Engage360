import { ShoppingBag, Landmark, Wallet, ShoppingCart, Zap, Sparkles, MonitorSmartphone, Star, Store, Layers } from "lucide-react";

export const INTEGRATION_TYPES = {
  shopify:            { label: "Shopify",             Icon: ShoppingBag,        color: "#96BF48" },
  woocommerce:        { label: "WooCommerce",          Icon: Store,             color: "#96588A" },
  magento:            { label: "Magento",              Icon: Layers,            color: "#EE672F" },
  razorpay:           { label: "Razorpay",             Icon: Landmark,           color: "#0C2451" },
  cashfree:           { label: "Cashfree",             Icon: Wallet,             color: "#00B8D9" },
  shiprocketCheckout: { label: "Shiprocket Checkout",  Icon: ShoppingCart,       color: "#FF7A00" },
  gokwik:             { label: "Gokwik",               Icon: Zap,                color: "#6C2BD9" },
  shopflo:            { label: "Shopflo",               Icon: Sparkles,          color: "#7C3AED" },
  pos:                { label: "POS Integration",      Icon: MonitorSmartphone, color: "#0EA5E9" },
  judgeme:            { label: "Judge.me",              Icon: Star,              color: "#F59E0B" },
};

export const SHOPIFY_INTEGRATION = {
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
  connected: true,
};

export const WOOCOMMERCE_INTEGRATION = {
  id: "woocommerce",
  name: "WooCommerce",
  connected: false,
  domain: "",
  desc: "Connect your WooCommerce store to sync orders, customers, and products.",
};

export const MAGENTO_INTEGRATION = {
  id: "magento",
  name: "Magento",
  connected: false,
  domain: "",
  desc: "Connect your Magento store to sync orders, customers, and products.",
};

export const RAZORPAY_INTEGRATION = {
  id: "razorpay",
  name: "Razorpay",
  connected: false,
  apiKey: "",
  desc: "Accept payments via India's leading payment gateway, and use it as your checkout partner.",
};

export const CASHFREE_INTEGRATION = {
  id: "cashfree",
  name: "Cashfree",
  connected: false,
  apiKey: "",
  desc: "Collect payments through Cashfree Payment Gateway.",
};

export const SHIPROCKET_CHECKOUT_INTEGRATION = {
  id: "shiprocketCheckout",
  name: "Shiprocket Checkout",
  connected: false,
  apiKey: "",
  desc: "Speed up checkout and boost conversions with Shiprocket's one-click checkout.",
};

export const GOKWIK_INTEGRATION = {
  id: "gokwik",
  name: "Gokwik",
  connected: false,
  apiKey: "",
  desc: "Boost conversions with Gokwik's one-click checkout experience.",
};

export const SHOPFLO_INTEGRATION = {
  id: "shopflo",
  name: "Shopflo",
  connected: false,
  apiKey: "",
  desc: "Optimize checkout conversions with Shopflo's fast, branded checkout.",
};

export const POS_INTEGRATION = {
  id: "pos",
  name: "POS Integration",
  connected: false,
  enabled: false,
  desc: "Turn on POS integration to send offline data and automate campaigns over it — copy the sample Webhook Curl to get started.",
};

export const JUDGE_ME_INTEGRATION = {
  id: "judgeme",
  name: "Judge.me",
  connected: false,
  apiKey: "",
  desc: "Collect product reviews and send WhatsApp review requests after delivery.",
};

export const SAMPLE_WEBHOOK_CURL = `curl -X POST https://api.bik.ai/v1/pos/orders \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id": "ORD1234", "amount": 1299, "customer_phone": "+919876543210"}'`;

// Drives the "Create new integration" modal's picker step. POS is
// intentionally absent — it's a toggle + webhook setup rather than a
// single-field connect form. Shopify's card always stays visible under
// Platform so an additional/alternate platform can be connected alongside
// an existing store.
export const CONNECT_INTEGRATION_GROUPS = [
  { group: "Platform", types: [
    { id: "shopify", desc: "Connect your Shopify store to sync orders, customers, and products.", formField: { key: "domain", label: "Store domain", placeholder: "https://yourstore.myshopify.com" } },
    { id: "woocommerce", desc: WOOCOMMERCE_INTEGRATION.desc, formField: { key: "domain", label: "Site URL", placeholder: "https://yourstore.com" } },
    { id: "magento", desc: MAGENTO_INTEGRATION.desc, formField: { key: "domain", label: "Store URL", placeholder: "https://yourstore.com" } },
  ]},
  { group: "Payment", types: [
    { id: "razorpay", desc: RAZORPAY_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "rzp_live_xxxxxxxxxxxx" } },
    { id: "cashfree", desc: CASHFREE_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "cf_live_xxxxxxxxxxxx" } },
  ]},
  { group: "Checkout Partners", types: [
    { id: "shiprocketCheckout", desc: SHIPROCKET_CHECKOUT_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "src_xxxxxxxxxxxx" } },
    { id: "gokwik", desc: GOKWIK_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "gk_xxxxxxxxxxxx" } },
    { id: "shopflo", desc: SHOPFLO_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "sf_xxxxxxxxxxxx" } },
    { id: "razorpay", desc: RAZORPAY_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "rzp_live_xxxxxxxxxxxx" } },
  ]},
  { group: "Reviews", types: [
    { id: "judgeme", desc: JUDGE_ME_INTEGRATION.desc, formField: { key: "apiKey", label: "API Key", placeholder: "jm_xxxxxxxxxxxx" } },
  ]},
];
