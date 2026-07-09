import React, { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import {
  COLUMN_LETTERS,
  GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL,
  POLL_INTERVAL_OPTIONS,
  simulateConnectSheet,
  simulateSampleRow,
  slugifyVariableName,
} from "./googleSheetTriggerHelpers";

const STEPS = [
  { n: 1, label: "Connect sheet" },
  { n: 2, label: "Read sheet" },
  { n: 3, label: "Contact & variables" },
  { n: 4, label: "Trigger behavior" },
];

export function isGoogleSheetStep1Valid(config) {
  return (
    !!config?.sheetUrl?.trim() &&
    (config?.columns?.length || 0) > 0 &&
    !!config?.contactIdentifierColumn
  );
}

function StepDots({ active }) {
  return (
    <div className="flex items-center gap-2 mb-6" data-testid="gsheet-trigger-stepper">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                s.n === active
                  ? "bg-primary text-white"
                  : s.n < active
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-text-muted"
              }`}
            >
              {s.n < active ? <Check className="w-3 h-3" /> : s.n}
            </span>
            <span className={`text-[11px] font-medium hidden sm:inline ${s.n === active ? "text-text-primary" : "text-text-muted"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="flex-1 h-px bg-border" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepFooter({ onBack, onContinue, continueDisabled, backTestId, continueTestId, continueLabel = "Continue" }) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          data-testid={backTestId}
          className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          data-testid={continueTestId}
          className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundImage: "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)" }}
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}

export default function GoogleSheetTriggerStep1({ config, setConfig }) {
  const [internalStep, setInternalStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingLetter, setPendingLetter] = useState("A");
  const [simResult, setSimResult] = useState(null);

  const update = (patch) => setConfig({ ...config, ...patch });
  const columns = config.columns || [];
  const variableNames = config.variableNames || {};
  const isHeaderMode = config.columnIdMode !== "id";

  // ── Step 1 — Connect ──────────────────────────────────────────
  const handleUrlChange = (value) => update({ sheetUrl: value, connected: false });

  const handleConnect = () => {
    if (!config.sheetUrl?.trim()) return;
    const detectedColumns = simulateConnectSheet();
    const patch = { connected: true, detectedColumns };
    if (isHeaderMode) {
      patch.columns = [...detectedColumns];
      patch.variableNames = detectedColumns.reduce(
        (acc, c) => ({ ...acc, [c]: slugifyVariableName(c) }),
        {},
      );
    }
    update(patch);
  };

  // ── Step 2 — How should we read this sheet? ─────────────────
  const setHeaderMode = (nextIsHeader) => {
    if (nextIsHeader) {
      const patch = { columnIdMode: "header" };
      if (config.connected) {
        patch.columns = [...(config.detectedColumns || [])];
        patch.variableNames = (config.detectedColumns || []).reduce(
          (acc, c) => ({ ...acc, [c]: slugifyVariableName(c) }),
          {},
        );
        patch.contactIdentifierColumn = "";
      }
      update(patch);
    } else {
      update({ columnIdMode: "id", columns: [], variableNames: {}, contactIdentifierColumn: "" });
    }
  };

  // ── Step 3 — Contact & variable mapping ─────────────────────
  const toggleHeaderColumn = (col, checked) => {
    if (checked) {
      const nextVariableNames = variableNames[col] ? variableNames : { ...variableNames, [col]: slugifyVariableName(col) };
      update({ columns: [...columns, col], variableNames: nextVariableNames });
    } else {
      const nextColumns = columns.filter((c) => c !== col);
      const patch = { columns: nextColumns };
      if (config.contactIdentifierColumn === col) patch.contactIdentifierColumn = "";
      update(patch);
    }
  };

  const setVariableName = (col, name) => update({ variableNames: { ...variableNames, [col]: name } });

  const addLetterColumn = () => {
    const c = pendingLetter;
    if (!c || columns.includes(c)) return;
    update({ columns: [...columns, c], variableNames: { ...variableNames, [c]: variableNames[c] || "" } });
  };

  const removeLetterColumn = (col) => {
    const nextColumns = columns.filter((c) => c !== col);
    const nextVariableNames = { ...variableNames };
    delete nextVariableNames[col];
    const patch = { columns: nextColumns, variableNames: nextVariableNames };
    if (config.contactIdentifierColumn === col) patch.contactIdentifierColumn = "";
    if (config.sampleValues?.[col] !== undefined) {
      const nextSampleValues = { ...config.sampleValues };
      delete nextSampleValues[col];
      patch.sampleValues = nextSampleValues;
    }
    update(patch);
  };

  // ── Step 4 — Trigger behavior / simulate ────────────────────
  const setSampleValue = (col, value) => {
    setSimResult(null);
    update({ sampleValues: { ...(config.sampleValues || {}), [col]: value } });
  };
  const handleSimulate = () => setSimResult(simulateSampleRow(config));

  const step3Valid = columns.length > 0 && !!config.contactIdentifierColumn;

  return (
    <div className="space-y-5" data-testid="google-sheet-step1">
      <StepDots active={internalStep} />

      {internalStep === 1 && (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">Google Sheet URL *</div>
            <input
              type="text"
              value={config.sheetUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1234..."
              data-testid="gsheet-trigger-sheet-url"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
            />
            <div className="mt-1 text-xs text-text-muted">
              Paste the link to the Google Sheet you want to use. We'll check access and read its structure.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={!config.sheetUrl?.trim()}
              data-testid="gsheet-trigger-connect-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Connect
            </button>
            <span
              data-testid="gsheet-trigger-connection-status"
              className={`text-xs font-medium ${config.connected ? "text-emerald-600" : "text-text-muted"}`}
            >
              {config.connected ? "🟢 Connected" : "⚪ Not connected"}
            </span>
          </div>

          <div className="bg-slate-50 border border-border rounded-md px-3 py-2.5">
            <div className="text-xs text-text-secondary">
              Share this sheet with <span className="font-semibold">{GOOGLE_SHEET_SERVICE_ACCOUNT_EMAIL}</span> (Editor
              access) so we can read new rows.
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              data-testid="gsheet-trigger-advanced-toggle"
              className="text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              {showAdvanced ? "▾" : "▸"} Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-2">
                <div className="text-sm font-semibold text-text-primary mb-1">Sheet ID (Optional)</div>
                <input
                  type="text"
                  value={config.sheetId}
                  onChange={(e) => update({ sheetId: e.target.value })}
                  placeholder="123456"
                  data-testid="gsheet-trigger-sheet-id"
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                />
                <div className="mt-1 text-xs text-text-muted">
                  Only needed if this file has multiple tabs and the tab name isn't enough to tell them apart.
                </div>
              </div>
            )}
          </div>

          <StepFooter
            onContinue={() => setInternalStep(2)}
            continueDisabled={!config.connected}
            continueTestId="gsheet-trigger-step1-continue"
          />
        </div>
      )}

      {internalStep === 2 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isHeaderMode}
              onChange={(e) => setHeaderMode(e.target.checked)}
              data-testid="gsheet-trigger-header-toggle"
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-sm font-semibold text-text-primary">The first row contains column names</span>
          </label>
          <div className="text-xs text-text-muted -mt-2">
            Turn this off only if your first row is already data, not column titles.
          </div>

          {isHeaderMode ? (
            <div>
              <div className="text-xs font-medium text-text-secondary mb-1.5">Here's what we found in row 1:</div>
              <div className="flex flex-wrap gap-2" data-testid="gsheet-trigger-detected-columns">
                {(config.detectedColumns || []).map((c) => (
                  <span key={c} className="inline-flex items-center bg-slate-100 border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-text-muted">
              We'll refer to columns by letter (A, B, C…). You'll pick which letters to capture in the next step.
            </div>
          )}

          <div className="bg-slate-50 border border-border rounded-md px-3 py-2.5">
            <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
              <li>Only rows added after this trigger is turned on will start the flow — existing rows won't trigger it.</li>
              <li>New rows must be appended at the bottom of the sheet, not inserted in the middle.</li>
            </ul>
          </div>

          <StepFooter
            onBack={() => setInternalStep(1)}
            onContinue={() => setInternalStep(3)}
            backTestId="gsheet-trigger-step2-back"
            continueTestId="gsheet-trigger-step2-continue"
          />
        </div>
      )}

      {internalStep === 3 && (
        <div className="space-y-5">
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">
              Which column identifies the contact for this automation? *
            </div>
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
              Choose a column with a unique value per row — e.g. Phone Number, Email, or Customer ID.
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">Map columns to variables</div>
            <div className="text-xs text-text-muted mb-2">
              {isHeaderMode
                ? "We've pre-selected everything and generated variable names — edit or uncheck anything you don't need."
                : "Add the column letters you want to capture, then name each one."}
            </div>

            {isHeaderMode ? (
              <div className="border border-border rounded-md overflow-hidden" data-testid="gsheet-trigger-mapping-table">
                {(config.detectedColumns || []).map((col) => {
                  const checked = columns.includes(col);
                  const isContact = config.contactIdentifierColumn === col;
                  return (
                    <div key={col} className="flex items-center gap-3 px-3 py-2 border-b border-border/60 last:border-b-0 bg-surface">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleHeaderColumn(col, e.target.checked)}
                        data-testid={`gsheet-trigger-map-checkbox-${col}`}
                        className="w-4 h-4 accent-primary rounded flex-shrink-0"
                      />
                      <span className="w-36 text-sm text-text-primary truncate flex-shrink-0">{col}</span>
                      <input
                        type="text"
                        value={variableNames[col] || ""}
                        onChange={(e) => setVariableName(col, e.target.value)}
                        disabled={!checked}
                        data-testid={`gsheet-trigger-map-varname-${col}`}
                        className="flex-1 px-2 py-1 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60 disabled:opacity-40"
                      />
                      <span className="text-xs text-text-muted font-mono flex-shrink-0 hidden sm:inline">
                        {checked && variableNames[col] ? `{{trigger.${variableNames[col]}}}` : "—"}
                      </span>
                      {isContact && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-tint text-primary font-medium flex-shrink-0">
                          Contact ID
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
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
                    onClick={addLetterColumn}
                    data-testid="gsheet-trigger-column-add"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-primary/40 text-primary hover:bg-primary-tint"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
                {columns.length > 0 && (
                  <div className="space-y-1.5" data-testid="gsheet-trigger-column-chips">
                    {columns.map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary flex-shrink-0">
                          {c}
                          <button
                            type="button"
                            onClick={() => removeLetterColumn(c)}
                            data-testid={`gsheet-trigger-column-remove-${c}`}
                            aria-label={`Remove ${c}`}
                            className="text-text-muted hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                        <input
                          type="text"
                          value={variableNames[c] || ""}
                          onChange={(e) => setVariableName(c, e.target.value)}
                          placeholder="variable_name"
                          data-testid={`gsheet-trigger-map-varname-${c}`}
                          className="flex-1 px-2 py-1 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <StepFooter
            onBack={() => setInternalStep(2)}
            onContinue={() => setInternalStep(4)}
            continueDisabled={!step3Valid}
            backTestId="gsheet-trigger-step3-back"
            continueTestId="gsheet-trigger-step3-continue"
          />
        </div>
      )}

      {internalStep === 4 && (
        <div className="space-y-4">
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
            <div className="mt-1 text-xs text-text-muted">
              Shorter intervals mean the flow starts sooner after a row is added.
            </div>
          </div>

          <div className="bg-slate-50 border border-border rounded-md px-3 py-2.5">
            <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1.5">
              <li>Only newly added rows trigger the flow — existing rows are ignored.</li>
              <li>New rows must be appended at the bottom of the sheet.</li>
              <li>The flow runs the next time we check, based on the frequency above.</li>
            </ul>
          </div>

          {columns.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-text-primary mb-1">Simulate a new row (optional)</div>
              <div className="space-y-2">
                {columns.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="w-32 text-xs text-text-muted truncate">{variableNames[c] || c}</span>
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

          <StepFooter
            onBack={() => setInternalStep(3)}
            backTestId="gsheet-trigger-step4-back"
          />
        </div>
      )}
    </div>
  );
}
