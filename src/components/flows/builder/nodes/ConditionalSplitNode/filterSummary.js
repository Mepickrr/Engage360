import { FREQUENCY_OPTIONS, TIME_RANGES } from "@/components/flows/builder/trigger/triggerHelpers";

const AFFINITY_LABELS = {
  predominantly: "Predominantly",
  for_minimum_of: "For minimum of",
  most_no_of_times: "Most no. of times",
  least_no_of_times: "Least no. of times",
};

function freqLabel(c) {
  const meta = FREQUENCY_OPTIONS.find((o) => o.id === c?.frequency);
  if (!meta) return "";
  return meta.needsCount ? `${meta.label} ${c.count || 1} time${c.count === 1 ? "" : "s"}` : meta.label;
}

function timeRangeLabel(tr) {
  if (!tr) return "";
  const meta = TIME_RANGES.find((r) => r.id === tr.op);
  if (!meta) return "";
  if (meta.followUp === "n_unit") return `${meta.label} ${tr.n || ""} ${tr.unit || "days"}`.trim();
  if (meta.followUp === "date") return `${meta.label} ${tr.date || ""}`.trim();
  if (meta.followUp === "date_range") return `${meta.label} ${tr.date || ""} and ${tr.date_to || ""}`.trim();
  return meta.label;
}

function formatValue(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(" – ");
  if (v === true) return "True";
  if (v === false) return "False";
  return v ?? "";
}

function summarizePropertyCondition(c) {
  if (!c.property) return "";
  if (c.operator === "" && (c.value === true || c.value === false)) {
    return `${c.property} is ${c.value ? "True" : "False"}`;
  }
  if (!c.operator) return c.property;
  if (c.operator === "exists" || c.operator === "does not exist") return `${c.property} ${c.operator}`;
  const val = formatValue(c.value);
  return val !== "" ? `${c.property} ${c.operator} ${val}` : `${c.property} ${c.operator}`;
}

function summarizeExecutionCondition(c) {
  if (!c.event) return "";
  const qualifier = c.qualifier === "has_not_executed" ? "Did not execute" : "Executed";
  const parts = [`${qualifier} "${c.event}"`, freqLabel(c), timeRangeLabel(c.time_range)];
  return parts.filter(Boolean).join(" ");
}

function summarizeAffinityCondition(c) {
  if (!c.event) return "";
  const parts = [
    AFFINITY_LABELS[c.affinity_type] || "",
    `"${c.event}"`,
    c.attribute ? `(${c.attribute})` : "",
    c.percent ? `${c.percent}%` : "",
    timeRangeLabel(c.time_range),
  ];
  return parts.filter(Boolean).join(" ");
}

function summarizeBlock(block) {
  const combinator = block.combinator || "AND";
  let parts;

  if (block.type === "segment") {
    const segs = (block.segments || []).filter(Boolean);
    return segs.length ? `Segment: ${segs.join(" or ")}` : "";
  }

  const summarizer = {
    property: summarizePropertyCondition,
    behavior: summarizeExecutionCondition,
    event_property: summarizeExecutionCondition,
    affinity: summarizeAffinityCondition,
  }[block.type];

  parts = (block.conditions || []).map(summarizer || (() => "")).filter(Boolean);
  return parts.join(` ${combinator} `);
}

// Human-readable description of a filter branch, e.g. "Audience Type is Engage Identified".
export function summarizeFilterGroup(group, { maxLength = 60 } = {}) {
  const blocks = group?.blocks || [];
  const combinator = group?.blocksCombinator || "AND";
  const parts = blocks.map(summarizeBlock).filter(Boolean);
  if (!parts.length) return "";
  const text = parts.join(` ${combinator} `);
  if (maxLength && text.length > maxLength) return `${text.slice(0, maxLength - 1)}…`;
  return text;
}

export function countGroupConditions(group) {
  return (group?.blocks || []).reduce(
    (sum, b) => sum + (b.conditions?.length || 0) + (b.segments?.filter(Boolean).length || 0),
    0,
  );
}
