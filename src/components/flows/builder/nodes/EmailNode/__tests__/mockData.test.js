import {
  EMAIL_PROVIDERS,
  TO_EMAIL_VARIABLES,
  defaultEmailNodeData,
} from "../data/mockData";

describe("EmailNode mockData", () => {
  it("defines the mocked email providers with Trust signal as the default first option", () => {
    expect(EMAIL_PROVIDERS[0]).toEqual({ id: "trust_signal", label: "Trust signal" });
    expect(EMAIL_PROVIDERS.some((p) => p.id === "karix")).toBe(true);
  });

  it("flattens SYSTEM_VARIABLES into a To Email variable list containing customer.email", () => {
    expect(TO_EMAIL_VARIABLES.some((v) => v.key === "customer.email")).toBe(true);
    expect(TO_EMAIL_VARIABLES[0]).toHaveProperty("label");
  });

  it("defaults new email node data to auto-detect To Email mode and no replyTo field", () => {
    expect(defaultEmailNodeData.toEmailMode).toBe("auto");
    expect(defaultEmailNodeData.toEmailVariable).toBe(null);
    expect(defaultEmailNodeData.provider).toBe("trust_signal");
    expect(defaultEmailNodeData.replyTo).toBeUndefined();
  });
});
