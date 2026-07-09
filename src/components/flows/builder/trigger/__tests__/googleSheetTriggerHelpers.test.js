import {
  emptyGoogleSheetTriggerConfig,
  simulateSampleRow,
  simulateConnectSheet,
  slugifyVariableName,
  MOCK_DETECTED_COLUMNS,
  POLL_INTERVAL_OPTIONS,
  COLUMN_LETTERS,
  GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
} from "../googleSheetTriggerHelpers";

describe("emptyGoogleSheetTriggerConfig", () => {
  it("returns sensible defaults", () => {
    const cfg = emptyGoogleSheetTriggerConfig();
    expect(cfg.sheetUrl).toBe("");
    expect(cfg.sheetId).toBe("");
    expect(cfg.connected).toBe(false);
    expect(cfg.columnIdMode).toBe("header");
    expect(cfg.detectedColumns).toEqual([]);
    expect(cfg.columns).toEqual([]);
    expect(cfg.variableNames).toEqual({});
    expect(cfg.contactIdentifierColumn).toBe("");
    expect(cfg.pollIntervalMinutes).toBe(5);
    expect(cfg.sampleValues).toEqual({});
  });
});

describe("re-exported constants", () => {
  it("exposes 26 column letters and the shared service account email", () => {
    expect(COLUMN_LETTERS).toHaveLength(26);
    expect(COLUMN_LETTERS[0]).toBe("A");
    expect(GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL).toBe("engagetechsupport@shiprocket.com");
  });

  it("offers five poll interval options from 1 to 60 minutes", () => {
    expect(POLL_INTERVAL_OPTIONS.map((o) => o.value)).toEqual([1, 5, 15, 30, 60]);
  });
});

describe("slugifyVariableName", () => {
  it("converts a header label into a snake_case variable name", () => {
    expect(slugifyVariableName("Customer Name")).toBe("customer_name");
    expect(slugifyVariableName("Phone Number")).toBe("phone_number");
  });

  it("strips leading/trailing separators and non-alphanumerics", () => {
    expect(slugifyVariableName("  Order #ID!  ")).toBe("order_id");
  });

  it("falls back to a default when the label has no usable characters", () => {
    expect(slugifyVariableName("")).toBe("column");
    expect(slugifyVariableName("   ")).toBe("column");
  });
});

describe("simulateConnectSheet", () => {
  it("returns the fixed mock header row", () => {
    expect(simulateConnectSheet()).toEqual(MOCK_DETECTED_COLUMNS);
  });
});

describe("simulateSampleRow", () => {
  it("errors when there are no captured columns", () => {
    const result = simulateSampleRow(emptyGoogleSheetTriggerConfig());
    expect(result).toEqual({
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Add at least one column before simulating.",
    });
  });

  it("errors when columns exist but no sample values were entered", () => {
    const cfg = { ...emptyGoogleSheetTriggerConfig(), columns: ["Phone", "Order ID"] };
    const result = simulateSampleRow(cfg);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Enter at least one sample value to simulate a row.");
  });

  it("succeeds and resolves the contact value when the identifier column has a sample value", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      columns: ["Phone", "Order ID"],
      contactIdentifierColumn: "Phone",
      sampleValues: { Phone: "+919999999999", "Order ID": "" },
    };
    const result = simulateSampleRow(cfg);
    expect(result).toEqual({
      success: true,
      variableCount: 1,
      resolvedContactValue: "+919999999999",
      error: null,
    });
  });

  it("succeeds with null resolvedContactValue when no identifier column is set", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      columns: ["Order ID"],
      sampleValues: { "Order ID": "555" },
    };
    const result = simulateSampleRow(cfg);
    expect(result.success).toBe(true);
    expect(result.resolvedContactValue).toBeNull();
  });

  it("resolves a whitespace-only identifier column value to null, while other filled columns still count toward variableCount", () => {
    const cfg = {
      ...emptyGoogleSheetTriggerConfig(),
      columns: ["Phone", "Order ID"],
      contactIdentifierColumn: "Phone",
      sampleValues: { Phone: "   ", "Order ID": "555" },
    };
    const result = simulateSampleRow(cfg);
    expect(result.success).toBe(true);
    expect(result.variableCount).toBe(1);
    expect(result.resolvedContactValue).toBeNull();
  });
});
