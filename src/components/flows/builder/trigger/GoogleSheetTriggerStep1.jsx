import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  COLUMN_LETTERS,
  GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  POLL_INTERVAL_OPTIONS,
  simulateSampleRow,
} from "./googleSheetTriggerHelpers";

export function isGoogleSheetStep1Valid(config) {
  return (
    !!config?.sheetUrl?.trim() &&
    (config?.columns?.length || 0) > 0 &&
    !!config?.contactIdentifierColumn
  );
}

export default function GoogleSheetTriggerStep1({ config, setConfig }) {
  const [pendingLetter, setPendingLetter] = useState("A");
  const [textInput, setTextInput] = useState("");
  const [simResult, setSimResult] = useState(null);

  const update = (patch) => setConfig({ ...config, ...patch });
  const columns = config.columns || [];

  const addColumn = (col) => {
    const c = col.trim();
    if (!c || columns.includes(c)) return;
    update({ columns: [...columns, c] });
  };

  const removeColumn = (col) => {
    const nextColumns = columns.filter((c) => c !== col);
    const patch = { columns: nextColumns };
    if (config.contactIdentifierColumn === col) patch.contactIdentifierColumn = "";
    if (config.sampleValues?.[col] !== undefined) {
      const nextSampleValues = { ...config.sampleValues };
      delete nextSampleValues[col];
      patch.sampleValues = nextSampleValues;
    }
    update(patch);
  };

  const setColumnIdMode = (mode) =>
    update({ columnIdMode: mode, columns: [], contactIdentifierColumn: "", sampleValues: {} });

  const setSampleValue = (col, value) => {
    setSimResult(null);
    update({ sampleValues: { ...(config.sampleValues || {}), [col]: value } });
  };

  const handleSimulate = () => setSimResult(simulateSampleRow(config));

  return (
    <div className="space-y-6" data-testid="google-sheet-step1">
      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Sheet URL *</div>
        <input
          type="text"
          value={config.sheetUrl}
          onChange={(e) => update({ sheetUrl: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/1234..."
          data-testid="gsheet-trigger-sheet-url"
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        <div className="mt-1 text-xs text-text-muted">The URL for the Google Sheet</div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Sheet ID (Optional)</div>
        <input
          type="text"
          value={config.sheetId}
          onChange={(e) => update({ sheetId: e.target.value })}
          placeholder="123456"
          data-testid="gsheet-trigger-sheet-id"
          className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
        />
        <div className="mt-1 text-xs text-text-muted">For multiple sheets in file, specify Sheet ID</div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Column Identifier</div>
        <div className="flex border border-border rounded-md overflow-hidden w-48">
          {[{ id: "header", label: "Header" }, { id: "id", label: "Id" }].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setColumnIdMode(opt.id)}
              data-testid={`gsheet-trigger-colmode-${opt.id}`}
              className={`flex-1 px-3 py-1.5 text-sm font-medium ${
                config.columnIdMode === opt.id ? "bg-primary-tint text-primary" : "bg-surface text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Columns to capture as variables</div>
        {config.columnIdMode === "id" ? (
          <div className="flex items-center gap-2 mb-2">
            <select
              value={pendingLetter}
              onChange={(e) => setPendingLetter(e.target.value)}
              data-testid="gsheet-trigger-column-select"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
            >
              {COLUMN_LETTERS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { addColumn(pendingLetter); setPendingLetter("A"); }}
              data-testid="gsheet-trigger-column-add"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColumn(textInput);
                setTextInput("");
              }
            }}
            placeholder="Eg. Customer Name — press Enter to add"
            data-testid="gsheet-trigger-column-text"
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface mb-2 focus:outline-none focus:border-primary/60"
          />
        )}
        {columns.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="gsheet-trigger-column-chips">
            {columns.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-slate-100 border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeColumn(c)}
                  data-testid={`gsheet-trigger-column-remove-${c}`}
                  aria-label={`Remove ${c}`}
                  className="text-text-muted hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Contact identifier column</div>
        <select
          value={config.contactIdentifierColumn}
          onChange={(e) => update({ contactIdentifierColumn: e.target.value })}
          disabled={columns.length === 0}
          data-testid="gsheet-trigger-contact-column"
          className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60 disabled:opacity-40"
        >
          <option value="">Select a column…</option>
          {columns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="mt-1 text-xs text-text-muted">
          Which column identifies the contact this flow should run for (e.g. Phone or Email).
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-text-primary mb-1">Check for new rows</div>
        <select
          value={config.pollIntervalMinutes}
          onChange={(e) => update({ pollIntervalMinutes: Number(e.target.value) })}
          data-testid="gsheet-trigger-poll-interval"
          className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
        >
          {POLL_INTERVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {columns.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-text-primary mb-1">Simulate a new row (optional)</div>
          <div className="space-y-2">
            {columns.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <span className="w-32 text-xs text-text-muted truncate">{c}</span>
                <input
                  type="text"
                  value={config.sampleValues?.[c] || ""}
                  onChange={(e) => setSampleValue(c, e.target.value)}
                  placeholder="Sample value"
                  data-testid={`gsheet-trigger-sample-${c}`}
                  className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSimulate}
            data-testid="gsheet-trigger-simulate-btn"
            className="mt-2 px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
          >
            Simulate New Row
          </button>
          {simResult && (
            <div
              data-testid="gsheet-trigger-simulate-result"
              className={`mt-2 px-3 py-2 rounded-md text-sm border ${
                simResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {simResult.success
                ? `Simulated row — ${simResult.variableCount} variable(s) filled${
                    simResult.resolvedContactValue ? ` · Contact resolved to ${simResult.resolvedContactValue}` : ""
                  }`
                : simResult.error}
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 border border-border rounded-md px-3 py-2.5">
        <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
          <li>{`Please give edit access to "${GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}" for this trigger to work.`}</li>
          <li>New entries should be appended at the bottom of the sheet, not inserted in the middle.</li>
          <li>Only rows added after you save this trigger will start the flow — existing rows won't trigger it.</li>
        </ul>
      </div>
    </div>
  );
}
