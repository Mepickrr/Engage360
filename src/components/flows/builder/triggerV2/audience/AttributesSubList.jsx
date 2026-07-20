import React from "react";
import { Plus } from "lucide-react";
import AttributeConditionRow from "../AttributeConditionRow";
import CombinatorPill from "./CombinatorPill";

// Shared "+ Attributes (N)" sub-list used inside behavior/event-property/
// affinity condition rows. Keeps the AND/OR combinator between attribute
// rows in one place so every condition type stays consistent.
export default function AttributesSubList({
  condition,
  onChange,
  attributesPool,
  testIdPrefix,
}) {
  const attributes = condition.attributes || [];
  const combinator = condition.attrs_combinator || "AND";

  const setAttributes = (next) => onChange({ ...condition, attributes: next });

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => onChange({ ...condition, attrs_open: !condition.attrs_open })}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
        data-testid={`${testIdPrefix}-toggle`}
      >
        <Plus className="w-3 h-3" />
        Attributes ({attributes.length})
      </button>
      {condition.attrs_open && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border">
          {attributes.map((a, ai) => (
            <React.Fragment key={ai}>
              {ai > 0 && (
                <CombinatorPill
                  value={combinator}
                  onChange={(v) => onChange({ ...condition, attrs_combinator: v })}
                  testId={`${testIdPrefix}-combinator`}
                />
              )}
              <AttributeConditionRow
                condition={a}
                attributesPool={attributesPool}
                onChange={(na) =>
                  setAttributes(attributes.map((x, idx) => (idx === ai ? na : x)))
                }
                onRemove={() =>
                  setAttributes(attributes.filter((_, idx) => idx !== ai))
                }
              />
            </React.Fragment>
          ))}
          <button
            type="button"
            onClick={() =>
              setAttributes([...attributes, { property: "", operator: "", value: "" }])
            }
            className="text-[11px] text-primary hover:text-primary-hover"
          >
            + Add attribute filter
          </button>
        </div>
      )}
    </div>
  );
}
