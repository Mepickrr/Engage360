import React, { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import CombinatorPill from "./CombinatorPill";
import AttributeConditionRow from "../AttributeConditionRow";

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
  return { event: eventName, property: "", operator: "", value: "" };
}

export default function EventPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const triggerEvent = useFlowBuilderStore((s) => {
    const node = s.nodes.find(
      (n) =>
        n.type === "trigger" ||
        n.type === "startTrigger" ||
        n.type === "start-trigger" ||
        n.id === "start",
    );
    if (!node) return null;
    return (
      node.data?.event_name ||
      node.data?.groups?.[0]?.event ||
      node.data?.config?.triggerGroups?.[0]?.event ||
      null
    );
  });

  const prevTriggerEventRef = useRef(triggerEvent);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({ conditions: [...conditions, defaultCondition(triggerEvent)] });
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
    <div className="space-y-3">
      {/* Locked event badge */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Trigger event:</span>
        <span className="px-2 py-0.5 text-[12px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          {triggerEvent}
        </span>
      </div>

      {conditions.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <CombinatorPill
              value={combinator}
              onChange={(v) => update({ combinator: v })}
              testId={`${testIdPrefix}-combinator`}
            />
          )}
          <AttributeConditionRow
            condition={c}
            attributesPool={propPool}
            onChange={(nc) => setCondition(i, { ...nc, event: triggerEvent })}
            onRemove={() => removeCondition(i)}
            testId={`${testIdPrefix}-row-${i}`}
          />
        </React.Fragment>
      ))}

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
