// Mock Segment store — frontend-only prototype, no backend persistence.
// Shared by Segments.jsx, SegmentBuilderPage, and AudienceFilterBuilder's
// "Custom segment" block (so segments created here are selectable elsewhere).

const BASE_POOL = 50000;

const CHANNEL_OPT_IN_RATES = {
  push: 0.82,
  email: 0.64,
  sms: 0.91,
  whatsapp: 0.58,
};

function emptyBlockSet() {
  return { blocks: [], blocksCombinator: "AND" };
}

function nowIso() {
  return "2026-07-10T09:00:00.000Z";
}

let segments = [
  {
    id: "seg_1",
    name: "Cart Abandoners 48h",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_1a",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "cart_abandoned", qualifier: "has_done", frequency: "at_least", count: 1, time_range: { op: "in_last", n: 2, unit: "days" } },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-07-03T09:00:00.000Z",
    updatedAt: "2026-07-10T08:55:00.000Z",
    owner: "meera",
    status: "active",
  },
  {
    id: "seg_2",
    name: "VIP Customers (LTV > ₹10K)",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_2a",
            type: "property",
            combinator: "AND",
            conditions: [{ property: "ltv", operator: ">=", value: "10000" }],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-06-28T09:00:00.000Z",
    updatedAt: "2026-07-10T07:45:00.000Z",
    owner: "meera",
    status: "active",
  },
  {
    id: "seg_3",
    name: "Skincare Browsers",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_3a",
            type: "property",
            combinator: "AND",
            conditions: [
              { property: "category", operator: "=", value: "skincare" },
              { property: "views", operator: ">=", value: "3" },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-07-10T08:38:00.000Z",
    owner: null,
    status: "active",
  },
  {
    id: "seg_4",
    name: "Reactivation Window — 45d",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_4a",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "app_open", qualifier: "has_not_done", frequency: "zero", time_range: { op: "between" } },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-07-10T08:30:00.000Z",
    owner: "meera",
    status: "active",
  },
  {
    id: "seg_5",
    name: "First-time Buyers",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_5a",
            type: "property",
            combinator: "AND",
            conditions: [{ property: "orders", operator: "=", value: "1" }],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-07-10T07:30:00.000Z",
    owner: null,
    status: "active",
  },
  {
    id: "seg_6",
    name: "High-intent unconverted",
    description: "",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_seed_6a",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "viewed_product", qualifier: "has_done", frequency: "at_least", count: 3 },
            ],
            segments: [],
          },
          {
            id: "blk_seed_6b",
            type: "property",
            combinator: "AND",
            conditions: [{ property: "orders", operator: "=", value: "0" }],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-06-05T09:00:00.000Z",
    updatedAt: "2026-07-07T09:00:00.000Z",
    owner: null,
    status: "stale",
  },
];

// Seed rows omit userCount/reachability — both are derived from the same
// deterministic estimateAudience() used by the live reachability panel,
// so the segments list and a segment's detail view never disagree.
segments = segments.map((s) => ({ ...s, ...estimateAudience(s.audience) }));

let nextSegmentSeq = segments.length + 1;

// ───────── deterministic mock math (no Math.random) ─────────

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Stable multiplier in [0.15, 0.85] derived from a condition's fields.
function conditionMultiplier(cond) {
  const key = JSON.stringify(cond);
  const h = hashString(key);
  return 0.15 + (h % 71) / 100; // 0.15 .. 0.85
}

function blockCount(block, pool) {
  const conds = block?.type === "segment" ? (block.segments || []).filter(Boolean) : block?.conditions || [];
  if (!conds.length) return pool;
  const combinator = block.combinator || "AND";
  if (combinator === "AND") {
    return conds.reduce((acc, c) => acc * conditionMultiplier(c), 1) * pool;
  }
  // OR: union approximation — take the max single-condition reach, boosted per extra condition
  const multipliers = conds.map((c) => conditionMultiplier(c));
  const maxM = Math.max(...multipliers);
  const boost = Math.min(1, maxM + (multipliers.length - 1) * 0.08);
  return boost * pool;
}

function blockSetCount(blockSet, pool) {
  const blocks = blockSet?.blocks || [];
  if (!blocks.length) return pool;
  const combinator = blockSet.blocksCombinator || "AND";
  if (combinator === "AND") {
    return blocks.reduce((acc, b) => Math.min(acc, blockCount(b, pool)), pool);
  }
  return Math.min(pool, blocks.reduce((acc, b) => acc + blockCount(b, pool), 0));
}

// Deterministic mock audience-count estimate for an `audience` object
// ({ include, exclude_enabled, exclude }). Same input always yields the
// same output.
export function estimateAudience(audience) {
  const include = audience?.include || emptyBlockSet();
  let count = blockSetCount(include, BASE_POOL);
  if (audience?.exclude_enabled) {
    const excludeCount = blockSetCount(audience.exclude || emptyBlockSet(), BASE_POOL);
    count = Math.max(0, count - excludeCount * 0.5);
  }
  const total = Math.round(count);
  const reachability = Object.fromEntries(
    Object.entries(CHANNEL_OPT_IN_RATES).map(([channel, rate]) => [channel, Math.round(total * rate)]),
  );
  // Users reachable via at least one channel (union of independent opt-ins).
  const unreachableRate = Object.values(CHANNEL_OPT_IN_RATES).reduce((acc, rate) => acc * (1 - rate), 1);
  const reachableUsers = Math.round(total * (1 - unreachableRate));
  return { userCount: total, reachability, reachableUsers };
}

// ───────── CRUD ─────────

export function listSegments() {
  return segments;
}

export function getSegment(id) {
  return segments.find((s) => s.id === id) || null;
}

export function createSegment({ name, description = "", audience }) {
  const estimate = estimateAudience(audience);
  const segment = {
    id: `seg_${nextSegmentSeq++}`,
    name,
    description,
    audience,
    userCount: estimate.userCount,
    reachability: estimate.reachability,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    owner: "meera",
    status: "active",
  };
  segments = [segment, ...segments];
  return segment;
}

export function updateSegment(id, { name, description, audience }) {
  const estimate = estimateAudience(audience);
  segments = segments.map((s) =>
    s.id === id
      ? {
          ...s,
          name: name ?? s.name,
          description: description ?? s.description,
          audience,
          userCount: estimate.userCount,
          reachability: estimate.reachability,
          updatedAt: nowIso(),
          status: "active",
        }
      : s,
  );
  return getSegment(id);
}

export function emptySegmentAudience() {
  return {
    include: emptyBlockSet(),
    exclude_enabled: false,
    exclude: emptyBlockSet(),
  };
}

// ───────── Query results history (mock "past filters" log) ─────────
// Separate from saved Segments — this mirrors the "Query results" panel on
// MoEngage's Create Segment page: every time a filter is queried (Show
// Count), it's logged here regardless of whether it's ever saved as a
// named segment. Frontend-only mock — nothing is actually persisted.

let queryHistory = [
  {
    id: "qh_1",
    queryTime: "2026-07-09T20:18:00.000Z",
    source: "Flows Campaign",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_qh_1a",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "app_open", qualifier: "has_done", frequency: "at_least", count: 1, time_range: { op: "in_last", n: 3, unit: "days" } },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
  },
  {
    id: "qh_2",
    queryTime: "2026-07-08T18:39:00.000Z",
    source: "Segmentation",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_qh_2a",
            type: "property",
            combinator: "AND",
            conditions: [
              { property: "orders_90d", operator: ">", value: "10" },
              { property: "tech_integration", operator: "not_in", value: "CS" },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
  },
  {
    id: "qh_3",
    queryTime: "2026-07-01T01:23:00.000Z",
    source: "Onsite Messaging Campaign",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_qh_3a",
            type: "property",
            combinator: "AND",
            conditions: [{ property: "shipments", operator: ">", value: "0" }],
            segments: [],
          },
          {
            id: "blk_qh_3b",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "app_open", qualifier: "has_done", frequency: "at_least", count: 1, time_range: { op: "in_last", n: 30, unit: "days" } },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: true,
      exclude: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_qh_3c",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "nps_survey_completed", qualifier: "has_done", frequency: "at_least", count: 1, time_range: { op: "in_last", n: 2, unit: "months" } },
            ],
            segments: [],
          },
        ],
      },
    },
  },
  {
    id: "qh_4",
    queryTime: "2026-06-26T17:38:00.000Z",
    source: "Segmentation",
    audience: {
      include: {
        blocksCombinator: "AND",
        blocks: [
          {
            id: "blk_qh_4a",
            type: "property",
            combinator: "AND",
            conditions: [{ property: "shipments", operator: ">", value: "10000" }],
            segments: [],
          },
          {
            id: "blk_qh_4b",
            type: "behavior",
            combinator: "AND",
            conditions: [
              { event: "sign_up", qualifier: "has_done", frequency: "at_least", count: 1, time_range: { op: "in_last", n: 2, unit: "months" } },
            ],
            segments: [],
          },
        ],
      },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
  },
];

let nextQueryHistorySeq = queryHistory.length + 1;

export function listQueryHistory() {
  return queryHistory;
}

export function getQueryHistoryEntry(id) {
  return queryHistory.find((q) => q.id === id) || null;
}

// Logs a new "query run" entry (e.g. when a seller clicks Show Count),
// so it shows up in the Query results list immediately.
export function logQueryRun({ audience, source = "Segment Builder" }) {
  const entry = {
    id: `qh_${nextQueryHistorySeq++}`,
    queryTime: nowIso(),
    source,
    audience,
  };
  queryHistory = [entry, ...queryHistory];
  return entry;
}
