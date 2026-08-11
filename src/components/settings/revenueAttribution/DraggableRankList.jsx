import React, { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function DraggableRankList({ items, onReorder, testIdPrefix }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  function moveItem(from, to) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }

  function handleDrop(index) {
    if (dragIndex !== null) moveItem(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const { id, label, Icon } = item;
        return (
          <li
            key={id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={() => handleDrop(index)}
            data-testid={`${testIdPrefix}-row-${id}`}
            className={`flex items-center gap-3 px-3 py-2.5 border rounded-md bg-white transition-colors ${
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? "border-primary bg-primary-tint/40"
                : "border-border"
            }`}
          >
            <GripVertical className="w-4 h-4 text-text-muted cursor-grab flex-shrink-0" />
            <span className="inline-flex items-center justify-center w-9 h-6 rounded text-[11px] font-semibold bg-primary-tint text-primary flex-shrink-0">
              {RANK_LABELS[index] || `${index + 1}th`}
            </span>
            {Icon && <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />}
            <span className="text-sm font-medium text-text-primary flex-1">{label}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveItem(index, index - 1)}
                data-testid={`${testIdPrefix}-row-${id}-up`}
                aria-label={`Move ${label} up`}
                className="p-1 rounded hover:enabled:bg-slate-50 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, index + 1)}
                data-testid={`${testIdPrefix}-row-${id}-down`}
                aria-label={`Move ${label} down`}
                className="p-1 rounded hover:enabled:bg-slate-50 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
