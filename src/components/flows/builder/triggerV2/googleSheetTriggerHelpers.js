// Pure, framework-free helpers for the Google Sheet Data Entry Start Trigger.
// No React dependencies — independently testable.

import { COLUMN_LETTERS, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL } from "../nodes/GoogleSheetNode/data/mockData";

export { COLUMN_LETTERS, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL };

export const POLL_INTERVAL_OPTIONS = [
  { value: 1, label: "Every 1 minute" },
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every 60 minutes" },
];

// Fixed mock header row a "Connect" click pretends to read from the sheet —
// there is no live Sheets API connection, same mocking convention as
// GoogleSheetNode's Sync button.
export const MOCK_DETECTED_COLUMNS = [
  "Customer Name",
  "Phone Number",
  "Email",
  "Order Value",
  "Internal Notes",
];

export function emptyGoogleSheetTriggerConfig() {
  return {
    sheetUrl: "",
    sheetId: "",
    connected: false,
    columnIdMode: "header", // "header" | "id"
    detectedColumns: [],
    columns: [],
    variableNames: {},
    contactIdentifierColumn: "",
    pollIntervalMinutes: 5,
    sampleValues: {},
  };
}

// Slugifies a detected column header into a default variable name,
// e.g. "Customer Name" -> "customer_name".
export function slugifyVariableName(label) {
  const slug = (label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "column";
}

// Mocks reading the sheet's header row after "Connect" is clicked.
export function simulateConnectSheet() {
  return MOCK_DETECTED_COLUMNS;
}

// Simulates what a triggered run would look like from manually-entered sample
// values, since there is no live Sheets API connection to pull a real row from.
export function simulateSampleRow(config) {
  const columns = config?.columns || [];
  const sampleValues = config?.sampleValues || {};
  const contactIdentifierColumn = config?.contactIdentifierColumn || "";

  if (columns.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Add at least one column before simulating.",
    };
  }
  const filled = columns.filter((c) => (sampleValues[c] || "").trim());
  if (filled.length === 0) {
    return {
      success: false,
      variableCount: 0,
      resolvedContactValue: null,
      error: "Enter at least one sample value to simulate a row.",
    };
  }
  const rawContactValue = contactIdentifierColumn ? sampleValues[contactIdentifierColumn] : null;
  const resolvedContactValue = rawContactValue && rawContactValue.trim() ? rawContactValue : null;
  return { success: true, variableCount: filled.length, resolvedContactValue, error: null };
}
