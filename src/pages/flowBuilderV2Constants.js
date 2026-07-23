// V2 WhatsApp template style allow-list — full parity with V1's grouped catalogue
// (Standard, Order, Ask Customer, Catalog, List). To hide a style in V2 only,
// remove its id here.
//
// Kept in its own module (not inline in FlowBuilderV2.jsx) so tests can import
// it without pulling in the full page component's heavy deps (react-router-dom,
// react-query, etc).
export const V2_ALLOWED_TEMPLATE_STYLES = [
  // Standard
  "standard", "session", "authentication", "carousel", "location", "flow_form",
  // Order
  "order_payment", "order_confirmation", "complete_checkout", "payment_link",
  // Ask Customer
  "ask_name", "ask_phone", "ask_email", "ask_gender", "address", "ask_rating",
  "ask_location", "ask_order_id", "ask_image", "ask_video", "ask_text",
  "collect_input", "call_permission",
  // Catalog
  "catalog_single", "catalog_multiple", "catalog_view", "catalog_list_bestsellers", "catalog",
  // List
  "list", "list_order", "list_bestsellers",
];
