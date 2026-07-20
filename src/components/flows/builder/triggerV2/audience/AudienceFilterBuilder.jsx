import React, { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import CombinatorPill from "./CombinatorPill";
import UserPropertyConditions from "./UserPropertyConditions";
import UserBehaviorConditions from "./UserBehaviorConditions";
import UserAffinityConditions from "./UserAffinityConditions";
import EventPropertyConditions from "./EventPropertyConditions";
import { listSegments } from "@/data/segmentsData";

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

  return (
    <div className="border border-border rounded-lg bg-surface">
      <div className="flex items-end bg-slate-50 border-b border-border pl-1">
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
            className="flex-shrink-0 mb-1 mr-1 p-1 text-text-muted hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            aria-label="Remove block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

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
            block={{ segments: block.segments || [] }}
            onChange={(b) => onUpdate({ segments: b.segments })}
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
    <div className="flex">
      {blockTypes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-colors border-b-2 ${
            t.id === value
              ? "text-primary border-primary"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AddBlockMenu({ onAdd, testIdPrefix, blockTypes }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        data-testid={`${testIdPrefix}-add-block`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition block
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {blockTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onAdd(t.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary-tint hover:text-primary transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SegmentList({ block, onChange, testIdPrefix, excludeSegmentName }) {
  const segments = block.segments || [];
  const options = listSegments()
    .map((s) => s.name)
    .filter((name) => name !== excludeSegmentName);

  React.useEffect(() => {
    if (segments.length === 0) {
      onChange({ ...block, segments: [""] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
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
            className="h-9 text-sm flex-1 rounded-md border border-border bg-surface px-2"
          >
            <option value="">Select a segment</option>
            {options.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {segments.length > 1 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  segments: segments.filter((_, idx) => idx !== i),
                })
              }
              className="p-1.5 text-text-muted hover:text-rose-600 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
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
