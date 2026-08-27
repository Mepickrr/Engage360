import { COMMUNICATION_LOGS, LOG_TYPES, LOG_CHANNELS, LOG_STATUSES } from "../mockCommunicationLogs";

describe("mockCommunicationLogs", () => {
  test("generates exactly 150 rows with unique ids", () => {
    expect(COMMUNICATION_LOGS).toHaveLength(150);
    const ids = new Set(COMMUNICATION_LOGS.map((r) => r.id));
    expect(ids.size).toBe(150);
  });

  test("every row has exactly one of phone/email populated", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect([row.phone, row.email].filter((v) => v != null)).toHaveLength(1);
    });
  });

  test("errorResponse is populated only for Failed/Bounced rows", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      const shouldHaveError = row.deliveryStatus === "Failed" || row.deliveryStatus === "Bounced";
      expect(row.errorResponse != null).toBe(shouldHaveError);
    });
  });

  test("aiCallDurationSec is populated only for terminal AI Calling rows", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      if (row.channel !== "AI Calling") {
        expect(row.aiCallDurationSec).toBeNull();
      } else {
        const isTerminal = ["Delivered", "Read", "Sent"].includes(row.deliveryStatus);
        if (isTerminal) {
          expect(row.aiCallDurationSec).toBeGreaterThan(0);
        } else {
          expect(row.aiCallDurationSec).toBeNull();
        }
      }
    });
  });

  test("uses only the documented channels, types, and statuses", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect(LOG_TYPES).toContain(row.type);
      expect(LOG_CHANNELS).toContain(row.channel);
      expect(LOG_STATUSES).toContain(row.deliveryStatus);
    });
  });

  test("updatedAt is never before sentAt", () => {
    COMMUNICATION_LOGS.forEach((row) => {
      expect(new Date(row.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(row.sentAt).getTime());
    });
  });

  test("all sentAt timestamps fall within the last 30 days of the anchor date", () => {
    const anchor = new Date("2026-08-10T12:00:00Z").getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    COMMUNICATION_LOGS.forEach((row) => {
      const sentMs = new Date(row.sentAt).getTime();
      expect(sentMs).toBeLessThanOrEqual(anchor);
      expect(anchor - sentMs).toBeLessThan(thirtyDaysMs);
    });
  });

  test("is deterministic across re-imports", () => {
    const snapshot = COMMUNICATION_LOGS.map((r) => `${r.id}|${r.sentAt}|${r.deliveryStatus}`).join(",");
    jest.resetModules();
    const { COMMUNICATION_LOGS: regenerated } = require("../mockCommunicationLogs");
    const snapshot2 = regenerated.map((r) => `${r.id}|${r.sentAt}|${r.deliveryStatus}`).join(",");
    expect(snapshot2).toBe(snapshot);
  });
});
