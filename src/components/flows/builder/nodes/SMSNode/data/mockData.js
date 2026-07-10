import { PackageCheck, Megaphone } from "lucide-react";

export const SMS_PROVIDERS = [
  { id: "trustsignal", name: "TrustSignal" },
  { id: "msg91",       name: "MSG91" },
  { id: "kaleyra",     name: "Kaleyra" },
];

export const SMS_SENDER_IDS = [
  { id: "trustsignal_txtind", providerId: "trustsignal", senderId: "TXTIND", status: "active" },
  { id: "trustsignal_shprkt", providerId: "trustsignal", senderId: "SHPRKT", status: "active" },
  { id: "msg91_avimee",       providerId: "msg91",       senderId: "AVIMEE", status: "active" },
  { id: "kaleyra_studdm",     providerId: "kaleyra",     senderId: "STUDDM", status: "inactive" },
];

export const SMS_TEMPLATE_STYLES = [
  { id: "transactional", label: "Transactional", Icon: PackageCheck,
    desc: "Order updates, OTPs, delivery alerts — sent to a specific customer about their own activity." },
  { id: "promotional", label: "Promotional", Icon: Megaphone,
    desc: "Marketing blasts, offers, and sale alerts — sent to customers who've opted in to promotions." },
];

export const MOCK_SMS_TEMPLATES = [
  {
    id: "sms_001",
    name: "product",
    approvedTemplateId: "1707177711975941111",
    category: "promotional",
    body: "Hey! Hurry, %event:productview:item% almost sold out! At Studd Muffyn, use FINAL20 & abhi buy karo: %event:productview:url%",
    variables: ["$1", "$2"],
    status: "Approved",
    lastUpdated: "2025-05-10",
  },
  {
    id: "sms_002",
    name: "cart_recovery_v1",
    approvedTemplateId: "1707177711975940001",
    category: "promotional",
    body: "Hi {{$1}}, you left items in your cart! Complete your order now and get 10% off with code SAVE10: {{$2}}",
    variables: ["$1", "$2"],
    status: "Approved",
    lastUpdated: "2025-04-28",
  },
  {
    id: "sms_003",
    name: "order_shipped",
    approvedTemplateId: "1707177711975940002",
    category: "transactional",
    body: "Your order #{{$1}} has been shipped! Track it here: {{$2}}. Expected delivery: {{$3}}",
    variables: ["$1", "$2", "$3"],
    status: "Approved",
    lastUpdated: "2025-05-02",
  },
  {
    id: "sms_004",
    name: "flash_sale_alert",
    approvedTemplateId: "1707177711975940003",
    category: "promotional",
    body: "FLASH SALE! Up to 50% off on all products at Studd Muffyn for the next 2 hours only. Shop now: {{$1}}",
    variables: ["$1"],
    status: "Approved",
    lastUpdated: "2025-05-08",
  },
  {
    id: "sms_005",
    name: "otp_verification",
    approvedTemplateId: "1707177711975940004",
    category: "transactional",
    body: "Your OTP for verification is {{$1}}. Valid for 10 minutes. Do not share this with anyone.",
    variables: ["$1"],
    status: "Approved",
    lastUpdated: "2025-04-15",
  },
];

function makeStyleConfig(category) {
  return {
    defaultDraft: { name: "", approvedTemplateId: "", body: "", shortenUrl: "", variableMap: {} },
    mockTemplates: MOCK_SMS_TEMPLATES.filter((t) => t.category === category),
    isValid: (draft) => Boolean(draft.name) && Boolean(draft.body),
  };
}

export const SMS_TEMPLATE_STYLE_CONFIGS = {
  transactional: makeStyleConfig("transactional"),
  promotional: makeStyleConfig("promotional"),
};

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",   example: "Priya"             },
    { key: "customer.lastName",  label: "Last Name",    example: "Sharma"            },
    { key: "customer.name",      label: "Full Name",    example: "Priya Sharma"      },
    { key: "customer.phone",     label: "Phone",        example: "+91 98765 43210"   },
    { key: "customer.email",     label: "Email",        example: "priya@example.com" },
    { key: "customer.id",        label: "Customer ID",  example: "CUST_4821"         },
  ],
  Order: [
    { key: "order.id",           label: "Order ID",       example: "#ORD-7842"                    },
    { key: "order.amount",       label: "Order Amount",   example: "₹1,299"                       },
    { key: "order.items",        label: "Items",          example: "Rosemary Water, Hair Oil"     },
    { key: "order.trackingUrl",  label: "Tracking URL",   example: "https://track.example.com/"  },
    { key: "order.deliveryDate", label: "Delivery Date",  example: "June 3, 2026"                },
    { key: "order.status",       label: "Order Status",   example: "Shipped"                     },
  ],
  Product: [
    { key: "product.name",  label: "Product Name", example: "Rosemary Water"              },
    { key: "product.price", label: "Price",        example: "₹399"                        },
    { key: "product.url",   label: "Product URL",  example: "https://store.com/rosemary"  },
  ],
  Store: [
    { key: "store.name", label: "Store Name", example: "Avimee Herbal"  },
    { key: "store.url",  label: "Store URL",  example: "https://avimee.com" },
  ],
};

export const SMS_DELIVERY_OPTIONS = [
  { id: "next_step", label: "Next Step",       isDefault: true  },
  { id: "sent",      label: "Sent",            isDefault: false },
  { id: "delivered", label: "Delivered",       isDefault: false },
  { id: "failed",    label: "Failed",          isDefault: false },
];

export const defaultSMSNodeData = {
  label: "Send SMS",
  providerId: null,
  senderIdId: null,
  templateStyle: null,
  template: null,
  variableMap: {},
  outputConfig: {
    routingMode:      "next_step",
    deliveryOutputs:  [],
    wiredPorts:       [],
  },
  utm: { enabled: false, source: "sms", medium: "journey", campaign: "" },
  aiBestTime:  false,
  smartRetry:  { enabled: false, mode: "smart" },
};
