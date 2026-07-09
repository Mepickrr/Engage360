import React, { useState } from "react";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { newFilterGroup, SPLIT_BLOCK_TYPES } from "./data/mockData";
import AudienceFilterBuilder from "@/components/flows/builder/trigger/audience/AudienceFilterBuilder";
import CombinatorPill from "@/components/flows/builder/trigger/audience/CombinatorPill";

function FilterGroupCard({ group, index, onChange, onRemove, canRemove }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-text-muted"
        >
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
        <input
          type="text"
          value={group.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="flex-1 min-w-0 text-sm font-medium bg-transparent focus:outline-none"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-3">
          <AudienceFilterBuilder
            blockSet={{
              blocks: group.blocks || [],
              blocksCombinator: group.blocksCombinator || "AND",
            }}
            onChange={(next) =>
              onChange({
                blocks: next.blocks,
                blocksCombinator: next.blocksCombinator,
              })
            }
            testIdPrefix={`fg-${group.id}`}
            blockTypes={SPLIT_BLOCK_TYPES}
          />
        </div>
      )}
    </div>
  );
}

function FilterModalBody({ initialGroups, initialCombinator, onCancel, onSave }) {
  const [groups, setGroups] = useState(initialGroups?.length ? initialGroups : [newFilterGroup(0)]);
  const [groupsCombinator, setGroupsCombinator] = useState(initialCombinator || "AND");

  const updateGroup = (id, next) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...next } : g)));

  const removeGroup = (id) =>
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      return next.length ? next : [newFilterGroup(0)];
    });

  const addGroup = () => setGroups((prev) => [...prev, newFilterGroup(prev.length)]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Filter conditions</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {groups.map((group, gi) => (
          <React.Fragment key={group.id}>
            {gi > 0 && (
              <div className="py-1">
                <CombinatorPill
                  value={groupsCombinator}
                  onChange={setGroupsCombinator}
                  testId="filter-groups-combinator"
                />
              </div>
            )}
            <FilterGroupCard
              group={group}
              index={gi}
              onChange={(next) => updateGroup(group.id, next)}
              onRemove={() => removeGroup(group.id)}
              canRemove={groups.length > 1}
            />
          </React.Fragment>
        ))}

        <button
          type="button"
          onClick={addGroup}
          data-testid="conditional-filter-modal-add-branch"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add branch
        </button>

        <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-md border border-border">
          <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          <span className="text-[11px] text-text-secondary">
            <span className="font-medium">Else</span> — users that don't match any branch
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          type="button"
          onClick={onCancel}
          data-testid="conditional-filter-modal-cancel"
          className="px-3 py-1.5 rounded-md border border-border text-text-secondary text-[12px] font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave({ filterGroups: groups, filterGroupsCombinator: groupsCombinator })}
          data-testid="conditional-filter-modal-save"
          className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-[12px] font-medium hover:bg-teal-700"
        >
          Save conditions
        </button>
      </div>
    </>
  );
}

export default function ConditionalFilterModal({
  open,
  onClose,
  filterGroups,
  filterGroupsCombinator,
  onSave,
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="conditional-filter-modal" className="max-w-2xl">
        {open && (
          <FilterModalBody
            initialGroups={filterGroups}
            initialCombinator={filterGroupsCombinator}
            onCancel={onClose}
            onSave={(next) => {
              onSave(next);
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
