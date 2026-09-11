// Prototype config for the Fastrr Journey dashboard — the 6 predefined
// recovery journeys, their copy, and the fixed wait duration shown in
// the preview modal.

export const JOURNEYS = [
  {
    id: "abandoned-product-known",
    journeyType: "Abandoned Product",
    audience: "Known",
    tooltip:
      "Nudges known customers who viewed a product but didn't add it to cart, using their verified WhatsApp number.",
    triggerLabel: "Known buyer views a product",
    waDraft: {
      body: "Hey {{1}}, still thinking about {{2}}? It's waiting for you — tap below to grab it before it's gone.",
      buttons: [{ label: "View Product" }],
    },
  },
  {
    id: "abandoned-product-identified",
    journeyType: "Abandoned Product",
    audience: "Fastrr Identified",
    tooltip:
      "Re-engages anonymous visitors identified by Fastrr who viewed a product but didn't add it to cart.",
    triggerLabel: "Fastrr-identified visitor views a product",
    waDraft: {
      body: "Spotted you browsing {{1}}! Here's a closer look — tap below to check it out again.",
      buttons: [{ label: "View Product" }],
    },
  },
  {
    id: "abandoned-cart-known",
    journeyType: "Abandoned Cart",
    audience: "Known",
    tooltip: "Reminds known customers who added items to cart but didn't check out.",
    triggerLabel: "Known buyer adds product to cart",
    waDraft: {
      body: "Hey {{1}}, you left {{2}} in your cart! Complete your order now and get {{3}} off.",
      buttons: [{ label: "Complete Order" }],
    },
  },
  {
    id: "abandoned-cart-identified",
    journeyType: "Abandoned Cart",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers anonymous, Fastrr-identified visitors who added items to cart but didn't check out.",
    triggerLabel: "Fastrr-identified visitor adds product to cart",
    waDraft: {
      body: "Spotted you checking us out! We saved your cart — tap below to pick up right where you left off.",
      buttons: [{ label: "Resume Cart" }],
    },
  },
  {
    id: "abandoned-checkout-known",
    journeyType: "Abandoned Checkout",
    audience: "Known",
    tooltip: "Follows up with known customers who started checkout but didn't complete payment.",
    triggerLabel: "Known buyer starts checkout",
    waDraft: {
      body: "Hey {{1}}, you're just one step away! Complete your payment for {{2}} now.",
      buttons: [{ label: "Complete Payment" }],
    },
  },
  {
    id: "abandoned-checkout-identified",
    journeyType: "Abandoned Checkout",
    audience: "Fastrr Identified",
    tooltip:
      "Recovers Fastrr-identified visitors who started checkout but didn't complete payment — the highest-intent recovery moment.",
    triggerLabel: "Fastrr-identified visitor starts checkout",
    waDraft: {
      body: "Almost done! Your order is saved — tap below to complete checkout in seconds.",
      buttons: [{ label: "Complete Checkout" }],
    },
  },
];

export const WAIT_LABEL = "30 Minutes";

// Shown in WelcomeModal's rate card, right after Meta Embedded Signup
// completes. WhatsApp channels are switched on the moment the account is
// approved; other channels are gated behind a KAM conversation for now.
export const RATE_CARD = {
  enabled: [
    { id: "wa-utility", name: "WhatsApp Utility", price: "₹0.40 / message", pricePerMessage: 0.4 },
    { id: "wa-marketing", name: "WhatsApp Marketing", price: "₹1.50 / message", pricePerMessage: 1.5 },
    { id: "wa-session", name: "WhatsApp Session", price: "₹0.40 / message", pricePerMessage: 0.4 },
  ],
  disabled: [
    { id: "email", name: "Email" },
    { id: "rcs", name: "RCS" },
    { id: "sms", name: "SMS" },
  ],
};

export const WALLET_TOPUP = {
  defaultAmount: 500,
  increments: [100, 500, 1000],
  // How many days of recovery-messaging runway the AI suggestion covers.
  aiSuggestRunwayDays: 3,
};

// Demo-only coupon codes for the wallet recharge nudge. Applying one adds
// bonus wallet credit on top of the recharge amount (not a checkout
// discount — this is a top-up, so "bonus credit" is the honest framing).
export const COUPONS = {
  WELCOME10: { bonusPercent: 10 },
};
