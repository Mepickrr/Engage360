import React, { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import {
  DEFAULT_FREQUENCY_CAPPING_RULES,
  FREQUENCY_CHANNELS,
  FREQUENCY_MODE_OPTIONS,
  PERIOD_OPTIONS,
  GAP_UNIT_OPTIONS,
  frequencyRuleId,
} from "./constants";

// Whether another rule on this channel already occupies (type, mode, limitPeriod).
function isComboTaken(rules, channelId, type, mode, limitPeriod, excludeRuleId) {
  return rules.some(
    (r) =>
      r.id !== excludeRuleId &&
      r.channelId === channelId &&
      r.type === type &&
      r.mode === mode &&
      r.limitPeriod === limitPeriod
  );
}

// Options for one of a rule's three identity dropdowns (type/mode/limitPeriod),
// with the other two fields held at their current value. Any candidate that
// would collide with another rule is left out — the current selection is
// always kept even if something else changed around it. This is what makes
// duplicates structurally unselectable instead of something to warn about.
function comboOptions(channelMeta, rules, rule, field) {
  const candidates = field === "type" ? channelMeta.types : field === "mode" ? FREQUENCY_MODE_OPTIONS : PERIOD_OPTIONS;
  return candidates.filter((value) => {
    if (value === rule[field]) return true;
    const type = field === "type" ? value : rule.type;
    const mode = field === "mode" ? value : rule.mode;
    const limitPeriod = field === "limitPeriod" ? value : rule.limitPeriod;
    return !isComboTaken(rules, rule.channelId, type, mode, limitPeriod, rule.id);
  });
}

// First (type, mode, limitPeriod) on this channel that no rule already owns.
function firstAvailableCombo(channelMeta, rules) {
  for (const type of channelMeta.types) {
    for (const mode of FREQUENCY_MODE_OPTIONS) {
      for (const limitPeriod of PERIOD_OPTIONS) {
        if (!isComboTaken(rules, channelMeta.id, type, mode, limitPeriod, null)) {
          return { type, mode, limitPeriod };
        }
      }
    }
  }
  return null;
}

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
  const [rules, setRules] = useState(DEFAULT_FREQUENCY_CAPPING_RULES);
  const [baseline, setBaseline] = useState(DEFAULT_FREQUENCY_CAPPING_RULES);
  const dirty = rules !== baseline;

  // Type/Mode/Time Range dropdowns already only ever offer non-colliding
  // options (see comboOptions), so this never needs to reject a change.
  function patchRule(id, patch) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...patch, id: frequencyRuleId(r.channelId, patch.type ?? r.type, patch.mode ?? r.mode, patch.limitPeriod ?? r.limitPeriod) }
          : r
      )
    );
  }

  function addRule(channelMeta) {
    const combo = firstAvailableCombo(channelMeta, rules);
    if (!combo) return;
    setRules((prev) => [
      ...prev,
      {
        id: frequencyRuleId(channelMeta.id, combo.type, combo.mode, combo.limitPeriod),
        channelId: channelMeta.id,
        type: combo.type,
        mode: combo.mode,
        enabled: false,
        limit: 0,
        limitPeriod: combo.limitPeriod,
        gapEnabled: false,
        gap: 0,
        gapUnit: "Hours",
      },
    ]);
  }

  function removeRule(id) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function handleDiscard() {
    setRules(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(rules);
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
            <li>Add more than one rule per channel to layer caps — e.g. a loose monthly limit alongside a tight daily one. A channel can’t carry two rules for the same Type + Mode combination.</li>
          </ul>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[980px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Mode</th>
              <th className="px-4 py-2 font-medium">User Message Limit</th>
              <th className="px-4 py-2 font-medium">Time Gap</th>
              <th className="px-4 py-2 font-medium w-10" />
            </tr>
          </thead>
          <tbody>
            {FREQUENCY_CHANNELS.map((channelMeta) => {
              const channelRules = rules.filter((r) => r.channelId === channelMeta.id);
              const canAddRule = firstAvailableCombo(channelMeta, rules) != null;
              const rowCount = Math.max(channelRules.length, 1) + 1; // +1 for the "Add rule" row

              return (
                <React.Fragment key={channelMeta.id}>
                  {channelRules.length === 0 && (
                    <tr className="border-t border-border" data-testid={`fc-channel-${channelMeta.id}-empty`}>
                      <td className="px-4 py-3 align-top" rowSpan={rowCount}>
                        <div className="text-sm font-medium text-text-primary">{channelMeta.channel}</div>
                      </td>
                      <td colSpan={4} className="px-4 py-3 text-[13px] text-text-muted">
                        No rules configured for this channel.
                      </td>
                    </tr>
                  )}
                  {channelRules.map((rule, idx) => (
                    <tr key={rule.id} className="border-t border-border" data-testid={`fc-rule-${rule.id}`}>
                      {idx === 0 && (
                        <td className="px-4 py-3 align-top" rowSpan={rowCount}>
                          <div className="text-sm font-medium text-text-primary">{channelMeta.channel}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 align-top">
                        {channelMeta.types.length > 1 ? (
                          <select
                            value={rule.type}
                            onChange={(e) => patchRule(rule.id, { type: e.target.value })}
                            data-testid={`fc-rule-${rule.id}-type`}
                            className="px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                          >
                            {comboOptions(channelMeta, rules, rule, "type").map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[13px] text-text-muted">{channelMeta.types[0]}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select
                          value={rule.mode}
                          onChange={(e) => patchRule(rule.id, { mode: e.target.value })}
                          data-testid={`fc-rule-${rule.id}-mode`}
                          className="px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                        >
                          {comboOptions(channelMeta, rules, rule, "mode").map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={rule.enabled}
                            onChange={(v) => patchRule(rule.id, { enabled: v })}
                            testId={`fc-rule-${rule.id}-enabled`}
                          />
                          <input
                            type="number"
                            min={0}
                            disabled={!rule.enabled}
                            value={rule.limit}
                            onChange={(e) =>
                              patchRule(rule.id, { limit: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })
                            }
                            data-testid={`fc-rule-${rule.id}-limit`}
                            className="w-24 px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                          />
                          <select
                            disabled={!rule.enabled}
                            value={rule.limitPeriod}
                            onChange={(e) => patchRule(rule.id, { limitPeriod: e.target.value })}
                            data-testid={`fc-rule-${rule.id}-limit-period`}
                            className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                          >
                            {comboOptions(channelMeta, rules, rule, "limitPeriod").map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={rule.gapEnabled}
                            onChange={(v) => patchRule(rule.id, { gapEnabled: v })}
                            testId={`fc-rule-${rule.id}-gap-enabled`}
                          />
                          <input
                            type="number"
                            min={0}
                            disabled={!rule.gapEnabled}
                            value={rule.gap}
                            onChange={(e) =>
                              patchRule(rule.id, { gap: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })
                            }
                            data-testid={`fc-rule-${rule.id}-gap`}
                            className="w-24 px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                          />
                          <select
                            disabled={!rule.gapEnabled}
                            value={rule.gapUnit}
                            onChange={(e) => patchRule(rule.id, { gapUnit: e.target.value })}
                            data-testid={`fc-rule-${rule.id}-gap-unit`}
                            className="px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                          >
                            {GAP_UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => removeRule(rule.id)}
                          data-testid={`fc-rule-${rule.id}-remove`}
                          title="Remove rule"
                          className="p-1.5 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border" data-testid={`fc-channel-${channelMeta.id}-add-row`}>
                    <td colSpan={5} className="px-4 py-2">
                      <button
                        type="button"
                        disabled={!canAddRule}
                        onClick={() => addRule(channelMeta)}
                        data-testid={`fc-channel-${channelMeta.id}-add-rule`}
                        title={canAddRule ? undefined : "Every Type + Mode combination for this channel already has a rule"}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add rule
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
