import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import userAttrsData from "@/data/userAttributes.json";
import TwoPanelDropdown from "../TwoPanelDropdown";
import CombinatorPill from "./CombinatorPill";
import {
  userPropertyOperators,
  operatorHidesValue,
  operatorIsRange,
  OPERATOR_DESCRIPTIONS,
} from "../triggerHelpers";

// Flatten to a lookup by name and a grouped { category: [{name, description}] }
// for the TwoPanelDropdown.
function buildAttrIndex() {
  const groups = userAttrsData.groups || {};
  const byName = {};
  const grouped = {};
  for (const cat of Object.keys(groups)) {
    grouped[cat] = (groups[cat] || []).map((a) => ({
      name: a.name,
      description: a.description || "",
    }));
    for (const a of groups[cat] || []) byName[a.name] = { ...a, category: cat };
  }
  return { byName, grouped };
}

export default function UserPropertyConditions({
  block,
  onChange,
  testIdPrefix,
}) {
  const { byName, grouped } = React.useMemo(buildAttrIndex, []);
  const conditions = block.conditions || [];
  const combinator = block.combinator || "AND";

  const update = (next) => onChange({ ...block, ...next });
  const setCondition = (i, c) =>
    update({ conditions: conditions.map((x, idx) => (idx === i ? c : x)) });
  const addCondition = () =>
    update({
      conditions: [
        ...conditions,
        { property: "", operator: "", value: "" },
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
        conditions: [{ property: "", operator: "", value: "" }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {conditions.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <CombinatorPill
              value={combinator}
              onChange={(v) => update({ combinator: v })}
              testId={`${testIdPrefix}-combinator`}
            />
          )}
          <Row
            c={c}
            attrIndex={byName}
            attrGroups={grouped}
            onChange={(nc) => setCondition(i, nc)}
            onRemove={() => removeCondition(i)}
            testIdPrefix={`${testIdPrefix}-${i}`}
          />
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={addCondition}
        data-testid={`${testIdPrefix}-add-cond`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        + Add condition
      </button>
    </div>
  );
}

function Row({ c, attrIndex, attrGroups, onChange, onRemove, testIdPrefix }) {
  const attr = attrIndex[c.property];
  const dt = (attr?.data_type || "string").toLowerCase();
  const isBoolean = dt === "boolean";
  const ops = userPropertyOperators(attr);
  const hides = operatorHidesValue(c.operator);
  const isRange = operatorIsRange(c.operator);

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4">
        <TwoPanelDropdown
          value={c.property}
          onChange={(v) => {
            const nextAttr = attrIndex[v];
            const nextDt = (nextAttr?.data_type || "string").toLowerCase();
            // Boolean → no operator. Pre-seed value as true.
            onChange({
              ...c,
              property: v,
              operator: nextDt === "boolean" ? "" : "",
              value: nextDt === "boolean" ? true : "",
            });
          }}
          groups={attrGroups}
          placeholder="Select attribute"
          testId={`${testIdPrefix}-attr`}
          buttonClassName="w-full"
        />
      </div>

      {/* Boolean: no operator dropdown — inline True/False toggle */}
      {isBoolean ? (
        <div className="col-span-7">
          <div className="flex items-center gap-3 h-9">
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                checked={c.value === true || c.value === "true"}
                onChange={() => onChange({ ...c, value: true })}
                className="accent-primary"
                data-testid={`${testIdPrefix}-bool-true`}
              />
              <span>True</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                checked={c.value === false || c.value === "false"}
                onChange={() => onChange({ ...c, value: false })}
                className="accent-primary"
                data-testid={`${testIdPrefix}-bool-false`}
              />
              <span>False</span>
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="col-span-3">
            <OperatorPicker
              ops={ops}
              value={c.operator}
              onChange={(v) => onChange({ ...c, operator: v, value: "" })}
              disabled={!attr}
              testId={`${testIdPrefix}-op`}
            />
          </div>
          <div className="col-span-4">
            <ValueInput
              attr={attr}
              operator={c.operator}
              value={c.value}
              onChange={(v) => onChange({ ...c, value: v })}
              hides={hides}
              isRange={isRange}
            />
          </div>
        </>
      )}

      <div className="col-span-1 flex justify-end pt-1">
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
          data-testid={`${testIdPrefix}-remove`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Operator dropdown with right-side description panel (screenshot 8 pattern).
// We reuse TwoPanelDropdown — operators sit in a single "Operators" group
// and the description panel renders on hover.
function OperatorPicker({ ops, value, onChange, disabled, testId }) {
  const groups = React.useMemo(
    () => ({
      Operators: (ops || []).map((o) => ({
        name: o,
        description: OPERATOR_DESCRIPTIONS[o] || "",
      })),
    }),
    [ops],
  );
  if (disabled) {
    return (
      <div className="h-9 px-3 text-sm rounded-md border border-border bg-slate-50 text-text-muted inline-flex items-center w-full">
        Operator
      </div>
    );
  }
  return (
    <TwoPanelDropdown
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder="Operator"
      testId={testId}
      buttonClassName="w-full"
      width={460}
    />
  );
}

function ValueInput({ attr, operator, value, onChange, hides, isRange }) {
  if (!attr || !operator || hides) return <div />;
  const dt = (attr.data_type || "string").toLowerCase();

  // Multi-select / categorical attributes (time slots, enums with values).
  if (dt === "time_slot" || (dt === "enum" && attr.allowed_values)) {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    const allowed = attr.allowed_values || [];
    return (
      <MultiValuePicker allowed={allowed} value={arr} onChange={onChange} />
    );
  }

  // Date / DateTime — operators are on / before / after / is between.
  if (dt === "datetime" || dt === "date" || dt === "time") {
    if (isRange) {
      const [a = "", b = ""] = Array.isArray(value) ? value : [value, ""];
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={a}
            onChange={(e) => onChange([e.target.value, b])}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="date"
            value={b}
            onChange={(e) => onChange([a, e.target.value])}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
          />
        </div>
      );
    }
    return (
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
      />
    );
  }

  // Numeric — single number for is greater/less/equal, two inputs for between.
  if (
    dt === "integer" ||
    dt === "decimal" ||
    dt === "numeric"
  ) {
    if (isRange) {
      const [a = "", b = ""] = Array.isArray(value) ? value : [value, ""];
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={a}
            onChange={(e) => onChange([e.target.value, b])}
            placeholder="Min"
            className="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="number"
            value={b}
            onChange={(e) => onChange([a, e.target.value])}
            placeholder="Max"
            className="w-24 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
          />
        </div>
      );
    }
    return (
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value"
        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
      />
    );
  }

  // Free-text enum (no allowed_values).
  if (dt === "enum" && !attr.allowed_values) {
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value"
        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface"
      />
    );
  }

  // String / text default.
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
      className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
    />
  );
}

function MultiValuePicker({ allowed, value, onChange }) {
  return (
    <div className="border border-border rounded-md bg-surface px-2 py-1.5">
      <div className="flex flex-wrap gap-1 mb-1 min-h-[20px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-tint text-primary text-[11px]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-primary/60 hover:text-primary"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <Select
        value=""
        onValueChange={(v) => {
          if (!v || value.includes(v)) return;
          onChange([...value, v]);
        }}
      >
        <SelectTrigger className="h-7 text-[12px] border-0 shadow-none px-1">
          <SelectValue placeholder="Add value…" />
        </SelectTrigger>
        <SelectContent>
          {(allowed || [])
            .filter((v) => !value.includes(v))
            .map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
