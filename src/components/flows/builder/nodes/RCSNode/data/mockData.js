import { PackageCheck, Megaphone } from "lucide-react";

export const RCS_NUMBERS = [
  { id: "rcs_1", nickname: "Main Business", number: "+91 98765 43210", status: "active" },
  { id: "rcs_2", nickname: "Support Line",  number: "+91 80000 11111", status: "active" },
  { id: "rcs_3", nickname: "Promo Channel", number: "+91 99999 00000", status: "inactive" },
];

export const RCS_DELIVERY_OUTPUT_OPTIONS = [
  { id: "next_step",       label: "Next Step",         isDefault: true  },
  { id: "sent",            label: "Sent",              isDefault: false },
  { id: "delivered",       label: "Delivered",         isDefault: false },
  { id: "read",            label: "Read",              isDefault: false },
  { id: "delivery_failed", label: "Delivery Failed",   isDefault: false },
  { id: "no_response",     label: "No response after", isDefault: false, hasTimeConfig: true },
];

export const RCS_BUTTON_TYPES = [
  { id: "quick_reply", label: "Quick Reply" },
  { id: "url",         label: "Open URL" },
  { id: "call",        label: "Call Phone" },
];

// Buttons that generate canvas output ports (quick_reply and url are connectable)
export const rcsIsConnectable = (btn) =>
  btn.type === "quick_reply" || btn.type === "url";

export const MOCK_RCS_TEMPLATES = [
  {
    id: "rcs_welcome",
    name: "Welcome Message",
    type: "Transactional",
    status: "Approved",
    style: "single",
    mediaType: "image",
    body: "Hi {{customerName}}! Welcome to {{brandName}}. We're thrilled to have you on board.",
    buttons: [
      { type: "url", label: "Visit Website", value: "https://example.com" },
      { type: "quick_reply", label: "Learn More" },
    ],
  },
  {
    id: "rcs_promo",
    name: "Promotional Offer",
    type: "Promotional",
    status: "Approved",
    style: "single",
    mediaType: "image",
    body: "Hi {{customerName}}! Exclusive offer just for you: {{offerDetails}}. Valid till {{expiryDate}}. Don't miss out!",
    buttons: [
      { type: "url", label: "Shop Now", value: "https://example.com/shop" },
      { type: "quick_reply", label: "Not Interested" },
    ],
  },
  {
    id: "rcs_order_update",
    name: "Order Update",
    type: "Transactional",
    status: "Approved",
    style: "single",
    mediaType: "none",
    body: "Your order #{{orderId}} has been {{orderStatus}}. Expected delivery: {{deliveryDate}}. Track your order below.",
    buttons: [
      { type: "url", label: "Track Order", value: "https://example.com/track" },
    ],
  },
  {
    id: "rcs_feedback",
    name: "Feedback Request",
    type: "Transactional",
    status: "Approved",
    style: "basic",
    mediaType: "none",
    body: "Hi {{customerName}}, how was your experience with us? Your feedback helps us improve. Reply to rate us.",
    buttons: [],
  },
  {
    id: "rcs_reminder",
    name: "Appointment Reminder",
    type: "Transactional",
    status: "In Review",
    style: "single",
    mediaType: "none",
    body: "Reminder: You have an appointment on {{appointmentDate}} at {{appointmentTime}}. Please confirm your attendance.",
    buttons: [
      { type: "quick_reply", label: "Confirm" },
      { type: "quick_reply", label: "Reschedule" },
    ],
  },
];

export const SYSTEM_VARIABLES = [
  "customerName", "brandName", "orderId", "orderStatus", "deliveryDate",
  "productName", "offerDetails", "expiryDate", "appointmentDate", "appointmentTime",
];

// ── Template Style catalogue (Transactional/Promotional) ─────────
// Reuses the existing template.type values as style ids directly, so no
// migration of MOCK_RCS_TEMPLATES is needed — same pattern as SMS/WhatsApp's
// TemplateStylePicker, keyed by RCS_TEMPLATE_STYLE_CONFIGS below.
export const RCS_TEMPLATE_STYLES = [
  { id: "Transactional", label: "Transactional", Icon: PackageCheck,
    desc: "Order updates, OTPs, delivery alerts — sent to a specific customer about their own activity." },
  { id: "Promotional", label: "Promotional", Icon: Megaphone,
    desc: "Marketing blasts, offers, and sale alerts — sent to customers who've opted in to promotions." },
];

function makeRCSStyleConfig(type) {
  return {
    defaultDraft: { id: null, name: "", type, status: "Draft", style: "single", mediaType: "none", body: "", buttons: [] },
    mockTemplates: MOCK_RCS_TEMPLATES.filter((t) => t.type === type),
    isValid: (draft) => Boolean(draft.name) && Boolean(draft.body),
  };
}

export const RCS_TEMPLATE_STYLE_CONFIGS = {
  Transactional: makeRCSStyleConfig("Transactional"),
  Promotional: makeRCSStyleConfig("Promotional"),
};

export const defaultRCSNodeData = {
  label: "Send RCS",
  template: null,
  variableMap: {},
  rcsNumberId: "rcs_1",
  templateStyle: null,
  outputConfig: {
    routingMode: "next_step",
    deliveryOutputs: [],
    noResponseValue: 5,
    noResponseUnit: "hours",
    wiredPorts: [],
  },
  utm: { enabled: true, utm_source: "rcs", utm_medium: "journey", utm_campaign: "", utm_content: "", utm_term: "" },
  aiBestTime: false,
  smartRetry: { enabled: false, mode: "smart" },
};
