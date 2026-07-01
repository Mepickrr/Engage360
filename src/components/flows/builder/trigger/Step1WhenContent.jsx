import React from "react";
import { Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";
import { getPropertiesForEvent } from "@/components/flows/builder/triggerEventProperties";
import AttributeConditionRow from "./AttributeConditionRow";
import CombinatorPill from "./audience/CombinatorPill";
import EventActionRow, {
  emptyEventAction,
} from "./audience/EventActionRow";

// Convert triggerEventProperties format → AttributeConditionRow format
function adaptTEPAttrs(props) {
  if (!props || props === "special") return [];
  return props.map((p) => ({
    name: p.name,
    data_type: p.type === "Numeric" ? "integer"
      : p.type === "DateTime" ? "datetime"
      : p.type === "Boolean" ? "boolean"
      : "string",
    operators: Array.isArray(p.ops) ? p.ops : [],
    selection_option: p.inputType === "B" ? "picker" : null,
    is_evaluate: false,
    examples: [],
  }));
}

function getAttrPool(eventName) {
  // Prefer attributes_by_event from JSON catalogue; fall back to triggerEventProperties.js
  const fromJson = catalogueData.attributes_by_event?.[eventName];
  if (fromJson && fromJson.length > 0) return fromJson;
  return adaptTEPAttrs(getPropertiesForEvent(eventName));
}

const MAX_TRIGGER_GROUPS = 5;

function emptyCondition() {
  return { property: "", operator: "", value: "" };
}

function emptyGroup(eventName) {
  return {
    event: eventName,
    conditions: [],
    evaluate: [],
    evaluateTime: { value: 1, unit: "Hour" },
    combinator: "AND",
  };
}

// Step 1: When will users enter the flow.
export default function Step1WhenContent({
  triggerGroups,
  setTriggerGroups,
  groupsCombinator = "AND",
  setGroupsCombinator = () => {},
  exitTrigger,
  setExitTrigger,
  onPickEventForGroup,
}) {
  const updateGroup = (idx, patch) => {
    setTriggerGroups(
      triggerGroups.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
    );
  };
  const removeGroup = (idx) =>
    setTriggerGroups(triggerGroups.filter((_, i) => i !== idx));

  const addAnotherTrigger = () => {
    if (triggerGroups.length >= MAX_TRIGGER_GROUPS) return;
    // Open picker for the new group via the parent.
    onPickEventForGroup(triggerGroups.length);
  };

  return (
    <div className="space-y-4">
      {triggerGroups.map((group, gi) => {
        const ev =
          catalogueData.catalogue &&
          Object.values(catalogueData.catalogue)
            .flatMap((sec) => Object.values(sec))
            .flat()
            .find((c) => c.name === group.event);
        const attrPool = getAttrPool(group.event);
        const propPool = attrPool.filter((a) => !a.is_evaluate);
        const evalPool = attrPool.filter((a) => a.is_evaluate);
        const attrAllowed = ev?.attribute_allowed;

        return (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <CombinatorPill
                value={groupsCombinator}
                onChange={setGroupsCombinator}
                testId="step1-groups-combinator"
              />
            )}
            <div
              className="border border-border rounded-lg p-4 bg-surface"
              data-testid={`trigger-group-${gi}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] uppercase tracking-wide text-text-muted font-semibold">
                  Create trigger based on {ev?.header || ""}
                </div>
                {triggerGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="p-1 text-text-muted hover:text-rose-600 rounded-md"
                    aria-label="Remove trigger group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  Whenever user performs
                </span>
                <button
                  type="button"
                  onClick={() => onPickEventForGroup(gi)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-md border border-primary/40 bg-primary-tint text-primary hover:bg-primary/10"
                  data-testid={`trigger-group-event-${gi}`}
                >
                  {group.event}
                </button>
              </div>

              {/* WITH ATTRIBUTE block */}
              {attrAllowed && (
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
                    With attribute
                  </div>
                  <div className="space-y-2">
                    {group.conditions.map((c, ci) => (
                      <React.Fragment key={ci}>
                        {ci > 0 && (
                          <CombinatorPill
                            value={group.combinator || "AND"}
                            onChange={(v) => updateGroup(gi, { combinator: v })}
                            testId={`step1-cond-combinator-${gi}`}
                          />
                        )}
                        <AttributeConditionRow
                          testId={`trigger-cond-${gi}-${ci}`}
                          condition={c}
                          attributesPool={propPool}
                          onChange={(nc) =>
                            updateGroup(gi, {
                              conditions: group.conditions.map((x, i) =>
                                i === ci ? nc : x,
                              ),
                            })
                          }
                          onRemove={() =>
                            updateGroup(gi, {
                              conditions: group.conditions.filter(
                                (_, i) => i !== ci,
                              ),
                            })
                          }
                        />
                      </React.Fragment>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(gi, {
                        conditions: [...group.conditions, emptyCondition()],
                      })
                    }
                    data-testid={`trigger-add-cond-${gi}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add condition
                  </button>
                </div>
              )}

              {/* EVALUATE block (Abandoned* events) */}
              {ev?.advance_evaluate && (
                <div className="mt-4 border-t border-dashed border-border pt-3">
                  <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
                    Evaluate
                  </div>
                  {/* Mandatory time range */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-text-secondary">Evaluate events within</span>
                    <input
                      type="number"
                      min={1}
                      value={group.evaluateTime?.value ?? 1}
                      onChange={(e) =>
                        updateGroup(gi, {
                          evaluateTime: { ...(group.evaluateTime || { unit: "Hour" }), value: Number(e.target.value) },
                        })
                      }
                      className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                    />
                    <select
                      value={group.evaluateTime?.unit || "Hour"}
                      onChange={(e) =>
                        updateGroup(gi, {
                          evaluateTime: { ...(group.evaluateTime || { value: 1 }), unit: e.target.value },
                        })
                      }
                      className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                    >
                      <option value="Minute">Minute</option>
                      <option value="Hour">Hour</option>
                      <option value="Day">Day</option>
                    </select>
                  </div>
                  {/* Attribute evaluate rules */}
                  {evalPool.length > 0 && (
                    <>
                      <div className="space-y-2">
                        {(group.evaluate || []).map((c, ci) => (
                          <AttributeConditionRow
                            key={ci}
                            testId={`trigger-eval-${gi}-${ci}`}
                            condition={c}
                            attributesPool={evalPool}
                            onChange={(nc) =>
                              updateGroup(gi, {
                                evaluate: (group.evaluate || []).map((x, i) =>
                                  i === ci ? nc : x,
                                ),
                              })
                            }
                            onRemove={() =>
                              updateGroup(gi, {
                                evaluate: (group.evaluate || []).filter(
                                  (_, i) => i !== ci,
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateGroup(gi, {
                            evaluate: [...(group.evaluate || []), emptyCondition()],
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add evaluate rule
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {triggerGroups.length < MAX_TRIGGER_GROUPS && (
        <button
          type="button"
          onClick={addAnotherTrigger}
          data-testid="trigger-add-group"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary border border-dashed border-primary/50 rounded-md hover:bg-primary-tint"
        >
          <Plus className="w-4 h-4" />
          Add another trigger event
        </button>
      )}

      {/* Exit trigger — event-based (Has Done / Has Not Done + event picker) */}
      <ExitTriggerSection
        exitTrigger={exitTrigger}
        setExitTrigger={setExitTrigger}
      />
    </div>
  );
}

function ExitTriggerSection({ exitTrigger, setExitTrigger }) {
  const open = !!exitTrigger?.open;
  const events = exitTrigger?.events || [];

  // Auto-bootstrap one empty row when the section is opened with no rows.
  React.useEffect(() => {
    if (open && events.length === 0) {
      setExitTrigger({
        ...(exitTrigger || {}),
        open: true,
        events: [emptyEventAction()],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = (next) => setExitTrigger({ ...(exitTrigger || {}), ...next });

  return (
    <div className="border border-dashed border-border rounded-lg p-3">
      <button
        type="button"
        onClick={() =>
          update({
            open: !open,
            events: events.length ? events : [emptyEventAction()],
          })
        }
        className="flex items-center gap-1.5 text-sm font-medium text-primary"
        data-testid="trigger-toggle-exit"
      >
        {open ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {open ? "Exit Trigger" : "+ Add Exit Trigger"}
      </button>
      {open && (
        <div className="mt-3 pl-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
              Exit when
            </div>
            <button
              type="button"
              onClick={() => setExitTrigger({ open: false, events: [] })}
              className="text-xs text-primary hover:underline"
              data-testid="trigger-clear-exit"
            >
              Clear Exit Trigger
            </button>
          </div>
          <div className="space-y-2">
            {events.map((row, i) => (
              <EventActionRow
                key={i}
                value={row}
                onChange={(v) =>
                  update({
                    events: events.map((x, idx) => (idx === i ? v : x)),
                  })
                }
                onRemove={
                  events.length > 1
                    ? () =>
                        update({
                          events: events.filter((_, idx) => idx !== i),
                        })
                    : undefined
                }
                testId={`exit-row-${i}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              update({ events: [...events, emptyEventAction()] })
            }
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            data-testid="exit-add-row"
          >
            <Plus className="w-3.5 h-3.5" />
            Add condition
          </button>
        </div>
      )}
    </div>
  );
}

export { emptyGroup, emptyCondition };
