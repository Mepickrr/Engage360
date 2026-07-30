import React, { useState } from "react";
import { Info, CheckCircle2 } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import { DEFAULT_DND_ROWS, DND_TYPE_OPTIONS } from "./constants";

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

export default function DndTab() {
  const [rows, setRows] = useState(DEFAULT_DND_ROWS);
  const [baseline, setBaseline] = useState(DEFAULT_DND_ROWS);
  const dirty = rows !== baseline;
  const anyEnabled = rows.some((r) => r.enabled);

  function patchRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleDiscard() {
    setRows(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(rows);
  }

  return (
    <div data-testid="delivery-dnd">
      <SaveBar
        title="Global DND Settings"
        subtitle="Configure Do Not Disturb time windows for channel-specific settings"
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        testIdPrefix="dnd"
      />

      <div className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-lg p-4">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">How to Configure Global DND</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Set Do Not Disturb hours to prevent messages from being sent during specific time periods.</li>
            <li>Configure different DND windows for different channels or apply global settings across all channels.</li>
            <li>DND will apply as per Asia/Kolkata timezone.</li>
          </ul>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Enable/Disable</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Start Time</th>
              <th className="px-4 py-2 font-medium">End Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border" data-testid={`dnd-row-${row.id}`}>
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{row.channel}</td>
                <td className="px-4 py-3">
                  <ToggleSwitch
                    checked={row.enabled}
                    onChange={(v) => patchRow(row.id, { enabled: v })}
                    testId={`dnd-row-${row.id}-enabled`}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    disabled={!row.enabled}
                    value={row.type}
                    onChange={(e) => patchRow(row.id, { type: e.target.value })}
                    data-testid={`dnd-row-${row.id}-type`}
                    className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                  >
                    {DND_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    disabled={!row.enabled}
                    value={row.start}
                    onChange={(e) => patchRow(row.id, { start: e.target.value })}
                    data-testid={`dnd-row-${row.id}-start`}
                    className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    disabled={!row.enabled}
                    value={row.end}
                    onChange={(e) => patchRow(row.id, { end: e.target.value })}
                    data-testid={`dnd-row-${row.id}-end`}
                    className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] italic text-text-muted mt-3">
        As per TRAI regulations, promotional SMS can only be sent between 10 AM and 9 PM. Campaigns or automations
        outside this window will be queued until 10 AM.
      </p>

      <div
        className={`mt-4 flex items-start gap-2 rounded-lg p-4 border ${
          anyEnabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-border"
        }`}
        data-testid="dnd-status-banner"
      >
        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${anyEnabled ? "text-emerald-600" : "text-text-muted"}`} />
        <div className="text-[12px] text-text-secondary">
          <p className="font-semibold text-text-primary">DND Status</p>
          <p>
            {anyEnabled
              ? "DND settings are currently active. Messages will be queued during configured DND hours and sent when the DND window ends."
              : "No DND windows are currently enabled. Turn on a channel above to start queuing messages during quiet hours."}
          </p>
        </div>
      </div>
    </div>
  );
}
