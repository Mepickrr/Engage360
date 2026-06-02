// Operator/value rules shared by Step 1 (event attributes) and Step 2 (user
// property / behavior / affinity).

// Brief §5a — exact operator sets per data type for the User Property tab.
// Boolean has no operator (rendered inline as a True/False toggle).
export const OPERATOR_SETS_BY_TYPE = {
  string: [
    "is",
    "is not",
    "contains",
    "does not contain",
    "starts with",
    "ends with",
    "does not start with",
    "does not end with",
    "exists",
    "does not exist",
  ],
  text: [
    "is",
    "is not",
    "contains",
    "does not contain",
    "starts with",
    "ends with",
    "does not start with",
    "does not end with",
    "exists",
    "does not exist",
  ],
  integer: [
    "is equal to",
    "is not equal to",
    "is between",
    "is not between",
    "is greater than",
    "is less than",
    "exists",
    "does not exist",
  ],
  decimal: [
    "is equal to",
    "is not equal to",
    "is between",
    "is not between",
    "is greater than",
    "is less than",
    "exists",
    "does not exist",
  ],
  numeric: [
    "is equal to",
    "is not equal to",
    "is between",
    "is not between",
    "is greater than",
    "is less than",
    "exists",
    "does not exist",
  ],
  date: ["on", "before", "after", "is between", "exists", "does not exist"],
  datetime: [
    "on",
    "before",
    "after",
    "is between",
    "exists",
    "does not exist",
  ],
  time: ["on", "before", "after", "is between", "exists", "does not exist"],
  boolean: [], // rendered inline
  enum: ["is equal to", "is not equal to"], // treated as multi-select / categorical
  time_slot: ["is equal to", "is not equal to"],
};

export const OPERATOR_DESCRIPTIONS = {
  // String
  is: "Attribute exactly matches the selected value.",
  "is not": "Attribute does not match the selected value.",
  contains: "Attribute string contains the value as a substring.",
  "does not contain": "Attribute string does not contain the value.",
  "starts with": "Attribute begins with the value.",
  "ends with": "Attribute ends with the value.",
  "does not start with": "Attribute does not begin with the value.",
  "does not end with": "Attribute does not end with the value.",
  exists: "Attribute is present on the user profile.",
  "does not exist": "Attribute is missing from the user profile.",
  // Numeric
  "is equal to": "Attribute is exactly equal to the input value.",
  "is not equal to": "Attribute is not equal to the input value.",
  "is greater than": "Attribute value is strictly greater than the input.",
  "is less than": "Attribute value is strictly less than the input.",
  "is between":
    "Stored value is matched between the first filter value and the second filter value.",
  "is not between":
    "Stored value is not matched between the first filter value and the second filter value.",
  // Date
  on: "Date matches the selected date.",
  before: "Date is earlier than the selected date.",
  after: "Date is later than the selected date.",
  // Legacy (kept so older saved configs still render a description).
  equals: "Attribute exactly matches the value.",
  "not equals": "Attribute does not match the value.",
  "greater than": "Attribute value is strictly greater than the input.",
  "less than": "Attribute value is strictly less than the input.",
  "greater than or equal": "Attribute value is ≥ the input.",
  "less than or equal": "Attribute value is ≤ the input.",
  between:
    "Attribute is matched between the first and second filter values (inclusive).",
  "in the last": "Date is within the last N days/weeks/months.",
  "more than N days ago": "Date is older than N days from today.",
  "is true": "Attribute is True.",
  "is false": "Attribute is False.",
  "is one of": "Attribute matches any value in the provided list.",
  "is not one of": "Attribute matches none of the values in the list.",
};

// Whether the value field should hide for this operator.
export function operatorHidesValue(op) {
  return (
    op === "exists" ||
    op === "does not exist" ||
    op === "Exists" ||
    op === "Doesn't Exist" ||
    op === "Doesn't Contain"
  );
}

export function operatorIsRange(op) {
  return (
    op === "between" ||
    op === "is between" ||
    op === "is not between" ||
    op === "Between"
  );
}

export function operatorIsRelativeDate(op) {
  return op === "in the last" || op === "In the last";
}

// Get the operator list for a User Property attribute. Falls back to data_type
// based defaults when no override is supplied.
export function userPropertyOperators(attr) {
  if (!attr) return [];
  const dt = (attr.data_type || "string").toLowerCase();
  return OPERATOR_SETS_BY_TYPE[dt] || OPERATOR_SETS_BY_TYPE.string;
}

// Existing helpers from previous build — kept for Step 1 event attributes.
export function getOperators(attr) {
  if (!attr) return [];
  if (attr.operators && attr.operators.length) return attr.operators;
  const dt = (attr.data_type || "string").toLowerCase();
  return OPERATOR_SETS_BY_TYPE[dt] || OPERATOR_SETS_BY_TYPE.string;
}

export function describeCondition(cond) {
  if (!cond) return "";
  const { property, operator, value } = cond;
  if (!property) return "";
  if (operatorHidesValue(operator)) return `${property} ${operator}`;
  if (operatorIsRange(operator)) {
    const [a, b] = Array.isArray(value) ? value : [value, ""];
    return `${property} ${operator} ${a || "?"} – ${b || "?"}`;
  }
  const v = Array.isArray(value) ? value.join(", ") : value;
  return `${property} ${operator} ${v || ""}`.trim();
}

export function mockedAudienceCount() {
  return Math.floor(1000 + Math.random() * 49000);
}

// Time-range options used by User behavior + User affinity (Most/Least time
// range). The follow-up control varies per option.
export const TIME_RANGES = [
  { id: "in_last", label: "in the last", followUp: "n_unit" },
  { id: "between", label: "in between", followUp: "date_range" },
  { id: "before", label: "before", followUp: "date" },
  { id: "after", label: "after", followUp: "date" },
  { id: "on", label: "on", followUp: "date" },
  { id: "today", label: "today", followUp: null },
  { id: "yesterday", label: "yesterday", followUp: null },
  { id: "last_week", label: "last week", followUp: null },
  { id: "last_month", label: "last month", followUp: null },
  { id: "this_week", label: "this week", followUp: null },
  { id: "this_month", label: "this month", followUp: null },
  { id: "ever", label: "ever", followUp: null },
];

export const FREQUENCY_OPTIONS = [
  { id: "at_least", label: "at least", needsCount: true },
  { id: "at_most", label: "at most", needsCount: true },
  { id: "exactly", label: "exactly", needsCount: true },
  { id: "first_time", label: "first time", needsCount: false },
  { id: "last_time", label: "last time", needsCount: false },
  { id: "zero", label: "zero", needsCount: false },
];

export const AFFINITY_TYPES = [
  { id: "predominantly", label: "Predominantly" },
  { id: "for_minimum_of", label: "For minimum of" },
  { id: "most_no_of_times", label: "Most no. of times" },
  { id: "least_no_of_times", label: "Least no. of times" },
];

export const AUDIENCE_TYPE_LABELS = {
  all: "All Users",
  engage_identified: "Engage Identified",
  known: "Known User",
};

// ───────── TriggerNode preview renderers ─────────

const TIME_RANGE_LABEL = {
  in_last: "in the last",
  between: "in between",
  before: "before",
  after: "after",
  on: "on",
  today: "today",
  yesterday: "yesterday",
  last_week: "last week",
  last_month: "last month",
  this_week: "this week",
  this_month: "this month",
  ever: "ever",
};

function fmtTimeRange(tr) {
  if (!tr) return "";
  const label = TIME_RANGE_LABEL[tr.op] || tr.op || "";
  if (tr.op === "in_last") return `${label} ${tr.n || ""} ${tr.unit || "days"}`;
  if (tr.op === "before" || tr.op === "after" || tr.op === "on")
    return `${label} ${tr.date || ""}`.trim();
  return label;
}

function fmtQualifier(q) {
  return q === "has_not_executed" || q === "has_not_done"
    ? "Has Not Done"
    : "Has Done";
}

// Single-line readable description of one attribute condition row
// (matches the format shown in the TriggerNode card).
export function renderConditionLine(c) {
  if (!c) return "";
  const { property, operator, value } = c;
  if (!property) return "";
  if (operatorHidesValue(operator)) return `${property} ${operator}`;
  if (operatorIsRange(operator)) {
    const [a, b] = Array.isArray(value) ? value : [value, ""];
    return `${property} ${operator} ${a || "?"}–${b || "?"}`;
  }
  const v = Array.isArray(value) ? value.join(", ") : value;
  return `${property} ${operator} ${v ?? ""}`.trim();
}

function joinConds(conds = [], combinator = "AND") {
  return conds
    .map((c) => renderConditionLine(c))
    .filter(Boolean)
    .join(` ${combinator} `);
}

function summarizePropertyTab(tab) {
  const conds = (tab?.conditions || []).filter((c) => c.property);
  if (!conds.length) return null;
  return {
    text: `Where ${joinConds(conds, tab.combinator || "AND")}`,
    full: `Where ${joinConds(conds, tab.combinator || "AND")}`,
  };
}

function summarizeBehaviorTab(tab) {
  const conds = (tab?.conditions || []).filter((c) => c.event);
  if (!conds.length) return null;
  const parts = conds.map((c) => {
    const q = fmtQualifier(c.qualifier);
    const freq =
      c.frequency === "first_time" || c.frequency === "last_time"
        ? c.frequency.replace("_", " ")
        : `${c.frequency || "at least"} ${c.count || 1}×`;
    return `${q} ${c.event} ${freq} ${fmtTimeRange(c.time_range)}`.trim();
  });
  const text = parts.join(` ${tab.combinator || "AND"} `);
  return { text, full: text };
}

const AFFINITY_LABEL = {
  predominantly: "Predominantly with",
  for_minimum_of: "For minimum of",
  most_no_of_times: "Most no. of times",
  least_no_of_times: "Least no. of times",
};

function summarizeAffinityTab(tab) {
  const conds = (tab?.conditions || []).filter((c) => c.event);
  if (!conds.length) return null;
  const parts = conds.map((c) => {
    const head = `Has Executed ${c.event}`;
    const t = c.affinity_type;
    if (t === "predominantly") {
      const u = c.unit || "days";
      const n = c.n || "";
      return `${head} • Predominantly with ${c.attribute || "?"} in last ${n} ${u}`.trim();
    }
    if (t === "for_minimum_of") {
      return `${head} • For minimum of ${c.percent || "?"}% with ${c.attribute || "?"} in last ${c.n || ""} ${c.unit || "days"}`.trim();
    }
    if (t === "most_no_of_times") {
      return `${head} • Most ${c.percent || "?"}% ${fmtTimeRange(c.time_range)}`;
    }
    if (t === "least_no_of_times") {
      return `${head} • Least ${c.percent || "?"}% ${fmtTimeRange(c.time_range)}`;
    }
    return head;
  });
  const text = parts.join(` ${tab.combinator || "AND"} `);
  return { text, full: text };
}

function summarizeSegmentTab(tab) {
  const segs = (tab?.segments || []).filter(Boolean);
  if (!segs.length) return null;
  const list = segs.map((s) => `"${s}"`).join(" OR ");
  return { text: `In segment ${list}`, full: `In segment ${list}` };
}

// Returns an array of audience summary rows for the TriggerNode card.
// Each row is { text, full, kind } where kind is "include" | "exclude".
export function renderAudienceLines(cfg) {
  const out = [];
  const audience = cfg?.audience;
  if (!audience || audience.include_all) return out;

  const tabs = audience.include?.tabs || {};
  const summaries = [
    summarizePropertyTab(tabs.property),
    summarizeBehaviorTab(tabs.behavior),
    summarizeAffinityTab(tabs.affinity),
    summarizeSegmentTab(tabs.segment),
  ].filter(Boolean);

  summaries.forEach((s) =>
    out.push({ text: s.text, full: s.full, kind: "include" }),
  );

  // Exclude (event-based rows)
  if (audience.exclude_enabled) {
    const events = (audience.exclude?.events || []).filter((e) => e?.event);
    if (events.length) {
      const text = `Exclude: ${events
        .map((e) => `${fmtQualifier(e.qualifier)} ${e.event}`)
        .join(" AND ")}`;
      out.push({ text, full: text, kind: "exclude" });
    }
  }
  return out;
}

export function renderFrequencyText(audience) {
  if (!audience?.limit_enabled) return null;
  const le = audience.limit_entry || {};
  const count = le.count ?? 1;
  const window = le.window ?? 1;
  const unit = le.unit || "days";
  const short = `${count}× / ${window} ${unit}`;
  return { short, full: `Limit to ${count} time(s) within ${window} ${unit}` };
}

export function renderExitSummary(exit) {
  if (!exit?.open) return null;
  const events = (exit.events || []).filter((e) => e?.event);
  if (!events.length) return null;
  if (events.length === 1) {
    const e = events[0];
    const txt = `Exit: ${fmtQualifier(e.qualifier)} ${e.event}`;
    return { short: txt, full: txt };
  }
  const full = events
    .map((e) => `${fmtQualifier(e.qualifier)} ${e.event}`)
    .join(" AND ");
  return { short: `Exit: ${events.length} conditions`, full: `Exit: ${full}` };
}
