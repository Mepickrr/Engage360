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
