import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GOOGLE_SHEET_ACTIONS, GOOGLE_SHEET_BLUE, GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  COLUMN_LETTERS, defaultGoogleSheetNodeData,
} from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

const ACTION_KEY = {
  add_row: "addRow",
  update_row: "updateRow",
  get_row: "getRow",
  upsert_row: "upsertRow",
};

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

// ── Multi-select of columns (Get Row Data) ────────────────────────────────────
function ColumnMultiSelect({ columnIdMode, columns, onChange }) {
  const [pendingLetter, setPendingLetter] = useState("A");
  const [textInput, setTextInput] = useState("");

  const addColumn = (col) => {
    const c = col.trim();
    if (!c || columns.includes(c)) return;
    onChange([...columns, c]);
  };
  const removeColumn = (col) => onChange(columns.filter((c) => c !== col));

  return (
    <div>
      {columnIdMode === "id" ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select
            value={pendingLetter}
            onChange={(e) => setPendingLetter(e.target.value)}
            data-testid="gsheet-getrow-column-select"
            style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
          >
            {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { addColumn(pendingLetter); setPendingLetter("A"); }}
            data-testid="gsheet-getrow-column-add"
            style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, background: GOOGLE_SHEET_BLUE, color: "#fff", cursor: "pointer" }}
          >
            Add
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColumn(textInput); setTextInput(""); } }}
            placeholder="Eg. Customer Name"
            data-testid="gsheet-getrow-column-text"
            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
          />
        </div>
      )}
      {columns.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {columns.map((c) => (
            <span key={c} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151" }}>
              {c}
              <button type="button" onClick={() => removeColumn(c)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
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

// ── Per-action field sets ──────────────────────────────────────────────────────
function AddRowFields({ value, onChange }) {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Column Identifier
        </div>
        <SegmentedToggle
          options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
          value={value?.columnIdMode ?? "id"}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-addrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to add</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.addRow.fields}
        columnIdMode={value?.columnIdMode ?? "id"}
        onChange={(fields) => onChange({ fields })}
        addTestId="gsheet-addrow-add-field"
        testIdPrefix="gsheet-addrow-field"
      />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Row number for this will be saved in
        </div>
        <input
          type="text"
          value={value?.rowNumberVar ?? defaultGoogleSheetNodeData.addRow.rowNumberVar}
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
  );
}

function UpdateRowFields({ value, onChange }) {
  const targetMode = value?.targetMode ?? "search";
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Target Row
        </div>
        <SegmentedToggle
          options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
          value={targetMode}
          onChange={(v) => onChange({ targetMode: v })}
          testIdPrefix="gsheet-updaterow-targetmode"
        />
      </div>
      {targetMode === "row_number" ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Row Number
          </div>
          <input
            type="number"
            value={value?.rowNumber ?? ""}
            onChange={(e) => onChange({ rowNumber: e.target.value ? Number(e.target.value) : null })}
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
            {columnIdMode === "id" ? (
              <select
                value={value?.lookupColumn ?? "A"}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
                data-testid="gsheet-updaterow-lookupcolumn"
                style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
              >
                {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value?.lookupColumn ?? ""}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
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
              value={value?.lookupField ?? ""}
              onChange={(e) => onChange({ lookupField: e.target.value })}
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
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-updaterow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to update</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.updateRow.fields}
        columnIdMode={columnIdMode}
        onChange={(fields) => onChange({ fields })}
        addTestId="gsheet-updaterow-add-field"
        testIdPrefix="gsheet-updaterow-field"
        columnLabel="Target Column"
        fieldLabel="Updated Field"
      />
      <TipsBox tips={[
        `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
      ]} />
    </>
  );
}

function GetRowFields({ value, onChange }) {
  const targetMode = value?.targetMode ?? "search";
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Target Row
        </div>
        <SegmentedToggle
          options={[{ id: "row_number", label: "Specify Row Number" }, { id: "search", label: "Search for Row" }]}
          value={targetMode}
          onChange={(v) => onChange({ targetMode: v })}
          testIdPrefix="gsheet-getrow-targetmode"
        />
      </div>
      {targetMode === "row_number" ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Row Number
          </div>
          <input
            type="number"
            value={value?.rowNumber ?? ""}
            onChange={(e) => onChange({ rowNumber: e.target.value ? Number(e.target.value) : null })}
            placeholder="Eg. 5"
            data-testid="gsheet-getrow-rownumber"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
              Lookup Column
            </div>
            {columnIdMode === "id" ? (
              <select
                value={value?.lookupColumn ?? "A"}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
                data-testid="gsheet-getrow-lookupcolumn"
                style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
              >
                {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value?.lookupColumn ?? ""}
                onChange={(e) => onChange({ lookupColumn: e.target.value })}
                placeholder="Eg. Order ID"
                data-testid="gsheet-getrow-lookupcolumn"
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
              value={value?.lookupField ?? ""}
              onChange={(e) => onChange({ lookupField: e.target.value })}
              placeholder="Eg. {{Order ID}}"
              data-testid="gsheet-getrow-lookupfield"
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
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-getrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Column(s) to save data from</div>
      <ColumnMultiSelect
        columnIdMode={columnIdMode}
        columns={value?.columns ?? []}
        onChange={(columns) => onChange({ columns })}
      />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Data from Column(s) will be saved in
        </div>
        <input
          type="text"
          value={value?.outputVarPrefix ?? defaultGoogleSheetNodeData.getRow.outputVarPrefix}
          onChange={(e) => onChange({ outputVarPrefix: e.target.value })}
          data-testid="gsheet-getrow-outputvar"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, boxSizing: "border-box" }}
        />
      </div>
      <TipsBox tips={[
        `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
        "The data will be saved as variables under this name, with sub-names corresponding to each selected column.",
      ]} />
    </>
  );
}

function UpsertRowFields({ value, onChange }) {
  const columnIdMode = value?.columnIdMode ?? "id";
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Lookup Column
          </div>
          {columnIdMode === "id" ? (
            <select
              value={value?.lookupColumn ?? "A"}
              onChange={(e) => onChange({ lookupColumn: e.target.value })}
              data-testid="gsheet-upsertrow-lookupcolumn"
              style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff" }}
            >
              {COLUMN_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={value?.lookupColumn ?? ""}
              onChange={(e) => onChange({ lookupColumn: e.target.value })}
              placeholder="Eg. Order ID"
              data-testid="gsheet-upsertrow-lookupcolumn"
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
            value={value?.lookupField ?? ""}
            onChange={(e) => onChange({ lookupField: e.target.value })}
            placeholder="Eg. {{Order ID}}"
            data-testid="gsheet-upsertrow-lookupfield"
            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, boxSizing: "border-box" }}
          />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
          Column Identifier
        </div>
        <SegmentedToggle
          options={[{ id: "header", label: "Header" }, { id: "id", label: "Id" }]}
          value={columnIdMode}
          onChange={(v) => onChange({ columnIdMode: v })}
          testIdPrefix="gsheet-upsertrow-colmode"
        />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Field(s) to write</div>
      <FieldRowList
        fields={value?.fields ?? defaultGoogleSheetNodeData.upsertRow.fields}
        columnIdMode={columnIdMode}
        onChange={(fields) => onChange({ fields })}
        addTestId="gsheet-upsertrow-add-field"
        testIdPrefix="gsheet-upsertrow-field"
      />
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Row number for this will be saved in
          </div>
          <input
            type="text"
            value={value?.rowNumberVar ?? defaultGoogleSheetNodeData.upsertRow.rowNumberVar}
            readOnly
            data-testid="gsheet-upsertrow-rownumbervar"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 4 }}>
            Whether a new row was added
          </div>
          <input
            type="text"
            value={value?.wasAddedVar ?? defaultGoogleSheetNodeData.upsertRow.wasAddedVar}
            readOnly
            data-testid="gsheet-upsertrow-wasaddedvar"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", color: "#64748B", boxSizing: "border-box" }}
          />
        </div>
      </div>
      <TipsBox tips={[
        `Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this action to work.`,
        "If no row matches the lookup value, a new row is appended with the field(s) above.",
        "Don't use special characters for value inputs.",
      ]} />
    </>
  );
}

function ModalBody({ action, initialValue, onCancel, onSave }) {
  const [value, setValue] = useState(initialValue);
  const patch = (changes) => setValue((v) => ({ ...v, ...changes }));
  const actionMeta = GOOGLE_SHEET_ACTIONS.find((a) => a.id === action);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{actionMeta?.label ?? "Configure action"}</DialogTitle>
      </DialogHeader>
      <div style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 4 }}>
        {action === "add_row" && <AddRowFields value={value} onChange={patch} />}
        {action === "update_row" && <UpdateRowFields value={value} onChange={patch} />}
        {action === "get_row" && <GetRowFields value={value} onChange={patch} />}
        {action === "upsert_row" && <UpsertRowFields value={value} onChange={patch} />}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: `1px solid ${BORDER}`, marginTop: 16 }}>
        <button
          type="button"
          onClick={onCancel}
          data-testid="gsheet-config-modal-cancel"
          style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(value)}
          data-testid="gsheet-config-modal-save"
          style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 8, background: GOOGLE_SHEET_BLUE, color: "#fff", cursor: "pointer" }}
        >
          Save configuration
        </button>
      </div>
    </>
  );
}

export default function GoogleSheetConfigModal({ open, onClose, action, initialData, onSave }) {
  const actionKey = ACTION_KEY[action];
  const initialValue = initialData ?? defaultGoogleSheetNodeData[actionKey];

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="gsheet-config-modal" className="max-w-2xl">
        {open && (
          <ModalBody
            action={action}
            initialValue={initialValue}
            onCancel={onClose}
            onSave={(v) => { onSave(v); onClose(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
