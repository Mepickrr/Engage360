import React, { useState } from "react";
import { Plus, Loader2, Trash2, ChevronDown, Bookmark } from "lucide-react";
import UserPropertyConditions from "./audience/UserPropertyConditions";
import UserBehaviorConditions from "./audience/UserBehaviorConditions";
import UserAffinityConditions from "./audience/UserAffinityConditions";
import CombinatorPill from "./audience/CombinatorPill";
import { emptyConditionBlock } from "./triggerHelpers";
import { toast } from "sonner";

const BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment", label: "Custom segment" },
];

const MOCK_SEGMENTS = [
  "Top 10% buyers (90d)",
  "Lapsed VIPs (60d+)",
  "Cart abandoners (24h)",
  "First-time buyers (30d)",
  "Newsletter subscribers",
];

const AUDIENCE_KINDS = [
  { id: "all", label: "All Users" },
  { id: "identified", label: "Engage Identified" },
  { id: "known", label: "Known User" },
];

export default function Step2WhoContent({
  audience,
  setAudience,
  showCount,
  count,
  loadingCount,
}) {
  const setIncludeAll = (all) => setAudience({ ...audience, include_all: all });

  return (
    <div className="space-y-5">
      {/* Top radio */}
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!!audience.include_all}
            onChange={() => setIncludeAll(true)}
            data-testid="audience-all-users"
            className="accent-primary"
          />
          <span className="text-sm">All users who match the start trigger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!audience.include_all}
            onChange={() => setIncludeAll(false)}
            data-testid="audience-filter-users"
            className="accent-primary"
          />
          <span className="text-sm">Filter users by</span>
        </label>
      </div>

      {!audience.include_all && (
        <>
          {/* Audience kind pills */}
          <AudienceKindBlock
            value={audience.audience_kind || "all"}
            onChange={(v) => setAudience({ ...audience, audience_kind: v })}
          />
          <div className="h-px bg-border" />

          {/* Include blocks */}
          <ConditionBlockList
            blockSet={audience.include || { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" }}
            onChange={(b) => setAudience({ ...audience, include: b })}
            testIdPrefix="audience-include"
          />
        </>
      )}

      {/* Exclude Users */}
      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.exclude_enabled}
            onChange={(e) => setAudience({ ...audience, exclude_enabled: e.target.checked })}
            data-testid="audience-exclude-toggle"
            className="accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">Exclude Users</span>
        </label>
        {audience.exclude_enabled && (
          <div className="mt-3">
            <ConditionBlockList
              blockSet={audience.exclude || { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" }}
              onChange={(b) => setAudience({ ...audience, exclude: b })}
              testIdPrefix="audience-exclude"
            />
          </div>
        )}
      </div>

      {/* Limit entry frequency */}
      <div className="border-t border-border pt-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.limit_enabled}
            onChange={(e) => setAudience({ ...audience, limit_enabled: e.target.checked })}
            className="accent-primary"
            data-testid="audience-limit-toggle"
          />
          <span className="text-sm font-medium">Limit entry frequency</span>
        </label>
        {audience.limit_enabled && (
          <div className="pl-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-text-secondary">Limit to</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.count ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), count: Number(e.target.value) } })
              }
              data-testid="audience-limit-count"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <span className="text-text-secondary">time(s) within</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.window ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), window: Number(e.target.value) } })
              }
              data-testid="audience-limit-window"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <select
              value={audience.limit_entry?.unit || "days"}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), unit: e.target.value } })
              }
              data-testid="audience-limit-unit"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.global_control}
            onChange={(e) => setAudience({ ...audience, global_control: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-sm font-medium">Global control group</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.flow_control}
            onChange={(e) => setAudience({ ...audience, flow_control: e.target.checked })}
            className="accent-primary"
          />
          <span className="text-sm font-medium">Flow control group</span>
        </label>
      </div>

      {/* Show count */}
      <div className="border-t border-border pt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={showCount}
          disabled={loadingCount}
          data-testid="audience-show-count"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary border border-primary/50 rounded-md hover:bg-primary-tint disabled:opacity-50"
        >
          {loadingCount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Show count
        </button>
        {count != null && (
          <span className="text-sm text-text-primary" data-testid="audience-count-value">
            ≈ <span className="font-semibold">{count.toLocaleString("en-IN")}</span> users will enter
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Audience Kind pills ───────────────────────────────────────
function AudienceKindBlock({ value, onChange }) {
  return (
    <div className="space-y-2" data-testid="audience-type-block">
      <div className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
        Audience Type
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {AUDIENCE_KINDS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              data-testid={`audience-type-${t.id}`}
              className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-primary border-border hover:bg-primary-tint hover:border-primary/40"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Multi-block condition list ────────────────────────────────
function ConditionBlockList({ blockSet, onChange, testIdPrefix }) {
  const blocks = blockSet.blocks?.length
    ? blockSet.blocks
    : [emptyConditionBlock("property")];
  const blocksCombinator = blockSet.blocksCombinator || "AND";

  const updateBlock = (id, updates) =>
    onChange({ ...blockSet, blocks: blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)) });

  const removeBlock = (id) =>
    onChange({ ...blockSet, blocks: blocks.filter((b) => b.id !== id) });

  const addBlock = (type) =>
    onChange({ ...blockSet, blocks: [...blocks, emptyConditionBlock(type)] });

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
          />
        </React.Fragment>
      ))}

      {/* Add block + Save as segment */}
      <div className="flex items-center gap-2 pt-2">
        <AddBlockMenu onAdd={addBlock} testIdPrefix={testIdPrefix} />
        <SaveAsSegmentButton blockSet={blockSet} />
      </div>
    </div>
  );
}

// ─── Single condition block ────────────────────────────────────
function ConditionBlock({ block, onUpdate, onRemove, testIdPrefix }) {
  const typeLabel = BLOCK_TYPES.find((t) => t.id === block.type)?.label || "Condition";

  const handleTypeChange = (newType) => {
    // Reset conditions when type changes
    onUpdate({ type: newType, conditions: [], segments: [], combinator: "AND" });
  };

  return (
    <div className="border border-border rounded-lg bg-surface">
      {/* Block header — tab strip */}
      <div className="flex items-end bg-slate-50 border-b border-border pl-1">
        <div className="flex-1 overflow-x-auto">
          <BlockTypePicker value={block.type} onChange={handleTypeChange} />
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

      {/* Block body */}
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
        {block.type === "segment" && (
          <SegmentList
            block={{ segments: block.segments || [] }}
            onChange={(b) => onUpdate({ segments: b.segments })}
            testIdPrefix={`${testIdPrefix}-segment`}
          />
        )}
      </div>
    </div>
  );
}

// ─── Block type tab strip ─────────────────────────────────────
function BlockTypePicker({ value, onChange }) {
  return (
    <div className="flex">
      {BLOCK_TYPES.map((t) => (
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

// ─── Add block dropdown button ─────────────────────────────────
function AddBlockMenu({ onAdd, testIdPrefix }) {
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
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onAdd(t.id); setOpen(false); }}
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

// ─── Save as segment ──────────────────────────────────────────
function SaveAsSegmentButton({ blockSet }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const hasConditions = (blockSet.blocks || []).some((b) => {
    if (b.type === "segment") return (b.segments || []).some(Boolean);
    return (b.conditions || []).some((c) => c.property || c.event);
  });

  if (!hasConditions) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    toast.success(`Segment "${name.trim()}" saved`);
    MOCK_SEGMENTS.unshift(name.trim());
    setName("");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          placeholder="Segment name…"
          className="h-7 px-2 text-xs rounded-md border border-primary/50 bg-surface focus:outline-none focus:border-primary w-40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-2 py-1 text-xs font-medium bg-primary text-white rounded-md disabled:opacity-40 hover:bg-primary-hover"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-2 py-1 text-xs text-text-muted hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
    >
      <Bookmark className="w-3.5 h-3.5" />
      Save as segment
    </button>
  );
}

// ─── Segment picker list ───────────────────────────────────────
function SegmentList({ block, onChange, testIdPrefix }) {
  const segments = block.segments || [];

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
              onChange({ ...block, segments: segments.map((x, idx) => (idx === i ? e.target.value : x)) })
            }
            data-testid={`${testIdPrefix}-${i}`}
            className="h-9 text-sm flex-1 rounded-md border border-border bg-surface px-2"
          >
            <option value="">Select a segment</option>
            {MOCK_SEGMENTS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {segments.length > 1 && (
            <button
              type="button"
              onClick={() => onChange({ ...block, segments: segments.filter((_, idx) => idx !== i) })}
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
