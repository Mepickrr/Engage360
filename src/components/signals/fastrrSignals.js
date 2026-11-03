import userAttrsData from "@/data/userAttributes.json";

// The "Shiprocket Buyer" attribute group is surfaced as "Fastrr Signals" on
// surfaces that opt in via FlowVariantContext ({ fastrrSignals: true }).
export const SIGNALS_SOURCE_GROUP = "Shiprocket Buyer";
export const SIGNALS_LABEL = "Fastrr Signals";

export const SIGNAL_ATTRIBUTES = new Set(
  (userAttrsData.groups?.[SIGNALS_SOURCE_GROUP] || []).map((a) => a.name),
);

// Conditions "Enhance Segment" appends, in rotation.
export const ENHANCE_PRESETS = [
  { property: "LIFETIME_AOV", operator: "is greater than", value: "2000" },
  { property: "THREE_MONTHS_ORDERS", operator: "is greater than", value: "1" },
  { property: "RTO_RISK", operator: "is equal to", value: "0" },
];

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
  const include = audience.include;
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

// "Recommended segments": alongside an existing selection, add the
// growth-friendly Fastrr segments; on an empty selection, just one.
const RECOMMENDED_WITH_EXISTING = ["fseg_high_aov", "fseg_low_rto", "fseg_purchase_aff"];
const RECOMMENDED_ALONE = ["fseg_high_aov"];

export function recommendSegments(selected = []) {
  const hasOwn = selected.some((s) => !s.fastrr);
  const ids = hasOwn ? RECOMMENDED_WITH_EXISTING : RECOMMENDED_ALONE;
  const additions = FASTRR_SEGMENTS.filter((s) => ids.includes(s.id) && !selected.some((x) => x.id === s.id));
  return [...selected, ...additions];
}

export const usesFastrrSegments = (segments = []) => segments.some((s) => s.fastrr);

// Session-level activation flag (prototype — no backend).
let signalsActive = false;
export const isSignalsActive = () => signalsActive;
export const markSignalsActive = () => { signalsActive = true; };
