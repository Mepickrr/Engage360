import React, { useState } from "react";
import { Table } from "lucide-react";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  COLUMN_LETTERS, defaultGoogleSheetNodeData,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Action picker ─────────────────────────────────────────────────────────────
function ActionPicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Select an action
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {GOOGLE_SHEET_ACTIONS.map(({ id, label, desc }) => {
          const highlight = hovered === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`gsheet-action-${id}`}
              style={{
                borderRadius: 8, padding: "10px 8px", textAlign: "center", cursor: "pointer",
                background: highlight ? "#EEF2FF" : "#fff",
                border: `${highlight ? 2 : 1.5}px solid ${highlight ? GOOGLE_SHEET_BLUE : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <Table size={18} color={GOOGLE_SHEET_BLUE} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Segmented toggle (Header/Id, RowNumber/Search) ────────────────────────────
function SegmentedToggle({ options, value, onChange, testIdPrefix }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            data-testid={`${testIdPrefix}-${opt.id}`}
            style={{
              flex: 1, padding: "7px 10px", fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: active ? "#EEF2FF" : "#fff",
              color: active ? GOOGLE_SHEET_BLUE : "#64748B",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Common Sheet URL / Sheet ID fields ────────────────────────────────────────
function CommonSheetFields({ sheetUrl, sheetId, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Sheet URL *
        </div>
        <input
          type="text"
          value={sheetUrl}
          onChange={(e) => onChange({ sheetUrl: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/1234..."
          data-testid="gsheet-sheet-url"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>The URL for the Google Sheet</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Sheet ID (Optional)
        </div>
        <input
          type="text"
          value={sheetId}
          onChange={(e) => onChange({ sheetId: e.target.value })}
          placeholder="123456"
          data-testid="gsheet-sheet-id"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>For multiple sheets in file, specify Sheet ID</div>
      </div>
    </div>
  );
}

// ── Repeatable Column/Field mapping list (Add Row, Update Row, Upsert Row) ────
function FieldRowList({ fields, columnIdMode, onChange, addTestId, testIdPrefix, columnLabel = "Column", fieldLabel = "Field" }) {
  const updateRow = (i, patch) => onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const addRow = () => onChange([...fields, { column: columnIdMode === "id" ? "A" : "", field: "" }]);
  const removeRow = (i) => onChange(fields.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>{columnLabel}</span>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" }}>{fieldLabel}</span>
        <span style={{ width: 20 }} />
      </div>
      {fields.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
          {columnIdMode === "id" ? (
            <select
              value={row.column}
              onChange={(e) => updateRow(i, { column: e.target.value })}
              data-testid={`${testIdPrefix}-column-${i}`}
              style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
            >
              {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={row.column}
              onChange={(e) => updateRow(i, { column: e.target.value })}
              placeholder="Eg. Customer Name"
              data-testid={`${testIdPrefix}-column-${i}`}
              style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
            />
          )}
          <input
            type="text"
            value={row.field}
            onChange={(e) => updateRow(i, { field: e.target.value })}
            placeholder="Eg. {{Order ID}}"
            data-testid={`${testIdPrefix}-value-${i}`}
            style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
          />
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              data-testid={`${testIdPrefix}-remove-${i}`}
              style={{ width: 20, height: 20, border: "none", background: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        data-testid={addTestId}
        style={{ width: "100%", padding: "8px 0", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, color: MUTED, fontWeight: 600 }}
      >
        + Add Field
      </button>
    </div>
  );
}

// ── Static tips box ────────────────────────────────────────────────────────────
function TipsBox({ tips }) {
  return (
    <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", marginTop: 14 }}>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
        {tips.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function GoogleSheetRightPanel({ node, updateNodeData, removeNode }) {
  const data  = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const patchAddRow = (changes) => patch({ addRow: { ...(data.addRow ?? defaultGoogleSheetNodeData.addRow), ...changes } });
  const patchUpdateRow = (changes) => patch({ updateRow: { ...(data.updateRow ?? defaultGoogleSheetNodeData.updateRow), ...changes } });

  const action     = data.action ?? null;
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);

  const resetAction = () => patch({
    action: null,
    addRow:    { ...defaultGoogleSheetNodeData.addRow },
    updateRow: { ...defaultGoogleSheetNodeData.updateRow },
    getRow:    { ...defaultGoogleSheetNodeData.getRow },
    upsertRow: { ...defaultGoogleSheetNodeData.upsertRow },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: GOOGLE_SHEET_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Table size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Google Sheet</div>
          {actionMeta && <div style={{ fontSize: 11, color: MUTED }}>{actionMeta.label}</div>}
        </div>
        {removeNode && (
          <button
            type="button"
            onClick={() => removeNode(node.id)}
            style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!action ? (
          <ActionPicker onSelect={(a) => patch({ action: a })} />
        ) : (
          <>
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={resetAction}
                data-testid="gsheet-change-action"
                style={{ fontSize: 11, color: GOOGLE_SHEET_BLUE, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Change action
              </button>
            </div>

            <div style={{ padding: 16 }}>
              <CommonSheetFields sheetUrl={data.sheetUrl ?? ""} sheetId={data.sheetId ?? ""} onChange={patch} />

              {action === "add_row" && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.addRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchAddRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-addrow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to add</div>
                  <FieldRowList
                    fields={data.addRow?.fields ?? defaultGoogleSheetNodeData.addRow.fields}
                    columnIdMode={data.addRow?.columnIdMode ?? "id"}
                    onChange={(fields) => patchAddRow({ fields })}
                    addTestId="gsheet-addrow-add-field"
                    testIdPrefix="gsheet-addrow-field"
                  />
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Row number for this will be saved in
                    </div>
                    <input
                      type="text"
                      value={data.addRow?.rowNumberVar ?? defaultGoogleSheetNodeData.addRow.rowNumberVar}
                      readOnly
                      data-testid="gsheet-addrow-rownumbervar"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
                    />
                  </div>
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                    "Don't use special characters for value inputs.",
                    "Value input example – {{customer.name}}, {{Order.ID}}, ...",
                  ]} />
                </>
              )}

              {action === "update_row" && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Target Row
                    </div>
                    <SegmentedToggle
                      options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
                      value={data.updateRow?.targetMode ?? "search"}
                      onChange={(v) => patchUpdateRow({ targetMode: v })}
                      testIdPrefix="gsheet-updaterow-targetmode"
                    />
                  </div>
                  {(data.updateRow?.targetMode ?? "search") === "row_number" ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                        Row Number
                      </div>
                      <input
                        type="number"
                        value={data.updateRow?.rowNumber ?? ""}
                        onChange={(e) => patchUpdateRow({ rowNumber: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Eg. 5"
                        data-testid="gsheet-updaterow-rownumber"
                        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Column
                        </div>
                        {(data.updateRow?.columnIdMode ?? "id") === "id" ? (
                          <select
                            value={data.updateRow?.lookupColumn ?? "A"}
                            onChange={(e) => patchUpdateRow({ lookupColumn: e.target.value })}
                            data-testid="gsheet-updaterow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
                          >
                            {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={data.updateRow?.lookupColumn ?? ""}
                            onChange={(e) => patchUpdateRow({ lookupColumn: e.target.value })}
                            placeholder="Eg. Order ID"
                            data-testid="gsheet-updaterow-lookupcolumn"
                            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                          Lookup Field
                        </div>
                        <input
                          type="text"
                          value={data.updateRow?.lookupField ?? ""}
                          onChange={(e) => patchUpdateRow({ lookupField: e.target.value })}
                          placeholder="Eg. {{Order ID}}"
                          data-testid="gsheet-updaterow-lookupfield"
                          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
                      Column Identifier
                    </div>
                    <SegmentedToggle
                      options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
                      value={data.updateRow?.columnIdMode ?? "id"}
                      onChange={(v) => patchUpdateRow({ columnIdMode: v })}
                      testIdPrefix="gsheet-updaterow-colmode"
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to update</div>
                  <FieldRowList
                    fields={data.updateRow?.fields ?? defaultGoogleSheetNodeData.updateRow.fields}
                    columnIdMode={data.updateRow?.columnIdMode ?? "id"}
                    onChange={(fields) => patchUpdateRow({ fields })}
                    addTestId="gsheet-updaterow-add-field"
                    testIdPrefix="gsheet-updaterow-field"
                    columnLabel="Target Column"
                    fieldLabel="Updated Field"
                  />
                  <TipsBox tips={[
                    `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
                  ]} />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
