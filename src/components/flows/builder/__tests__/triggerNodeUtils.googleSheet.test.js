import { summariseTriggerConfig } from "../triggerNodeUtils";

describe("summariseTriggerConfig — google_sheet_new_row", () => {
  const baseConfig = {
    kind: "google_sheet_new_row",
    sheetUrl: "https://docs.google.com/spreadsheets/d/abc123",
    sheetId: "",
    columnIdMode: "id",
    columns: ["A", "B"],
    contactIdentifierColumn: "A",
    pollIntervalMinutes: 15,
    sampleValues: {},
  };

  it("marks the summary as a Google Sheet trigger with sheet and polling fields", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.isGoogleSheet).toBe(true);
    expect(summary.isWebhook).toBe(false);
    expect(summary.isBroadcast).toBe(false);
    expect(summary.sheetUrl).toBe(baseConfig.sheetUrl);
    expect(summary.columns).toEqual(["A", "B"]);
    expect(summary.contactIdentifierColumn).toBe("A");
    expect(summary.pollIntervalMinutes).toBe(15);
  });

  it("has no exit condition and no audience pill, since Step 2 is skipped for this kind", () => {
    const summary = summariseTriggerConfig(baseConfig);
    expect(summary.noExitCondition).toBe(true);
    expect(summary.exitEvents).toEqual([]);
    expect(summary.audienceTypePill).toBeNull();
  });
});
