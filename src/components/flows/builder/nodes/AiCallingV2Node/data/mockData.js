export const PROVIDERS = [
  { value: "squadstack", label: "Squadstack" },
];

export const PHONE_NUMBERS = [
  { value: "919999999999", label: "+91 99999 99999" },
  { value: "918888888888", label: "+91 88888 88888" },
];

export const AGENT_TYPES = [
  { value: "oc_ac_c2p",      label: "OC-AC-C2P Stack" },
  { value: "abandoned_cart", label: "Abandoned Cart" },
  { value: "marketing",      label: "Marketing Pitch" },
  { value: "nps",            label: "NPS" },
];

export const VOICE_BUILDS_BY_TYPE = {
  oc_ac_c2p:      ["OC-AC", "OC", "AC", "OC-CTP", "CTP", "CTP2"],
  abandoned_cart: ["Aba1", "aba_fem", "aba"],
  marketing:      ["Payday"],
  nps:            ["Npss"],
};

export const VOICES = [
  { value: "varsha", label: "Varsha (F)", gender: "F" },
  { value: "harish", label: "Harish (M)", gender: "M" },
];

export const RETRY_GAPS = [
  { value: 5,   label: "5 min" },
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 60,  label: "1 hr" },
  { value: 120, label: "2 hrs" },
];

export const COUPON_EXPIRY_OPTIONS = [
  { value: "none", label: "No expiry" },
  { value: "24h",  label: "24 hours" },
  { value: "48h",  label: "48 hours" },
  { value: "72h",  label: "72 hours" },
  { value: "7d",   label: "7 days" },
];

// Each entry: { id: string, label: string, group: "intent"|"connection" }
export const OUTPUT_PORTS_BY_TYPE = {
  oc_ac_c2p: [
    { id: "oc",                label: "OC",                   group: "intent" },
    { id: "orderCancellation", label: "Order Cancellation",   group: "intent" },
    { id: "ac",                label: "AC",                   group: "intent" },
    { id: "acChange",          label: "AC Change",            group: "intent" },
    { id: "acNotInterested",   label: "AC Not Interested",    group: "intent" },
    { id: "ctpInterested",     label: "CTP Interested",       group: "intent" },
    { id: "ctpNotInterested",  label: "CTP Not Interested",   group: "intent" },
    { id: "codInterested",     label: "COD Interested",       group: "intent" },
    { id: "connected",         label: "Connected",            group: "connection" },
    { id: "noResponse",        label: "No Response",          group: "connection" },
    { id: "notConnected",      label: "Not Connected",        group: "connection" },
  ],
  abandoned_cart: [
    { id: "abcInterested",          label: "ABC Interested",              group: "intent" },
    { id: "abcInterestedNoAddress", label: "ABC Interested (No Address)", group: "intent" },
    { id: "abcNotInterested",       label: "ABC Not Interested",          group: "intent" },
    { id: "codEnabled",             label: "COD Enabled",                 group: "intent" },
    { id: "connected",              label: "Connected",                   group: "connection" },
    { id: "noResponse",             label: "No Response",                 group: "connection" },
    { id: "notConnected",           label: "Not Connected",               group: "connection" },
  ],
  marketing: [
    { id: "interested",   label: "Interested",    group: "intent" },
    { id: "cutTheCall",   label: "Cut the Call",  group: "intent" },
    { id: "notConnected", label: "Not Connected", group: "intent" },
  ],
  nps: [
    { id: "interested",   label: "Interested",    group: "intent" },
    { id: "cutTheCall",   label: "Cut the Call",  group: "intent" },
    { id: "notConnected", label: "Not Connected", group: "intent" },
  ],
};

export const defaultAiCallingV2NodeData = {
  label: "AI Calling",
  provider: "squadstack",
  phoneNumber: "",
  agentType: "",
  voiceBuild: "",
  voice: "varsha",
  discount: {
    enabled: false,
    message: "",
    couponCode: "",
    expiry: "none",
  },
  placeCOD: false,
  retryAttempt: 1,
  retryGap: 5,
  utm: {
    enabled: false,
    utm_source: "aicalling",
    utm_medium: "journey",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  },
  outputMode: "next",
  wiredPorts: [],
};
