export const EMAIL_FROM_ADDRESSES = [
  { id: "from_1", name: "Your Store",          email: "hello@yourstore.com",   verified: true  },
  { id: "from_2", name: "Your Store Support",  email: "support@yourstore.com", verified: true  },
  { id: "from_3", name: "Your Store Offers",   email: "offers@yourstore.com",  verified: true  },
  { id: "from_4", name: "Your Store Orders",   email: "orders@yourstore.com",  verified: false },
];

export const EMAIL_PROVIDERS = [
  { id: "trust_signal", label: "Trust signal" },
  { id: "karix",        label: "Karix" },
];

export const MOCK_EMAIL_TEMPLATES = [
  {
    id: "email_tpl_001",
    name: "Cart Recovery — Minimal",
    subject: "Hey {{first_name}}, you left something behind 🛒",
    previewText: "Your cart is waiting. Complete your order and get 10% off.",
    category: "Transactional",
    thumbnailColor: "#EFF6FF",
    status: "Active",
    lastUpdated: "2025-05-18",
    blocks: [
      { type: "image", src: null },
      { type: "text",  content: "Hey {{first_name}}, you left items in your cart!" },
      { type: "button", label: "Complete My Order", url: "{{cart_url}}" },
    ],
  },
  {
    id: "email_tpl_002",
    name: "Welcome Series — Day 1",
    subject: "Welcome to Your Store, {{first_name}}! 🌿",
    previewText: "Discover our bestsellers and claim your welcome offer.",
    category: "Marketing",
    thumbnailColor: "#F0FDF4",
    status: "Active",
    lastUpdated: "2025-04-30",
    blocks: [
      { type: "image", src: null },
      { type: "text",  content: "Welcome, {{first_name}}! We're thrilled to have you." },
      { type: "button", label: "Shop Bestsellers", url: "{{store_url}}" },
    ],
  },
  {
    id: "email_tpl_003",
    name: "Order Shipped Notification",
    subject: "Your order #{{order_id}} is on its way! 🚚",
    previewText: "Track your delivery and know when to expect it.",
    category: "Transactional",
    thumbnailColor: "#FFFBEB",
    status: "Active",
    lastUpdated: "2025-05-01",
    blocks: [
      { type: "text",   content: "Great news! Your order has been shipped." },
      { type: "button", label: "Track Order", url: "{{tracking_url}}" },
    ],
  },
  {
    id: "email_tpl_004",
    name: "Flash Sale — 48hr",
    subject: "⚡ 48-Hour Flash Sale — Up to 40% off",
    previewText: "Don't miss out. Sale ends in 48 hours.",
    category: "Marketing",
    thumbnailColor: "#FFF1F2",
    status: "Draft",
    lastUpdated: "2025-05-12",
    blocks: [
      { type: "image", src: null },
      { type: "text",  content: "Limited time only — 40% off your favourite products." },
      { type: "button", label: "Shop the Sale", url: "{{sale_url}}" },
    ],
  },
];

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",   example: "Priya"             },
    { key: "customer.lastName",  label: "Last Name",    example: "Sharma"            },
    { key: "customer.name",      label: "Full Name",    example: "Priya Sharma"      },
    { key: "customer.email",     label: "Email",        example: "priya@example.com" },
    { key: "customer.id",        label: "Customer ID",  example: "CUST_4821"         },
  ],
  Order: [
    { key: "order.id",           label: "Order ID",      example: "#ORD-7842"                   },
    { key: "order.amount",       label: "Order Amount",  example: "₹1,299"                      },
    { key: "order.trackingUrl",  label: "Tracking URL",  example: "https://track.example.com/"  },
    { key: "order.deliveryDate", label: "Delivery Date", example: "June 3, 2026"                },
    { key: "order.status",       label: "Order Status",  example: "Shipped"                     },
  ],
  Product: [
    { key: "product.name",  label: "Product Name", example: "Rosemary Water"             },
    { key: "product.price", label: "Price",        example: "₹399"                       },
    { key: "product.url",   label: "Product URL",  example: "https://store.com/rosemary" },
  ],
  Store: [
    { key: "store.name", label: "Store Name", example: "Your Store"  },
    { key: "store.url",  label: "Store URL",  example: "https://yourstore.com" },
  ],
};

export const TO_EMAIL_VARIABLES = Object.values(SYSTEM_VARIABLES).flat();

export const EMAIL_DELIVERY_OPTIONS = [
  { id: "next_step",  label: "Next Step",       isDefault: true  },
  { id: "sent",       label: "Sent",            isDefault: false },
  { id: "delivered",  label: "Delivered",       isDefault: false },
  { id: "opened",     label: "Opened",          isDefault: false },
  { id: "clicked",    label: "Link Clicked",    isDefault: false },
  { id: "bounced",    label: "Bounced",         isDefault: false },
  { id: "unsubscribed", label: "Unsubscribed",  isDefault: false },
  { id: "not_ordered", label: "Not Ordered",    isDefault: false },
];

// Blocks available in the template editor sidebar
export const EDITOR_CONTENT_BLOCKS = [
  { type: "text",      label: "Text",       icon: "T"  },
  { type: "image",     label: "Image",      icon: "🖼" },
  { type: "button",    label: "Button",     icon: "⬜" },
  { type: "divider",   label: "Divider",    icon: "—"  },
  { type: "spacer",    label: "Spacer",     icon: "↕"  },
  { type: "html",      label: "HTML",       icon: "<>" },
  { type: "social",    label: "Social",     icon: "🔗" },
  { type: "product",   label: "Product",    icon: "🛍" },
  { type: "unsubscribe", label: "Unsubscribe", icon: "🚫" },
];

export const EDITOR_ROW_LAYOUTS = [
  { id: "single",    cols: 1, label: "1 Column"   },
  { id: "two_equal", cols: 2, label: "2 Columns"  },
  { id: "two_wide",  cols: 2, label: "Left wide"  },
  { id: "three",     cols: 3, label: "3 Columns"  },
];

export const defaultEmailNodeData = {
  label:       "Send Email",
  template:    null,
  provider:    "trust_signal",
  fromId:      "from_1",
  toEmailMode:     "auto",
  toEmailVariable: null,
  subject:     "",
  previewText: "",
  attachments: [],
  gmailAnnotation: { enabled: false, logo: "", discount: "", code: "", expiry: "" },
  outputConfig: {
    routingMode:      "next_step",
    deliveryOutputs:  [],
    wiredPorts:       [],
  },
  markAsMarketing: true,
  utm: { enabled: true, utm_source: "email", utm_medium: "journey", utm_campaign: "", utm_content: "", utm_term: "" },
  aiBestTime: false,
  smartRetry: { enabled: false, mode: "smart" },
};
