export const EXPRESSION_VARIABLE_GROUPS = [
  {
    id: "customer",
    label: "Customer variables",
    variables: [
      { key: "customer.id",          label: "Customer ID",     type: "Number", recommended: true  },
      { key: "customer.phone",       label: "Phone Number",    type: "String", recommended: true  },
      { key: "customer.email",       label: "Email",           type: "String", recommended: true  },
      { key: "customer.name",        label: "Full Name",       type: "String", recommended: true  },
      { key: "customer.first_name",  label: "First Name",      type: "String" },
      { key: "customer.last_name",   label: "Last Name",       type: "String" },
      { key: "customer.city",        label: "City",            type: "String" },
      { key: "customer.country",     label: "Country",         type: "String" },
      { key: "customer.tags",        label: "Tags",            type: "String" },
      { key: "customer.order_count", label: "Order Count",     type: "Number" },
      { key: "customer.total_spend", label: "Total Spend",     type: "Number" },
      { key: "customer.rfm",         label: "RFM Segment",     type: "String" },
      { key: "customer.is_new",      label: "Is New Customer", type: "Boolean"},
    ],
  },
  {
    id: "flow",
    label: "Flow variables",
    variables: [
      { key: "flow.orderId",       label: "Order ID",       type: "String", recommended: true },
      { key: "flow.paymentAmount", label: "Payment Amount", type: "Number", recommended: true },
      { key: "flow.orderAmount",   label: "Order Amount",   type: "Number", recommended: true },
      { key: "flow.paymentLink",   label: "Payment Link",   type: "String" },
      { key: "flow.paymentLinkId", label: "Payment Link ID",type: "String" },
    ],
  },
  {
    id: "local_responses",
    label: "Local User Responses",
    variables: [
      { key: "response.1", label: "Response 1", type: "String" },
      { key: "response.2", label: "Response 2", type: "String" },
      { key: "response.3", label: "Response 3", type: "String" },
    ],
  },
  {
    id: "store",
    label: "Store variables",
    variables: [
      { key: "store.name",     label: "Store Name", type: "String", recommended: true },
      { key: "store.currency", label: "Currency",   type: "String" },
      { key: "store.domain",   label: "Domain",     type: "String" },
      { key: "store.id",       label: "Store ID",   type: "String" },
    ],
  },
  {
    id: "global",
    label: "Global Variables",
    variables: [
      { key: "global.date",      label: "Current Date", type: "String", recommended: true },
      { key: "global.time",      label: "Current Time", type: "String", recommended: true },
      { key: "global.timestamp", label: "Timestamp",    type: "Number" },
    ],
  },
  {
    id: "session",
    label: "Session variables",
    variables: [
      { key: "session.platform",    label: "Platform",      type: "String" },
      { key: "session.referrer",    label: "Referrer URL",  type: "String" },
      { key: "session.device_type", label: "Device Type",   type: "String" },
      { key: "session.start_time",  label: "Session Start", type: "String" },
    ],
  },
];

export const EXPRESSION_OPERATORS = [
  { value: ">",        label: "> (greater than)"    },
  { value: "<",        label: "< (less than)"       },
  { value: ">=",       label: "≥ (greater or equal)"},
  { value: "<=",       label: "≤ (less or equal)"   },
  { value: "==",       label: "= (equals)"          },
  { value: "!=",       label: "≠ (not equals)"      },
  { value: "contains", label: "contains"            },
  { value: "%",        label: "% (modulo)"          },
];

export const PATH_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const SPLIT_BLOCK_TYPES = [
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
];

export function newBlock() {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "property",
    combinator: "AND",
    conditions: [],
    segments: [],
  };
}

export function newFilterGroup(index = 0) {
  return {
    id: `fg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    label: `Branch ${index + 1}`,
    blocksCombinator: "AND",
    blocks: [newBlock()],
  };
}

export function newExpression(index = 0) {
  return {
    id: `expr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    inputMode: "structured",
    variable: "",
    operator: ">",
    value: "",
    rawText: "",
  };
}

export const defaultConditionalSplitData = {
  label: "Conditional Split",
  mode: null,
  filterGroups: [
    {
      id: "fg_default",
      label: "Branch 1",
      blocksCombinator: "AND",
      blocks: [
        {
          id: "blk_default",
          type: "property",
          combinator: "AND",
          conditions: [],
          segments: [],
        },
      ],
    },
  ],
  filterGroupsCombinator: "AND",
  abPaths: [
    { id: "path_a", label: "A", percentage: 50 },
    { id: "path_b", label: "B", percentage: 50 },
  ],
  abRandomise: false,
  expressions: [newExpression(0)],
  wiredPorts: [],
};
