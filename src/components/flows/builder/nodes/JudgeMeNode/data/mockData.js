export const RATING_OPTIONS = [
  { value: 1, label: "⭐ 1 — Poor" },
  { value: 2, label: "⭐ 2 — Fair" },
  { value: 3, label: "⭐ 3 — Good" },
  { value: 4, label: "⭐ 4 — Very Good" },
  { value: 5, label: "⭐ 5 — Excellent" },
];

export const JM_VARIABLE_NAMES = {
  rating:    "jm_rating",
  text:      "jm_review_text",
  imageUrl:  "jm_image_url",
  productId: "jm_product_id",
};

export const DEFAULT_MESSAGES = {
  rating:      "How would you rate your recent purchase? Please select a rating.",
  ratingButton: "Rate",
  reviewText:  "Please share a brief review of your experience in one line.",
  reviewError: "Your review must be at least 3 characters. Please try again.",
  image:       "Please upload a photo of your product.",
  imageSkip:   "Skip",
};

export const VARIABLE_GROUPS = [
  {
    id: "customer",
    label: "Customer variables",
    variables: [
      { key: "customer.id",         label: "Customer ID",    type: "Number", recommended: true  },
      { key: "customer.phone",      label: "Phone Number",   type: "String", recommended: true  },
      { key: "customer.email",      label: "Email",          type: "String", recommended: true  },
      { key: "customer.name",       label: "Full Name",      type: "String", recommended: true  },
      { key: "customer.first_name", label: "First Name",     type: "String"                     },
      { key: "customer.last_name",  label: "Last Name",      type: "String"                     },
    ],
  },
  {
    id: "product",
    label: "Product variables",
    variables: [
      { key: "product.id",    label: "Product ID",    type: "String", recommended: true  },
      { key: "product.name",  label: "Product Name",  type: "String"                     },
      { key: "product.sku",   label: "Product SKU",   type: "String"                     },
      { key: "order.id",      label: "Order ID",      type: "String", recommended: true  },
    ],
  },
  {
    id: "store",
    label: "Store variables",
    variables: [
      { key: "store.name",   label: "Store Name",  type: "String", recommended: true  },
      { key: "store.domain", label: "Domain",      type: "String"                     },
    ],
  },
];

export const defaultJudgeMeNodeData = {
  label:       "Collect Review",
  channel:     "whatsapp",
  productVar:  null,
  ratingQuestion:  DEFAULT_MESSAGES.rating,
  ratingButton:    DEFAULT_MESSAGES.ratingButton,
  reviewQuestion:  DEFAULT_MESSAGES.reviewText,
  reviewError:     DEFAULT_MESSAGES.reviewError,
  retryCount:      2,
  imageEnabled:    false,
  imageQuestion:   DEFAULT_MESSAGES.image,
  allowSkipImage:  true,
  imageSkipLabel:  DEFAULT_MESSAGES.imageSkip,
  noResponseValue: 24,
  noResponseUnit:  "hours",
};
