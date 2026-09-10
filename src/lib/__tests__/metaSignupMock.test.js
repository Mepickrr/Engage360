import {
  STORAGE_KEY,
  DEFAULT_SIGNUP_PAYLOAD,
  buildSignupPayload,
  writeSignupPayload,
  readSignupPayload,
  openSignupPopup,
} from "../metaSignupMock";

describe("buildSignupPayload", () => {
  it("derives the phone number from has_number mode", () => {
    const payload = buildSignupPayload({
      brandName: "Avimee",
      category: "Shopping & Retail",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      numberMode: "has_number",
      numberValue: "98765 43210",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
    expect(payload.brandName).toBe("Avimee");
    expect(payload.category).toBe("Shopping & Retail");
    expect(payload.website).toBe("https://avimee.com");
    expect(payload.email).toBe("hi@avimee.com");
  });

  it("uses the selected virtual number when in needs_virtual_number mode", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "needs_virtual_number",
      numberValue: "",
      virtualNumberValue: "+91 63001 22456",
    });
    expect(payload.phoneNumber).toBe("+91 63001 22456");
  });

  it("falls back to the placeholder number in has_app mode", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "has_app",
      numberValue: "",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
  });

  it("falls back to the placeholder number when has_number mode has no value typed", () => {
    const payload = buildSignupPayload({
      brandName: "",
      category: "",
      website: "",
      email: "",
      numberMode: "has_number",
      numberValue: "",
      virtualNumberValue: "",
    });
    expect(payload.phoneNumber).toBe("+91 98765 43210");
  });
});

describe("writeSignupPayload / readSignupPayload", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a written payload", () => {
    const payload = buildSignupPayload({
      brandName: "Avimee",
      category: "Ecommerce",
      website: "https://avimee.com",
      email: "hi@avimee.com",
      numberMode: "has_number",
      numberValue: "98765 43210",
      virtualNumberValue: "",
    });
    writeSignupPayload(payload);
    expect(readSignupPayload()).toEqual(payload);
  });

  it("returns the default payload when nothing is stored", () => {
    expect(readSignupPayload()).toEqual(DEFAULT_SIGNUP_PAYLOAD);
  });

  it("returns the default payload when the stored value is malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readSignupPayload()).toEqual(DEFAULT_SIGNUP_PAYLOAD);
  });
});

describe("openSignupPopup", () => {
  it("opens the signup route as a named popup with fixed dimensions", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    openSignupPopup();
    expect(openSpy).toHaveBeenCalledWith(
      "/engage/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
    openSpy.mockRestore();
  });
});
