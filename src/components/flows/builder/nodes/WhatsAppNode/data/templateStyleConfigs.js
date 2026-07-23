// src/components/flows/builder/nodes/WhatsAppNode/data/templateStyleConfigs.js
import { MOCK_TEMPLATES } from "./mockTemplates";

const LANGUAGE_OPTIONS = [{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }];
const STATUS_OPTIONS = ["Draft", "Uploaded", "Approved", "Rejected", "Paused"];

export const STANDARD_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. cart_recovery_v1" },
  { key: "category", label: "Category", type: "select", options: ["Marketing", "Utility", "Conversational"] },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "header", label: "Header", type: "header-picker" },
  { key: "body", label: "Message Body", type: "body-with-variables", rows: 5 },
  { key: "footer", label: "Footer (optional)", type: "text", placeholder: "Reply STOP to unsubscribe" },
  { key: "buttons", label: "Buttons", type: "buttons-list", max: 3 },
];

export const SESSION_FIELDS = STANDARD_FIELDS.filter((f) => f.key !== "category");

export const FLOW_FORM_FIELDS = [...STANDARD_FIELDS, { key: "flowCta", label: "Call to action", type: "flow-cta" }];

export const AUTH_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. otp_verification_v1" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "body-with-variables", rows: 4 },
  { key: "codeButtonLabel", label: "Copy Code Button Label", type: "text", placeholder: "Copy Code" },
];

export const CATALOG_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. catalog_bestsellers_v1" },
  { key: "category", label: "Category", type: "select", options: ["Marketing", "Utility"] },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "body-with-variables", rows: 3 },
  { key: "productNames", label: "Products (comma-separated)", type: "text", placeholder: "Rosemary Water, Hair Oil, Grey Hair Serum" },
];

export const LOCATION_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. store_location_v1" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Message Body", type: "body-with-variables", rows: 3 },
  { key: "addressLabel", label: "Address Caption", type: "text", placeholder: "123 Rosemary Lane, Bengaluru" },
];

export const AUDIO_FIELDS = [
  { key: "name", label: "Template Name", type: "text", placeholder: "e.g. founder_welcome_note" },
  { key: "language", label: "Language", type: "select", options: LANGUAGE_OPTIONS },
  { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { key: "body", label: "Caption", type: "body-with-variables", rows: 3 },
  { key: "audioLabel", label: "Audio Clip Label", type: "text", placeholder: "Founder's welcome note · 0:32" },
];

const STANDARD_DEFAULT_DRAFT = { name: "", category: "Marketing", language: "en", status: "Draft", header: { type: "none" }, body: "", footer: "", buttons: [], variableMap: {} };

export const COLLECT_INPUT_PRESETS = {
  text: { inputType: "text", questionMessage: "Tell us what you're looking for today" },
  phone: { inputType: "phone", questionMessage: "What's your phone number?" },
  email: { inputType: "email", questionMessage: "What's your email address?" },
  number: { inputType: "number", questionMessage: "How would you rate your experience (1-5)?" },
  location: { inputType: "location", questionMessage: "Please share your delivery address." },
  image: { inputType: "image", questionMessage: "Please share a photo of your product." },
  video: { inputType: "video", questionMessage: "Please share a short video." },
  document: { inputType: "document", questionMessage: "Please share a document for reference." },
  selection: { inputType: "selection", questionMessage: "Which option do you prefer?" },
  address: { inputType: "address", questionMessage: "What's your delivery address?" },
  rating: { inputType: "rating", questionMessage: "How would you rate your experience (1-5)?" },
  gender: { inputType: "gender", questionMessage: "What's your gender?" },
};

export const TEMPLATE_STYLE_CONFIGS = {
  standard: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: STANDARD_DEFAULT_DRAFT,
    mockTemplates: MOCK_TEMPLATES,
  },

  session: {
    previewKind: "standard",
    fields: SESSION_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Conversational" },
    mockTemplates: [
      { id: "session_1", name: "session_welcome_back", category: "Conversational", language: "en", status: "Active", header: { type: "none" }, body: "Welcome back! How can we help today?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Track Order" }, { type: "QUICK_REPLY", label: "Talk to Support" }] },
      { id: "session_2", name: "session_cart_reminder", category: "Conversational", language: "en", status: "Active", header: { type: "none" }, body: "Your cart is still here — need a hand checking out?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "View Cart" }] },
    ],
  },

  authentication: {
    previewKind: "standard",
    fields: AUTH_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "Your verification code is {{otp}}. Valid for 5 minutes. Don't share this code.", codeButtonLabel: "Copy Code", variableMap: {} },
    mockTemplates: [
      { id: "auth_1", name: "otp_verification_v1", language: "en", status: "Approved", body: "Your verification code is {{otp}}. Valid for 5 minutes. Don't share this code.", codeButtonLabel: "Copy Code" },
      { id: "auth_2", name: "otp_resend_v1", language: "en", status: "Draft", body: "Didn't get it? Your new code is {{otp}}. Valid for 5 minutes.", codeButtonLabel: "Copy Code" },
    ],
  },

  carousel: {
    previewKind: "carousel",
    fields: null,
    defaultDraft: { name: "", category: "Marketing", language: "en", body: "", cards: [{ mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] }, { mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] }] },
    mockTemplates: [
      {
        id: "carousel_1", isCarousel: true, name: "new_arrivals_v1", category: "Marketing", language: "en", body: "Check out what's new this week 👀",
        cards: [
          { mediaUrl: "https://placehold.co/300x200/25D366/white?text=Rosemary+Water", cardBody: "Rosemary Water — ₹399", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/1a4a2e/white?text=Hair+Oil", cardBody: "Keshpallav Hair Oil — ₹499", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/2d4a22/white?text=Scalp+Serum", cardBody: "Scalptone Serum — ₹549", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
        ],
      },
      {
        id: "carousel_2", isCarousel: true, name: "bestsellers_this_week", category: "Marketing", language: "en", body: "Our bestsellers this week 🔥",
        cards: [
          { mediaUrl: "https://placehold.co/300x200/25D366/white?text=Bestseller+1", cardBody: "Grey Hair Serum — ₹449", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
          { mediaUrl: "https://placehold.co/300x200/1a4a2e/white?text=Bestseller+2", cardBody: "Hair Fall Kit — ₹899", buttons: [{ type: "QUICK_REPLY", label: "Shop Now" }] },
        ],
      },
    ],
  },

  location: {
    previewKind: "location",
    fields: LOCATION_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "", addressLabel: "", variableMap: {} },
    mockTemplates: [
      { id: "location_1", name: "store_location_v1", language: "en", status: "Active", body: "Our store is here — see you soon!", addressLabel: "123 Rosemary Lane, Bengaluru" },
      { id: "location_2", name: "pickup_point_confirmed", language: "en", status: "Active", body: "Pickup point confirmed for order #7842", addressLabel: "Avimee Pickup Point, MG Road" },
    ],
  },

  flow_form: {
    previewKind: "standard",
    fields: FLOW_FORM_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, flowCta: { buttonIcon: "default", buttonText: "View Flow", flowFormId: null, flowFormName: null } },
    mockTemplates: [
      { id: "flow_form_1", name: "post_purchase_survey_v1", category: "Marketing", language: "en", status: "Active", header: { type: "none" }, body: "We'd love your feedback on your recent order!", footer: "", buttons: [], flowCta: { buttonIcon: "default", buttonText: "Take Survey", flowFormId: "ff_1", flowFormName: "Post-purchase survey" } },
      { id: "flow_form_2", name: "event_rsvp_v1", category: "Marketing", language: "en", status: "Draft", header: { type: "none" }, body: "You're invited! Reserve your spot below.", footer: "", buttons: [], flowCta: { buttonIcon: "default", buttonText: "RSVP Now", flowFormId: "ff_2", flowFormName: "Event RSVP" } },
    ],
  },

  audio: {
    previewKind: "audio",
    fields: AUDIO_FIELDS,
    defaultDraft: { name: "", language: "en", status: "Draft", body: "", audioLabel: "", variableMap: {} },
    mockTemplates: [
      { id: "audio_1", name: "founder_welcome_note", language: "en", status: "Active", body: "Here's a quick voice note from our founder 🎙", audioLabel: "Founder's welcome note · 0:32" },
      { id: "audio_2", name: "rosemary_howto_audio", language: "en", status: "Draft", body: "Listen to how to use your Rosemary Water", audioLabel: "How-to guide · 0:48" },
    ],
  },

  order_payment: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "order_payment_1", name: "order_payment_pending", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Your order of Rosemary Water (₹399) is ready — complete payment to confirm.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "https://avimee.com/pay?ref={{order.id}}" }] },
      { id: "order_payment_2", name: "order_payment_multi_item", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "2 items in your order — pay ₹1,299 to ship today.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "https://avimee.com/pay" }] },
    ],
  },

  order_confirmation: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "order_confirmation_1", name: "order_confirmed_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Payment received! Order #7842 confirmed and being packed.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Track Order" }] },
      { id: "order_confirmation_2", name: "order_payment_failed_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Payment failed for order #7842 — retry now.", footer: "", buttons: [{ type: "URL", label: "Retry Payment", url: "https://avimee.com/pay?ref=7842" }] },
    ],
  },

  complete_checkout: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "complete_checkout_1", name: "checkout_confirm_address", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Let's finish your order — confirm your delivery address to continue.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Confirm Address" }, { type: "QUICK_REPLY", label: "Edit Address" }] },
      { id: "complete_checkout_2", name: "checkout_cod_confirm", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Confirm Cash on Delivery for your order — pay ₹1,299 on arrival.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Confirm COD" }] },
    ],
  },

  payment_link: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "payment_link_1", name: "payment_link_v1", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Complete your ₹599 payment here.", footer: "", buttons: [{ type: "URL", label: "Pay via UPI", url: "upi://pay?ref=7842" }] },
      { id: "payment_link_2", name: "payment_link_reminder", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Reminder: your payment link expires in 2 hours.", footer: "", buttons: [{ type: "URL", label: "Pay Now", url: "upi://pay?ref=7842" }] },
    ],
  },

  address: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "address_1", name: "confirm_delivery_address", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Please confirm your delivery address for order #7842.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Address is Correct" }, { type: "QUICK_REPLY", label: "Edit Address" }] },
      { id: "address_2", name: "add_landmark_hint", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Add a landmark to help our rider find you.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Add Landmark" }] },
    ],
  },

  collect_input: {
    previewKind: "collectInput",
    fields: null,
    defaultDraft: { isCollectInput: true, inputType: "text", questionMessage: "", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_text" }, confirmation: { enabled: false, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" }, errorMessage: "Please send a text message." },
    mockTemplates: [
      { id: "collect_input_1", isCollectInput: true, inputType: "text", questionMessage: "Tell us what you're looking for today", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_text" }, confirmation: { enabled: false, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" }, errorMessage: "Please send a text message." },
      { id: "collect_input_2", isCollectInput: true, inputType: "email", questionMessage: "What's your email address?", retryAttempts: 3, noResponse: { timeoutValue: 1, timeoutUnit: "hours", retryOnce: false }, saveToVariable: { scope: "flow", variableName: "collected_email" }, confirmation: { enabled: true, message: "You entered {{collected_value}} — is this correct?", confirmLabel: "Confirm", editLabel: "Edit" }, errorMessage: "That doesn't look like a valid email. Please try again." },
    ],
  },

  call_permission: {
    previewKind: "standard",
    fields: STANDARD_FIELDS,
    defaultDraft: { ...STANDARD_DEFAULT_DRAFT, category: "Utility" },
    mockTemplates: [
      { id: "call_permission_1", name: "call_permission_order", category: "Utility", language: "en", status: "Active", header: { type: "none" }, body: "Can we give you a quick call about your order?", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Allow" }, { type: "QUICK_REPLY", label: "Deny" }] },
      { id: "call_permission_2", name: "call_permission_support", category: "Utility", language: "en", status: "Draft", header: { type: "none" }, body: "Our support team would like to call you back.", footer: "", buttons: [{ type: "QUICK_REPLY", label: "Allow" }, { type: "QUICK_REPLY", label: "Not Now" }] },
    ],
  },

  catalog_single: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "", variableMap: {} },
    mockTemplates: [
      { id: "catalog_single_1", name: "featured_rosemary_water", category: "Marketing", language: "en", status: "Active", body: "Our most-loved product, one tap away.", productNames: "Rosemary Water" },
      { id: "catalog_single_2", name: "featured_hair_oil", category: "Marketing", language: "en", status: "Draft", body: "The oil everyone's talking about.", productNames: "Keshpallav Hair Oil" },
    ],
  },

  catalog_multiple: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "", variableMap: {} },
    mockTemplates: [
      { id: "catalog_multiple_1", name: "top_3_products", category: "Marketing", language: "en", status: "Active", body: "Our top 3 picks for you.", productNames: "Rosemary Water, Keshpallav Hair Oil, Grey Hair Serum" },
      { id: "catalog_multiple_2", name: "combo_deal_set", category: "Marketing", language: "en", status: "Draft", body: "Bundle & save on our Combo Deal.", productNames: "Rosemary Water, Keshpallav Hair Oil" },
    ],
  },

  catalog_view: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "", variableMap: {} },
    mockTemplates: [
      { id: "catalog_view_1", name: "browse_full_catalog", category: "Marketing", language: "en", status: "Active", body: "Browse our full catalog.", productNames: "Rosemary Water, Keshpallav Hair Oil, Grey Hair Serum, Scalptone Serum" },
      { id: "catalog_view_2", name: "new_collection_drop", category: "Marketing", language: "en", status: "Draft", body: "New collection just dropped.", productNames: "Scalptone Serum, Grey Hair Serum" },
    ],
  },

  catalog_list_bestsellers: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "", variableMap: {} },
    mockTemplates: [
      { id: "catalog_list_bestsellers_1", name: "top_5_bestsellers", category: "Marketing", language: "en", status: "Active", body: "Our Top 5 Bestsellers.", productNames: "Rosemary Water, Hair Oil, Grey Hair Serum, Scalptone Serum, Hair Fall Kit" },
      { id: "catalog_list_bestsellers_2", name: "trending_this_month", category: "Marketing", language: "en", status: "Draft", body: "Trending This Month.", productNames: "Rosemary Water, Hair Fall Kit" },
    ],
  },

  catalog: {
    previewKind: "catalog",
    fields: CATALOG_FIELDS,
    defaultDraft: { name: "", category: "Marketing", language: "en", status: "Draft", body: "", productNames: "", variableMap: {} },
    mockTemplates: [
      { id: "catalog_1", name: "bestsellers_showcase", category: "Marketing", language: "en", status: "Active", body: "🔥 Bestsellers you'll love.", productNames: "Rosemary Water, Keshpallav Hair Oil" },
      { id: "catalog_2", name: "seasonal_sale_showcase", category: "Marketing", language: "en", status: "Draft", body: "Seasonal sale — up to 30% off bestsellers.", productNames: "Grey Hair Serum, Scalptone Serum" },
    ],
  },

  list: {
    previewKind: "list",
    fields: null,
    defaultDraft: { isListMessage: true, header: "", body: "", footer: "", buttonText: "", sections: [{ title: "", rows: [{ id: "row_1", title: "", description: "" }] }] },
    mockTemplates: [
      {
        id: "list_1", isListMessage: true, header: "", body: "Choose a delivery slot", footer: "", buttonText: "Pick a Slot",
        sections: [
          { title: "Morning", rows: [{ id: "row_1", title: "8am - 11am", description: "" }] },
          { title: "Afternoon", rows: [{ id: "row_2", title: "12pm - 3pm", description: "" }] },
          { title: "Evening", rows: [{ id: "row_3", title: "5pm - 8pm", description: "" }] },
        ],
      },
      {
        id: "list_2", isListMessage: true, header: "", body: "Pick a support topic", footer: "", buttonText: "View Topics",
        sections: [
          { title: "", rows: [
            { id: "row_1", title: "Orders", description: "" },
            { id: "row_2", title: "Returns", description: "" },
            { id: "row_3", title: "Other", description: "" },
          ] },
        ],
      },
    ],
  },
};
