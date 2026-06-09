export const CHATBOT_TEAL = "#0891B2";

// ── Global config ─────────────────────────────────────────────────

export const CHATBOT_TONES = [
  { id: "casual",       label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "formal",       label: "Formal" },
];

export const AGENT_TYPES = [
  { id: "faq",            label: "FAQ Bot",                desc: "Answers frequently asked questions from a knowledge base" },
  { id: "support",        label: "Support Agent",          desc: "Handles customer support issues and resolves complaints" },
  { id: "sales",          label: "Sales Assistant",        desc: "Drives product discovery and guides toward purchase" },
  { id: "recommendation", label: "Product Recommendation", desc: "Recommends products based on browsing and purchase history" },
  { id: "custom",         label: "Custom",                 desc: "Define your own agent behavior via instructions" },
];

// ── Per-node config ───────────────────────────────────────────────

export const CHATBOT_TEMPLATES = [
  {
    id: "customer_support",
    name: "Customer Support",
    goal: "Resolve the customer's issue. Collect order ID or relevant details. Escalate if unresolved.",
    replyOptions: [
      { id: "ro_talk_agent", label: "Talk to agent" },
      { id: "ro_self_serve", label: "Self-serve help" },
    ],
  },
  {
    id: "product_faq",
    name: "Product FAQ",
    goal: "Answer product questions accurately. If the question is outside the knowledge base, escalate.",
    replyOptions: [
      { id: "ro_browse",    label: "Browse products" },
      { id: "ro_main_menu", label: "Main menu" },
    ],
  },
  {
    id: "lead_qualification",
    name: "Lead Qualification",
    goal: "Qualify the prospect by understanding their need, budget, and timeline. Route qualified leads.",
    replyOptions: [
      { id: "ro_talk_sales", label: "Talk to sales" },
      { id: "ro_not_now",    label: "Not right now" },
    ],
  },
  {
    id: "order_tracking",
    name: "Order Tracking",
    goal: "Provide order status and estimated delivery. Handle delay queries empathetically.",
    replyOptions: [
      { id: "ro_track",   label: "Track my order" },
      { id: "ro_issue",   label: "Report an issue" },
    ],
  },
  {
    id: "product_recommendation",
    name: "Product Recommendation",
    goal: "Recommend products based on the customer's stated preferences and purchase history.",
    replyOptions: [
      { id: "ro_see_picks", label: "See recommendations" },
      { id: "ro_browse",    label: "Browse catalog" },
    ],
  },
];

export const TIMEOUT_OPTIONS = [
  { value: 5,    label: "5 min" },
  { value: 15,   label: "15 min" },
  { value: 30,   label: "30 min" },
  { value: 60,   label: "1 hour" },
  { value: 1440, label: "24 hours" },
];

export const SYSTEM_PORT_GOAL    = "__goal_achieved__";
export const SYSTEM_PORT_TIMEOUT = "__no_response__";

// Per-node defaults (goal, replies, outputs)
export const defaultAiChatbotNodeData = {
  label:          "AI Chatbot",
  mode:           "custom",    // "template" | "custom"
  templateId:     null,
  goal:           "",
  replyOptions:   [
    { id: "ro_talk_agent", label: "Talk to agent" },
    { id: "ro_main_menu",  label: "Main menu" },
  ],
  timeoutMinutes: 30,
  wiredPorts:     [],
};

// Global defaults (instructions, personality — shared across all chatbot nodes)
export const defaultAiChatbotGlobal = {
  personalityId:   "friendly",
  tone:            "professional",
  instructions:    "",
  agentType:       null,
  storeDataAccess: false,
  storeDataMode:   "full",
  tools:           [],
  handoverContext: [],
  configured:      false,
};
