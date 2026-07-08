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

export function emptyGoogleSheetTriggerConfig() {
  return {
    sheetUrl: "",
    sheetId: "",
    columnIdMode: "id", // "header" | "id"
    columns: [],
    contactIdentifierColumn: "",
    pollIntervalMinutes: 5,
    sampleValues: {},
  };
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
  const resolvedContactValue = contactIdentifierColumn
    ? sampleValues[contactIdentifierColumn] || null
    : null;
  return { success: true, variableCount: filled.length, resolvedContactValue, error: null };
}
