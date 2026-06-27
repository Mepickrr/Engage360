import React, { useEffect, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import CombinatorPill from "./CombinatorPill";
import AttributeConditionRow from "../AttributeConditionRow";
import { TimeRangeRow } from "./UserBehaviorConditions";
import { FREQUENCY_OPTIONS } from "../triggerHelpers";

const EXEC_QUALIFIERS = [
  { id: "has_executed",     label: "Has Executed" },
  { id: "has_not_executed", label: "Has Not Executed" },
];

function adaptTEPAttrs(props) {
  if (!props || props === "special") return [];
  return props.map((p) => ({
    name: p.name,
    data_type:
      p.type === "Numeric"
        ? "integer"
        : p.type === "DateTime"
        ? "datetime"
        : p.type === "Boolean"
        ? "boolean"
        : "string",
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

function defaultCondition(eventName) {
  return {
    qualifier: "has_executed",
    event: eventName,
    frequency: "at_least",
    count: 1,
    time_range: { op: "in_last", n: 30, unit: "days" },
    attributes: [],
    attrs_open: false,
  };
}

export default function EventPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const triggerEvent = useFlowBuilderStore(
    (s) =>
      s.nodes.find((n) => n.type === "trigger")?.data?.event_name ?? null,
  );

  const prevTriggerEventRef = useRef(triggerEvent);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({
      conditions: [...conditions, defaultCondition(triggerEvent)],
    });
  const removeCondition = (i) =>
    update({ conditions: conditions.filter((_, idx) => idx !== i) });

  // Bootstrap first condition when trigger event is available
  useEffect(() => {
    if (!triggerEvent) return;
    if (conditions.length === 0) {
      onChange({
        ...block,
        combinator: block.combinator || "AND",
        conditions: [defaultCondition(triggerEvent)],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEvent]);

  // Reset conditions when trigger event changes
  useEffect(() => {
    const prev = prevTriggerEventRef.current;
    if (triggerEvent && prev && triggerEvent !== prev) {
      onChange({
        ...block,
        conditions: [defaultCondition(triggerEvent)],
      });
    }
    prevTriggerEventRef.current = triggerEvent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerEvent]);

  if (!triggerEvent) {
    return (
      <div className="py-6 text-center text-[12px] text-text-muted border border-dashed border-border rounded-lg">
        Add a start trigger event to use this filter.
      </div>
    );
  }

  const attrPool = getAttrPool(triggerEvent) || [];
  const propPool = attrPool.filter((a) => !a.is_evaluate);

  return (
    <div className="space-y-4">
      {/* Locked event badge */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Trigger event:</span>
        <span className="px-2 py-0.5 text-[12px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {triggerEvent}
        </span>
      </div>

      {conditions.map((c, i) => {
        const freqMeta = FREQUENCY_OPTIONS.find((f) => f.id === c.frequency);
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
              <div className="flex flex-wrap items-center gap-1.5">
                <Select
                  value={c.qualifier}
                  onValueChange={(v) => setCondition(i, { ...c, qualifier: v })}
                >
                  <SelectTrigger className="h-9 text-sm min-w-[160px]">
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

                <Select
                  value={c.frequency}
                  onValueChange={(v) => setCondition(i, { ...c, frequency: v })}
                >
                  <SelectTrigger className="h-9 text-sm min-w-[120px]">
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
                        setCondition(i, {
                          ...c,
                          count: Number(e.target.value),
                        })
                      }
                      className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                    />
                    <span className="text-xs text-text-muted">times</span>
                  </>
                )}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <TimeRangeRow
                value={c.time_range}
                onChange={(tr) => setCondition(i, { ...c, time_range: tr })}
                testIdPrefix={`${testIdPrefix}-tr-${i}`}
              />

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setCondition(i, { ...c, attrs_open: !c.attrs_open })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <Plus className="w-3 h-3" />
                  Attributes ({(c.attributes || []).length})
                </button>
                {c.attrs_open && (
                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border">
                    {(c.attributes || []).map((a, ai) => (
                      <AttributeConditionRow
                        key={ai}
                        condition={a}
                        attributesPool={propPool}
                        onChange={(na) =>
                          setCondition(i, {
                            ...c,
                            attributes: c.attributes.map((x, idx) =>
                              idx === ai ? na : x,
                            ),
                          })
                        }
                        onRemove={() =>
                          setCondition(i, {
                            ...c,
                            attributes: c.attributes.filter(
                              (_, idx) => idx !== ai,
                            ),
                          })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCondition(i, {
                          ...c,
                          attributes: [
                            ...(c.attributes || []),
                            { property: "", operator: "", value: "" },
                          ],
                        })
                      }
                      className="text-[11px] text-primary hover:text-primary-hover"
                    >
                      + Add attribute filter
                    </button>
                  </div>
                )}
              </div>
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
