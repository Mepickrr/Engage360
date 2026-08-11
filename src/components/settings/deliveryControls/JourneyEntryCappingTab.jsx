import React, { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import { JOURNEY_CAP_EVENT_POOL, DEFAULT_EVENT_CAP_RULES, DEFAULT_RULE_LIMIT } from "./constants";

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

function slug(event) {
  return event.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Falls back to a scannable summary when the seller hasn't typed a label.
function summarizeRule(rule) {
  if (rule.label.trim()) return rule.label.trim();
  const { selectedEvents } = rule;
  if (selectedEvents.length === 0) return "No events selected yet";
  if (selectedEvents.length === 1) return selectedEvents[0];
  return `${selectedEvents[0]} + ${selectedEvents.length - 1} more`;
}

function emptyRule(id) {
  return { id, label: "", enabled: true, limit: DEFAULT_RULE_LIMIT, selectedEvents: [] };
}

function RuleCard({ rule, onChange, onRemove }) {
  const testIdPrefix = `journey-cap-rule-${rule.id}`;

  function patch(next) {
    onChange({ ...rule, ...next });
  }

  function toggleEvent(event) {
    const selected = rule.selectedEvents.includes(event)
      ? rule.selectedEvents.filter((e) => e !== event)
      : [...rule.selectedEvents, event];
    patch({ selectedEvents: selected });
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-white" data-testid={testIdPrefix}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <ToggleSwitch checked={rule.enabled} onChange={(v) => patch({ enabled: v })} testId={`${testIdPrefix}-toggle`} />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={rule.label}
              onChange={(e) => patch({ label: e.target.value })}
              placeholder={summarizeRule(rule)}
              data-testid={`${testIdPrefix}-label`}
              className="w-full text-sm font-semibold text-text-primary bg-transparent border-none outline-none placeholder:text-text-primary placeholder:font-semibold focus:ring-1 focus:ring-primary rounded px-1 -mx-1"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          data-testid={`${testIdPrefix}-remove`}
          aria-label="Remove rule"
          className="text-text-muted hover:text-rose-600 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {rule.enabled && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] text-text-secondary">Limit to</span>
            <input
              type="number"
              min={0}
              value={rule.limit}
              onChange={(e) => patch({ limit: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })}
              data-testid={`${testIdPrefix}-limit`}
              className="w-16 px-2 py-1.5 border border-border rounded-md text-sm bg-white"
            />
            <span className="text-[12px] text-text-secondary">
              time(s) per day, shared across every event selected below
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
              Events ({rule.selectedEvents.length} selected)
            </div>
            <div className="flex flex-wrap gap-2">
              {JOURNEY_CAP_EVENT_POOL.map((event) => {
                const selected = rule.selectedEvents.includes(event);
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    data-testid={`${testIdPrefix}-event-${slug(event)}`}
                    aria-pressed={selected}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text-secondary border-border hover:bg-slate-50"
                    }`}
                  >
                    {event}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function JourneyEntryCappingTab() {
  const [rules, setRules] = useState(DEFAULT_EVENT_CAP_RULES);
  const [baseline, setBaseline] = useState(DEFAULT_EVENT_CAP_RULES);
  const [nextId, setNextId] = useState(1);
  const dirty = rules !== baseline;

  function addRule() {
    setRules((prev) => [...prev, emptyRule(`rule-${nextId}`)]);
    setNextId((n) => n + 1);
  }

  function patchRule(id, next) {
    setRules((prev) => prev.map((r) => (r.id === id ? next : r)));
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
    <div data-testid="delivery-journey-entry-capping">
      <SaveBar
        title="Journey Entry Capping"
        subtitle="Limit how often start-trigger events can enter any flow/journey, so users aren't overcommunicated to."
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        testIdPrefix="journey-cap"
      />

      <div className="mb-4 flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-lg p-4">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <div className="text-[12px] text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">How Event Rules work</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>
              Each rule caps a daily budget shared across the events you select for it — pick one event for a
              per-event cap (e.g. max 3 "Product Viewed" per day), or several for a shared cap across all of them
              (e.g. max 1 total across "Product Viewed" and "Abandoned Checkout" combined).
            </li>
            <li>
              An event can belong to more than one rule. It only enters a journey if every rule it matches still
              has budget left — entering counts against all of them, not just one.
            </li>
            <li>
              This is separate from a single journey's own "Limit entry frequency" setting, and from the
              channel-level Frequency Capping tab (which limits outbound messages, not entries). Limits reset in the set window
              at 12 AM.
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-3" data-testid="journey-cap-rules">
        {rules.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-[13px] text-text-muted" data-testid="journey-cap-empty">
            No event rules yet. Add a rule to start capping how often selected events can enter journeys.
          </div>
        )}
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onChange={(next) => patchRule(rule.id, next)}
            onRemove={() => removeRule(rule.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addRule}
        data-testid="journey-cap-add-rule"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-4 h-4" />
        Add Rule
      </button>
    </div>
  );
}
