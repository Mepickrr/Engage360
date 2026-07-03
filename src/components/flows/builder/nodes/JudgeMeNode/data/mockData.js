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

export const PRODUCT_SELECTOR_OPTIONS = [
  { value: "all",            label: "All product one after another" },
  { value: "highest_value",  label: "Highest Product Value"         },
  { value: "least_reviewed", label: "Least Review Product"          },
  { value: "least_rated",    label: "Least Rating Product"          },
];

export const defaultJudgeMeNodeData = {
  label:       "Collect Review",
  productVar:  "all",
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
