import React, { useMemo } from "react";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";

function adaptTEPAttrs(props) {
  if (!props || props === "special") return [];
  return props.map((p) => ({
    name: p.name,
    data_type: p.type === "Numeric" ? "integer" : p.type === "DateTime" ? "datetime" : p.type === "Boolean" ? "boolean" : "string",
    operators: Array.isArray(p.ops) ? p.ops : [],
    selection_option: p.inputType === "B" ? "picker" : null,
    is_evaluate: false,
    examples: [],
  }));
}

function getAttrPool(eventName) {
  const fromJson = catalogueData.attributes_by_event?.[eventName];
  if (fromJson && fromJson.length > 0) return fromJson;
  return adaptTEPAttrs(getPropertiesForEvent(eventName));
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";
import TwoPanelDropdown from "../TwoPanelDropdown";
import CombinatorPill from "./CombinatorPill";
import AttributesSubList from "./AttributesSubList";
import {
  FREQUENCY_OPTIONS,
  TIME_RANGES,
} from "../triggerHelpers";

const EXEC_QUALIFIERS = [
  { id: "has_executed", label: "Has Executed" },
  { id: "has_not_executed", label: "Has Not Executed" },
];

// Build grouped events for TwoPanelDropdown (category → list).
function useEventGroups() {
  return useMemo(() => {
    const out = {};
    const cat = catalogueData.catalogue || {};
    for (const header of Object.keys(cat)) {
      if (header === "ALL" || header === "All") continue;
      for (const sec of Object.keys(cat[header])) {
        const list = (cat[header][sec] || []).filter(
          (e) => e.audience_qualification_allow !== false,
        );
        if (!list.length) continue;
        out[`${header} · ${sec}`] = list.map((e) => ({
          name: e.name,
          description: e.description || "",
          source: e.source || "",
          device_tag: e.device_tag || [],
        }));
      }
    }
    return out;
  }, []);
}

export function TimeRangeRow({ value, onChange, testIdPrefix }) {
  const op = value?.op || "in_last";
  const meta = TIME_RANGES.find((r) => r.id === op);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select
        value={op}
        onValueChange={(v) =>
          onChange({ op: v, n: "", unit: "days", date: "", date_to: "" })
        }
      >
        <SelectTrigger
          className="h-9 text-sm w-[140px] shrink-0"
          data-testid={`${testIdPrefix}-trigger`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGES.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {meta?.followUp === "n_unit" && (
        <>
          <input
            type="number"
            min={1}
            value={value?.n || ""}
            onChange={(e) => onChange({ ...value, n: e.target.value })}
            className="w-16 shrink-0 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
          />
          <select
            value={value?.unit || "days"}
            onChange={(e) => onChange({ ...value, unit: e.target.value })}
            className="h-9 text-sm rounded-md border border-border bg-surface px-2 shrink-0"
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </>
      )}
      {meta?.followUp === "date" && (
        <input
          type="date"
          value={value?.date || ""}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
        />
      )}
      {meta?.followUp === "date_range" && (
        <>
          <input
            type="date"
            value={value?.date || ""}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="date"
            value={value?.date_to || ""}
            onChange={(e) => onChange({ ...value, date_to: e.target.value })}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
          />
        </>
      )}
    </div>
  );
}

export default function UserBehaviorConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const eventGroups = useEventGroups();
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({
      conditions: [
        ...conditions,
        {
          qualifier: "has_executed",
          event: "",
          frequency: "at_least",
          count: 1,
          time_range: { op: "in_last", n: 30, unit: "days" },
          attributes: [],
          attrs_open: false,
        },
      ],
    });
  const removeCondition = (i) =>
    update({ conditions: conditions.filter((_, idx) => idx !== i) });

  // Auto-bootstrap one empty row on mount when block is empty.
  React.useEffect(() => {
    if ((block.conditions || []).length === 0) {
      onChange({
        ...block,
        combinator: block.combinator || "AND",
        conditions: [
          {
            qualifier: "has_executed",
            event: "",
            frequency: "at_least",
            count: 1,
            time_range: { op: "in_last", n: 30, unit: "days" },
            attributes: [],
            attrs_open: false,
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {conditions.map((c, i) => {
        const freqMeta = FREQUENCY_OPTIONS.find((f) => f.id === c.frequency);
        const attrPool =
          (c.event && getAttrPool(c.event)) || [];
        const propPool = attrPool.filter((a) => !a.is_evaluate);
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <CombinatorPill
                value={combinator}
                onChange={(v) => update({ combinator: v })}
                testId={`${testIdPrefix}-combinator`}
              />
            )}
            <div
              className="border border-border rounded-lg p-3 bg-surface space-y-2"
              data-testid={`${testIdPrefix}-row-${i}`}
            >
              <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={c.qualifier}
                      onValueChange={(v) => setCondition(i, { ...c, qualifier: v })}
                    >
                      <SelectTrigger className="h-9 text-sm w-[150px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXEC_QUALIFIERS.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <TwoPanelDropdown
                      value={c.event}
                      onChange={(v) =>
                        setCondition(i, { ...c, event: v, attributes: [] })
                      }
                      groups={eventGroups}
                      placeholder="Select an event"
                      testId={`${testIdPrefix}-evt-${i}`}
                      buttonClassName="flex-1 min-w-0"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Select
                      value={c.frequency}
                      onValueChange={(v) => setCondition(i, { ...c, frequency: v })}
                    >
                      <SelectTrigger className="h-9 text-sm w-[130px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {freqMeta?.needsCount && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={c.count || 1}
                          onChange={(e) =>
                            setCondition(i, { ...c, count: Number(e.target.value) })
                          }
                          className="w-16 shrink-0 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                        />
                        <span className="text-xs text-text-muted shrink-0">times</span>
                      </>
                    )}
                  </div>

                  <TimeRangeRow
                    value={c.time_range}
                    onChange={(tr) => setCondition(i, { ...c, time_range: tr })}
                    testIdPrefix={`${testIdPrefix}-tr-${i}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  className="flex-shrink-0 p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <AttributesSubList
                condition={c}
                onChange={(nc) => setCondition(i, nc)}
                attributesPool={propPool}
                testIdPrefix={`${testIdPrefix}-attrs-${i}`}
              />
            </div>
          </React.Fragment>
        );
      })}
      <button
        type="button"
        onClick={addCondition}
        data-testid={`${testIdPrefix}-add-cond`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition
      </button>
    </div>
  );
}
