import userAttrsData from "@/data/userAttributes.json";

// The "Shiprocket Buyer" attribute group is surfaced as "Fastrr Signals" on
// surfaces that opt in via FlowVariantContext ({ fastrrSignals: true }).
export const SIGNALS_SOURCE_GROUP = "Shiprocket Buyer";
export const SIGNALS_LABEL = "Fastrr Signals";

export const SIGNAL_ATTRIBUTES = new Set(
  (userAttrsData.groups?.[SIGNALS_SOURCE_GROUP] || []).map((a) => a.name),
);

// Conditions "Fastrr Enhance" appends, in rotation.
export const ENHANCE_PRESETS = [
  { property: "LIFETIME_AOV", operator: "is greater than", value: "2000" },
  { property: "THREE_MONTHS_ORDERS", operator: "is greater than", value: "1" },
  { property: "RTO_RISK", operator: "is equal to", value: "0" },
];

export function blockSetHasConditions(blockSet) {
  return (blockSet?.blocks || []).some((b) =>
    b.type === "segment" ? (b.segments || []).some(Boolean) : (b.conditions || []).some((c) => c.property || c.event),
  );
}

// True when any node in a flow (start trigger audience, conditional split…)
// filters on a Fastrr Signals attribute.
export function nodesUseSignals(nodes = []) {
  const walk = (v) => {
    if (!v || typeof v !== "object") return false;
    if (Array.isArray(v)) return v.some(walk);
    if (typeof v.property === "string" && SIGNAL_ATTRIBUTES.has(v.property)) return true;
    return Object.values(v).some(walk);
  };
  return nodes.some((n) => walk(n.data));
}

function blockSetUsesSignals(blockSet) {
  return (blockSet?.blocks || []).some(
    (b) => b.type === "property" && (b.conditions || []).some((c) => SIGNAL_ATTRIBUTES.has(c.property)),
  );
}

export function audienceUsesSignals(audience) {
  return blockSetUsesSignals(audience?.include) || (!!audience?.exclude_enabled && blockSetUsesSignals(audience?.exclude));
}

// Appends the next preset not yet in the include set as an OR'd Fastrr
// Signals block. Returns null once every preset is already present.
export function enhanceAudience(audience) {
  const include = audience.include || { blocks: [], blocksCombinator: "AND" };
  // Nothing filtered yet: start the filter with the first preset, no OR.
  if (!blockSetHasConditions(include)) {
    const first = ENHANCE_PRESETS[0];
    const block = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "property",
      combinator: "OR",
      conditions: [{ ...first }],
      segments: [],
      fastrrEnhance: true,
    };
    return { audience: { ...audience, include: { blocks: [block], blocksCombinator: "AND" } }, added: first, started: true };
  }
  const blocks = include.blocks || [];
  const enhanceIdx = blocks.findIndex((b) => b.fastrrEnhance);
  const used = new Set(
    blocks.flatMap((b) => (b.conditions || []).filter((c) => c.operator && c.value !== "").map((c) => c.property)),
  );
  const next = ENHANCE_PRESETS.find((p) => !used.has(p.property));
  if (!next) return null;

  let nextBlocks;
  if (enhanceIdx >= 0) {
    nextBlocks = blocks.map((b, i) => (i === enhanceIdx ? { ...b, combinator: "OR", conditions: [...b.conditions, { ...next }] } : b));
  } else {
    nextBlocks = [
      ...blocks,
      {
        id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: "property",
        combinator: "OR",
        conditions: [{ ...next }],
        segments: [],
        fastrrEnhance: true,
      },
    ];
  }
  return { audience: { ...audience, include: { ...include, blocks: nextBlocks, blocksCombinator: "OR" } }, added: next };
}

// Predefined segments built on Fastrr Signals, offered in the campaign
// "Send To" picker alongside the seller's own segments.
export const FASTRR_SEGMENTS = [
  { id: "fseg_high_aov",      name: "Fastrr Signals High AOV",          userCount: 6240, type: "dynamic", updatedAt: "Live", source: SIGNALS_LABEL, fastrr: true },
  { id: "fseg_high_rto",      name: "Fastrr Signals High RTO Risk",     userCount: 2180, type: "dynamic", updatedAt: "Live", source: SIGNALS_LABEL, fastrr: true },
  { id: "fseg_low_rto",       name: "Fastrr Signals Low RTO Risk",      userCount: 9870, type: "dynamic", updatedAt: "Live", source: SIGNALS_LABEL, fastrr: true },
  { id: "fseg_purchase_aff",  name: "Fastrr Signals Purchase Affinity", userCount: 7315, type: "dynamic", updatedAt: "Live", source: SIGNALS_LABEL, fastrr: true },
];

// "Recommended segments": each click adds the next Fastrr segment not yet
// selected, keeping whatever the seller already picked.
const RECOMMENDED_ORDER = ["fseg_high_aov", "fseg_low_rto", "fseg_purchase_aff", "fseg_high_rto"];

export function nextRecommendedSegment(selected = []) {
  const id = RECOMMENDED_ORDER.find((rid) => !selected.some((s) => s.id === rid));
  return FASTRR_SEGMENTS.find((s) => s.id === id) || null;
}

export const usesFastrrSegments = (segments = []) => segments.some((s) => s.fastrr);

// Session-level activation flag (prototype — no backend).
let signalsActive = false;
export const isSignalsActive = () => signalsActive;
export const markSignalsActive = () => { signalsActive = true; };
