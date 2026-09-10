// Prototype mock: builds and hands off the payload the Meta Embedded
// Signup mock tab prefills itself from. No real Meta/Facebook API is
// involved anywhere in this file.

export const STORAGE_KEY = "fastrr-engage-signup-mock-payload";

const FALLBACK_PHONE = "+91 98765 43210";

export const DEFAULT_SIGNUP_PAYLOAD = {
  brandName: "",
  category: "",
  website: "",
  email: "",
  phoneNumber: FALLBACK_PHONE,
};

export function buildSignupPayload({
  brandName,
  category,
  website,
  email,
  numberMode,
  numberValue,
  virtualNumberValue,
}) {
  let phoneNumber = FALLBACK_PHONE;
  if (numberMode === "has_number" && numberValue) {
    phoneNumber = `+91 ${numberValue}`;
  } else if (numberMode === "needs_virtual_number" && virtualNumberValue) {
    phoneNumber = virtualNumberValue;
  }

  return {
    brandName: brandName || "",
    category: category || "",
    website: website || "",
    email: email || "",
    phoneNumber,
  };
}

export function writeSignupPayload(payload) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// Note: this payload persists across sessions until overwritten by a new
// handleStartSignup() call — opening this URL directly without going
// through the Account Setup CTA will read whatever was last written
// (or DEFAULT_SIGNUP_PAYLOAD if nothing ever was). Fine for this prototype;
// worth revisiting if this flow gets a real backend.
export function readSignupPayload() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SIGNUP_PAYLOAD;
  try {
    return { ...DEFAULT_SIGNUP_PAYLOAD, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SIGNUP_PAYLOAD;
  }
}

export function openSignupPopup() {
  return window.open(
    "/engage/meta-embedded-signup",
    "metaEmbeddedSignup",
    "width=560,height=780"
  );
}
