import { getSMSTemplateAnalytics, SMS_ANALYTICS_METRICS } from "../mockSMSAnalytics";

describe("getSMSTemplateAnalytics", () => {
  it("is deterministic for the same template id", () => {
    const a = getSMSTemplateAnalytics({ id: "sms_003" });
    const b = getSMSTemplateAnalytics({ id: "sms_003" });
    expect(a).toEqual(b);
  });

  it("returns sent/delivered/failed counts that add up sensibly", () => {
    const data = getSMSTemplateAnalytics({ id: "sms_003" });
    expect(data.sent).toBeGreaterThan(0);
    expect(data.delivered + data.failed).toBe(data.sent);
    expect(data.deliveredPct).toBeGreaterThanOrEqual(0);
    expect(data.deliveredPct).toBeLessThanOrEqual(100);
  });

  it("varies output by template id", () => {
    const a = getSMSTemplateAnalytics({ id: "sms_001" });
    const b = getSMSTemplateAnalytics({ id: "sms_002" });
    expect(a.sent).not.toBe(b.sent);
  });
});

describe("SMS_ANALYTICS_METRICS", () => {
  it("has exactly Sent, Delivered, Failed rows, no Read/CTR", () => {
    expect(SMS_ANALYTICS_METRICS.map((m) => m.label)).toEqual(["Sent", "Delivered", "Failed"]);
  });

  it("each metric formats a value from analytics data", () => {
    const data = getSMSTemplateAnalytics({ id: "sms_003" });
    SMS_ANALYTICS_METRICS.forEach((m) => {
      expect(typeof m.value(data)).toBe("string");
      expect(m.value(data).length).toBeGreaterThan(0);
    });
  });
});
