export const PREDICTION_TYPES = [
  { id: "purchase",    label: "Purchase",    description: "Predicts purchase intent from session behavior" },
  { id: "order_value", label: "Order Value", description: "Predicts likely order value tier for this user" },
  { id: "uninstall",   label: "Uninstall",   description: "Predicts app uninstall likelihood" },
  { id: "discount",    label: "Discount",    description: "Predicts discount need + maps best-fit offer" },
  { id: "rto",         label: "RTO",         description: "Predicts whether the order will be in RTO" },
  { id: "custom",      label: "Custom",      description: "Set your custom prediction" },
];

// Shared threshold metadata used by both canvas node and right panel
export const THRESHOLD_META = {
  high:   { label: "High",   bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", desc: "Top ~20% likelihood" },
  medium: { label: "Medium", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", desc: "Middle ~40% likelihood" },
  low:    { label: "Low",    bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", desc: "Bottom ~40% likelihood" },
};

export const MOCK_USER_EVENTS = [
  { id: "cart_abandoned",   label: "Cart Abandoned" },
  { id: "order_placed",     label: "Order Placed" },
  { id: "product_viewed",   label: "Product Viewed" },
  { id: "checkout_started", label: "Checkout Started" },
  { id: "app_opened",       label: "App Opened" },
  { id: "search_performed", label: "Search Performed" },
  { id: "wishlist_added",   label: "Wishlist Added" },
  { id: "payment_failed",   label: "Payment Failed" },
  { id: "session_started",  label: "Session Started" },
  { id: "coupon_applied",   label: "Coupon Applied" },
];

// Each branch now carries its own threshold
export const defaultAiPredictNodeData = {
  label: "AI Predict",
  predictionType: null,
  customEvent: null,
  branches: [
    { id: "branch_high",   threshold: "high",   label: "High" },
    { id: "branch_medium", threshold: "medium", label: "Medium" },
    { id: "branch_low",    threshold: "low",    label: "Low" },
  ],
  wiredPorts: [],
};
