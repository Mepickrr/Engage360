import React from "react";
import { PALETTE_CATALOGUE } from "@/lib/flowMeta";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";

export default function NodePalette() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const triggerExists = nodes.some((n) => n.type === "trigger");

  const onDragStart = (event, item) => {
    event.dataTransfer.setData("application/reactflow-item", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      data-testid="node-palette"
      className="w-[240px] border-r border-border bg-surface overflow-y-auto flex-shrink-0"
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
          Building blocks
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          Drag onto the canvas to add.
        </div>
      </div>

      <div className="px-3 py-2 space-y-4">
        {PALETTE_CATALOGUE.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold px-1 mb-1.5">
              {group.group}
            </div>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const disabled = item.singleton && triggerExists;
                const Icon = item.Icon;
                const key = `${item.kind}-${item.subtype || "none"}`;
                return (
                  <div
                    key={key}
                    draggable={!disabled}
                    onDragStart={(e) => !disabled && onDragStart(e, item)}
                    data-testid={`palette-item-${key}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border transition-colors select-none ${
                      disabled
                        ? "opacity-40 cursor-not-allowed border-border bg-slate-50"
                        : "border-border bg-white hover:border-text-muted/40 cursor-grab active:cursor-grabbing"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-text-primary truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
