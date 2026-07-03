export const SHOPIFY_GREEN = "#96BF48";

export const SHOPIFY_ACTIONS = [
  { id: "order_creation",     label: "Order Creation",      emoji: "🛒", desc: "Create an order on Shopify"    },
  { id: "order_cancellation", label: "Order Cancellation",  emoji: "❌", desc: "Cancel an existing order"       },
  { id: "order_tag",          label: "Order Tag Update",    emoji: "🏷️", desc: "Add tags to an order"          },
  { id: "customer_tag",       label: "Customer Tag Update", emoji: "👤", desc: "Add tags to a customer"        },
  { id: "order_notes",        label: "Order Notes",         emoji: "📝", desc: "Update notes on an order"      },
  { id: "discount_code",      label: "Discount Code",       emoji: "🎁", desc: "Generate a discount coupon"    },
];

export const MOCK_TAGS = ["Nitro", "nitro", "fastrr_login"];

export const defaultShopifyNodeData = {
  action: null,
  orderTags: [],
  customerTags: [],
  orderNote: "",
  discount: {
    title: "",
    type: "amount",
    amount: null,
    percentage: null,
    appliesTo: "entire_order",
    products: [],
    collections: [],
    minPurchaseEnabled: false,
    minPurchaseType: "order_value",
    minPurchaseValue: null,
    buyX: { quantity: 1, type: "specific_products", items: [] },
    getY: { quantity: 1, type: "specific_products", items: [], discountType: "free", discountValue: null },
    expirationEnabled: false,
    expirationType: "days",
    expirationValue: null,
  },
};
