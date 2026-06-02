import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  getOperators,
  operatorHidesValue,
  operatorIsRange,
} from "./triggerHelpers";

// Render the value input depending on the attribute + operator combo.
function ValueInput({ attr, operator, value, onChange }) {
  if (!attr || operatorHidesValue(operator)) return null;
  const dt = (attr.data_type || "string").toLowerCase();
  const sel = (attr.selection_option || "").toLowerCase();

  if (dt === "boolean") {
    return (
      <div className="text-[11px] text-text-muted px-3 py-2 italic">
        {operator}
      </div>
    );
  }
  if (sel === "date picker" || dt === "date" || dt === "datetime") {
    if (operatorIsRange(operator)) {
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
  if (sel === "multiple select") {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    const examples = attr.examples || [];
    return (
      <div className="border border-border rounded-md bg-surface px-2 py-1.5">
        <div className="flex flex-wrap gap-1 mb-1">
          {arr.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-tint text-primary text-[11px]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(arr.filter((t) => t !== tag))}
                className="text-primary/60 hover:text-primary"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Select
          value=""
          onValueChange={(v) => {
            if (!v || arr.includes(v)) return;
            onChange([...arr, v]);
          }}
        >
          <SelectTrigger className="h-7 text-[12px] border-0 shadow-none px-1">
            <SelectValue placeholder="Add value…" />
          </SelectTrigger>
          <SelectContent>
            {examples
              .filter((ex) => !arr.includes(ex))
              .map((ex) => (
                <SelectItem key={ex} value={ex}>
                  {ex}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (operatorIsRange(operator)) {
    const [a = "", b = ""] = Array.isArray(value) ? value : [value, ""];
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={a}
          onChange={(e) => onChange([e.target.value, b])}
          placeholder="Min"
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-24 focus:outline-none focus:border-primary/60"
        />
        <span className="text-xs text-text-muted">to</span>
        <input
          type="number"
          value={b}
          onChange={(e) => onChange([a, e.target.value])}
          placeholder="Max"
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-surface w-24 focus:outline-none focus:border-primary/60"
        />
      </div>
    );
  }
  if (dt === "integer" || dt === "decimal" || dt === "number") {
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

// One [Property] [Operator] [Value] [trash] row.
// `attributesPool` is the candidate list to pick the property from.
export default function AttributeConditionRow({
  condition,
  attributesPool,
  onChange,
  onRemove,
  testId,
}) {
  const attr = attributesPool.find((a) => a.name === condition.property);
  const operators = getOperators(attr);
  const ops =
    operators && operators.length
      ? operators
      : ["Is", "Is Not", "Exists", "Doesn't Exist"];

  return (
    <div className="grid grid-cols-12 gap-2 items-center" data-testid={testId}>
      {/* Property */}
      <div className="col-span-4">
        <Select
          value={condition.property || ""}
          onValueChange={(v) =>
            onChange({ ...condition, property: v, operator: "", value: "" })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {attributesPool.map((a) => (
              <SelectItem key={a.name} value={a.name}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Operator */}
      <div className="col-span-3">
        <Select
          value={condition.operator || ""}
          onValueChange={(v) => onChange({ ...condition, operator: v })}
          disabled={!attr}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            {ops.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Value */}
      <div className="col-span-4">
        <ValueInput
          attr={attr}
          operator={condition.operator}
          value={condition.value}
          onChange={(v) => onChange({ ...condition, value: v })}
        />
      </div>
      {/* Trash */}
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
          aria-label="Remove condition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
