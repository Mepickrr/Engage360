export const MOCK_TEMPLATES = [
  {
    id: "tpl_001",
    name: "TRUST_NOTE_J",
    type: "Marketing",
    status: "Active",
    language: "en",
    category: "Marketing",
    header: { type: "image", url: "https://placehold.co/400x200/25D366/white?text=Before+After", bg: "#1a4a2e" },
    body: "I tried Avimee Scalptone Serum, Keshpallav Oil, Rosemary Oil, and Grey Hair Serum after seeing them on social media. Within a month, my hair felt stronger, thicker, and healthier with reduced hair fall and improved scalp condition.",
    footer: "Reply STOP to unsubscribe",
    buttons: [
      { type: "QUICK_REPLY", label: "Shop Now" },
      { type: "QUICK_REPLY", label: "Learn More" },
    ],
    variables: [],
    lastUpdated: "2025-04-12",
  },
  {
    id: "tpl_002",
    name: "AH_QuizCompleted_NoPurchase_Day1",
    type: "Marketing",
    status: "Active",
    language: "en",
    category: "Marketing",
    header: { type: "video", url: null, bg: "#1a1a2e" },
    body: "Kya aapko apne hair fall ka asli reason pata chala?\n\n{{customer.name}}, Aapka scalp diagnosis complete ho chuka hai. Ab next step simple hai, *start your recommended routine.*",
    footer: "Reply STOP to unsubscribe",
    buttons: [
      { type: "URL", label: "Start My Routine", url: "https://avimee.com/routine?ref={{customer.id}}" },
      { type: "QUICK_REPLY", label: "Not Now" },
    ],
    variables: ["customer.name", "customer.id"],
    lastUpdated: "2025-04-18",
  },
  {
    id: "tpl_003",
    name: "rosemary_water",
    type: "Marketing",
    status: "Active",
    language: "en",
    category: "Marketing",
    header: { type: "video", url: null, bg: "#2d4a22" },
    body: "Dear {{customer.firstName}}, *Let's Boost Your Hair Growth* 🌿\n\nYou've taken the first step with Keshpallav Hair Oil—now supercharge your results with *Rosemary Water!* 🌿\n\n✅ Stimulates scalp & boosts blood flow\n✅ Reduces hair fall & strengthens roots\n✅ Works best with Keshpallav for faster regrowth\n\nJust spray, massage & apply oil. Simple! 💚",
    footer: "",
    buttons: [
      { type: "URL", label: "Get Rosemary Water Now", url: "https://avimee.com/rosemary?utm_source=whatsapp" },
    ],
    variables: ["customer.firstName"],
    lastUpdated: "2025-04-20",
  },
  {
    id: "tpl_004",
    name: "order_address_confirm",
    type: "Utility",
    status: "Active",
    language: "en",
    category: "Utility",
    header: { type: "none" },
    body: "Hello,\nHere are your {{$1}} order details-\nYour order ID is {{$2}} and total amount is {{$3}} ({{$4}}).\nDelivery Address: {{$5}}\n\nFor a smooth delivery, reply:\n1. Address is Correct\n2. Edit My Address\n\nTo unsubscribe from WhatsApp notifications, simply reply 'Stop'.",
    footer: "",
    buttons: [
      { type: "QUICK_REPLY", label: "Address is Correct" },
      { type: "QUICK_REPLY", label: "Edit My Address" },
    ],
    variables: ["$1", "$2", "$3", "$4", "$5"],
    lastUpdated: "2025-05-01",
  },
  {
    id: "tpl_005",
    name: "Black_friday_mega_sale313",
    type: "Marketing",
    status: "Active",
    language: "en",
    category: "Marketing",
    header: { type: "image", url: "https://placehold.co/400x200/2a7a2a/white?text=Black+Friday+Sale", bg: "#1a1a1a" },
    body: "🤑 *Black Friday just got personal!* ⚡ Hey, we've unlocked *early access* just for YOU 🎉 Score *massive savings* on your favorites — before anyone else 🙌 🔥 _Styles are flying fast — don't miss out!_",
    footer: "Reply STOP to unsubscribe",
    buttons: [
      { type: "URL", label: "Shop Black Friday Deals", url: "https://store.com/black-friday" },
    ],
    variables: [],
    lastUpdated: "2025-04-30",
  },
  {
    id: "tpl_006",
    name: "order_shipped_utility",
    type: "Utility",
    status: "In Review",
    language: "en",
    category: "Utility",
    header: { type: "text", text: "Your Order is on the Way! 📦" },
    body: "Hi {{customer.firstName}},\n\nGreat news! Your order *#{{order.id}}* has been shipped.\n\nExpected delivery: *{{order.deliveryDate}}*\nTracking: {{order.trackingUrl}}",
    footer: "Need help? Reply to this message.",
    buttons: [
      { type: "URL", label: "Track My Order", url: "{{order.trackingUrl}}" },
      { type: "QUICK_REPLY", label: "Contact Support" },
    ],
    variables: ["customer.firstName", "order.id", "order.deliveryDate", "order.trackingUrl"],
    lastUpdated: "2025-05-05",
  },
];

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name", example: "Priya" },
    { key: "customer.lastName",  label: "Last Name",  example: "Sharma" },
    { key: "customer.name",      label: "Full Name",  example: "Priya Sharma" },
    { key: "customer.phone",     label: "Phone",      example: "+91 98765 43210" },
    { key: "customer.email",     label: "Email",      example: "priya@example.com" },
    { key: "customer.id",        label: "Customer ID",example: "CUST_4821" },
  ],
  Order: [
    { key: "order.id",           label: "Order ID",       example: "#ORD-7842" },
    { key: "order.amount",       label: "Order Amount",   example: "₹1,299" },
    { key: "order.items",        label: "Items",          example: "Rosemary Water, Hair Oil" },
    { key: "order.trackingUrl",  label: "Tracking URL",   example: "https://track.example.com/7842" },
    { key: "order.deliveryDate", label: "Delivery Date",  example: "June 3, 2026" },
    { key: "order.status",       label: "Order Status",   example: "Shipped" },
  ],
  Product: [
    { key: "product.name",     label: "Product Name",  example: "Rosemary Water" },
    { key: "product.price",    label: "Price",         example: "₹399" },
    { key: "product.url",      label: "Product URL",   example: "https://store.com/rosemary" },
    { key: "product.imageUrl", label: "Product Image", example: "https://cdn.store.com/img.jpg" },
  ],
  Store: [
    { key: "store.name",          label: "Store Name",      example: "Avimee Herbal" },
    { key: "store.url",           label: "Store URL",        example: "https://avimee.com" },
    { key: "store.supportNumber", label: "Support Number",  example: "+91 80 1234 5678" },
  ],
};

export const WABA_NUMBERS = [
  { id: "waba_1", nickname: "Main Store",   number: "+91 98765 43210", status: "active" },
  { id: "waba_2", nickname: "Support Line", number: "+91 98765 00001", status: "active" },
  { id: "waba_3", nickname: "North Region", number: "+91 80000 12345", status: "inactive" },
];

// Delivery output options — seller picks which output ports appear on canvas
export const DELIVERY_OUTPUT_OPTIONS = [
  { id: "next_step",       label: "Next Step",         isDefault: true  },
  { id: "sent",            label: "Sent",              isDefault: false },
  { id: "delivered",       label: "Delivered",         isDefault: false },
  { id: "read",            label: "Read",              isDefault: false },
  { id: "delivery_failed", label: "Delivery Failed",   isDefault: false },
  { id: "not_read",        label: "Not Read",          isDefault: false },
  { id: "no_response",     label: "No response after", isDefault: false, hasTimeConfig: true },
];

// Buttons that generate canvas output ports
export const isConnectable = (btn) =>
  btn.type === "QUICK_REPLY" || btn.type === "URL" || btn.type === "FLOW";

export const defaultWANodeData = {
  template: null,
  variableMap: {},
  wabaNumberId: "waba_1",
  templateType: "Marketing",
  markAsMarketing: true,
  utm: { enabled: false, source: "whatsapp", medium: "journey", campaign: "", content: "", term: "" },
  aiBestTime: false,
  smartRetry: { enabled: false, mode: "smart", smartWindow: "72", manualSlots: [] },
  fallback: { enabled: false, template: null },
  outputConfig: {
    deliveryOutputs: ["next_step"],   // array of selected DELIVERY_OUTPUT_OPTIONS ids
    noResponseValue: 5,
    noResponseUnit: "hours",
    wiredPorts: [],                   // which ports have been connected on canvas
  },
};
