import React, { useState } from "react";
import { Info } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import { DEFAULT_FREQUENCY_CAPPING_ROWS, PERIOD_OPTIONS, GAP_UNIT_OPTIONS } from "./constants";

function ToggleSwitch({ checked, onChange, testId }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export default function FrequencyCappingTab() {
  const [rows, setRows] = useState(DEFAULT_FREQUENCY_CAPPING_ROWS);
  const [baseline, setBaseline] = useState(DEFAULT_FREQUENCY_CAPPING_ROWS);
  const dirty = rows !== baseline;

  function patchRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function patchConfig(id, type, patch) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, configByType: { ...r.configByType, [type]: { ...r.configByType[type], ...patch } } }
          : r
      )
    );
  }

  function handleDiscard() {
    setRows(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(rows);
  }

  return (
    <div data-testid="delivery-frequency-capping">
      <SaveBar
        title="Channel Frequency Capping"
        subtitle="Configure user level message limits and time gaps for global and channel specific settings."
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        testIdPrefix="frequency-capping"
      />

      <div className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-lg p-4">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">How to Configure Frequency Capping</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Set user level message limits and time gaps for global (all channels) or individual channels. Message limits reset daily at 12 AM.</li>
            <li>Messages blocked by FC are dropped. For automations, dropped messages also cause the user to exit the flow.</li>
            <li>All Channels doesn’t include Email and Mobile Push campaigns. Please configure Frequency limits for Email channel individually.</li>
          </ul>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[880px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">User Message Limit</th>
              <th className="px-4 py-2 font-medium">Time Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const config = row.configByType[row.selectedType];
              return (
                <tr key={row.id} className="border-t border-border" data-testid={`fc-row-${row.id}`}>
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-medium text-text-primary">{row.channel}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.types.length > 1 ? (
                      <select
                        value={row.selectedType}
                        onChange={(e) => patchRow(row.id, { selectedType: e.target.value })}
                        data-testid={`fc-row-${row.id}-type`}
                        className="px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                      >
                        {row.types.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[13px] text-text-muted">{row.types[0]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={config.enabled}
                        onChange={(v) => patchConfig(row.id, row.selectedType, { enabled: v })}
                        testId={`fc-row-${row.id}-enabled`}
                      />
                      <input
                        type="number"
                        min={0}
                        disabled={!config.enabled}
                        value={config.limit}
                        onChange={(e) =>
                          patchConfig(row.id, row.selectedType, {
                            limit: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                          })
                        }
                        data-testid={`fc-row-${row.id}-limit`}
                        className="w-24 px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                      />
                      <select
                        disabled={!config.enabled}
                        value={config.limitPeriod}
                        onChange={(e) => patchConfig(row.id, row.selectedType, { limitPeriod: e.target.value })}
                        data-testid={`fc-row-${row.id}-limit-period`}
                        className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                      >
                        {PERIOD_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={config.gapEnabled}
                        onChange={(v) => patchConfig(row.id, row.selectedType, { gapEnabled: v })}
                        testId={`fc-row-${row.id}-gap-enabled`}
                      />
                      <input
                        type="number"
                        min={0}
                        disabled={!config.gapEnabled}
                        value={config.gap}
                        onChange={(e) =>
                          patchConfig(row.id, row.selectedType, {
                            gap: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                          })
                        }
                        data-testid={`fc-row-${row.id}-gap`}
                        className="w-24 px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                      />
                      <select
                        disabled={!config.gapEnabled}
                        value={config.gapUnit}
                        onChange={(e) => patchConfig(row.id, row.selectedType, { gapUnit: e.target.value })}
                        data-testid={`fc-row-${row.id}-gap-unit`}
                        className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                      >
                        {GAP_UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
