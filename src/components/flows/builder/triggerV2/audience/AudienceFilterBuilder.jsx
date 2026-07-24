import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, User, Activity, Layers, Sparkles } from "lucide-react";
import CombinatorPill from "./CombinatorPill";
import UserPropertyConditions from "./UserPropertyConditions";
import UserBehaviorConditions from "./UserBehaviorConditions";
import UserAffinityConditions from "./UserAffinityConditions";
import EventPropertyConditions from "./EventPropertyConditions";
import { listSegments } from "@/data/segmentsData";

// Per-lens visual identity: icon, left-rail/tab accent, one-line subtitle.
const LENS_META = {
  property: {
    icon: User,
    subtitle: "Who are they?",
    rail: "border-l-primary",
    tabActive: "text-primary",
    iconActive: "text-primary",
  },
  behavior: {
    icon: Activity,
    subtitle: "What did they do?",
    rail: "border-l-warning",
    tabActive: "text-warning",
    iconActive: "text-warning",
  },
  affinity: {
    icon: Sparkles,
    subtitle: "What do they like?",
    rail: "border-l-slate-400",
    tabActive: "text-text-primary",
    iconActive: "text-slate-500",
  },
  segment: {
    icon: Layers,
    subtitle: "Reuse a saved segment",
    rail: "border-l-success",
    tabActive: "text-success",
    iconActive: "text-success",
  },
};
const DEFAULT_LENS_META = LENS_META.property;

function lensMeta(type) {
  return LENS_META[type] || DEFAULT_LENS_META;
}

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

function emptyBlock(type = "property") {
  return {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type,
    combinator: "AND",
    conditions: [],
    segments: [],
  };
}

export default function AudienceFilterBuilder({
  blockSet,
  onChange,
  testIdPrefix,
  blockTypes,
  excludeSegmentName,
}) {
  const blocks = blockSet.blocks?.length
    ? blockSet.blocks
    : [emptyBlock(blockTypes[0]?.id || "property")];
  const blocksCombinator = blockSet.blocksCombinator || "AND";

  const updateBlock = (id, updates) =>
    onChange({
      ...blockSet,
      blocks: blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });

  const removeBlock = (id) =>
    onChange({ ...blockSet, blocks: blocks.filter((b) => b.id !== id) });

  const addBlock = (type) =>
    onChange({ ...blockSet, blocks: [...blocks, emptyBlock(type)] });

  const setCombinator = (v) =>
    onChange({ ...blockSet, blocksCombinator: v });

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => (
        <React.Fragment key={block.id}>
          {idx > 0 && (
            <div className="py-1">
              <CombinatorPill
                value={blocksCombinator}
                onChange={setCombinator}
                testId={`${testIdPrefix}-blocks-combinator`}
              />
            </div>
          )}
          <ConditionBlock
            block={block}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onRemove={blocks.length > 1 ? () => removeBlock(block.id) : null}
            testIdPrefix={`${testIdPrefix}-block-${idx}`}
            blockTypes={blockTypes}
            excludeSegmentName={excludeSegmentName}
          />
        </React.Fragment>
      ))}
      <div className="pt-2">
        <AddBlockMenu
          onAdd={addBlock}
          testIdPrefix={testIdPrefix}
          blockTypes={blockTypes}
        />
      </div>
    </div>
  );
}

function ConditionBlock({ block, onUpdate, onRemove, testIdPrefix, blockTypes, excludeSegmentName }) {
  const handleTypeChange = (newType) => {
    onUpdate({ type: newType, conditions: [], segments: [], combinator: "AND" });
  };
  const meta = lensMeta(block.type);

  return (
    <div className={`border border-border border-l-[3px] ${meta.rail} rounded-lg bg-surface shadow-sm overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 bg-slate-50 border-b border-border px-2 py-1.5">
        <div className="flex-1 overflow-x-auto">
          <BlockTypePicker
            value={block.type}
            onChange={handleTypeChange}
            blockTypes={blockTypes}
          />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 p-1 text-text-muted hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            aria-label="Remove block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className={`px-3 pt-2 text-[13px] font-semibold ${meta.tabActive}`}>{meta.subtitle}</p>

      <div className="p-3">
        {block.type === "property" && (
          <UserPropertyConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-property`}
          />
        )}
        {block.type === "behavior" && (
          <UserBehaviorConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-behavior`}
          />
        )}
        {block.type === "affinity" && (
          <UserAffinityConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-affinity`}
          />
        )}
        {block.type === "event_property" && (
          <EventPropertyConditions
            block={{ conditions: block.conditions || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ conditions: b.conditions, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-event-property`}
          />
        )}
        {block.type === "segment" && (
          <SegmentList
            block={{ segments: block.segments || [], combinator: block.combinator || "AND" }}
            onChange={(b) => onUpdate({ segments: b.segments, combinator: b.combinator })}
            testIdPrefix={`${testIdPrefix}-segment`}
            excludeSegmentName={excludeSegmentName}
          />
        )}
      </div>
    </div>
  );
}

function BlockTypePicker({ value, onChange, blockTypes }) {
  return (
    <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
      {blockTypes.map((t) => {
        const meta = lensMeta(t.id);
        const Icon = meta.icon;
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
              active
                ? `bg-white shadow-sm ${meta.tabActive}`
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? meta.iconActive : "text-text-muted"}`} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function AddBlockMenu({ onAdd, testIdPrefix, blockTypes }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-stretch">
      <button
        type="button"
        onClick={() => onAdd(blockTypes[0]?.id)}
        data-testid={`${testIdPrefix}-add-block`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition block
      </button>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        data-testid={`${testIdPrefix}-add-block-menu`}
        aria-label="Choose condition block type"
        className="ml-1 p-0.5 text-primary hover:text-primary-hover rounded"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-border rounded-lg shadow-lg p-1 min-w-[220px]">
            {blockTypes.map((t) => {
              const meta = lensMeta(t.id);
              const Icon = meta.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onAdd(t.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 text-left px-2 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <span className={`w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 ${meta.iconActive}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-text-primary">{t.label}</span>
                    <span className="block text-[11px] text-text-muted truncate">{meta.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SegmentList({ block, onChange, testIdPrefix, excludeSegmentName }) {
  const segments = block.segments || [];
  const combinator = block.combinator || "AND";
  const allSegments = React.useMemo(
    () => listSegments().filter((s) => s.name !== excludeSegmentName),
    [excludeSegmentName],
  );
  const byName = React.useMemo(() => {
    const m = {};
    allSegments.forEach((s) => { m[s.name] = s; });
    return m;
  }, [allSegments]);

  React.useEffect(() => {
    if (segments.length === 0) {
      onChange({ ...block, segments: [""] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {segments.map((s, i) => {
        const meta = byName[s];
        return (
          <React.Fragment key={i}>
          {i > 0 && (
            <CombinatorPill
              value={combinator}
              onChange={(v) => onChange({ ...block, combinator: v })}
              testId={`${testIdPrefix}-combinator`}
            />
          )}
          <div
            className="flex items-center gap-3 border border-border rounded-lg bg-surface px-3 py-2.5"
          >
            <span className="w-8 h-8 rounded-md bg-success-bg text-success flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <select
                value={s}
                onChange={(e) =>
                  onChange({
                    ...block,
                    segments: segments.map((x, idx) =>
                      idx === i ? e.target.value : x,
                    ),
                  })
                }
                data-testid={`${testIdPrefix}-${i}`}
                className="w-full text-[13px] font-semibold text-text-primary bg-transparent focus:outline-none"
              >
                <option value="">Select a segment</option>
                {allSegments.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              {meta && (
                <p className="text-[11px] text-text-muted truncate">
                  {meta.userCount?.toLocaleString?.() ?? meta.userCount} people
                  {meta.updatedAt ? ` · updated ${timeAgo(meta.updatedAt)}` : ""}
                </p>
              )}
            </div>
            {segments.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...block,
                    segments: segments.filter((_, idx) => idx !== i),
                  })
                }
                className="p-1.5 text-text-muted hover:text-rose-600 rounded-md flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          </React.Fragment>
        );
      })}
      <button
        type="button"
        onClick={() => onChange({ ...block, segments: [...segments, ""] })}
        data-testid={`${testIdPrefix}-add`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add segment (OR)
      </button>
    </div>
  );
}
