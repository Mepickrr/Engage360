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
import AttributeConditionRow from "../AttributeConditionRow";
import { TimeRangeRow } from "./UserBehaviorConditions";
import { AFFINITY_TYPES } from "../triggerHelpers";

function useEventGroups() {
  return useMemo(() => {
    const out = {};
    const cat = catalogueData.catalogue || {};
    for (const header of Object.keys(cat)) {
      for (const sec of Object.keys(cat[header])) {
        const list = (cat[header][sec] || []).filter(
          (e) => e.audience_qualification_allow !== false,
        );
        if (!list.length) continue;
        out[`${header} · ${sec}`] = list.map((e) => ({
          name: e.name,
          description: e.description || "",
        }));
      }
    }
    return out;
  }, []);
}

function eventAttrGroups(eventName) {
  const attrs =
    (eventName && getAttrPool(eventName)) || [];
  const props = attrs.filter((a) => !a.is_evaluate);
  return {
    [`${eventName} attributes`]: props.map((a) => ({
      name: a.name,
      description: `${a.data_type || "string"}${a.selection_option ? " · " + a.selection_option : ""}`,
    })),
  };
}

export default function UserAffinityConditions({
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
          affinity_type: "predominantly",
          event: "",
          attribute: "",
          n: "",
          unit: "days",
          percent: 10,
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
            affinity_type: "predominantly",
            event: "",
            attribute: "",
            n: "",
            unit: "days",
            percent: 10,
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
        const attrsForEvent = c.event ? eventAttrGroups(c.event) : {};
        const propPool =
          (c.event && getAttrPool(c.event)) || [];
        const evtAttrs = propPool.filter((a) => !a.is_evaluate);

        const isA = c.affinity_type === "predominantly";
        const isB = c.affinity_type === "for_minimum_of";
        const isC = c.affinity_type === "most_no_of_times";
        const isD = c.affinity_type === "least_no_of_times";

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
              {/* Type + delete */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Select
                  value={c.affinity_type}
                  onValueChange={(v) =>
                    setCondition(i, { ...c, affinity_type: v, attribute: "" })
                  }
                >
                  <SelectTrigger
                    className="h-9 text-sm min-w-[180px]"
                    data-testid={`${testIdPrefix}-type-${i}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AFFINITY_TYPES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Has Executed → event */}
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="text-text-secondary">Has Executed</span>
                <TwoPanelDropdown
                  value={c.event}
                  onChange={(v) =>
                    setCondition(i, { ...c, event: v, attribute: "" })
                  }
                  groups={eventGroups}
                  placeholder="Select event"
                  testId={`${testIdPrefix}-evt-${i}`}
                />
              </div>

              {/* Variant-specific row */}
              {isA && (
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-text-secondary">Predominantly with</span>
                  <TwoPanelDropdown
                    value={c.attribute}
                    onChange={(v) => setCondition(i, { ...c, attribute: v })}
                    groups={attrsForEvent}
                    placeholder={c.event ? "Select attribute" : "Select event first"}
                    testId={`${testIdPrefix}-attr-${i}`}
                    disabled={!c.event}
                  />
                  <span className="text-text-secondary">in the last</span>
                  <input
                    type="number"
                    min={1}
                    value={c.n || ""}
                    onChange={(e) => setCondition(i, { ...c, n: e.target.value })}
                    className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                  />
                  <select
                    value={c.unit}
                    onChange={(e) => setCondition(i, { ...c, unit: e.target.value })}
                    className="h-9 text-sm rounded-md border border-border bg-surface px-2"
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                </div>
              )}

              {isB && (
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-text-secondary">For minimum of</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={c.percent || ""}
                    onChange={(e) =>
                      setCondition(i, { ...c, percent: e.target.value })
                    }
                    className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                  />
                  <span className="text-text-secondary">% times with</span>
                  <TwoPanelDropdown
                    value={c.attribute}
                    onChange={(v) => setCondition(i, { ...c, attribute: v })}
                    groups={attrsForEvent}
                    placeholder={c.event ? "Select attribute" : "Select event first"}
                    testId={`${testIdPrefix}-attr-${i}`}
                    disabled={!c.event}
                  />
                  <span className="text-text-secondary">in the last</span>
                  <input
                    type="number"
                    min={1}
                    value={c.n || ""}
                    onChange={(e) => setCondition(i, { ...c, n: e.target.value })}
                    className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                  />
                  <select
                    value={c.unit}
                    onChange={(e) => setCondition(i, { ...c, unit: e.target.value })}
                    className="h-9 text-sm rounded-md border border-border bg-surface px-2"
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                </div>
              )}

              {(isC || isD) && (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="text-text-secondary">
                      {isC ? "Most no. of times" : "Least no. of times"} and
                      filter {isC ? "top" : "bottom"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.percent || ""}
                      onChange={(e) =>
                        setCondition(i, { ...c, percent: e.target.value })
                      }
                      className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
                    />
                    <span className="text-text-secondary">% times</span>
                  </div>
                  <TimeRangeRow
                    value={c.time_range}
                    onChange={(tr) => setCondition(i, { ...c, time_range: tr })}
                    testIdPrefix={`${testIdPrefix}-tr-${i}`}
                  />
                </>
              )}

              {/* + Attributes (event payload filters) */}
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
                        attributesPool={evtAttrs}
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
