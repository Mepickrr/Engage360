export function getGoogleSheetSummary(data) {
  const action = data?.action;
  if (!action) return null;
  if (action === "add_row") {
    return `Row added to Sheet · ${data?.sheetId || "default"}`;
  }
  if (action === "update_row") {
    const ur = data?.updateRow ?? {};
    if (ur.targetMode === "row_number") return `Row #${ur.rowNumber ?? "—"} updated`;
    return `Row updated where ${ur.lookupColumn || "—"} = ${ur.lookupField || "—"}`;
  }
  if (action === "get_row") {
    const gr = data?.getRow ?? {};
    if (gr.targetMode === "row_number") return `Row #${gr.rowNumber ?? "—"} fetched`;
    return `Row fetched where ${gr.lookupColumn || "—"} = ${gr.lookupField || "—"}`;
  }
  if (action === "upsert_row") {
    const ups = data?.upsertRow ?? {};
    return `Row added or updated where ${ups.lookupColumn || "—"} = ${ups.lookupField || "—"}`;
  }
  return null;
}
